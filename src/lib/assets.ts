/**
 * Helper para construir rutas de assets públicos
 * compatible con cualquier base path configurado en Vite.
 *
 * Uso:
 *   publicUrl('logo_del_hotel.jpeg')  // -> "/sistema_uno_hotel/logo_del_hotel.jpeg"
 */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  // Eliminar barras duplicadas
  const cleanBase = base.endsWith('/') ? base : base + '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return cleanBase + cleanPath;
}
