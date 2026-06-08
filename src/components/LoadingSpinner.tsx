/**
 * Componente LoadingSpinner
 * Indicador de carga animado con SVG, accesible con aria-label.
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({ size = 'md', label = 'Cargando...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2" role="status">
      <svg
        className={`animate-spin text-sky-600 ${sizes[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * FullPageLoader — cubre toda la pantalla durante la carga inicial
 */
export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <LoadingSpinner size="lg" label="Iniciando aplicación..." />
    </div>
  );
}
