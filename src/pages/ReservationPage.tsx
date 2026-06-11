import { useEffect, useRef, useState } from 'react';
import { Printer, Download, FileText, ArrowLeft, QrCode } from 'lucide-react';
import { getReservationByRequestId, downloadReservationTxt, getValidationUrl, getQrImageUrl } from '../lib/reservations';
import { getRequestDetail, formatDateTime } from '../lib/requests';
import { Button, PageHeader, Card } from '../components/UI';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { Reservation, RequestDetail, RouterState } from '../types';

interface ReservationPageProps {
  requestId: string;
  onNavigate: (state: RouterState) => void;
}

const HOTEL_PHONE = '+507 6315-1015';
const HOTEL_RUC = 'RUC1556766114-2-2019 DV79';

function fmtDDMMYYYY(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}-${d.getMonth() + 1}-${d.getFullYear()}`;
}

function fmtTime12(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'p.m.' : 'a.m.';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

const S = {
  cell: {
    border: '1px solid #c8c8c8',
    padding: '4px 8px',
    fontSize: '11px',
    verticalAlign: 'middle' as const,
  },
  hdrBlue: {
    background: '#1a3a6e',
    color: 'white',
    border: '1px solid #1a3a6e',
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: 700 as const,
    textAlign: 'center' as const,
  },
  subHdrBlue: {
    background: '#2258a8',
    color: 'white',
    border: '1px solid #2258a8',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 700 as const,
    textAlign: 'center' as const,
  },
  labelCell: {
    border: '1px solid #c8c8c8',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 700 as const,
    color: '#1a3a6e',
    background: '#f0f4fa',
    whiteSpace: 'nowrap' as const,
    verticalAlign: 'middle' as const,
  },
  valueCell: {
    border: '1px solid #c8c8c8',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 700 as const,
    verticalAlign: 'middle' as const,
  },
  lodgingValue: {
    border: '1px solid #c8c8c8',
    padding: '5px 8px',
    fontSize: '12px',
    fontWeight: 700 as const,
    textAlign: 'center' as const,
    background: '#dce8f8',
    color: '#1a3a6e',
    verticalAlign: 'middle' as const,
  },
};

export function ReservationPage({ requestId, onNavigate }: ReservationPageProps) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [resResult, detResult] = await Promise.all([
        getReservationByRequestId(requestId),
        getRequestDetail(requestId),
      ]);
      if (!mounted) return;
      if (resResult.error || !resResult.data) {
        setError(resResult.error ?? 'Reserva no encontrada.');
      } else if (detResult.error || !detResult.data) {
        setError(detResult.error ?? 'Solicitud no encontrada.');
      } else {
        setReservation(resResult.data);
        setDetail(detResult.data);
      }
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [requestId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !reservation || !detail) {
    return (
      <div className="space-y-4">
        <PageHeader title="Reserva" onBack={() => onNavigate({ page: 'request-detail', requestId })} />
        <Card className="p-6 text-center">
          <p className="text-red-500 text-sm">{error || 'No se encontró la reserva.'}</p>
        </Card>
      </div>
    );
  }

  const validationUrl = getValidationUrl(reservation.verification_code);
  const qrImageUrl = getQrImageUrl(validationUrl);
  const pricePerPerson =
    detail.cantidad_personas > 0
      ? Number(detail.total_estimado) / detail.cantidad_personas
      : 0;

  const checkInDate = fmtDDMMYYYY(detail.llegada_panama);
  const checkInTime = fmtTime12(detail.llegada_panama);
  const departureDate = fmtDDMMYYYY(detail.salida_panama);
  const departureTime = fmtTime12(detail.salida_panama);
  const checkoutDate = fmtDDMMYYYY(detail.salida_hotel + 'T12:00:00');

  const emptyRows = Math.max(0, 5 - detail.travelers.length);

  return (
    <div className="space-y-4 pb-4">
      {/* ── Barra de acciones (oculta al imprimir) ── */}
      <div className="no-print">
        <PageHeader
          title={`Reserva #${reservation.reservation_number}`}
          subtitle={reservation.verification_code}
          onBack={() => onNavigate({ page: 'request-detail', requestId })}
        />
        <Card className="p-4 mb-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => window.print()} className="flex-1">
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadReservationTxt(reservation, detail)}
              className="flex-1"
            >
              <FileText className="h-4 w-4" />
              Descargar TXT
            </Button>
          </div>
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
            <QrCode className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700">Código de verificación</p>
              <p className="text-sm font-mono font-bold text-sky-700 mt-0.5">{reservation.verification_code}</p>
              <p className="text-xs text-slate-400 mt-0.5 break-all">{validationUrl}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════
          DOCUMENTO OFICIAL — replica exacta del PDF
          ══════════════════════════════════════════════ */}
      <div
        ref={printRef}
        id="reservation-print"
        className="bg-white print:border-0 print:shadow-none"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif', border: '1px solid #ccc' }}
      >
        {/* ── CABECERA: Skyline + logo ── */}
        <div style={{ position: 'relative', background: '#1a3a6e', minHeight: '72px' }}>
          {/* Skyline panoramic gradient that mimics the city photo */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, #0a1f4e 0%, #1a3a6e 30%, #2258a8 60%, #5b9bd5 80%, #a8ccea 95%, #d4e9f7 100%)',
          }} />
          {/* Silhouette city effect */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px',
            background: 'linear-gradient(180deg, transparent 0%, #0d2458 60%, #0a1f4e 100%)',
            clipPath: 'polygon(0% 100%, 0% 60%, 2% 60%, 2% 30%, 4% 30%, 4% 60%, 6% 60%, 6% 40%, 7% 40%, 7% 10%, 8% 10%, 8% 40%, 9% 40%, 9% 60%, 10% 60%, 10% 20%, 11% 20%, 11% 60%, 13% 60%, 13% 50%, 15% 50%, 15% 60%, 17% 60%, 17% 35%, 18% 35%, 18% 60%, 20% 60%, 20% 45%, 22% 45%, 22% 60%, 24% 60%, 24% 55%, 26% 55%, 26% 60%, 28% 60%, 28% 40%, 30% 40%, 30% 60%, 32% 60%, 32% 50%, 34% 50%, 34% 60%, 36% 60%, 36% 30%, 37% 30%, 37% 60%, 40% 60%, 40% 45%, 43% 45%, 43% 60%, 46% 60%, 46% 50%, 50% 50%, 50% 60%, 53% 60%, 53% 35%, 55% 35%, 55% 60%, 58% 60%, 58% 50%, 62% 50%, 62% 60%, 66% 60%, 66% 40%, 68% 40%, 68% 60%, 72% 60%, 72% 55%, 75% 55%, 75% 60%, 78% 60%, 78% 45%, 80% 45%, 80% 60%, 83% 60%, 83% 50%, 86% 50%, 86% 60%, 90% 60%, 90% 35%, 92% 35%, 92% 60%, 95% 60%, 95% 50%, 98% 50%, 98% 60%, 100% 60%, 100% 100%)',
          }} />
          {/* Logo */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px' }}>
            <img
              src="/logo_del_hotel.jpeg"
              alt="Vista al Mar"
              style={{ height: '52px', width: '52px', objectFit: 'contain', background: 'white', padding: '2px', borderRadius: '4px' }}
            />
            <div style={{ color: 'white', lineHeight: 1.2 }}>
              <div style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.05em' }}>VISTA AL MAR</div>
              <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.08em' }}>HOTEL &amp; BOUTIQUE</div>
            </div>
          </div>
        </div>

        {/* ── TÍTULO PRINCIPAL ── */}
        <div style={{ textAlign: 'center', padding: '8px 10px 4px', borderBottom: '1px solid #ddd' }}>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#1a3a6e', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Reservation Hotel &amp; Boutique Vista al Mar
          </div>
          <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#1a3a6e', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            On behalf of Hotel Vista Almar, we want to express our thanks to you for choosing our services details
          </div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#1a3a6e', marginTop: '2px' }}>
            {HOTEL_RUC}
          </div>
        </div>

        {/* ── TABLA DOBLE: Reservación + Hospedaje ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '30%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '16%' }} />
          </colgroup>
          <thead>
            <tr>
              <th colSpan={2} style={{ ...S.hdrBlue, textAlign: 'left', fontStyle: 'italic', letterSpacing: '0.03em' }}>
                informacion de Reserbacion
              </th>
              <th colSpan={3} style={{ ...S.hdrBlue, letterSpacing: '0.1em' }}>
                LODGING
              </th>
            </tr>
            <tr>
              <th colSpan={2} style={{ ...S.subHdrBlue, textAlign: 'left', fontWeight: 400, fontSize: '10px' }}>
                FLIGHT/ ARRIBAL NUMBER
              </th>
              <th style={S.subHdrBlue}>CHECK IN</th>
              <th style={S.subHdrBlue}>CHECK IN</th>
              <th style={S.subHdrBlue}>CHECKOUT</th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1: Date of Check In + CHECK IN dates */}
            <tr>
              <td style={S.labelCell}>DATE OF CHECK IN TO PANAMA</td>
              <td style={S.valueCell}>
                {checkInDate}<br />
                <span style={{ color: '#555', fontWeight: 400 }}>{checkInTime}</span>
              </td>
              <td style={{ ...S.labelCell, textAlign: 'center', background: '#f0f4fa' }}>CHECK IN</td>
              <td style={S.lodgingValue}>{checkInDate}</td>
              <td style={S.lodgingValue}>{checkoutDate}</td>
            </tr>
            {/* Row 2: Departure flight */}
            <tr>
              <td style={S.labelCell}>DEPARTURE FLIGHT NUMBER</td>
              <td style={S.valueCell}></td>
              <td style={{ ...S.labelCell, textAlign: 'center', background: '#f0f4fa' }}>CHECKOUT</td>
              <td colSpan={2} style={{ ...S.cell, background: '#f8f8f8' }}></td>
            </tr>
            {/* Row 3: Departure date Panama + Phone */}
            <tr>
              <td style={S.labelCell}>DEPARTURE DATE PANAMA</td>
              <td style={S.valueCell}>
                {departureDate}<br />
                <span style={{ color: '#555', fontWeight: 400 }}>{departureTime}</span>
              </td>
              <td style={{ ...S.labelCell, textAlign: 'center', background: '#f0f4fa' }}>PHONE</td>
              <td colSpan={2} style={{ ...S.cell, textAlign: 'center', fontWeight: 700, color: '#cc0000', fontSize: '12px' }}>
                {HOTEL_PHONE}
              </td>
            </tr>
            {/* Row 4: Reservation number */}
            <tr>
              <td style={S.labelCell}>RESERVATION NUMBER</td>
              <td style={{ ...S.valueCell, fontSize: '15px', color: '#1a3a6e', fontWeight: 900 }}>
                {reservation.reservation_number}
              </td>
              <td colSpan={3} style={{ ...S.cell, background: '#f8f8f8' }}></td>
            </tr>
          </tbody>
        </table>

        {/* ── TABLA DE VIAJEROS ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '28%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '14%' }} />
          </colgroup>
          <thead>
            <tr>
              <th
                colSpan={6}
                style={{ ...S.hdrBlue, fontSize: '12px', letterSpacing: '0.12em', fontWeight: 900 }}
              >
                INCLUDES TRANSPORTATION SERVICE
              </th>
            </tr>
            <tr>
              <th style={{ ...S.subHdrBlue, textAlign: 'left' }}>NAME</th>
              <th style={{ ...S.subHdrBlue, textAlign: 'left' }}>PASSPORT</th>
              <th style={S.subHdrBlue}>ADULT</th>
              <th style={S.subHdrBlue}>KIDS</th>
              <th style={{ ...S.subHdrBlue, textAlign: 'left' }}>PHONE</th>
              <th style={{ ...S.subHdrBlue, textAlign: 'right' }}>PRICETOTAL</th>
            </tr>
          </thead>
          <tbody>
            {detail.travelers.map((t) => (
              <tr key={t.id}>
                <td style={{ ...S.cell, fontWeight: 700, textTransform: 'uppercase', color: '#1a3a6e' }}>
                  {t.nombre_completo}
                </td>
                <td style={{ ...S.cell, fontFamily: 'monospace', color: '#cc0000', fontWeight: 700 }}>
                  {t.numero_pasaporte}
                </td>
                <td style={{ ...S.cell, textAlign: 'center' }}>1</td>
                <td style={{ ...S.cell, textAlign: 'center' }}></td>
                <td style={{ ...S.cell, color: '#cc0000', fontWeight: 600 }}>
                  {t.numero_celular ? `+${t.numero_celular.replace(/^\+/, '')}` : ''}
                </td>
                <td style={{ ...S.cell, textAlign: 'right', fontWeight: 700, color: '#1a3a6e' }}>
                  ${pricePerPerson.toFixed(2)}
                </td>
              </tr>
            ))}
            {Array.from({ length: emptyRows }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td style={{ ...S.cell, height: '22px' }}></td>
                <td style={S.cell}></td>
                <td style={S.cell}></td>
                <td style={S.cell}></td>
                <td style={S.cell}></td>
                <td style={S.cell}></td>
              </tr>
            ))}
            {/* Room type row */}
            <tr>
              <td colSpan={2} style={{ ...S.cell, textAlign: 'center', padding: '8px' }}>
                <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '11px' }}>MATRIMONIAL/SINGLE/SUITE</div>
                <div style={{ fontWeight: 900, color: '#cc0000', fontSize: '13px' }}>DOBLE</div>
              </td>
              <td colSpan={2} style={{ ...S.cell, textAlign: 'center', color: '#2258a8', fontSize: '11px' }}>
                Habitacion<br />Standar
              </td>
              <td colSpan={2} style={S.cell}></td>
            </tr>
          </tbody>
        </table>

        {/* ── SEPARADOR PUNTEADO ── */}
        <div style={{ borderTop: '2px dashed #aaa', margin: '4px 0' }}></div>

        {/* ── PIE DE PÁGINA ── */}
        <div style={{ display: 'flex', gap: '16px', padding: '8px 14px 10px', alignItems: 'flex-start' }}>
          {/* Texto legal + firmas */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '9.5px', lineHeight: 1.5, marginBottom: '5px' }}>
              <strong>ATENCIÓN:</strong> El Decreto Ejecutivo N°82 del 23 de diciembre de 2008
              regula la actividad hotelera en Panamá.
            </p>
            <p style={{ fontSize: '9.5px', marginBottom: '4px' }}>
              <strong>Recepción / Front Desk:</strong> [Address plalacerditor]
            </p>
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '9.5px', whiteSpace: 'nowrap' }}>Huésped / Guest Name:</span>
                <div style={{ flex: 1, borderBottom: '1px solid #555' }}></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{ fontSize: '9.5px', whiteSpace: 'nowrap' }}>Dirección / Address:</span>
                <div style={{ flex: 1, borderBottom: '1px solid #555' }}></div>
              </div>
            </div>
          </div>

          {/* QR code + branding */}
          <div style={{ textAlign: 'center', minWidth: '115px' }}>
            <p style={{ fontSize: '9px', fontWeight: 600, marginBottom: '4px', lineHeight: 1.4 }}>
              ¡Comunícate con nosotros!<br />
              <span style={{ fontSize: '8px', color: '#666' }}>Comentarias and queries:</span>
            </p>
            <img
              src={qrImageUrl}
              alt="QR Validación"
              style={{ width: '85px', height: '85px', border: '1px solid #ddd', display: 'block', margin: '0 auto' }}
            />
            <p style={{ fontSize: '10px', fontWeight: 900, marginTop: '4px', lineHeight: 1.3, color: '#1a3a6e' }}>
              HOTEL &amp; BOUTIQUE<br />VISTA AL MAR
            </p>
            <p style={{ fontSize: '9px', color: '#555', marginTop: '3px' }}>
              (Firma del Recepcionista)
            </p>
          </div>
        </div>

        {/* ── LÍNEAS DE FIRMA ── */}
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '6px 30px 12px', gap: '40px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #555', height: '18px' }}></div>
            <p style={{ fontSize: '9.5px', color: '#444', marginTop: '3px' }}>Firma del Recepcionista</p>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #555', height: '18px' }}></div>
            <p style={{ fontSize: '9.5px', color: '#444', marginTop: '3px' }}>(Firma del Huésped)</p>
          </div>
        </div>

        {/* ── ESTADO Y EMISIÓN ── */}
        <div style={{ padding: '3px 14px 8px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '9px', color: '#888' }}>
            Emitido el {formatDateTime(reservation.approved_at)}
            {reservation.approved_by_name ? ` por ${reservation.approved_by_name}` : ''}
            {' · '}Estado:{' '}
            <span style={{ fontWeight: 700, color: reservation.status === 'active' ? '#16a34a' : '#dc2626' }}>
              {reservation.status === 'active' ? 'ACTIVA' : 'CANCELADA'}
            </span>
          </p>
        </div>
      </div>

      {/* ── Botones inferiores (no se imprimen) ── */}
      <div className="no-print flex gap-2">
        <Button
          variant="secondary"
          onClick={() => onNavigate({ page: 'request-detail', requestId })}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Ver Solicitud
        </Button>
        <Button onClick={() => window.print()} className="flex-1">
          <Download className="h-4 w-4" />
          Descargar PDF
        </Button>
      </div>
    </div>
  );
}
