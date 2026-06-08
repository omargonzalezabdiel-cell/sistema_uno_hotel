/**
 * Contexto de Autenticación
 *
 * Provee el estado del usuario autenticado a toda la aplicación React.
 * Usa React Context API para compartir:
 * - El usuario actual (o null si no está autenticado)
 * - Funciones de login y logout
 * - Estado de carga inicial
 *
 * Uso:
 *   // En cualquier componente hijo del AuthProvider:
 *   const { user, login, logout } = useAuth();
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as authLogin, logout as authLogout, getSession } from '../lib/auth';
import type { User } from '../types';

// ============================================================
// TIPO DEL CONTEXTO
// ============================================================

interface AuthContextValue {
  /** Usuario autenticado actualmente, o null si no hay sesión */
  user: User | null;
  /** true mientras se carga la sesión desde localStorage */
  loading: boolean;
  /**
   * Inicia sesión con usuario y contraseña.
   * @returns true si el login fue exitoso, false si las credenciales son inválidas.
   */
  login: (username: string, password: string) => Promise<boolean>;
  /** Cierra la sesión del usuario actual */
  logout: () => void;
}

// ============================================================
// CREACIÓN DEL CONTEXTO
// ============================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================
// PROVEEDOR DEL CONTEXTO
// ============================================================

/**
 * AuthProvider — envuelve la aplicación y gestiona el estado de sesión.
 * Carga la sesión guardada en localStorage al montar el componente.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión guardada al iniciar la app
  useEffect(() => {
    const savedUser = getSession();
    setUser(savedUser);
    setLoading(false);
  }, []);

  /** Función de inicio de sesión */
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const result = await authLogin(username, password);
    if (result) {
      setUser(result);
      return true;
    }
    return false;
  }, []);

  /** Función de cierre de sesión */
  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// HOOK PERSONALIZADO
// ============================================================

/**
 * Hook para acceder al contexto de autenticación.
 * Debe usarse dentro de un componente hijo de AuthProvider.
 *
 * @throws Error si se usa fuera del AuthProvider
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
