/**
 * Página de Lista de Solicitudes
 *
 * Muestra todas las solicitudes de hospedaje en orden descendente por fecha.
 * Características:
 * - Paginación (20 registros por página)
 * - Indicadores visuales del costo y datos clave
 * - Acceso rápido al detalle de cada solicitud
 * - Botón de nueva solicitud para roles autorizados
 */
import { useEffect, useState, useCallback } from 'react';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { getRequests, formatDate, formatDateTime } from '../lib/requests';
import { canCreateRequest } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { Card, EmptyState, PageHeader, Button } from '../components/UI';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { RequestWithCreator, RouterState } from '../types';

interface RequestsListPageProps {
  onNavigate: (state: RouterState) => void;
}

const PAGE_SIZE = 20;

export function RequestsListPage({ onNavigate }: RequestsListPageProps) {
  const { user } = useAuth();

  const [requests, setRequests] = useState<RequestWithCreator[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = Math.ceil(total / PAGE_SIZE);

  /** Carga la página actual de solicitudes */
  const loadPage = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    const { data, count, error: err } = await getRequests(p, PAGE_SIZE);
    setRequests(data);
    setTotal(count);
    if (err) setError(err);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPage(page);
  }, [page, loadPage]);

  return (
    <div>
      <PageHeader
        title="Solicitudes"
        subtitle={`${total} solicitud${total !== 1 ? 'es' : ''} registrada${total !== 1 ? 's' : ''}`}
        action={
          canCreateRequest(user) ? (
            <Button onClick={() => onNavigate({ page: 'request-form' })}>
              + Nueva
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-red-500 text-sm">{error}</p>
          <Button variant="secondary" onClick={() => loadPage(page)} className="mt-3 mx-auto">
            Reintentar
          </Button>
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="Sin solicitudes"
            description="Aún no hay solicitudes registradas."
          />
        </Card>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {requests.map((req) => (
              <button
                key={req.id}
                onClick={() => onNavigate({ page: 'request-detail', requestId: req.id })}
                className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-left hover:border-sky-200 hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">
                      {req.responsable_nombre}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {req.responsable_pasaporte}
                      {req.responsable_correo ? ` · ${req.responsable_correo}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="inline-flex items-center text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">
                        {req.cantidad_personas} pax
                      </span>
                      <span className="inline-flex items-center text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full">
                        {req.noches} noche{req.noches !== 1 ? 's' : ''}
                      </span>
                      <span className="inline-flex items-center text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                        {formatDate(req.llegada_panama)}
                      </span>
                    </div>
                    {req.creator && (
                      <p className="text-xs text-slate-400 mt-1">
                        Por: {req.creator.username}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <p className="text-sm font-bold text-emerald-600">
                      ${Number(req.total_estimado).toLocaleString('es-PA', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(req.created_at).split(',')[0]}
                    </p>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-slate-500">
                Página {page + 1} de {totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
