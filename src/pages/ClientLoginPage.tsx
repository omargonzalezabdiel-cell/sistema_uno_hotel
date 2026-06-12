import { useState } from 'react';
import { User, Lock, Hotel, Eye, EyeOff } from 'lucide-react';
import { loginClient, registerClient } from '../lib/clients';
import { Input, Button, ErrorMessage } from '../components/UI';
import { Logo } from '../components/Logo';
import type { Client, RouterState } from '../types';

interface ClientLoginPageProps {
  onLoginSuccess: (client: Client) => void;
  onNavigate: (s: RouterState) => void;
}

export function ClientLoginPage({ onLoginSuccess, onNavigate }: ClientLoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [passport, setPassport] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!passport.trim() || !password) { setError('Complete todos los campos.'); return; }
    setLoading(true);
    setError('');
    const client = await loginClient(passport, password);
    setLoading(false);
    if (!client) {
      setError('Pasaporte o contraseña incorrectos. Si es su primer ingreso, use su número de pasaporte como contraseña.');
      return;
    }
    onLoginSuccess(client);
  }

  async function handleRegister() {
    if (!fullName.trim() || !passport.trim() || !password) { setError('Complete todos los campos.'); return; }
    setLoading(true);
    setError('');
    const { client, error: err } = await registerClient(fullName, passport, password);
    setLoading(false);
    if (err) { setError(err); return; }
    if (client) onLoginSuccess(client);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-slate-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Logo size={44} />
          <div className="text-left">
            <p className="text-sm font-bold text-sky-800 leading-tight">HOTEL &amp; BOUTIQUE</p>
            <p className="text-base font-black text-sky-700 leading-tight">VISTA AL MAR</p>
          </div>
        </div>
        <p className="text-sm text-slate-500">Portal de Huéspedes</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="flex rounded-xl border border-slate-200 overflow-hidden mb-5 bg-white">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-sky-600 text-white' : 'text-slate-600'}`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-sky-600 text-white' : 'text-slate-600'}`}
          >
            Registrarse
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <ErrorMessage message={error} />

          {mode === 'register' && (
            <Input
              label="Nombre Completo"
              required
              placeholder="Nombre y apellidos del pasaporte"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          )}

          <div className="relative">
            <Input
              label="Número de Pasaporte"
              required
              placeholder="Ej: AB1234567"
              value={passport}
              onChange={e => setPassport(e.target.value)}
            />
            <User className="absolute right-3 top-9 h-4 w-4 text-slate-400" />
          </div>

          <div className="relative">
            <Input
              label="Contraseña"
              type={showPw ? 'text' : 'password'}
              required
              placeholder={mode === 'register' ? 'Elija una contraseña' : 'Su contraseña'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') mode === 'login' ? handleLogin() : handleRegister(); }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {mode === 'login' && (
            <p className="text-xs text-slate-500 leading-relaxed bg-sky-50 p-2.5 rounded-xl">
              Si es su primer ingreso, use su <strong>número de pasaporte</strong> como contraseña.
            </p>
          )}

          <Button
            onClick={mode === 'login' ? handleLogin : handleRegister}
            loading={loading}
            className="w-full py-3 text-base font-bold"
          >
            <Hotel className="h-4 w-4" />
            {mode === 'login' ? 'Entrar al Portal' : 'Crear Cuenta'}
          </Button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          ¿Es personal del hotel?{' '}
          <button
            onClick={() => onNavigate({ page: 'login' })}
            className="text-sky-600 hover:underline font-semibold"
          >
            Acceso de personal
          </button>
        </p>

        <p className="text-center mt-2">
          <button
            onClick={() => onNavigate({ page: 'home' })}
            className="text-xs text-slate-400 hover:text-slate-600 hover:underline"
          >
            Volver al formulario de solicitud
          </button>
        </p>
      </div>
    </div>
  );
}
