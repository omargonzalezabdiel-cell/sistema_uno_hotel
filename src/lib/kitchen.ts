import { supabase } from './supabase';
import type { MenuItem, MenuCategory, FoodOrder, OrderStatus, OrderItem } from '../types';

export function isKitchenOpen(): { open: boolean; period: string } {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const t = h * 60 + m;
  if (t >= 420 && t <= 600) return { open: true, period: 'Desayuno' }; // 7:00 - 10:00
  if (t >= 1080 && t <= 1200) return { open: true, period: 'Cena' }; // 18:00 - 20:00
  return { open: false, period: '' };
}

export const CATEGORY_LABELS: Record<MenuCategory, string> = {
  desayuno: 'Desayuno',
  cena: 'Cena',
  bebida: 'Bebida',
  postre: 'Postre',
  plato: 'Plato',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  preparando: 'Preparando',
  listo: 'Listo',
  entregado: 'Entregado',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  preparando: 'bg-sky-100 text-sky-700',
  listo: 'bg-emerald-100 text-emerald-700',
  entregado: 'bg-slate-100 text-slate-600',
};

export async function getMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('category', { ascending: true });
  if (error) { console.error('Error fetching menu:', error); return []; }
  return (data as MenuItem[]) ?? [];
}

export async function createMenuItem(item: { name: string; description?: string; price: number; category: MenuCategory; created_by: string | null }): Promise<MenuItem | null> {
  const { data, error } = await supabase
    .from('menu_items')
    .insert(item)
    .select()
    .single();
  if (error) { console.error('Error creating menu item:', error); return null; }
  return data as MenuItem;
}

export async function updateMenuItem(id: string, updates: Partial<Pick<MenuItem, 'name' | 'description' | 'price' | 'category' | 'active'>>): Promise<boolean> {
  const { error } = await supabase.from('menu_items').update(updates).eq('id', id);
  if (error) { console.error('Error updating menu item:', error); return false; }
  return true;
}

export async function getFoodOrders(excludeDelivered = false): Promise<FoodOrder[]> {
  let query = supabase.from('food_orders').select('*').order('created_at', { ascending: false });
  if (excludeDelivered) query = query.neq('status', 'entregado');
  const { data, error } = await query;
  if (error) { console.error('Error fetching orders:', error); return []; }
  return (data as FoodOrder[]) ?? [];
}

export async function createFoodOrder(roomNumber: string, clientName: string, items: OrderItem[], notes?: string): Promise<FoodOrder | null> {
  const { data, error } = await supabase
    .from('food_orders')
    .insert({ room_number: roomNumber, client_name: clientName, items, notes: notes ?? null })
    .select()
    .single();
  if (error) { console.error('Error creating order:', error); return null; }
  return data as FoodOrder;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  const { error } = await supabase
    .from('food_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) { console.error('Error updating order status:', error); return false; }
  return true;
}
