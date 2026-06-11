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

  function handlePrint() {
    window.print();
  }

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
  const firstPhone = detail.travelers.find((t) => t.numero_celular)?.numero_celular ?? HOTEL_PHONE;
  const checkInFormatted = (() => {
    const d = new Date(detail.llegada_panama);
    return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  })();
  const checkInTime = (() => {
    const d = new Date(detail.llegada_panama);
    let h = d.getHours(), m = d.getMinutes();
    const ampm = h >= 12 ? 'p.m.' : 'a.m.';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  })();
  const departureFormatted = (() => {
    const d = new Date(detail.salida_panama);
    return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  })();
  const departureTime = (() => {
    const d = new Date(detail.salida_panama);
    let h = d.getHours(), m = d.getMinutes();
    const ampm = h >= 12 ? 'p.m.' : 'a.m.';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  })();
  const checkoutFormatted = (() => {
    const d = new Date(detail.salida_hotel + 'T12:00:00');
    return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  })();

  return (
    <div className="space-y-4 pb-4">
      {/* Acciones — ocultas al imprimir */}
      <div className="no-print">
        <PageHeader
          title={`Reserva #${reservation.reservation_number}`}
          subtitle={reservation.verification_code}
          onBack={() => onNavigate({ page: 'request-detail', requestId })}
        />

        <Card className="p-4 mb-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handlePrint} className="flex-1">
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

      {/* ============================================================
          DOCUMENTO DE RESERVA — visible en pantalla y al imprimir
          ============================================================ */}
      <div ref={printRef} id="reservation-print" className="bg-white border border-slate-200 rounded-xl overflow-hidden print:rounded-none print:border-0">

        {/* Encabezado azul */}
        <div className="bg-blue-800 text-white text-center py-6 px-4">
          <div className="flex justify-center mb-3">
            <img
              src="/logo_del_hotel.jpeg"
              alt="Vista al Mar"
              className="h-16 w-16 object-contain rounded-lg border-2 border-white/30"
            />
          </div>
          <h1 className="text-base font-bold tracking-wide uppercase">
            Reservation {HOTEL_TITLE}
          </h1>
          <p className="text-blue-200 text-xs mt-1 leading-tight">
            ON BEHALF OF HOTEL VISTA ALMAR, WE WANT TO EXPRESS OUR THANKS TO YOU FOR CHOOSING OUR SERVICES DETAILS
          </p>
          <p className="text-blue-300 text-xs mt-2 font-mono">{HOTEL_RUC}</p>
        </div>

        {/* Tabla de información principal */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th colSpan={2} className="border border-blue-600 px-3 py-2 text-left font-bold text-sm">
                  Informacion de Reservacion
                </th>
                <th colSpan={2} className="border border-blue-600 px-3 py-2 text-center font-bold text-sm">
                  LODGING
                </th>
              </tr>
              <tr className="bg-blue-700 text-white">
                <th className="border border-blue-600 px-3 py-1.5 text-left font-semibold">CAMPO</th>
                <th className="border border-blue-600 px-3 py-1.5 text-left font-semibold">DETALLE</th>
                <th className="border border-blue-600 px-3 py-1.5 text-center font-semibold">CHECK IN</th>
                <th className="border border-blue-600 px-3 py-1.5 text-center font-semibold">CHECKOUT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200 px-3 py-2 font-semibold text-blue-800 bg-blue-50 whitespace-nowrap">
                  DATE OF CHECK IN TO PANAMA
                </td>
                <td className="border border-slate-200 px-3 py-2 font-bold">
                  {checkInFormatted}<br />
                  <span className="text-slate-500">{checkInTime}</span>
                </td>
                <td className="border border-slate-200 px-3 py-2 text-center font-bold bg-slate-50">
                  {checkInFormatted}
                </td>
                <td className="border border-slate-200 px-3 py-2 text-center font-bold bg-slate-50">
                  {checkoutFormatted}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2 font-semibold text-blue-800 bg-blue-50 whitespace-nowrap">
                  DEPARTURE DATE PANAMA
                </td>
                <td className="border border-slate-200 px-3 py-2 font-bold">
                  {departureFormatted}<br />
                  <span className="text-slate-500">{departureTime}</span>
                </td>
                <td className="border border-slate-200 px-3 py-2 text-center font-semibold text-blue-800 bg-blue-50">
                  PHONE
                </td>
                <td className="border border-slate-200 px-3 py-2 text-center font-bold text-red-600">
                  {firstPhone}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2 font-semibold text-blue-800 bg-blue-50 whitespace-nowrap">
                  RESERVATION NUMBER
                </td>
                <td className="border border-slate-200 px-3 py-2 font-bold text-xl text-blue-800">
                  {reservation.reservation_number}
                </td>
                <td className="border border-slate-200 px-3 py-2 text-center font-semibold text-blue-800 bg-blue-50">
                  NIGHTS
                </td>
                <td className="border border-slate-200 px-3 py-2 text-center font-bold">
                  {detail.noches}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sección de viajeros */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th colSpan={6} className="border border-blue-600 px-3 py-2 text-center font-bold text-sm tracking-widest">
                  INCLUDES TRANSPORTATION SERVICE
                </th>
              </tr>
              <tr className="bg-blue-700 text-white">
                <th className="border border-blue-600 px-3 py-1.5 text-left font-semibold">NAME</th>
                <th className="border border-blue-600 px-3 py-1.5 text-left font-semibold">PASSPORT</th>
                <th className="border border-blue-600 px-3 py-1.5 text-center font-semibold">ADULT</th>
                <th className="border border-blue-600 px-3 py-1.5 text-center font-semibold">KIDS</th>
                <th className="border border-blue-600 px-3 py-1.5 text-left font-semibold">PHONE</th>
                <th className="border border-blue-600 px-3 py-1.5 text-right font-semibold">PRICETOTAL</th>
              </tr>
            </thead>
            <tbody>
              {detail.travelers.map((t) => (
                <tr key={t.id}>
                  <td className="border border-slate-200 px-3 py-2.5 font-bold text-slate-800 uppercase">
                    {t.nombre_completo}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 font-mono text-slate-700">
                    {t.numero_pasaporte}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center">1</td>
                  <td className="border border-slate-200 px-3 py-2.5 text-center text-slate-400">—</td>
                  <td className="border border-slate-200 px-3 py-2.5 text-red-600 font-semibold">
                    {t.numero_celular ?? '—'}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-right font-bold text-slate-800">
                    ${pricePerPerson.toFixed(2)}
                  </td>
                </tr>
              ))}
              {/* Filas vacías de relleno para diseño */}
              {detail.travelers.length < 4 &&
                Array.from({ length: 4 - detail.travelers.length }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="border border-slate-200 px-3 py-3">&nbsp;</td>
                    <td className="border border-slate-200 px-3 py-3"></td>
                    <td className="border border-slate-200 px-3 py-3"></td>
                    <td className="border border-slate-200 px-3 py-3"></td>
                    <td className="border border-slate-200 px-3 py-3"></td>
                    <td className="border border-slate-200 px-3 py-3"></td>
                  </tr>
                ))}
              {/* Fila de tipo de habitación y total */}
              <tr className="bg-slate-50">
                <td colSpan={2} className="border border-slate-200 px-3 py-2.5 text-center">
                  <span className="font-bold text-slate-700 block">MATRIMONIAL / SINGLE / SUITE</span>
                  <span className="text-blue-700 text-xs">Habitacion Standar</span>
                </td>
                <td colSpan={3} className="border border-slate-200 px-3 py-2.5 text-right font-bold text-slate-700">
                  TOTAL
                </td>
                <td className="border border-slate-200 px-3 py-2.5 text-right font-bold text-lg text-emerald-700">
                  ${Number(detail.total_estimado).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pie de página */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {/* Texto legal */}
            <div className="flex-1 space-y-2">
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>ATENCIÓN:</strong> El Decreto Ejecutivo N°82 del 23 de diciembre de 2008
                regula la actividad hotelera en Panamá.
              </p>
              <p className="text-xs text-slate-600">
                <strong>Recepción / Front Desk:</strong> {HOTEL_PHONE}
              </p>
              <div className="mt-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Huésped / Guest Name:</span>
                  <div className="flex-1 border-b border-slate-300 min-w-16"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Dirección / Address:</span>
                  <div className="flex-1 border-b border-slate-300 min-w-16"></div>
                </div>
              </div>

              {/* Código de verificación */}
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-xs font-semibold text-blue-800">Código de Verificación:</p>
                <p className="text-sm font-mono font-bold text-blue-700">{reservation.verification_code}</p>
                <p className="text-xs text-blue-500 mt-0.5">Valide en: {validationUrl}</p>
              </div>
            </div>

            {/* QR code */}
            <div className="flex flex-col items-center gap-2 sm:w-44">
              <img
                src={qrImageUrl}
                alt="QR Validación"
                className="w-32 h-32 border border-slate-200 rounded"
              />
              <p className="text-xs font-semibold text-slate-600 text-center">
                ¡Comunícate con nosotros!<br />
                <span className="text-slate-400 text-xs">Scan para validar reserva</span>
              </p>
              <p className="text-xs font-bold text-blue-800 text-center leading-tight">
                {HOTEL_TITLE}
              </p>
            </div>
          </div>

          {/* Líneas de firma */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-8">
            <div className="flex-1 text-center">
              <div className="border-b border-slate-400 mb-1 mx-4"></div>
              <p className="text-xs text-slate-600">Firma del Recepcionista</p>
            </div>
            <div className="flex-1 text-center">
              <div className="border-b border-slate-400 mb-1 mx-4"></div>
              <p className="text-xs text-slate-600">Firma del Huésped / (Guest Signature)</p>
            </div>
          </div>

          {/* Generado por */}
          <div className="mt-3 pt-3 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Emitido el {formatDateTime(reservation.approved_at)}
              {reservation.approved_by_name ? ` por ${reservation.approved_by_name}` : ''}
              {' · '}Estado: <span className={reservation.status === 'active' ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                {reservation.status === 'active' ? 'Activa' : 'Cancelada'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Botones inferiores — ocultos al imprimir */}
      <div className="no-print flex gap-2">
        <Button
          variant="secondary"
          onClick={() => onNavigate({ page: 'request-detail', requestId })}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Ver Solicitud
        </Button>
        <Button onClick={handlePrint} className="flex-1">
          <Download className="h-4 w-4" />
          Descargar PDF
        </Button>
      </div>
    </div>
  );
}
