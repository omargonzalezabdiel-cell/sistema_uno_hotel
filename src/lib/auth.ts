/**
 * Módulo de autenticación personalizada
 *
 * Implementa autenticación con usuario y contraseña usando:
 * - Tabla `users` en Supabase con contraseñas cifradas con bcrypt (pgcrypto)
 * - Función RPC `verify_login` para verificación segura en el servidor
 * - Sesión almacenada en localStorage del navegador
 *
 * NO usa Supabase Auth (auth.users) — el sistema usa una tabla propia.
 */
import { supabase } from './supabase';
import type { Session, User } from '../types';

/** Clave usada para guardar la sesión en localStorage */
const SESSION_KEY = 'hotel_vista_al_mar_session';

// ============================================================
// INICIO DE SESIÓN
// ============================================================

/**
 * Inicia sesión con usuario y contraseña.
 * Llama a la función RPC `verify_login` en Supabase que verifica
 * la contraseña usando crypt() de pgcrypto (bcrypt).
 *
 * @param username - Nombre de usuario
 * @param password - Contraseña en texto plano (se verifica en el servidor)
 * @returns El usuario autenticado o null si las credenciales son inválidas
 */
export async function login(username: string, password: string): Promise<User | null> {
  const { data, error } = await supabase.rpc('verify_login', {
    p_username: username.trim(),
    p_password: password,
  });

  if (error) {
    console.error('Error en verify_login:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const user: User = {
    id: data[0].id,
    username: data[0].username,
    role: data[0].role,
    created_at: data[0].created_at,
  };

  // Guardar sesión en localStorage
  const session: Session = { user, loginAt: new Date().toISOString() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return user;
}

// ============================================================
// CIERRE DE SESIÓN
// ============================================================

/**
 * Cierra la sesión del usuario actual eliminando la sesión de localStorage.
 */
export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ============================================================
// RECUPERAR SESIÓN ACTIVA
// ============================================================

/**
 * Recupera la sesión guardada en localStorage.
 * Retorna null si no hay sesión activa.
 *
 * @returns El usuario de la sesión activa o null
 */
export function getSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session: Session = JSON.parse(raw);
    return session.user;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

// ============================================================
// VERIFICACIÓN DE PERMISOS POR ROL
// ============================================================

/**
 * Verifica si un usuario puede crear solicitudes.
 * Roles permitidos: creador, super_admin
 */
export function canCreateRequest(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'creador' || user.role === 'super_admin';
}

/**
 * Verifica si un usuario puede editar solicitudes.
 * Roles permitidos: creador, super_admin
 */
export function canEditRequest(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'creador' || user.role === 'super_admin';
}

/**
 * Verifica si un usuario puede eliminar solicitudes.
 * Roles permitidos: solo creador
 */
export function canDeleteRequest(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'creador';
}

/**
 * Verifica si un usuario puede gestionar otros usuarios (CRUD de usuarios).
 * Roles permitidos: solo creador
 */
export function canManageUsers(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'creador';
}

/**
 * Retorna el nombre legible del rol para mostrar en la UI.
 */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    creador: 'Creador del Sistema',
    super_admin: 'Super Administrador',
    usuario_normal: 'Usuario Normal',
  };
  return labels[role] ?? role;
}
