/**
 * Tipos TypeScript para el sistema de gestión de solicitudes de hospedaje
 * Hotel Vista al Mar
 *
 * Este archivo define todas las interfaces y tipos utilizados en la aplicación.
 * Cualquier cambio en la estructura de la base de datos debe reflejarse aquí.
 */

// ============================================================
// USUARIOS
// ============================================================

/** Roles disponibles en el sistema */
export type UserRole = 'creador' | 'super_admin' | 'usuario_normal';

/** Usuario del sistema (sin contraseña) */
export interface User {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
}

/** Sesión almacenada en localStorage */
export interface Session {
  user: User;
  loginAt: string;
}

// ============================================================
// SOLICITUDES
// ============================================================

/** Solicitud de hospedaje */
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

/** Solicitud con datos del usuario creador (JOIN) */
export interface RequestWithCreator extends Request {
  creator?: User | null;
}

// ============================================================
// VIAJEROS
// ============================================================

/** Viajero individual del grupo */
export interface Traveler {
  id: string;
  request_id: string;
  nombre_completo: string;
  numero_pasaporte: string;
  numero_celular: string | null;
  created_at: string;
}

/** Solicitud completa con lista de viajeros */
export interface RequestDetail extends RequestWithCreator {
  travelers: Traveler[];
}

// ============================================================
// FORMULARIOS
// ============================================================

/** Datos de un viajero en el formulario (antes de guardar) */
export interface TravelerFormData {
  nombre_completo: string;
  numero_pasaporte: string;
  numero_celular: string;
}

/** Datos completos del formulario de solicitud */
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
// ESTADÍSTICAS DEL DASHBOARD
// ============================================================

/** Estadísticas para el panel principal */
export interface DashboardStats {
  total_requests: number;
  total_travelers: number;
  total_estimado_acumulado: number;
  recent_requests: RequestWithCreator[];
}

// ============================================================
// NAVEGACIÓN
// ============================================================

/** Páginas disponibles en la app (enrutamiento por estado) */
export type PageName =
  | 'home'
  | 'login'
  | 'dashboard'
  | 'requests-list'
  | 'request-detail'
  | 'request-form'
  | 'search'
  | 'users';

/** Estado del enrutador */
export interface RouterState {
  page: PageName;
  requestId?: string;
}
