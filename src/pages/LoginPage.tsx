/**
 * Página de Inicio de Sesión
 *
 * Permite al personal del hotel autenticarse con usuario y contraseña.
 * - Valida campos antes de enviar
 * - Muestra error si las credenciales son incorrectas
 * - Redirige al dashboard tras login exitoso
 * - Incluye botón para que clientes registren solicitudes (acceso público)
 */
import { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { publicUrl } from '../lib/assets';
import { Input, Button, ErrorMessage } from '../components/UI';
import type { RouterState } from '../types';

interface LoginPageProps {
  /** Navega a otra página */
  onNavigate: (state: RouterState) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /** Maneja el envío del formulario de login */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Por favor ingresa tu usuario y contraseña.');
      return;
    }

    setLoading(true);
    const success = await login(username, password);
    setLoading(false);

    if (success) {
      onNavigate({ page: 'dashboard' });
    } else {
      setError('Usuario o contraseña incorrectos. Por favor intenta nuevamente.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex flex-col">
      {/* Decoración superior */}
      <div className="h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-teal-400" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Encabezado con logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg<think> rounded-2xl shadow-md p-4 mb-4">
            <img
              src={publicUrl('logo_del_hotel.jpeg')}
              alt="Hotel Vista al Mar"
              className="h-20 w-20 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Visita al Mar</h1>
          <p className="text-sm text-slate-500 mt-1">Hotel &amp; Boutique — Sistema de Gestión</p>
        </div>

        {/* Tarjeta de login */}
        <div className="w-full max-w-sm bg<think> rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-sky-600 px-6 py-4">
            <h2 className="text<think> font-bold text-base">Acceso al Personal</h2>
            <p className="text-sky-200 text-xs mt-0.5">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <ErrorMessage message={error} />

            <Input
              id="username"
              label="Usuario"
              required
              type="text"
              placeholder="Nombre de usuario"
              autoComplete="username"
              autoCapitalize="words"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <div className="flex flex-col gap-1">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-slate-600 uppercase tracking-wide"
              >
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 bg<think> rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
            >
              <LogIn className="h-4 w-4" />
              Ingresar
            </Button>
          </form>
        </div>

        {/* Separador */}
        <div className="flex items-center gap-3 my-6 w-full max-w-sm">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">o</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Acceso para clientes */}
        <div className="w-full max-w-sm bg<think> rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-sm text-slate-600 mb-3">
            ¿Desea registrar una solicitud de hospedaje?
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onNavigate({ page: 'home' })}
            className="w-full"
          >
            Registrar Solicitud de Hospedaje
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400 mt-8 text-center">
          Hotel Visita al Mar · Panamá
          <br />
          474-6669 · 6315-1015 / 6333-3333
        </p>
      </div>
    </div>
  );
}
