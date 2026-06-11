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
const HOTEL_TITLE = 'HOTEL & BOUTIQUE VISTA AL MAR';
const HOTEL_RUC = 'RUC1556766114-2-2019 DV79';

function fmtDayMonthYear(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
}

function fmtTime12(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'p.m.' : 'a.m.';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

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

  const checkInDate = fmtDayMonthYear(detail.llegada_panama);
  const checkInTime = fmtTime12(detail.llegada_panama);
  const departureDate = fmtDayMonthYear(detail.salida_panama);
  const departureTime = fmtTime12(detail.salida_panama);
  const checkoutDate = fmtDayMonthYear(detail.salida_hotel + 'T12:00:00');

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
          DOCUMENTO OFICIAL — se imprime completo
          ══════════════════════════════════════════════ */}
      <div
        ref={printRef}
        id="reservation-print"
        className="bg-white border border-slate-300 overflow-hidden text-[11px] print:border-0 print:shadow-none"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      >

        {/* ── CABECERA CON FONDO TIPO SKYLINE ── */}
        <div
          className="relative h-28 flex items-start px-3 pt-2"
          style={{
            background: 'linear-gradient(180deg, #0c2d5c 0%, #1a4e8a 35%, #2872c4 60%, #5ba3e0 80%, #a8d4f5 95%, #d9eef9 100%)',
          }}
        >
          {/* Logo + nombre hotel */}
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1.5 backdrop-blur-sm">
            <img
              src="/logo_del_hotel.jpeg"
              alt="Vista al Mar"
              className="h-12 w-12 object-contain rounded bg-white p-0.5"
            />
            <div className="text-white">
              <p className="text-sm font-extrabold leading-tight tracking-wide">VISTA AL MAR</p>
              <p className="text-xs font-light leading-tight">HOTEL &amp; BOUTIQUE</p>
            </div>
          </div>
        </div>

        {/* ── TÍTULO PRINCIPAL ── */}
        <div className="text-center px-4 pt-3 pb-2 border-b border-slate-200">
          <h1 className="text-sm font-extrabold text-blue-900 tracking-wide uppercase">
            Reservation {HOTEL_TITLE}
          </h1>
          <p className="text-[10px] font-bold text-blue-800 mt-1 uppercase tracking-wide">
            ON BEHALF OF HOTEL VISTA ALMAR, WE WANT TO EXPRESS OUR THANKS TO YOU FOR CHOOSING OUR SERVICES DETAILS
          </p>
          <p className="text-[10px] text-blue-700 font-semibold mt-1">{HOTEL_RUC}</p>
        </div>

        {/* ── TABLA DE INFORMACIÓN PRINCIPAL ── */}
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            {/* Cabeceras de sección */}
            <thead>
              <tr>
                <th
                  colSpan={2}
                  style={{
                    background: '#1a4e8a', color: 'white', padding: '6px 10px',
                    textAlign: 'left', fontStyle: 'italic', fontWeight: 700,
                    border: '1px solid #1e40af',
                  }}
                >
                  informacion de Reserbacion
                </th>
                <th
                  colSpan={3}
                  style={{
                    background: '#1a4e8a', color: 'white', padding: '6px 10px',
                    textAlign: 'center', fontWeight: 700, letterSpacing: '0.1em',
                    border: '1px solid #1e40af',
                  }}
                >
                  LODGING
                </th>
              </tr>
              <tr style={{ background: '#1e4fa5', color: 'white' }}>
                <th style={{ border: '1px solid #3b82f6', padding: '4px 8px', textAlign: 'left', fontWeight: 700 }}>FLIGHT / ARRIBAL NUMBER</th>
                <th style={{ border: '1px solid #3b82f6', padding: '4px 8px', textAlign: 'left' }}></th>
                <th style={{ border: '1px solid #3b82f6', padding: '4px 8px', textAlign: 'center', fontWeight: 700 }}>CHECK IN</th>
                <th style={{ border: '1px solid #3b82f6', padding: '4px 8px', textAlign: 'center', fontWeight: 700 }}>CHECK IN</th>
                <th style={{ border: '1px solid #3b82f6', padding: '4px 8px', textAlign: 'center', fontWeight: 700 }}>CHECKOUT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 700, color: '#1e40af', background: '#eff6ff', whiteSpace: 'nowrap' }}>
                  DATE OF CHECK IN TO PANAMA
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 700 }}>
                  {checkInDate}<br />
                  <span style={{ color: '#64748b' }}>{checkInTime}</span>
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 700, color: '#1e40af', background: '#eff6ff', textAlign: 'center' }}>
                  CHECK IN
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 700, textAlign: 'center', background: '#e0f2fe' }}>
                  {checkInDate}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 700, textAlign: 'center', background: '#e0f2fe' }}>
                  {checkoutDate}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 700, color: '#1e40af', background: '#eff6ff', whiteSpace: 'nowrap' }}>
                  DEPARTURE FLIGHT NUMBER
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', color: '#94a3b8' }}>—</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 700, color: '#1e40af', background: '#eff6ff', textAlign: 'center' }}>
                  CHECKOUT
                </td>
                <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '5px 8px', background: '#f8fafc' }}></td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 700, color: '#1e40af', background: '#eff6ff', whiteSpace: 'nowrap' }}>
                  DEPARTURE DATE PANAMA
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 700 }}>
                  {departureDate}<br />
                  <span style={{ color: '#64748b' }}>{departureTime}</span>
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 700, color: '#1e40af', background: '#eff6ff', textAlign: 'center' }}>
                  PHONE
                </td>
                <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 700, color: '#dc2626', textAlign: 'center' }}>
                  {HOTEL_PHONE}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 700, color: '#1e40af', background: '#eff6ff', whiteSpace: 'nowrap' }}>
                  RESERVATION NUMBER
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 900, fontSize: '16px', color: '#1e40af' }}>
                  {reservation.reservation_number}
                </td>
                <td colSpan={3} style={{ border: '1px solid #cbd5e1', background: '#f8fafc' }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── TABLA DE VIAJEROS ── */}
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr>
                <th
                  colSpan={6}
                  style={{
                    background: '#1a4e8a', color: 'white', padding: '6px 10px',
                    textAlign: 'center', fontWeight: 900, letterSpacing: '0.15em',
                    border: '1px solid #1e40af', fontSize: '12px',
                  }}
                >
                  INCLUDES TRANSPORTATION SERVICE
                </th>
              </tr>
              <tr style={{ background: '#1e4fa5', color: 'white' }}>
                <th style={{ border: '1px solid #3b82f6', padding: '5px 8px', textAlign: 'left', fontWeight: 700 }}>NAME</th>
                <th style={{ border: '1px solid #3b82f6', padding: '5px 8px', textAlign: 'left', fontWeight: 700 }}>PASSPORT</th>
                <th style={{ border: '1px solid #3b82f6', padding: '5px 8px', textAlign: 'center', fontWeight: 700 }}>ADULT</th>
                <th style={{ border: '1px solid #3b82f6', padding: '5px 8px', textAlign: 'center', fontWeight: 700 }}>KIDS</th>
                <th style={{ border: '1px solid #3b82f6', padding: '5px 8px', textAlign: 'left', fontWeight: 700 }}>PHONE</th>
                <th style={{ border: '1px solid #3b82f6', padding: '5px 8px', textAlign: 'right', fontWeight: 700 }}>PRICETOTAL</th>
              </tr>
            </thead>
            <tbody>
              {detail.travelers.map((t) => (
                <tr key={t.id}>
                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', fontWeight: 700, textTransform: 'uppercase' }}>
                    {t.nombre_completo}
                  </td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', fontFamily: 'monospace' }}>
                    {t.numero_pasaporte}
                  </td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', textAlign: 'center' }}>1</td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', textAlign: 'center', color: '#94a3b8' }}></td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', color: '#dc2626', fontWeight: 600 }}>
                    {t.numero_celular ?? '—'}
                  </td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>
                    ${pricePerPerson.toFixed(2)}
                  </td>
                </tr>
              ))}
              {/* Filas de relleno (como en el PDF original) */}
              {Array.from({ length: emptyRows }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td style={{ border: '1px solid #e2e8f0', padding: '10px 8px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '10px 8px' }}></td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '10px 8px' }}></td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '10px 8px' }}></td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '10px 8px' }}></td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '10px 8px' }}></td>
                </tr>
              ))}
              {/* Fila tipo de habitación */}
              <tr style={{ background: '#f8fafc' }}>
                <td colSpan={2} style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>MATRIMONIAL/SINGLE/SUITE</div>
                  <div style={{ fontWeight: 900, color: '#dc2626', fontSize: '13px' }}>DOBLE</div>
                </td>
                <td colSpan={2} style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'center', color: '#3b82f6' }}>
                  Habitacion<br />Standar
                </td>
                <td colSpan={2} style={{ border: '1px solid #e2e8f0', padding: '8px' }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── SEPARADOR ── */}
        <div style={{ borderTop: '2px dashed #94a3b8', margin: '4px 0' }}></div>

        {/* ── PIE DE PÁGINA ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', gap: '16px', alignItems: 'flex-start' }}>
          {/* Texto legal y firmas */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '10px', lineHeight: 1.5, marginBottom: '6px' }}>
              <strong>ATENCIÓN:</strong> El Decreto Ejecutivo N°82 del 23 de diciembre de 2008
              regula la actividad hotelera en Panamá.
            </p>
            <p style={{ fontSize: '10px', marginBottom: '4px' }}>
              <strong>Recepción / Front Desk:</strong> [Address plalacerditor]
            </p>
            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '10px', marginBottom: '6px' }}>
                Huésped / Guest Name: <span style={{ display: 'inline-block', width: '120px', borderBottom: '1px solid #475569' }}>&nbsp;</span>
              </p>
              <p style={{ fontSize: '10px' }}>
                Dirección / Address: &nbsp;&nbsp;<span style={{ display: 'inline-block', width: '120px', borderBottom: '1px solid #475569' }}>&nbsp;</span>
              </p>
            </div>
            {/* Código de verificación */}
            <div style={{ marginTop: '8px', padding: '4px 8px', background: '#eff6ff', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#1e40af' }}>
                Código: {reservation.verification_code}
              </p>
              <p style={{ fontSize: '8px', color: '#3b82f6', wordBreak: 'break-all' }}>
                {validationUrl}
              </p>
            </div>
          </div>

          {/* QR + branding */}
          <div style={{ textAlign: 'center', minWidth: '110px' }}>
            <p style={{ fontSize: '9px', fontWeight: 600, marginBottom: '4px' }}>
              ¡Comunícate con nosotros!<br />
              <span style={{ fontSize: '8px', color: '#64748b' }}>Comentarias and queries:</span>
            </p>
            <img
              src={qrImageUrl}
              alt="QR Validación"
              style={{ width: '80px', height: '80px', border: '1px solid #e2e8f0' }}
            />
            <p style={{ fontSize: '9px', fontWeight: 900, marginTop: '4px', lineHeight: 1.3, color: '#1e40af' }}>
              HOTEL &amp; BOUTIQUE<br />VISTA AL MAR
            </p>
            <p style={{ fontSize: '8px', color: '#475569', marginTop: '2px' }}>
              (Firma del Recepcionista)
            </p>
          </div>
        </div>

        {/* ── LÍNEAS DE FIRMA ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 40px 12px', gap: '40px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #475569', marginBottom: '4px', height: '20px' }}></div>
            <p style={{ fontSize: '10px', color: '#475569' }}>Firma del Recepcionista</p>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #475569', marginBottom: '4px', height: '20px' }}></div>
            <p style={{ fontSize: '10px', color: '#475569' }}>(Firma del Huésped)</p>
          </div>
        </div>

        {/* ── ESTADO Y EMISIÓN ── */}
        <div style={{ padding: '4px 14px 8px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '9px', color: '#94a3b8' }}>
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
