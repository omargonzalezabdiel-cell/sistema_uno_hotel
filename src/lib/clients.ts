import { supabase } from './supabase';
import type { Client, ClientSession } from '../types';

const CLIENT_SESSION_KEY = 'hotel_vista_al_mar_client_session';

export async function loginClient(passport: string, password: string): Promise<Client | null> {
  const { data, error } = await supabase.rpc('verify_client_login', {
    p_passport: passport.trim(),
    p_password: password,
  });
  if (error) { console.error('Error en verify_client_login:', error); return null; }
  if (!data || data.length === 0) return null;

  const client: Client = {
    id: data[0].id,
    full_name: data[0].full_name,
    passport: data[0].passport,
    room_number: data[0].room_number,
    active: data[0].active,
    created_at: data[0].created_at,
  };

  const session: ClientSession = { client, loginAt: new Date().toISOString() };
  localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(session));
  return client;
}

export async function registerClient(fullName: string, passport: string, password: string): Promise<{ client: Client | null; error: string | null }> {
  const { data, error } = await supabase.rpc('register_client', {
    p_full_name: fullName.trim(),
    p_passport: passport.trim(),
    p_password: password,
  });
  if (error) {
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      return { client: null, error: 'Ese número de pasaporte ya está registrado.' };
    }
    return { client: null, error: 'Error al registrar: ' + error.message };
  }
  if (!data || data.length === 0) return { client: null, error: 'No se pudo crear la cuenta.' };

  const client: Client = {
    id: data[0].id,
    full_name: data[0].full_name,
    passport: data[0].passport,
    room_number: data[0].room_number,
    active: data[0].active,
    created_at: data[0].created_at,
  };

  const session: ClientSession = { client, loginAt: new Date().toISOString() };
  localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(session));
  return { client, error: null };
}

export function getClientSession(): Client | null {
  try {
    const raw = localStorage.getItem(CLIENT_SESSION_KEY);
    if (!raw) return null;
    const session: ClientSession = JSON.parse(raw);
    return session.client;
  } catch {
    localStorage.removeItem(CLIENT_SESSION_KEY);
    return null;
  }
}

export function logoutClient(): void {
  localStorage.removeItem(CLIENT_SESSION_KEY);
}
