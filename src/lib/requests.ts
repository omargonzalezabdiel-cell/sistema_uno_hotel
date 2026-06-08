/**
 * Funciones de utilidad para el manejo de solicitudes en Supabase.
 *
 * Centraliza todas las operaciones CRUD sobre las tablas:
 * - requests
 * - travelers
 *
 * Uso: importar las funciones necesarias en los componentes/páginas.
 */
import { supabase } from './supabase';
import type { Request, RequestDetail, RequestWithCreator, Traveler, DashboardStats } from '../types';

/** Tarifa fija por persona por noche (USD) */
export const TARIFA_POR_NOCHE = 20;

// ============================================================
// CÁLCULOS
// ============================================================

/**
 * Calcula la cantidad de noches entre la fecha de llegada al hotel
 * y la fecha de salida del hotel.
 *
 * @param llegada - Fecha/hora de llegada a Panamá (string ISO)
 * @param salidaHotel - Fecha de salida del hotel (string YYYY-MM-DD)
 * @returns Número de noches (mínimo 1)
 */
export function calcularNoches(llegada: string, salidaHotel: string): number {
  const fechaEntrada = new Date(llegada);
  const fechaSalida = new Date(salidaHotel + 'T12:00:00');
  const diffMs = fechaSalida.getTime() - fechaEntrada.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDias);
}

/**
 * Calcula el costo total estimado.
 * Fórmula: personas × noches × $20
 */
export function calcularTotal(personas: number, noches: number): number {
  return personas * noches * TARIFA_POR_NOCHE;
}

// ============================================================
// OBTENER SOLICITUDES
// ============================================================

/**
 * Obtiene una lista paginada de solicitudes ordenadas por fecha de creación.
 * Incluye el nombre del usuario creador mediante JOIN.
 *
 * @param page - Número de página (base 0)
 * @param pageSize - Cantidad de registros por página
 */
export async function getRequests(
  page: number = 0,
  pageSize: number = 20
): Promise<{ data: RequestWithCreator[]; count: number; error: string | null }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from('requests')
    .select(
      `*, creator:users!requests_created_by_fkey(id, username, role, created_at)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  return { data: (data as RequestWithCreator[]) ?? [], count: count ?? 0, error: null };
}

/**
 * Obtiene el detalle completo de una solicitud incluyendo sus viajeros.
 *
 * @param id - UUID de la solicitud
 */
export async function getRequestDetail(
  id: string
): Promise<{ data: RequestDetail | null; error: string | null }> {
  const { data: req, error: reqError } = await supabase
    .from('requests')
    .select(`*, creator:users!requests_created_by_fkey(id, username, role, created_at)`)
    .eq('id', id)
    .maybeSingle();

  if (reqError || !req) {
    return { data: null, error: reqError?.message ?? 'Solicitud no encontrada' };
  }

  const { data: travelers, error: travError } = await supabase
    .from('travelers')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true });

  if (travError) {
    return { data: null, error: travError.message };
  }

  const detail: RequestDetail = {
    ...(req as RequestWithCreator),
    travelers: (travelers as Traveler[]) ?? [],
  };

  return { data: detail, error: null };
}

// ============================================================
// CREAR SOLICITUD
// ============================================================

/**
 * Crea una nueva solicitud con sus viajeros en una operación atómica.
 * Primero inserta la solicitud, luego inserta los viajeros.
 *
 * @param requestData - Datos de la solicitud (sin id, noches, total_estimado)
 * @param travelersData - Lista de viajeros
 * @returns El ID de la solicitud creada
 */
export async function createRequest(
  requestData: Omit<Request, 'id' | 'created_at'>,
  travelersData: Omit<Traveler, 'id' | 'request_id' | 'created_at'>[]
): Promise<{ id: string | null; error: string | null }> {
  const { data: req, error: reqError } = await supabase
    .from('requests')
    .insert(requestData)
    .select('id')
    .single();

  if (reqError || !req) {
    return { id: null, error: reqError?.message ?? 'Error al crear la solicitud' };
  }

  if (travelersData.length > 0) {
    const travelers = travelersData.map((t) => ({
      ...t,
      request_id: req.id,
    }));

    const { error: travError } = await supabase.from('travelers').insert(travelers);

    if (travError) {
      // Intentar limpiar la solicitud huérfana
      await supabase.from('requests').delete().eq('id', req.id);
      return { id: null, error: travError.message };
    }
  }

  return { id: req.id, error: null };
}

// ============================================================
// ACTUALIZAR SOLICITUD
// ============================================================

/**
 * Actualiza los datos de una solicitud existente.
 * Reemplaza completamente la lista de viajeros (delete + insert).
 */
export async function updateRequest(
  id: string,
  requestData: Partial<Omit<Request, 'id' | 'created_at'>>,
  travelersData: Omit<Traveler, 'id' | 'request_id' | 'created_at'>[]
): Promise<{ error: string | null }> {
  const { error: reqError } = await supabase
    .from('requests')
    .update(requestData)
    .eq('id', id);

  if (reqError) {
    return { error: reqError.message };
  }

  // Eliminar viajeros anteriores y reinsertar
  await supabase.from('travelers').delete().eq('request_id', id);

  if (travelersData.length > 0) {
    const travelers = travelersData.map((t) => ({
      ...t,
      request_id: id,
    }));
    const { error: travError } = await supabase.from('travelers').insert(travelers);
    if (travError) {
      return { error: travError.message };
    }
  }

  return { error: null };
}

// ============================================================
// ELIMINAR SOLICITUD
// ============================================================

/**
 * Elimina una solicitud. Los viajeros se eliminan automáticamente
 * por la restricción ON DELETE CASCADE de la tabla travelers.
 *
 * @param id - UUID de la solicitud a eliminar
 */
export async function deleteRequest(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('requests').delete().eq('id', id);
  return { error: error?.message ?? null };
}

// ============================================================
// BÚSQUEDA
// ============================================================

/**
 * Busca solicitudes por nombre, pasaporte, celular o correo.
 * La búsqueda es case-insensitive usando ilike (% wildcards).
 *
 * Estrategia:
 * 1. Busca en requests por nombre, pasaporte y correo del responsable.
 * 2. Busca en travelers por nombre, pasaporte y celular.
 * 3. Une los resultados sin duplicados.
 *
 * @param query - Texto a buscar
 */
export async function searchRequests(
  query: string
): Promise<{ data: RequestWithCreator[]; error: string | null }> {
  const q = `%${query.trim()}%`;

  // Buscar en requests directamente
  const { data: directResults, error: directError } = await supabase
    .from('requests')
    .select(`*, creator:users!requests_created_by_fkey(id, username, role, created_at)`)
    .or(
      `responsable_nombre.ilike.${q},responsable_pasaporte.ilike.${q},responsable_correo.ilike.${q}`
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (directError) {
    return { data: [], error: directError.message };
  }

  // Buscar en travelers (por nombre, pasaporte, celular)
  const { data: travelerResults, error: travError } = await supabase
    .from('travelers')
    .select('request_id')
    .or(`nombre_completo.ilike.${q},numero_pasaporte.ilike.${q},numero_celular.ilike.${q}`)
    .limit(50);

  if (travError) {
    return { data: directResults as RequestWithCreator[], error: null };
  }

  const requestIdsFromTravelers = [
    ...new Set((travelerResults ?? []).map((t: { request_id: string }) => t.request_id)),
  ];

  let combinedResults = [...(directResults as RequestWithCreator[])];

  if (requestIdsFromTravelers.length > 0) {
    const { data: travelerRequests } = await supabase
      .from('requests')
      .select(`*, creator:users!requests_created_by_fkey(id, username, role, created_at)`)
      .in('id', requestIdsFromTravelers)
      .order('created_at', { ascending: false });

    if (travelerRequests) {
      const existingIds = new Set(combinedResults.map((r) => r.id));
      for (const req of travelerRequests as RequestWithCreator[]) {
        if (!existingIds.has(req.id)) {
          combinedResults.push(req);
        }
      }
    }
  }

  combinedResults.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return { data: combinedResults, error: null };
}

// ============================================================
// ESTADÍSTICAS DEL DASHBOARD
// ============================================================

/**
 * Obtiene las estadísticas para el panel principal.
 * - Total de solicitudes
 * - Total de viajeros
 * - Suma acumulada de costos estimados
 * - Solicitudes recientes (últimas 5)
 */
export async function getDashboardStats(): Promise<{
  data: DashboardStats | null;
  error: string | null;
}> {
  const [countRes, sumRes, recentRes] = await Promise.all([
    supabase.from('requests').select('id', { count: 'exact', head: true }),
    supabase.from('requests').select('total_estimado, cantidad_personas'),
    supabase
      .from('requests')
      .select(`*, creator:users!requests_created_by_fkey(id, username, role, created_at)`)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (countRes.error || sumRes.error || recentRes.error) {
    return { data: null, error: 'Error al obtener estadísticas' };
  }

  const totalPersonas = (sumRes.data ?? []).reduce(
    (acc: number, r: { cantidad_personas: number }) => acc + r.cantidad_personas,
    0
  );

  const totalEstimado = (sumRes.data ?? []).reduce(
    (acc: number, r: { total_estimado: number }) => acc + Number(r.total_estimado),
    0
  );

  return {
    data: {
      total_requests: countRes.count ?? 0,
      total_travelers: totalPersonas,
      total_estimado_acumulado: totalEstimado,
      recent_requests: (recentRes.data as RequestWithCreator[]) ?? [],
    },
    error: null,
  };
}

// ============================================================
// EXPORTACIÓN A TXT
// ============================================================

/**
 * Formatea una fecha/hora en español para mostrar en la UI y exportación.
 * @param iso - String ISO 8601
 */
export function formatDateTime(iso: string): string {
  if (!iso) return 'No especificada';
  return new Date(iso).toLocaleString('es-PA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea una fecha en español.
 * @param dateStr - String YYYY-MM-DD o ISO
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return 'No especificada';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00' : ''));
  return d.toLocaleDateString('es-PA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Genera el contenido de texto para la exportación de una solicitud.
 * Formato listo para descargar como archivo .txt.
 *
 * @param detail - Solicitud completa con viajeros y creador
 */
export function generateTxtContent(detail: RequestDetail): string {
  const separator = '='.repeat(50);
  const subSep = '-'.repeat(50);

  const viajerosTxt = detail.travelers
    .map(
      (t, i) =>
        `${i + 1}. Nombre:    ${t.nombre_completo}\n   Pasaporte: ${t.numero_pasaporte}\n   Celular:   ${t.numero_celular ?? 'No proporcionado'}`
    )
    .join('\n\n');

  return `${separator}
HOTEL VISTA AL MAR - SOLICITUD DE HOSPEDAJE
${separator}

RESPONSABLE DEL GRUPO:
${subSep}
Nombre:          ${detail.responsable_nombre}
Pasaporte:       ${detail.responsable_pasaporte}
Correo:          ${detail.responsable_correo ?? 'No proporcionado'}

INFORMACIÓN DEL VIAJE:
${subSep}
Llegada a Panamá:  ${formatDateTime(detail.llegada_panama)}
Salida de Panamá:  ${formatDateTime(detail.salida_panama)}
Salida del Hotel:  ${formatDate(detail.salida_hotel)}

VIAJEROS:
${subSep}
${viajerosTxt}

RESUMEN:
${subSep}
Total de Personas:     ${detail.cantidad_personas}
Cantidad de Noches:    ${detail.noches}
Tarifa por Noche:      USD $${TARIFA_POR_NOCHE.toFixed(2)} por persona
Costo Total Estimado:  USD $${Number(detail.total_estimado).toFixed(2)}

REGISTRO:
${subSep}
Fecha de Registro:     ${formatDateTime(detail.created_at)}
Registrado por:        ${detail.creator?.username ?? 'Público (sin cuenta)'}

${separator}
NOTA: Esta es una SOLICITUD DE HOSPEDAJE. No constituye una reserva
confirmada. El personal del hotel procesará la reserva manualmente.
${separator}
`;
}

/**
 * Descarga un archivo .txt con la información de la solicitud.
 * Usa la API de Blob y URL.createObjectURL del navegador.
 *
 * @param detail - Solicitud completa
 */
export function downloadTxt(detail: RequestDetail): void {
  const content = generateTxtContent(detail);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Nombre del archivo basado en el nombre del responsable y el ID
  const safeName = detail.responsable_nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

  link.download = `solicitud-${safeName}-${detail.id.slice(0, 8)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
