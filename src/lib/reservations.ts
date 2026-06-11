import { supabase } from './supabase';
import { formatDateTime, formatDate } from './requests';
import type { Reservation, RequestDetail } from '../types';

// ============================================================
// UTILIDADES
// ============================================================

function randomAlphanumeric(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function buildVerificationCode(reservationNumber: number): string {
  return `VAM-${reservationNumber}-${randomAlphanumeric(6)}`;
}

export function getValidationUrl(verificationCode: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/?validar=${verificationCode}`;
}

export function getQrImageUrl(validationUrl: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(validationUrl)}`;
}

// ============================================================
// CRUD
// ============================================================

export async function generateReservation(
  requestId: string,
  userId: string | null,
  userName: string | null,
) {
  const { data: nextNum, error: numErr } = await supabase.rpc('get_next_reservation_number');
  if (numErr || nextNum == null) {
    return { data: null, error: numErr?.message ?? 'Error al obtener número de reserva.' };
  }

  const verificationCode = buildVerificationCode(nextNum as number);
  const validationUrl = getValidationUrl(verificationCode);

  const { data, error } = await supabase
    .from('reservations')
    .insert({
      request_id: requestId,
      reservation_number: nextNum,
      verification_code: verificationCode,
      qr_url: validationUrl,
      approved_by: userId,
      approved_by_name: userName,
      approved_at: new Date().toISOString(),
      status: 'active',
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Reservation, error: null };
}

export async function getReservationByRequestId(requestId: string) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('request_id', requestId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data as Reservation | null, error: null };
}

export async function getReservationByCode(code: string) {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      reservation_number,
      verification_code,
      status,
      approved_at,
      qr_url,
      requests (
        responsable_nombre,
        responsable_pasaporte,
        llegada_panama,
        salida_panama,
        salida_hotel,
        noches,
        total_estimado,
        cantidad_personas
      )
    `)
    .eq('verification_code', code)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ============================================================
// EXPORTACIÓN TXT
// ============================================================

export function generateReservationTxt(reservation: Reservation, detail: RequestDetail): string {
  const SEP = '='.repeat(60);
  const sep = '-'.repeat(60);
  const phone = detail.travelers.find((t) => t.numero_celular)?.numero_celular ?? 'N/A';

  const lines = [
    SEP,
    'HOTEL & BOUTIQUE VISTA AL MAR',
    'RESERVATION OFFICIAL DOCUMENT',
    'RUC1556766114-2-2019 DV79',
    SEP,
    '',
    `RESERVATION NUMBER : ${reservation.reservation_number}`,
    `VERIFICATION CODE  : ${reservation.verification_code}`,
    `STATUS             : ${reservation.status === 'active' ? 'ACTIVE' : 'CANCELLED'}`,
    `ISSUED             : ${formatDateTime(reservation.approved_at)}`,
    '',
    sep,
    'LODGING INFORMATION',
    sep,
    `CHECK IN           : ${formatDateTime(detail.llegada_panama)}`,
    `CHECK OUT (HOTEL)  : ${formatDate(detail.salida_hotel)}`,
    `DEPARTURE PANAMA   : ${formatDateTime(detail.salida_panama)}`,
    `NIGHTS             : ${detail.noches}`,
    `PHONE              : ${phone}`,
    '',
    sep,
    'RESPONSIBLE',
    sep,
    `NAME               : ${detail.responsable_nombre}`,
    `PASSPORT           : ${detail.responsable_pasaporte}`,
    detail.responsable_correo ? `EMAIL              : ${detail.responsable_correo}` : '',
    '',
    sep,
    'TRAVELERS',
    sep,
  ];

  detail.travelers.forEach((t, i) => {
    lines.push(`  ${i + 1}. ${t.nombre_completo}`);
    lines.push(`     PASSPORT : ${t.numero_pasaporte}`);
    if (t.numero_celular) lines.push(`     PHONE    : ${t.numero_celular}`);
  });

  const pricePerPerson =
    detail.cantidad_personas > 0
      ? Number(detail.total_estimado) / detail.cantidad_personas
      : 0;

  lines.push('');
  lines.push(sep);
  lines.push('COST SUMMARY');
  lines.push(sep);
  lines.push(`PERSONS            : ${detail.cantidad_personas}`);
  lines.push(`NIGHTS             : ${detail.noches}`);
  lines.push(`RATE/PERSON/NIGHT  : $20.00`);
  lines.push(`PRICE PER PERSON   : $${pricePerPerson.toFixed(2)}`);
  lines.push(`TOTAL ESTIMATED    : $${Number(detail.total_estimado).toFixed(2)}`);
  lines.push('');
  lines.push(sep);
  lines.push('ATENCIÓN: El Decreto Ejecutivo N°82 del 23 de diciembre de 2008');
  lines.push('regula la actividad hotelera en Panamá.');
  lines.push('');
  lines.push(`VALIDATE ONLINE: ${reservation.qr_url ?? ''}`);
  lines.push(SEP);

  return lines.filter((l) => l !== undefined).join('\n');
}

export function downloadReservationTxt(reservation: Reservation, detail: RequestDetail): void {
  const content = generateReservationTxt(reservation, detail);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = detail.responsable_nombre.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  a.download = `Reserva_${reservation.reservation_number}_${safeName}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
