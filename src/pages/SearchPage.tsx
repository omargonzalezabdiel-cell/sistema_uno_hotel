/**
 * Página de Búsqueda
 *
 * Motor de búsqueda rápido que encuentra solicitudes por:
 * - Nombre completo del responsable o de cualquier viajero
 * - Número de pasaporte (responsable o viajero)
 * - Número de celular de cualquier viajero
 * - Correo electrónico del responsable
 *
 * La búsqueda se activa automáticamente con debounce de 400ms
 * para evitar consultas excesivas mientras el usuario escribe.
 */
import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText } from 'lucide-react';
import { searchRequests, formatDate } from '../lib/requests';
import { Card, EmptyState, PageHeader } from '../components/UI';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { RequestWithCreator, RouterState } from '../types';

interface SearchPageProps {
  onNavigate: (state: RouterState) => void;
}

export function SearchPage({ onNavigate }: SearchPageProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RequestWithCreator[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus en el input al cargar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Búsqueda con debounce de 400ms
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      const { data, error: err } = await searchRequests(query);
      setResults(data);
      if (err) setError(err);
      setSearched(true);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <PageHeader title="Buscar" subtitle="Busca por nombre, pasaporte, celular o correo" />

      {/* Barra de búsqueda */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          placeholder="Nombre, pasaporte, celular, correo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Estado: cargando */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      )}

      {/* Estado: error */}
      {!loading && error && (
        <Card className="p-4 text-center">
          <p className="text-red-500 text-sm">{error}</p>
        </Card>
      )}

      {/* Estado: sin búsqueda */}
      {!loading && !query && (
        <Card>
          <EmptyState
            icon={<Search className="h-10 w-10" />}
            title="Escribe para buscar"
            description="Ingresa un nombre, número de pasaporte, celular o correo."
          />
        </Card>
      )}

      {/* Estado: sin resultados */}
      {!loading && searched && query && results.length === 0 && (
        <Card>
          <EmptyState
            icon={<FileText className="h-10 w-10" />}
            title="Sin resultados"
            description={`No se encontraron solicitudes para "${query}".`}
          />
        </Card>
      )}

      {/* Resultados */}
      {!loading && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 mb-2">
            {results.length} resultado{results.length !== 1 ? 's' : ''} para &ldquo;{query}&rdquo;
          </p>
          {results.map((req) => (
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
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    {req.responsable_pasaporte}
                  </p>
                  {req.responsable_correo && (
                    <p className="text-xs text-slate-400 truncate">{req.responsable_correo}</p>
                  )}
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
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-emerald-600">
                    ${Number(req.total_estimado).toLocaleString('es-PA', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
