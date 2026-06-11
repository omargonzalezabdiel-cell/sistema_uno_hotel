import { useEffect, useState } from 'react';
import {
  User, Calendar, Users, Mail, Phone, FileText,
  Download, Pencil, Trash2, Eye, BookCheck, ExternalLink
} from 'lucide-react';
import { getRequestDetail, deleteRequest, downloadTxt, generateTxtContent, formatDateTime, formatDate } from '../lib/requests';
import { getReservationByRequestId, generateReservation } from '../lib/reservations';
import { canEditRequest, canDeleteRequest, canCreateRequest } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, Button, RoleBadge } from '../components/UI';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { RequestDetail, Reservation, RouterState } from '../types';

interface RequestDetailPageProps {
  requestId: string;
  onNavigate: (state: RouterState) => void;
}

export function RequestDetailPage({ requestId, onNavigate }: RequestDetailPageProps) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [generatingRes, setGeneratingRes] = useState(false);
  const [resError, setResError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const [detResult, resResult] = await Promise.all([
        getRequestDetail(requestId),
        getReservationByRequestId(requestId),
      ]);
      if (!mounted) return;
      if (detResult.error || !detResult.data) {
        setError(detResult.error ?? 'No se pudo cargar la solicitud.');
      } else {
        setDetail(detResult.data);
        setReservation(resResult.data);
      }
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [requestId]);

  async function handleGenerateReservation() {
    if (!detail) return;
    setGeneratingRes(true);
    setResError('');
    const { data, error: err } = await generateReservation(
      requestId,
      user?.id ?? null,
      user?.username ?? null,
    );
    if (err || !data) {
      setResError(err ?? 'Error al generar la reserva.');
    } else {
      setReservation(data);
    }
    setGeneratingRes(false);
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    const { error: err } = await deleteRequest(requestId);
    if (err) {
      setError('Error al eliminar: ' + err);
      setDeleting(false);
      setConfirmDelete(false);
    } else {
      onNavigate({ page: 'requests-list' });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <PageHeader title="Detalle" onBack={() => onNavigate({ page: 'requests-list' })} />
        <Card className="p-6 text-center">
          <p className="text-red-500 text-sm">{error || 'Solicitud no encontrada.'}</p>
        </Card>
      </div>
    );
  }

  const txtPreview = showPreview ? generateTxtContent(detail) : '';

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        title={detail.responsable_nombre}
        subtitle={`Solicitud registrada el ${formatDateTime(detail.created_at).split(',')[0]}`}
        onBack={() => onNavigate({ page: 'requests-list' })}
        action={
          <div className="flex gap-2">
            {canEditRequest(user) && (
              <Button
                variant="secondary"
                onClick={() => onNavigate({ page: 'request-form', requestId })}
                className="px-3"
                aria-label="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDeleteRequest(user) && (
              <Button
                variant={confirmDelete ? 'danger' : 'ghost'}
                onClick={handleDelete}
                loading={deleting}
                className="px-3"
                aria-label="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
                {confirmDelete && <span className="text-xs">Confirmar</span>}
              </Button>
            )}
          </div>
        }
      />

      {/* ──────────── SECCIÓN DE RESERVA ──────────── */}
      {reservation ? (
        <Card className="p-4 border-emerald-200 bg-emerald-50/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <BookCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700">Reserva Generada</p>
                <p className="text-lg font-bold text-emerald-800 leading-tight">
                  #{reservation.reservation_number}
                </p>
                <p className="text-xs font-mono text-emerald-600">{reservation.verification_code}</p>
              </div>
            </div>
            <Button
              onClick={() => onNavigate({ page: 'reservation-detail', requestId })}
              className="px-3 bg-emerald-600 hover:bg-emerald-700"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-xs">Ver Reserva</span>
            </Button>
          </div>
        </Card>
      ) : canCreateRequest(user) ? (
        <Card className="p-4 border-sky-200 bg-sky-50/40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Sin reserva oficial</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Genera una reserva con número consecutivo, código QR y documento oficial.
              </p>
            </div>
            <Button
              onClick={handleGenerateReservation}
              loading={generatingRes}
              className="px-4 whitespace-nowrap bg-sky-600 hover:bg-sky-700"
            >
              <BookCheck className="h-4 w-4" />
              Generar Reserva
            </Button>
          </div>
          {resError && (
            <p className="text-red-500 text-xs mt-2">{resError}</p>
          )}
        </Card>
      ) : null}

      {/* Datos del Responsable */}
      <Card className="p-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <User className="h-3.5 w-3.5" /> Responsable del Grupo
        </h2>
        <div className="space-y-2">
          <InfoRow label="Nombre" value={detail.responsable_nombre} />
          <InfoRow label="Pasaporte" value={detail.responsable_pasaporte} mono />
          {detail.responsable_correo && (
            <InfoRow label="Correo" value={detail.responsable_correo} icon={<Mail className="h-3 w-3" />} />
          )}
          {detail.responsable_pasaporte_foto && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Foto Pasaporte</p>
              <a
                href={detail.responsable_pasaporte_foto}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline"
              >
                <Eye className="h-3 w-3" /> Ver foto
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Información del Viaje */}
      <Card className="p-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" /> Información del Viaje
        </h2>
        <div className="space-y-2">
          <InfoRow label="Llegada a Panamá" value={formatDateTime(detail.llegada_panama)} />
          <InfoRow label="Salida de Panamá" value={formatDateTime(detail.salida_panama)} />
          <InfoRow label="Salida del Hotel" value={formatDate(detail.salida_hotel)} />
        </div>
      </Card>

      {/* Lista de Viajeros */}
      <Card className="p-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Users className="h-3.5 w-3.5" /> Viajeros ({detail.travelers.length})
        </h2>
        <div className="space-y-3">
          {detail.travelers.map((t, i) => (
            <div key={t.id} className="border border-slate-100 rounded-xl p-3">
              <p className="text-xs font-bold text-sky-600 mb-1">Persona {i + 1}</p>
              <p className="text-sm font-semibold text-slate-800">{t.nombre_completo}</p>
              <p className="text-xs text-slate-500 mt-0.5">Pasaporte: <span className="font-mono">{t.numero_pasaporte}</span></p>
              {t.numero_celular && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" /> {t.numero_celular}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Resumen de Costo */}
      <Card className="p-4 border-emerald-100 bg-emerald-50/30">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" /> Resumen
        </h2>
        <div className="space-y-2">
          <SummaryRow label="Total de Personas" value={String(detail.cantidad_personas)} />
          <SummaryRow label="Cantidad de Noches" value={String(detail.noches)} />
          <div className="border-t border-emerald-100 pt-2">
            <SummaryRow
              label="Costo Estimado"
              value={`USD $${Number(detail.total_estimado).toLocaleString('es-PA', { minimumFractionDigits: 2 })}`}
              highlight
            />
          </div>
        </div>
      </Card>

      {/* Registro */}
      <Card className="p-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
          Registro
        </h2>
        <div className="space-y-2">
          <InfoRow label="Fecha de Registro" value={formatDateTime(detail.created_at)} />
          {detail.creator ? (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Registrado por</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">{detail.creator.username}</span>
                <RoleBadge role={detail.creator.role} />
              </div>
            </div>
          ) : (
            <InfoRow label="Registrado por" value="Público (sin cuenta)" />
          )}
        </div>
      </Card>

      {/* Exportación de solicitud */}
      <Card className="p-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
          Exportar Solicitud
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => setShowPreview((v) => !v)}
            className="flex-1"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Ocultar Vista Previa' : 'Vista Previa'}
          </Button>
          <Button
            onClick={() => downloadTxt(detail)}
            className="flex-1"
          >
            <Download className="h-4 w-4" />
            Descargar .txt
          </Button>
        </div>

        {showPreview && (
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-auto max-h-80">
            <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
              {txtPreview}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTES DE PRESENTACIÓN
// ============================================================

function InfoRow({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
      <span className={`text-xs font-semibold text-slate-800 text-right flex items-center gap-1 ${mono ? 'font-mono' : ''}`}>
        {icon}
        {value}
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${highlight ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
        {label}
      </span>
      <span className={`text-sm ${highlight ? 'font-bold text-emerald-600 text-base' : 'font-semibold text-slate-700'}`}>
        {value}
      </span>
    </div>
  );
}
