/**
 * Dashboard - Panel Principal
 *
 * Muestra un resumen estadístico del sistema:
 * - Total de solicitudes registradas
 * - Total de viajeros
 * - Suma total estimada acumulada
 * - Lista de solicitudes recientes (últimas 5)
 *
 * Solo accesible para usuarios autenticados.
 */
import { useEffect, useState } from 'react';
import { FileText, Users, DollarSign, Clock } from 'lucide-react';
import { getDashboardStats, formatDate, formatDateTime } from '../lib/requests';
import { useAuth } from '../context/AuthContext';
import { StatCard, Card, EmptyState } from '../components/UI';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { DashboardStats, RouterState } from '../types';

interface DashboardPageProps {
  onNavigate: (state: RouterState) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const { data, error: err } = await getDashboardStats();
      if (!mounted) return;
      if (err) setError(err);
      else setStats(data);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div>
        <p className="text-slate-500 text-sm">{greeting()},</p>
        <h1 className="text-xl font-bold text-slate-800">{user?.username}</h1>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Solicitudes"
          value={stats?.total_requests ?? 0}
          icon={<FileText className="h-5 w-5" />}
          color="sky"
        />
        <StatCard
          label="Viajeros"
          value={stats?.total_travelers ?? 0}
          icon={<Users className="h-5 w-5" />}
          color="teal"
        />
      </div>

      <StatCard
        label="Total Estimado Acumulado"
        value={`USD $${(stats?.total_estimado_acumulado ?? 0).toLocaleString('es-PA', { minimumFractionDigits: 2 })}`}
        icon={<DollarSign className="h-5 w-5" />}
        color="emerald"
      />

      {/* Solicitudes recientes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            Solicitudes Recientes
          </h2>
          <button
            onClick={() => onNavigate({ page: 'requests-list' })}
            className="text-xs text-sky-600 font-semibold hover:underline"
          >
            Ver todas
          </button>
        </div>

        {!stats?.recent_requests?.length ? (
          <Card>
            <EmptyState
              icon={<FileText className="h-10 w-10" />}
              title="Sin solicitudes aún"
              description="Las solicitudes registradas aparecerán aquí."
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {stats.recent_requests.map((req) => (
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
                      {req.cantidad_personas} persona{req.cantidad_personas !== 1 ? 's' : ''} · {req.noches} noche{req.noches !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Llegada: {formatDate(req.llegada_panama)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-emerald-600">
                      ${Number(req.total_estimado).toLocaleString('es-PA', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDateTime(req.created_at).split(',')[0]}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
