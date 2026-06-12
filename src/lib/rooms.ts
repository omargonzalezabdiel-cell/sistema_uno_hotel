import { supabase } from './supabase';
import type { Room, RoomStatus } from '../types';

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  ocupada_por_horas: 'Ocupada por horas',
  pendiente_limpieza: 'Pendiente de limpieza',
  limpieza_urgente: 'Limpieza urgente',
  fuera_de_servicio: 'Fuera de servicio',
};

export const ROOM_STATUS_COLORS: Record<RoomStatus, { card: string; badge: string; dot: string }> = {
  libre: { card: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  ocupada: { card: 'bg-sky-50 border-sky-200', badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  ocupada_por_horas: { card: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  pendiente_limpieza: { card: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  limpieza_urgente: { card: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  fuera_de_servicio: { card: 'bg-slate-50 border-slate-300', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
};

export async function getRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('room_number');
  if (error) { console.error('Error fetching rooms:', error); return []; }
  return (data as Room[]) ?? [];
}

export async function updateRoomStatus(
  roomId: string,
  status: RoomStatus,
  guestName: string | null,
  notes: string | null,
  updatedBy: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from('rooms')
    .update({ status, guest_name: guestName, notes, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq('id', roomId);
  if (error) { console.error('Error updating room:', error); return false; }
  return true;
}
