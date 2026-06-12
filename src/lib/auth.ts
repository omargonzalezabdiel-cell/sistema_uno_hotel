import { supabase } from './supabase';
import type { Session, User, UserRole } from '../types';

const SESSION_KEY = 'hotel_vista_al_mar_session';

export const CREATABLE_ROLES: UserRole[] = ['recepcionista', 'limpieza', 'cocinera', 'supervisor', 'usuario_normal'];

export async function login(username: string, password: string): Promise<User | null> {
  const { data, error } = await supabase.rpc('verify_login', {
    p_username: username.trim(),
    p_password: password,
  });

  if (error) {
    console.error('Error en verify_login:', error);
    return null;
  }

  if (!data || data.length === 0) return null;

  const user: User = {
    id: data[0].id,
    username: data[0].username,
    role: data[0].role,
    created_at: data[0].created_at,
  };

  const session: Session = { user, loginAt: new Date().toISOString() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return user;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

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

export function canCreateRequest(user: User | null): boolean {
  if (!user) return false;
  return ['creador', 'super_admin', 'recepcionista', 'supervisor'].includes(user.role);
}

export function canEditRequest(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'creador' || user.role === 'super_admin';
}

export function canDeleteRequest(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'creador';
}

export function canManageUsers(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'creador' || user.role === 'super_admin';
}

export function canManageRooms(user: User | null): boolean {
  if (!user) return false;
  return ['creador', 'super_admin', 'recepcionista'].includes(user.role);
}

export function canAccessKitchen(user: User | null): boolean {
  if (!user) return false;
  return ['creador', 'super_admin', 'cocinera'].includes(user.role);
}

export function canAccessCleaning(user: User | null): boolean {
  if (!user) return false;
  return ['creador', 'super_admin', 'limpieza', 'recepcionista'].includes(user.role);
}

export function canAccessMessages(user: User | null): boolean {
  if (!user) return false;
  return ['creador', 'super_admin', 'recepcionista', 'limpieza', 'cocinera'].includes(user.role);
}

export function canSendAnnouncements(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'creador' || user.role === 'super_admin';
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    creador: 'Creador del Sistema',
    super_admin: 'Super Administrador',
    usuario_normal: 'Usuario Normal',
    recepcionista: 'Recepcionista',
    limpieza: 'Limpieza',
    cocinera: 'Cocinera',
    supervisor: 'Supervisor',
  };
  return labels[role] ?? role;
}
