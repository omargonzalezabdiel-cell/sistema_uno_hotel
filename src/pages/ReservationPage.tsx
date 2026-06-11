import { useEffect, useRef, useState } from 'react';
import { Printer, FileText, ArrowLeft, QrCode } from 'lucide-react';
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
// Panama City skyline panoramic photo (Pexels)
const SKYLINE_URL = 'https://images.pexels.com/photos/2041627/pexels-photo-2041627.jpeg?auto=compress&cs=tinysrgb&w=1200&h=200&fit=crop';

// Colors matching the PDF exactly
const BLUE_HEADER = '#1565C0';   // dark blue header bg
const BLUE_LABEL  = '#1565C0';   // bold blue label text
const LODGING_BG  = '#1565C0';   // LODGING header bg
const DATE_BG     = '#1565C0';   // date cells in lodging (dark blue)

function fmtDDMMYYYY(iso: string): string {
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

// Shared cell styles
const baseCell: React.CSSProperties = {
  border: '1px solid #bdbdbd',
  padding: '5px 8px',
  fontSize: '11px',
  verticalAlign: 'middle',
};
const labelCell: React.CSSProperties = {
  ...baseCell,
  fontWeight: 700,
  color: BLUE_LABEL,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};
const valueCell: React.CSSProperties = {
  ...baseCell,
  fontWeight: 700,
  color: '#111',
};
const headerCell: React.CSSProperties = {
  border: '1px solid #1255a0',
  padding: '6px 10px',
  background: BLUE_HEADER,
  color: 'white',
  fontWeight: 700,
  fontSize: '12px',
  textAlign: 'center',
};
const lodgingDateCell: React.CSSProperties = {
  ...baseCell,
  background: LODGING_BG,
  color: 'white',
  fontWeight: 900,
  textAlign: 'center',
  fontSize: '12px',
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

  const checkInDate   = fmtDDMMYYYY(detail.llegada_panama);
  const checkInTime   = fmtTime12(detail.llegada_panama);
  const departureDate = fmtDDMMYYYY(detail.salida_panama);
  const departureTime = fmtTime12(detail.salida_panama);
  const checkoutDate  = fmtDDMMYYYY(detail.salida_hotel + 'T12:00:00');

  // Minimum 5 data rows in traveler table (empty rows fill the rest)
  const emptyRows = Math.max(0, 5 - detail.travelers.length);

  return (
    <div className="space-y-4 pb-4">

      {/* ── Action bar (hidden when printing) ── */}
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

      {/* ════════════════════════════════════════════════════
          OFFICIAL RESERVATION DOCUMENT — exact PDF replica
          ════════════════════════════════════════════════════ */}
      <div
        ref={printRef}
        id="reservation-print"
        className="bg-white print:border-0 print:shadow-none"
        style={{
          fontFamily: 'Arial, Helvetica, sans-serif',
          border: '1px solid #ccc',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >

        {/* ── 1. HEADER: panoramic skyline photo + logo ── */}
        <div style={{ position: 'relative', height: '130px', overflow: 'hidden' }}>
          <img
            src={SKYLINE_URL}
            alt="Panama City Skyline"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 60%',
              display: 'block',
            }}
          />
          {/* Logo overlay — top left */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.88)',
            borderRadius: '6px',
            padding: '5px 10px 5px 6px',
          }}>
            <img
              src="/logo_del_hotel.jpeg"
              alt="Vista al Mar"
              style={{ height: '46px', width: '46px', objectFit: 'contain', borderRadius: '3px' }}
            />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#1565C0', letterSpacing: '0.05em' }}>VISTA AL MAR</div>
              <div style={{ fontSize: '9px', fontWeight: 400, color: '#555', letterSpacing: '0.1em' }}>HOTEL &amp; BOUTIQUE</div>
            </div>
          </div>
        </div>

        {/* ── 2. TITLE SECTION ── */}
        <div style={{ textAlign: 'center', padding: '10px 12px 6px', borderBottom: '1px solid #ddd' }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 900,
            color: BLUE_LABEL,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            Reservation Hotel &amp; Boutique Vista al Mar
          </div>
          <div style={{
            fontSize: '10px',
            fontWeight: 700,
            color: BLUE_LABEL,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            marginBottom: '3px',
          }}>
            On behalf of Hotel Vista Almar, we want to express our thanks to you for choosing our services details
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: BLUE_LABEL }}>
            {HOTEL_RUC}
          </div>
        </div>

        {/* ── 3. MAIN INFO TABLE ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            {/* Col 1: label */}
            <col style={{ width: '26%' }} />
            {/* Col 2: value */}
            <col style={{ width: '20%' }} />
            {/* Col 3: CHECK IN/CHECKOUT label */}
            <col style={{ width: '16%' }} />
            {/* Col 4: LODGING CHECK IN date */}
            <col style={{ width: '19%' }} />
            {/* Col 5: LODGING CHECKOUT date */}
            <col style={{ width: '19%' }} />
          </colgroup>
          <tbody>
            {/* Section header row */}
            <tr>
              <td
                colSpan={2}
                style={{
                  ...headerCell,
                  textAlign: 'left',
                  fontStyle: 'italic',
                  fontSize: '13px',
                  letterSpacing: '0.02em',
                }}
              >
                informacion de Reserbacion
              </td>
              <td
                colSpan={3}
                style={{
                  ...headerCell,
                  fontSize: '14px',
                  letterSpacing: '0.12em',
                }}
              >
                LODGING
              </td>
            </tr>
            {/* Sub-header row */}
            <tr>
              <td
                colSpan={2}
                style={{
                  ...baseCell,
                  fontWeight: 700,
                  color: BLUE_LABEL,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  background: '#e8f0fe',
                }}
              >
                FLIGHT/ ARRIBAL NUMBER
              </td>
              <td style={{ ...baseCell, fontWeight: 700, color: BLUE_LABEL, textAlign: 'center', fontSize: '11px', background: '#e8f0fe' }}>
                CHECK IN
              </td>
              <td style={{ ...headerCell, fontSize: '11px', padding: '4px 6px' }}>
                CHECK IN
              </td>
              <td style={{ ...headerCell, fontSize: '11px', padding: '4px 6px' }}>
                CHECKOUT
              </td>
            </tr>
            {/* Row: DATE OF CHECK IN TO PANAMA */}
            <tr>
              <td style={labelCell}>DATE OF CHECK IN TO PANAMA</td>
              <td style={valueCell}>{checkInDate}</td>
              <td style={{ ...valueCell, color: BLUE_LABEL, fontWeight: 700, textAlign: 'center' }}>{checkInTime}</td>
              <td style={lodgingDateCell}>{checkInDate}</td>
              <td style={lodgingDateCell}>{checkoutDate}</td>
            </tr>
            {/* Row: DEPARTURE FLIGHT NUMBER */}
            <tr>
              <td style={labelCell}>DEPARTURE FLIGHT NUMBER</td>
              <td style={valueCell}></td>
              <td style={{ ...baseCell, fontWeight: 700, color: BLUE_LABEL, textAlign: 'center', fontSize: '11px', textTransform: 'uppercase' }}>
                CHECKOUT
              </td>
              <td colSpan={2} style={{ ...baseCell, background: '#fafafa' }}></td>
            </tr>
            {/* Row: DEPARTURE DATE PANAMA */}
            <tr>
              <td style={labelCell}>DEPARTURE DATE PANAMA</td>
              <td style={valueCell}>{departureDate}</td>
              <td style={{ ...valueCell, color: BLUE_LABEL, fontWeight: 700, textAlign: 'center' }}>{departureTime}</td>
              <td colSpan={2} style={{ ...baseCell, background: '#fafafa' }}></td>
            </tr>
            {/* Row: RESERVATION NUMBER + PHONE */}
            <tr>
              <td style={labelCell}>RESERVATION NUMBER</td>
              <td style={{ ...valueCell, fontSize: '16px', fontWeight: 900, color: '#111' }}>
                {reservation.reservation_number}
              </td>
              <td style={{ ...baseCell, background: '#fafafa' }}></td>
              <td style={{ ...baseCell, fontWeight: 700, color: BLUE_LABEL, textAlign: 'center', textTransform: 'uppercase', fontSize: '11px' }}>
                PHONE
              </td>
              <td style={{ ...baseCell, fontWeight: 700, color: '#cc0000', textAlign: 'center', fontSize: '11px' }}>
                {HOTEL_PHONE}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── 4. TRAVELERS TABLE ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
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
                style={{
                  ...headerCell,
                  fontSize: '14px',
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                  padding: '8px 10px',
                }}
              >
                INCLUDES TRANSPORTATION SERVICE
              </th>
            </tr>
            <tr>
              <th style={{ ...headerCell, textAlign: 'left', fontSize: '11px', padding: '5px 8px' }}>NAME</th>
              <th style={{ ...headerCell, textAlign: 'left', fontSize: '11px', padding: '5px 8px' }}>PASSPORT</th>
              <th style={{ ...headerCell, fontSize: '11px', padding: '5px 6px' }}>ADULT</th>
              <th style={{ ...headerCell, fontSize: '11px', padding: '5px 6px' }}>KIDS</th>
              <th style={{ ...headerCell, textAlign: 'left', fontSize: '11px', padding: '5px 8px' }}>PHONE</th>
              <th style={{ ...headerCell, textAlign: 'right', fontSize: '11px', padding: '5px 8px' }}>PRICETOTAL</th>
            </tr>
          </thead>
          <tbody>
            {detail.travelers.map((t) => (
              <tr key={t.id}>
                <td style={{ ...baseCell, fontWeight: 700, textTransform: 'uppercase', color: '#111' }}>
                  {t.nombre_completo}
                </td>
                <td style={{ ...baseCell, fontFamily: 'monospace', color: '#111' }}>
                  {t.numero_pasaporte}
                </td>
                <td style={{ ...baseCell, textAlign: 'center' }}>1</td>
                <td style={{ ...baseCell, textAlign: 'center' }}></td>
                <td style={{ ...baseCell, color: '#cc0000', fontWeight: 600 }}>
                  {t.numero_celular ? `+${t.numero_celular.replace(/^\+/, '')}` : ''}
                </td>
                <td style={{ ...baseCell, textAlign: 'right', fontWeight: 700 }}>
                  ${pricePerPerson.toFixed(2)}
                </td>
              </tr>
            ))}
            {/* Empty filler rows */}
            {Array.from({ length: emptyRows }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td style={{ ...baseCell, height: '24px' }}>&nbsp;</td>
                <td style={baseCell}></td>
                <td style={baseCell}></td>
                <td style={baseCell}></td>
                <td style={baseCell}></td>
                <td style={baseCell}></td>
              </tr>
            ))}
            {/* Room type row */}
            <tr>
              <td colSpan={2} style={{ ...baseCell, textAlign: 'center', padding: '8px 6px' }}>
                <div style={{ fontWeight: 700, color: '#111', fontSize: '11px', textTransform: 'uppercase' }}>
                  MATRIMONIAL/SINGLE/SUITE
                </div>
                <div style={{ fontWeight: 900, color: '#cc0000', fontSize: '13px' }}>DOBLE</div>
              </td>
              <td colSpan={2} style={{ ...baseCell, textAlign: 'center', color: BLUE_LABEL, fontSize: '11px' }}>
                Habitacion<br />Standar
              </td>
              <td colSpan={2} style={baseCell}></td>
            </tr>
          </tbody>
        </table>

        {/* ── 5. DASHED SEPARATOR ── */}
        <div style={{
          borderTop: '2px dashed #aaa',
          margin: '10px 0 6px',
          borderStyle: 'dashed',
          borderWidth: '1px 0 0',
          borderColor: '#999',
        }}></div>

        {/* ── 6. FOOTER SECTION ── */}
        <div style={{ display: 'flex', gap: '20px', padding: '6px 14px 10px', alignItems: 'flex-start' }}>

          {/* Left: Legal text + input lines */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '10px', lineHeight: 1.6, marginBottom: '6px' }}>
              <strong>ATENCIÓN:</strong> El Decreto Ejecutivo N°82 del 23 de diciembre de 2008
              regula la actividad hoteiera en Panamá.
            </p>
            <p style={{ fontSize: '10px', marginBottom: '10px' }}>
              <strong>Recepción</strong> / Front Desk: [Address plalacerditor]
            </p>
            {/* Guest Name field */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>Huésped / Guest Name: [</span>
              <div style={{ flex: 1, borderBottom: '1px solid #555', minWidth: '80px', marginBottom: '1px' }}></div>
              <span style={{ fontSize: '10px' }}>]</span>
            </div>
            {/* Address field */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
              <span style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>Dirección / Address: [</span>
              <div style={{ flex: 1, borderBottom: '1px solid #555', minWidth: '80px', marginBottom: '1px' }}></div>
              <span style={{ fontSize: '10px' }}>]</span>
            </div>
          </div>

          {/* Right: QR + hotel branding + receptionist signature */}
          <div style={{ textAlign: 'center', minWidth: '120px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, marginBottom: '4px', lineHeight: 1.4 }}>
              ¡Comunícate con nosotros!
            </p>
            <p style={{ fontSize: '9px', color: '#555', marginBottom: '6px' }}>Comentarias and queries:</p>
            <img
              src={qrImageUrl}
              alt="QR Validación"
              style={{ width: '90px', height: '90px', border: '1px solid #ddd', display: 'block', margin: '0 auto' }}
            />
            <p style={{ fontSize: '11px', fontWeight: 900, marginTop: '6px', lineHeight: 1.3, color: '#111' }}>
              HOTEL &amp; BOUTIQUE<br />VISTA AL MAR
            </p>
            {/* Receptionist signature line */}
            <div style={{ borderBottom: '1px solid #555', margin: '8px auto 3px', width: '100px' }}></div>
            <p style={{ fontSize: '10px', color: '#333' }}>(Firma del Recepcionista)</p>
          </div>
        </div>

        {/* ── 7. BOTTOM SIGNATURE LINES ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '10px 40px 16px',
          gap: '40px',
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #555', height: '20px' }}></div>
            <p style={{ fontSize: '10px', color: '#333', marginTop: '4px' }}>Firma del Recepcionista</p>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #555', height: '20px' }}></div>
            <p style={{ fontSize: '10px', color: '#333', marginTop: '4px' }}>(Firma del Huésped)</p>
          </div>
        </div>

        {/* ── 8. ISSUANCE METADATA ── */}
        <div style={{ padding: '3px 14px 8px', textAlign: 'center', borderTop: '1px solid #e0e0e0' }}>
          <p style={{ fontSize: '9px', color: '#999' }}>
            Emitido el {formatDateTime(reservation.approved_at)}
            {reservation.approved_by_name ? ` por ${reservation.approved_by_name}` : ''}
            {' · '}Estado:{' '}
            <span style={{ fontWeight: 700, color: reservation.status === 'active' ? '#16a34a' : '#dc2626' }}>
              {reservation.status === 'active' ? 'ACTIVA' : 'CANCELADA'}
            </span>
            {' · '}{reservation.verification_code}
          </p>
        </div>
      </div>

      {/* ── Bottom action buttons (hidden when printing) ── */}
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
          <Printer className="h-4 w-4" />
          Imprimir / PDF
        </Button>
      </div>
    </div>
  );
}
