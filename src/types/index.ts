/**
 * Tipos TypeScript para el sistema Hotel Vista al Mar
 */

// ============================================================
// USUARIOS
// ============================================================

export type UserRole = 'creador' | 'super_admin' | 'usuario_normal' | 'recepcionista' | 'limpieza' | 'cocinera' | 'supervisor';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export interface Session {
  user: User;
  loginAt: string;
}

// ============================================================
// CLIENTES
// ============================================================

export interface Client {
  id: string;
  full_name: string;
  passport: string;
  room_number: string | null;
  active: boolean;
  created_at: string;
}

export interface ClientSession {
  client: Client;
  loginAt: string;
}

// ============================================================
// SOLICITUDES
// ============================================================

export interface Request {
  id: string;
  responsable_nombre: string;
  responsable_pasaporte: string;
  responsable_correo: string | null;
  responsable_pasaporte_foto: string | null;
  cantidad_personas: number;
  llegada_panama: string;
  salida_panama: string;
  salida_hotel: string;
  noches: number;
  total_estimado: number;
  created_by: string | null;
  created_at: string;
}

export interface RequestWithCreator extends Request {
  creator?: User | null;
}

// ============================================================
// VIAJEROS
// ============================================================

export interface Traveler {
  id: string;
  request_id: string;
  nombre_completo: string;
  numero_pasaporte: string;
  numero_celular: string | null;
  created_at: string;
}

export interface RequestDetail extends RequestWithCreator {
  travelers: Traveler[];
}

// ============================================================
// FORMULARIOS
// ============================================================

export interface TravelerFormData {
  nombre_completo: string;
  numero_pasaporte: string;
  numero_celular: string;
}

export interface RequestFormData {
  responsable_nombre: string;
  responsable_pasaporte: string;
  responsable_correo: string;
  responsable_pasaporte_foto: File | null;
  cantidad_personas: number;
  llegada_panama: string;
  salida_panama: string;
  salida_hotel: string;
  travelers: TravelerFormData[];
}

// ============================================================
// RESERVAS
// ============================================================

export interface Reservation {
  id: string;
  request_id: string;
  reservation_number: number;
  verification_code: string;
  qr_url: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string;
  status: 'active' | 'cancelled';
  created_at: string;
}

// ============================================================
// HABITACIONES
// ============================================================

export type RoomStatus = 'libre' | 'ocupada' | 'ocupada_por_horas' | 'pendiente_limpieza' | 'limpieza_urgente' | 'fuera_de_servicio';

export interface Room {
  id: string;
  room_number: string;
  status: RoomStatus;
  guest_name: string | null;
  notes: string | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

// ============================================================
// COCINA
// ============================================================

export type MenuCategory = 'desayuno' | 'cena' | 'bebida' | 'postre' | 'plato';
export type OrderStatus = 'pendiente' | 'preparando' | 'listo' | 'entregado';

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: MenuCategory;
  active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface FoodOrder {
  id: string;
  room_number: string;
  client_name: string;
  items: OrderItem[];
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// MENSAJES
// ============================================================

export interface Message {
  id: string;
  from_role: string;
  from_name: string;
  to_role: string | null;
  to_name: string | null;
  content: string;
  read: boolean;
  created_at: string;
}

// ============================================================
// ANUNCIOS
// ============================================================

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_by: string | null;
  created_by_name: string | null;
  active: boolean;
  created_at: string;
}

// ============================================================
// ESTADÍSTICAS
// ============================================================

export interface DashboardStats {
  total_requests: number;
  total_travelers: number;
  total_estimado_acumulado: number;
  recent_requests: RequestWithCreator[];
}

// ============================================================
// NAVEGACIÓN
// ============================================================

export type PageName =
  | 'home'
  | 'login'
  | 'dashboard'
  | 'requests-list'
  | 'request-detail'
  | 'request-form'
  | 'search'
  | 'users'
  | 'reservation-detail'
  | 'validate-reservation'
  | 'rooms'
  | 'kitchen'
  | 'cleaning'
  | 'messages'
  | 'announcements'
  | 'client-login'
  | 'client-dashboard';

export interface RouterState {
  page: PageName;
  requestId?: string;
  reservationCode?: string;
}
