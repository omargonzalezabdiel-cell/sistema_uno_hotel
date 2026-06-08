/**
 * Componentes UI reutilizables
 *
 * Pequeños building blocks usados en toda la aplicación:
 * - Badge: etiqueta de rol coloreada
 * - Card: contenedor con sombra
 * - EmptyState: pantalla vacía con icono
 * - ErrorMessage: mensaje de error en rojo
 */
import type { ReactNode } from 'react';
import type { UserRole } from '../types';

// ============================================================
// BADGE DE ROL
// ============================================================

const roleColors: Record<UserRole, string> = {
  creador: 'bg-purple-100 text-purple-700',
  super_admin: 'bg-sky-100 text-sky-700',
  usuario_normal: 'bg-slate-100 text-slate-600',
};

const roleLabels: Record<UserRole, string> = {
  creador: 'Creador',
  super_admin: 'Super Admin',
  usuario_normal: 'Usuario',
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[role]}`}>
      {roleLabels[role]}
    </span>
  );
}

// ============================================================
// CARD
// ============================================================

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`}>
      {children}
    </div>
  );
}

// ============================================================
// STAT CARD (para el dashboard)
// ============================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: 'sky' | 'teal' | 'amber' | 'emerald';
}

const statColors = {
  sky: 'bg-sky-50 text-sky-600',
  teal: 'bg-teal-50 text-teal-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
};

export function StatCard({ label, value, icon, color = 'sky' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${statColors[color]}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

export function EmptyState({ icon, title, description }: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="text-slate-300 mb-4">{icon}</div>
      <p className="text-slate-600 font-semibold text-base">{title}</p>
      {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
    </div>
  );
}

// ============================================================
// ERROR MESSAGE
// ============================================================

export function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
      {message}
    </div>
  );
}

// ============================================================
// SUCCESS MESSAGE
// ============================================================

export function SuccessMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
      {message}
    </div>
  );
}

// ============================================================
// BOTÓN PRIMARIO
// ============================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

const btnVariants = {
  primary: 'bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

export function Button({ loading, variant = 'primary', children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${btnVariants[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ============================================================
// INPUT
// ============================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export function Input({ label, error, required, id, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        className={`w-full border ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'} rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

// ============================================================
// SELECT
// ============================================================

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export function Select({ label, error, required, id, className = '', children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={id}
        className={`w-full border ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'} rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

// ============================================================
// SECTION TITLE
// ============================================================

export function SectionTitle({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-slate-800">{children}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ============================================================
// PAGE HEADER
// ============================================================

export function PageHeader({
  title,
  subtitle,
  action,
  onBack,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors -ml-2"
            aria-label="Volver"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
