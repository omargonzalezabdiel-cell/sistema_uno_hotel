/**
 * Página de Formulario de Solicitud de Hospedaje
 *
 * Usada en dos contextos:
 * 1. Pública (página home): clientes registran su propia solicitud
 * 2. Admin (autenticado): personal del hotel registra solicitudes
 *
 * Funcionalidades:
 * - Datos del responsable del grupo
 * - Selector de cantidad de personas → genera bloques dinámicos por persona
 * - Fechas de llegada, salida de Panamá y salida del hotel
 * - Cálculo automático en tiempo real: noches × personas × $20
 * - Validación: al menos un celular por grupo
 * - Upload de foto de pasaporte (opcional)
 * - Modo edición (requestId prop) para modificar solicitudes existentes
 */
import { useState, useEffect, useCallback } from 'react';
import { User, Phone, Calendar, Users, Upload, X, CheckCircle } from 'lucide-react';
import {
  calcularNoches,
  calcularTotal,
  createRequest,
  updateRequest,
  getRequestDetail,
  TARIFA_POR_NOCHE,
} from '../lib/requests';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Input, Button, ErrorMessage, SuccessMessage, Card, SectionTitle } from '../components/UI';
import { Logo } from '../components/Logo';
import type { TravelerFormData, RouterState } from '../types';

interface RequestFormPageProps {
  onNavigate: (state: RouterState) => void;
  /** Si se pasa, carga la solicitud existente para editar */
  requestId?: string;
  /** Si true, muestra el formulario en modo público (sin header admin) */
  isPublic?: boolean;
}

// ============================================================
// ESTADO INICIAL DEL FORMULARIO
// ============================================================

const emptyTraveler = (): TravelerFormData => ({
  nombre_completo: '',
  numero_pasaporte: '',
  numero_celular: '',
});

export function RequestFormPage({ onNavigate, requestId, isPublic = false }: RequestFormPageProps) {
  const { user } = useAuth();
  const isEditing = !!requestId;

  // --- Campos del responsable ---
  const [respNombre, setRespNombre] = useState('');
  const [respPasaporte, setRespPasaporte] = useState('');
  const [respCorreo, setRespCorreo] = useState('');
  const [respFoto, setRespFoto] = useState<File | null>(null);
  const [existingFotoUrl, setExistingFotoUrl] = useState<string | null>(null);

  // --- Viajeros ---
  const [cantidadPersonas, setCantidadPersonas] = useState(1);
  const [travelers, setTravelers] = useState<TravelerFormData[]>([emptyTraveler()]);

  // --- Fechas ---
  const [llegadaPanama, setLlegadaPanama] = useState('');
  const [salidaPanama, setSalidaPanama] = useState('');
  const [salidaHotel, setSalidaHotel] = useState('');

  // --- Estado de UI ---
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(isEditing);

  // ============================================================
  // CARGA DE DATOS PARA EDICIÓN
  // ============================================================

  useEffect(() => {
    if (!isEditing) return;
    let mounted = true;
    async function loadDetail() {
      const { data } = await getRequestDetail(requestId!);
      if (!mounted || !data) return;

      setRespNombre(data.responsable_nombre);
      setRespPasaporte(data.responsable_pasaporte);
      setRespCorreo(data.responsable_correo ?? '');
      setExistingFotoUrl(data.responsable_pasaporte_foto);
      setCantidadPersonas(data.cantidad_personas);
      setLlegadaPanama(data.llegada_panama.slice(0, 16));
      setSalidaPanama(data.salida_panama.slice(0, 16));
      setSalidaHotel(data.salida_hotel);
      setTravelers(
        data.travelers.map((t) => ({
          nombre_completo: t.nombre_completo,
          numero_pasaporte: t.numero_pasaporte,
          numero_celular: t.numero_celular ?? '',
        }))
      );
      setLoadingDetail(false);
    }
    loadDetail();
    return () => { mounted = false; };
  }, [isEditing, requestId]);

  // ============================================================
  // SINCRONIZAR CANTIDAD DE PERSONAS CON BLOQUES DE VIAJEROS
  // ============================================================

  useEffect(() => {
    setTravelers((prev) => {
      if (cantidadPersonas > prev.length) {
        const extras = Array.from({ length: cantidadPersonas - prev.length }, emptyTraveler);
        return [...prev, ...extras];
      }
      return prev.slice(0, cantidadPersonas);
    });
  }, [cantidadPersonas]);

  // ============================================================
  // CÁLCULO AUTOMÁTICO
  // ============================================================

  const noches =
    llegadaPanama && salidaHotel ? calcularNoches(llegadaPanama, salidaHotel) : 0;

  const totalEstimado =
    noches > 0 ? calcularTotal(cantidadPersonas, noches) : 0;

  // ============================================================
  // ACTUALIZAR VIAJERO INDIVIDUAL
  // ============================================================

  const updateTraveler = useCallback(
    (index: number, field: keyof TravelerFormData, value: string) => {
      setTravelers((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], [field]: value };
        return copy;
      });
      // Limpiar error de ese campo
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[`traveler_${index}_${field}`];
        return copy;
      });
    },
    []
  );

  // ============================================================
  // VALIDACIÓN
  // ============================================================

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!respNombre.trim()) newErrors.respNombre = 'El nombre del responsable es obligatorio.';
    if (!respPasaporte.trim()) newErrors.respPasaporte = 'El pasaporte del responsable es obligatorio.';
    if (!llegadaPanama) newErrors.llegadaPanama = 'La fecha y hora de llegada es obligatoria.';
    if (!salidaPanama) newErrors.salidaPanama = 'La fecha y hora de salida es obligatoria.';
    if (!salidaHotel) newErrors.salidaHotel = 'La fecha de salida del hotel es obligatoria.';

    if (llegadaPanama && salidaHotel) {
      const n = calcularNoches(llegadaPanama, salidaHotel);
      if (n <= 0) newErrors.salidaHotel = 'La salida del hotel debe ser posterior a la llegada.';
    }

    travelers.forEach((t, i) => {
      if (!t.nombre_completo.trim())
        newErrors[`traveler_${i}_nombre_completo`] = 'Nombre obligatorio.';
      if (!t.numero_pasaporte.trim())
        newErrors[`traveler_${i}_numero_pasaporte`] = 'Pasaporte obligatorio.';
    });

    // Al menos un celular en el grupo
    const hasPhone = travelers.some((t) => t.numero_celular.trim().length > 0);
    if (!hasPhone) {
      newErrors.phoneRequired =
        'Al menos un integrante del grupo debe proporcionar un número de celular.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ============================================================
  // SUBIR FOTO DE PASAPORTE A SUPABASE STORAGE
  // ============================================================

  async function uploadPassportPhoto(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `passports/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from('passport-photos')
      .upload(path, file, { upsert: false });

    if (error) {
      console.warn('Error al subir foto de pasaporte:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from('passport-photos').getPublicUrl(path);
    return urlData?.publicUrl ?? null;
  }

  // ============================================================
  // ENVÍO DEL FORMULARIO
  // ============================================================

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError('');
    setSuccessMsg('');

    if (!validate()) return;

    setLoading(true);

    // Subir foto si se proporcionó
    let fotoUrl = existingFotoUrl ?? null;
    if (respFoto) {
      fotoUrl = await uploadPassportPhoto(respFoto);
    }

    const requestData = {
      responsable_nombre: respNombre.trim(),
      responsable_pasaporte: respPasaporte.trim(),
      responsable_correo: respCorreo.trim() || null,
      responsable_pasaporte_foto: fotoUrl,
      cantidad_personas: cantidadPersonas,
      llegada_panama: new Date(llegadaPanama).toISOString(),
      salida_panama: new Date(salidaPanama).toISOString(),
      salida_hotel: salidaHotel,
      noches,
      total_estimado: totalEstimado,
      created_by: user?.id ?? null,
    };

    const travelersData = travelers.map((t) => ({
      nombre_completo: t.nombre_completo.trim(),
      numero_pasaporte: t.numero_pasaporte.trim(),
      numero_celular: t.numero_celular.trim() || null,
    }));

    if (isEditing) {
      const { error } = await updateRequest(requestId!, requestData, travelersData);
      setLoading(false);
      if (error) {
        setGlobalError('Error al actualizar la solicitud: ' + error);
      } else {
        onNavigate({ page: 'request-detail', requestId });
      }
    } else {
      const { id, error } = await createRequest(requestData, travelersData);
      setLoading(false);
      if (error || !id) {
        setGlobalError('Error al registrar la solicitud: ' + (error ?? 'Error desconocido'));
      } else {
        setSuccessMsg('¡Solicitud registrada exitosamente! El personal del hotel se comunicará con usted.');
        // Resetear formulario para registro público
        if (isPublic) {
          setRespNombre('');
          setRespPasaporte('');
          setRespCorreo('');
          setRespFoto(null);
          setCantidadPersonas(1);
          setTravelers([emptyTraveler()]);
          setLlegadaPanama('');
          setSalidaPanama('');
          setSalidaHotel('');
        } else {
          onNavigate({ page: 'request-detail', requestId: id });
        }
      }
    }
  }

  if (loadingDetail) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={isPublic ? 'min-h-screen bg-slate-50' : ''}>
      {/* Header público */}
      {isPublic && (
        <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <Logo size={36} />
            <button
              onClick={() => onNavigate({ page: 'login' })}
              className="text-xs text-sky-600 font-semibold hover:underline"
            >
              Acceso Personal
            </button>
          </div>
        </div>
      )}

      <div className={isPublic ? 'max-w-lg mx-auto px-4 py-6' : ''}>
        {/* Título */}
        {!isEditing && (
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-800">
              {isPublic ? 'Solicitud de Hospedaje' : 'Nueva Solicitud'}
            </h1>
            {isPublic && (
              <p className="text-sm text-slate-500 mt-1">
                Complete el formulario y nos contactaremos con usted para confirmar su reserva.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <SuccessMessage message={successMsg} />
          <ErrorMessage message={globalError} />

          {/* ---- DATOS DEL RESPONSABLE ---- */}
          <Card className="p-4 space-y-4">
            <SectionTitle subtitle="Persona responsable del grupo">
              <User className="inline h-4 w-4 mr-2 text-sky-500" />
              Datos del Responsable
            </SectionTitle>

            <Input
              id="resp_nombre"
              label="Nombre Completo"
              required
              placeholder="Igual que aparece en el pasaporte"
              value={respNombre}
              onChange={(e) => { setRespNombre(e.target.value); setErrors((p) => ({ ...p, respNombre: '' })); }}
              error={errors.respNombre}
            />

            <Input
              id="resp_pasaporte"
              label="Número de Pasaporte"
              required
              placeholder="Ej: AB1234567"
              value={respPasaporte}
              onChange={(e) => { setRespPasaporte(e.target.value); setErrors((p) => ({ ...p, respPasaporte: '' })); }}
              error={errors.respPasaporte}
            />

            <Input
              id="resp_correo"
              label="Correo Electrónico"
              type="email"
              placeholder="correo@ejemplo.com (opcional)"
              value={respCorreo}
              onChange={(e) => setRespCorreo(e.target.value)}
            />

            {/* Upload de foto de pasaporte */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                <Upload className="h-3 w-3" />
                Foto / Escaneo del Pasaporte
                <span className="text-slate-400 font-normal normal-case ml-1">(opcional)</span>
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center">
                {respFoto ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-600 truncate">{respFoto.name}</p>
                    <button
                      type="button"
                      onClick={() => setRespFoto(null)}
                      className="text-red-500 hover:text-red-700"
                      aria-label="Eliminar foto"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : existingFotoUrl ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-500 truncate">Foto guardada</p>
                    <button
                      type="button"
                      onClick={() => setExistingFotoUrl(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer text-sm text-sky-600 hover:text-sky-800">
                    Toca para seleccionar imagen
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setRespFoto(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>
            </div>
          </Card>

          {/* ---- CANTIDAD DE PERSONAS ---- */}
          <Card className="p-4 space-y-4">
            <SectionTitle subtitle="Cuántas personas incluye la solicitud">
              <Users className="inline h-4 w-4 mr-2 text-sky-500" />
              Información del Grupo
            </SectionTitle>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Cantidad de Personas <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCantidadPersonas((v) => Math.max(1, v - 1))}
                  className="h-10 w-10 flex-shrink-0 rounded-xl border border-slate-200 bg-white text-slate-600 text-lg font-bold hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-center"
                  aria-label="Reducir cantidad"
                >
                  −
                </button>
                <span className="flex-1 text-center text-xl font-bold text-slate-800">
                  {cantidadPersonas}
                </span>
                <button
                  type="button"
                  onClick={() => setCantidadPersonas((v) => Math.min(20, v + 1))}
                  className="h-10 w-10 flex-shrink-0 rounded-xl border border-slate-200 bg-white text-slate-600 text-lg font-bold hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-center"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
            </div>

            {/* Alerta de celular requerido */}
            {errors.phoneRequired && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <Phone className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">{errors.phoneRequired}</p>
              </div>
            )}

            {/* Bloques por persona */}
            <div className="space-y-4">
              {travelers.map((t, i) => (
                <div key={i} className="border border-slate-100 rounded-xl p-3 space-y-3">
                  <p className="text-xs font-bold text-sky-600 uppercase tracking-wide">
                    Persona {i + 1}
                  </p>
                  <Input
                    id={`t_nombre_${i}`}
                    label="Nombre Completo"
                    required
                    placeholder="Nombre completo"
                    value={t.nombre_completo}
                    onChange={(e) => updateTraveler(i, 'nombre_completo', e.target.value)}
                    error={errors[`traveler_${i}_nombre_completo`]}
                  />
                  <Input
                    id={`t_pasaporte_${i}`}
                    label="Número de Pasaporte"
                    required
                    placeholder="Número de pasaporte"
                    value={t.numero_pasaporte}
                    onChange={(e) => updateTraveler(i, 'numero_pasaporte', e.target.value)}
                    error={errors[`traveler_${i}_numero_pasaporte`]}
                  />
                  <Input
                    id={`t_celular_${i}`}
                    label="Número de Celular"
                    type="tel"
                    placeholder="Celular (opcional)"
                    value={t.numero_celular}
                    onChange={(e) => updateTraveler(i, 'numero_celular', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* ---- FECHAS ---- */}
          <Card className="p-4 space-y-4">
            <SectionTitle subtitle="Según boleto aéreo y salida del hotel">
              <Calendar className="inline h-4 w-4 mr-2 text-sky-500" />
              Información del Viaje
            </SectionTitle>

            <Input
              id="llegada_panama"
              label="Llegada a Panamá"
              type="datetime-local"
              required
              value={llegadaPanama}
              onChange={(e) => { setLlegadaPanama(e.target.value); setErrors((p) => ({ ...p, llegadaPanama: '' })); }}
              error={errors.llegadaPanama}
            />

            <Input
              id="salida_panama"
              label="Salida de Panamá"
              type="datetime-local"
              required
              value={salidaPanama}
              onChange={(e) => { setSalidaPanama(e.target.value); setErrors((p) => ({ ...p, salidaPanama: '' })); }}
              error={errors.salidaPanama}
            />

            <Input
              id="salida_hotel"
              label="Salida del Hotel"
              type="date"
              required
              value={salidaHotel}
              onChange={(e) => { setSalidaHotel(e.target.value); setErrors((p) => ({ ...p, salidaHotel: '' })); }}
              error={errors.salidaHotel}
            />
          </Card>

          {/* ---- RESUMEN DE COSTO ---- */}
          {noches > 0 && (
            <Card className="p-4 border-emerald-100">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-700">Costo Estimado</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Personas</span>
                  <span className="font-semibold text-slate-700">{cantidadPersonas}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Noches</span>
                  <span className="font-semibold text-slate-700">{noches}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tarifa</span>
                  <span className="font-semibold text-slate-700">USD ${TARIFA_POR_NOCHE}/persona/noche</span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between">
                  <span className="font-bold text-slate-700">Total Estimado</span>
                  <span className="font-bold text-emerald-600 text-lg">
                    USD ${totalEstimado.toLocaleString('es-PA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                * Estimado sujeto a disponibilidad y confirmación del hotel.
              </p>
            </Card>
          )}

          {/* ---- BOTONES ---- */}
          <div className="flex gap-3 pb-4">
            {!isPublic && (
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() =>
                  isEditing
                    ? onNavigate({ page: 'request-detail', requestId })
                    : onNavigate({ page: 'requests-list' })
                }
              >
                Cancelar
              </Button>
            )}
            <Button type="submit" loading={loading} className="flex-1">
              {isEditing ? 'Guardar Cambios' : 'Registrar Solicitud'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
