import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Shield, ExternalLink } from 'lucide-react';
import { getReservationByCode } from '../lib/reservations';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface ValidationPageProps {
  code: string;
}

interface ValidationData {
  reservation_number: number;
  verification_code: string;
  status: string;
  approved_at: string;
  requests: {
    responsable_nombre: string;
    responsable_pasaporte: string;
    llegada_panama: string;
    salida_hotel: string;
    noches: number;
    total_estimado: number;
    cantidad_personas: number;
  } | null;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function ValidationPage({ code }: ValidationPageProps) {
  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(false);
  const [data, setData] = useState<ValidationData | null>(null);

  useEffect(() => {
    let mounted = true;
    async function validate() {
      const { data: result } = await getReservationByCode(code);
      if (!mounted) return;
      if (result) {
        setFound(true);
        setData(result as unknown as ValidationData);
      }
      setLoading(false);
    }
    validate();
    return () => { mounted = false; };
  }, [code]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-sm mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img
            src="/logo_del_hotel.jpeg"
            alt="Vista al Mar"
            className="h-10 w-10 object-contain rounded-lg"
          />
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800 leading-tight">HOTEL & BOUTIQUE</p>
            <p className="text-sm font-bold text-blue-700 leading-tight">VISTA AL MAR</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-slate-500">
          <Shield className="h-3.5 w-3.5" />
          <span className="text-xs">Validación Oficial de Reserva</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-slate-500">Verificando reserva...</p>
        </div>
      ) : found && data ? (
        /* RESERVA VÁLIDA */
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-emerald-200 overflow-hidden">
          <div className="bg-emerald-500 text-white px-6 py-5 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-2" />
            <h1 className="text-xl font-bold tracking-wide">RESERVA VÁLIDA</h1>
            <p className="text-emerald-100 text-sm mt-1">Documento verificado correctamente</p>
          </div>

          <div className="px-5 py-4 space-y-3">
            <Row label="Número de Reserva" value={String(data.reservation_number)} highlight />
            <Row label="Código" value={data.verification_code} mono />
            <Row
              label="Estado"
              value={data.status === 'active' ? 'Activa' : 'Cancelada'}
              statusOk={data.status === 'active'}
            />
            <Row label="Fecha de Emisión" value={fmtDate(data.approved_at)} />

            {data.requests && (
              <>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    Huésped
                  </p>
                  <Row label="Responsable" value={data.requests.responsable_nombre} />
                  <Row label="Pasaporte" value={data.requests.responsable_pasaporte} mono />
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    Hospedaje
                  </p>
                  <Row label="Check In" value={fmtDate(data.requests.llegada_panama)} />
                  <Row label="Check Out" value={fmtDate(data.requests.salida_hotel)} />
                  <Row label="Noches" value={String(data.requests.noches)} />
                  <Row label="Personas" value={String(data.requests.cantidad_personas)} />
                  <Row
                    label="Total"
                    value={`$${Number(data.requests.total_estimado).toFixed(2)}`}
                    highlight
                  />
                </div>
              </>
            )}
          </div>

          <div className="px-5 pb-4 pt-1 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              Este documento fue generado oficialmente por el sistema de gestión del
              Hotel &amp; Boutique Vista al Mar, Panamá.
            </p>
          </div>
        </div>
      ) : (
        /* RESERVA NO VÁLIDA */
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-red-200 overflow-hidden">
          <div className="bg-red-500 text-white px-6 py-5 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-2" />
            <h1 className="text-xl font-bold tracking-wide">RESERVA NO VÁLIDA</h1>
            <p className="text-red-100 text-sm mt-1">No se encontró en el sistema</p>
          </div>

          <div className="px-5 py-5 text-center">
            <p className="text-sm text-slate-600 leading-relaxed">
              La reserva con código{' '}
              <span className="font-mono font-bold text-red-600">{code}</span>{' '}
              no fue encontrada en nuestro sistema.
            </p>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Si cree que esto es un error, comuníquese con la recepción del hotel.
            </p>
          </div>

          <div className="px-5 pb-4 border-t border-slate-100 pt-3 flex justify-center">
            <a
              href="tel:+5076315-1015"
              className="flex items-center gap-1.5 text-sm text-sky-600 font-semibold hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              +507 6315-1015
            </a>
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-slate-400 text-center">
        Hotel &amp; Boutique Vista al Mar · Panamá
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
  statusOk,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
  statusOk?: boolean;
}) {
  return (
    <div className="flex justify-between items-center gap-2 py-0.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span
        className={`text-xs font-semibold text-right ${
          mono
            ? 'font-mono text-slate-700'
            : highlight
            ? 'text-slate-900 text-sm'
            : statusOk !== undefined
            ? statusOk
              ? 'text-emerald-600'
              : 'text-red-500'
            : 'text-slate-800'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
