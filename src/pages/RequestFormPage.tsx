import { useState, useEffect, useCallback, useRef } from 'react';
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
  requestId?: string;
  isPublic?: boolean;
}

const emptyTraveler = (): TravelerFormData => ({
  nombre_completo: '',
  numero_pasaporte: '',
  numero_celular: '',
});

export function RequestFormPage({ onNavigate, requestId, isPublic = false }: RequestFormPageProps) {
  const { user } = useAuth();
  const isEditing = !!requestId;

  const [respNombre, setRespNombre] = useState('');
  const [respPasaporte, setRespPasaporte] = useState('');
  const [respCorreo, setRespCorreo] = useState('');
  const [respFoto, setRespFoto] = useState<File | null>(null);
  const [existingFotoUrl, setExistingFotoUrl] = useState<string | null>(null);

  const [cantidadPersonas, setCantidadPersonas] = useState(1);
  const [travelers, setTravelers] = useState<TravelerFormData[]>([emptyTraveler()]);

  // All times stored/entered as Panama time
  const [llegadaPanama, setLlegadaPanama] = useState('');
  const [salidaPanama, setSalidaPanama] = useState('');
  const [salidaHotel, setSalidaHotel] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(isEditing);

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // ────────────────────────────────────────────
  // REFERENCIAS A CAMPOS INPUT PARA FOCUSEO AUTOMÁTICO
  // ────────────────────────────────────────────
  const respNombreRef = useRef<HTMLInputElement>(null);
  const respPasaporteRef = useRef<HTMLInputElement>(null);
  const respCorreoRef = useRef<HTMLInputElement>(null);
  const respFotoRef = useRef<HTMLInputElement>(null);
  const llegadaPanamaRef = useRef<HTMLInputElement>(null);
  const salidaPanamaRef = useRef<HTMLInputElement>(null);
  const salidaHotelRef = useRef<HTMLInputElement>(null);
  const travelerRefs = useRef<Array<{
    nombre: HTMLInputElement | null;
    pasaporte: HTMLInputElement | null;
    celular: HTMLInputElement | null;
  }>>([]);

  // ────────────────────────────────────────────
  // CARGA DE DATOS PARA EDICIÓN
  // ────────────────────────────────────────────
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

  // ────────────────────────────────────────────
  // SINCRONIZAR VIAJEROS CON CANTIDAD
  // ────────────────────────────────────────────
  useEffect(() => {
    setTravelers((prev) => {
      if (cantidadPersonas > prev.length) {
        const extras = Array.from({ length: cantidadPersonas - prev.length }, emptyTraveler);
        return [...prev, ...extras];
      }
      return prev.slice(0, cantidadPersonas);
    });
  }, [cantidadPersonas]);

  const noches = llegadaPanama && salidaHotel ? calcularNoches(llegadaPanama, salidaHotel) : 0;
  const totalEstimado = noches > 0 ? calcularTotal(cantidadPersonas, noches) : 0;

  const updateTraveler = useCallback(
    (index: number, field: keyof TravelerFormData, value: string) => {
      setTravelers((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], [field]: value };
        return copy;
      });
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[`traveler_${index}_${field}`];
        return copy;
      });
    },
    []
  );

  // ────────────────────────────────────────────
  // VALIDACIÓN
  // ────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {};

    if (!respNombre.trim())
      e.respNombre = 'Por favor escriba el nombre completo del responsable antes de continuar.';
    if (!respPasaporte.trim())
      e.respPasaporte = 'Por favor escriba el número de pasaporte antes de continuar.';
    if (!llegadaPanama)
      e.llegadaPanama = 'Por favor seleccione la fecha y hora de llegada a Panamá.';
    if (!salidaPanama)
      e.salidaPanama = 'Por favor seleccione la fecha y hora de salida de Panamá.';
    if (!salidaHotel)
      e.salidaHotel = 'Por favor seleccione la fecha de salida del hotel.';

    if (llegadaPanama && salidaHotel) {
      const n = calcularNoches(llegadaPanama, salidaHotel);
      if (n <= 0) e.salidaHotel = 'La fecha de salida del hotel debe ser posterior a la fecha de llegada.';
    }

    travelers.forEach((t, i) => {
      if (!t.nombre_completo.trim())
        e[`traveler_${i}_nombre_completo`] = 'Por favor escriba el nombre completo de esta persona.';
      if (!t.numero_pasaporte.trim())
        e[`traveler_${i}_numero_pasaporte`] = 'Por favor escriba el número de pasaporte de esta persona.';
    });

    const hasPhone = travelers.some((t) => t.numero_celular.trim().length > 0);
    if (!hasPhone) {
      e.phoneRequired =
        'Por favor ingrese al menos un número de celular en el grupo. Necesitamos contactarle para confirmar la reserva.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ────────────────────────────────────────────
  // SUBIR FOTO DE PASAPORTE
  // ────────────────────────────────────────────
  async function uploadPassportPhoto(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `passports/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('passport-photos')
      .upload(path, file, { upsert: false });
    if (error) return null;
    const { data: urlData } = supabase.storage.from('passport-photos').getPublicUrl(path);
    return urlData?.publicUrl ?? null;
  }

  // ────────────────────────────────────────────
  // ENVÍO DEL FORMULARIO
  // ────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError('');
    setSuccessMsg('');
    if (!validate()) return;

    setLoading(true);
    let fotoUrl = existingFotoUrl ?? null;
    if (respFoto) fotoUrl = await uploadPassportPhoto(respFoto);

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
        setGlobalError('No se pudo actualizar la solicitud. Por favor intente nuevamente.');
      } else {
        onNavigate({ page: 'request-detail', requestId });
      }
    } else {
      const { id, error } = await createRequest(requestData, travelersData);
      setLoading(false);
      if (error || !id) {
        setGlobalError('No se pudo registrar la solicitud. Por favor intente nuevamente o contacte al hotel.');
      } else {
        setSuccessMsg('¡Su solicitud fue enviada correctamente! El personal del hotel se comunicará con usted para confirmar su reserva.');
        if (isPublic) {
          setRespNombre(''); setRespPasaporte(''); setRespCorreo('');
          setRespFoto(null); setCantidadPersonas(1);
          setTravelers([emptyTraveler()]);
          setLlegadaPanama(''); setSalidaPanama(''); setSalidaHotel('');
        } else {
          onNavigate({ page: 'request-detail', requestId: id });
        }
      }
    }
  }

  // ────────────────────────────────────────────
  // ASISTENTE VISUAL — solo en modo público con acción interactiva
  // ────────────────────────────────────────────
  const focusField = (field: string) => {
    // Mapear campo a su referencia
    if (field === 'resp_nombre') {
      respNombreRef.current?.focus();
    } else if (field === 'resp_pasaporte') {
      respPasaporteRef.current?.focus();
    } else if (field === 'resp_correo') {
      respCorreoRef.current?.focus();
    } else if (field === 'resp_foto') {
      respFotoRef.current?.click();
    } else if (field === 'cantidad_personas') {
      // Scroll a la sección de cantidad
      document.getElementById('cantidad_personas_section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (field === 'llegada_panama') {
      llegadaPanamaRef.current?.focus();
      llegadaPanamaRef.current?.showPicker?.();
    } else if (field === 'salida_panama') {
      salidaPanamaRef.current?.focus();
      salidaPanamaRef.current?.showPicker?.();
    } else if (field === 'salida_hotel') {
      salidaHotelRef.current?.focus();
      salidaHotelRef.current?.showPicker?.();
    } else if (field.startsWith('t_nombre_')) {
      const index = parseInt(field.replace('t_nombre_', ''), 10);
      travelerRefs.current[index]?.nombre?.focus();
    } else if (field.startsWith('t_pasaporte_')) {
      const index = parseInt(field.replace('t_pasaporte_', ''), 10);
      travelerRefs.current[index]?.pasaporte?.focus();
    } else if (field.startsWith('t_celular_')) {
      const index = parseInt(field.replace('t_celular_', ''), 10);
      travelerRefs.current[index]?.celular?.focus();
    }
    // También abrir tooltip
    setActiveTooltip((prev) => (prev === field ? null : field));
  };

  const helpTip = (field: string, hint: string, tooltip: string) => {
    if (!isPublic) return null;
    return (
      <div className="mt-2 space-y-1.5">
        <button
          type="button"
          onClick={() => focusField(field)}
          className="w-full text-left text-sm text-red-600 font-medium flex items-start gap-1.5 leading-snug hover:text-red-700 transition-colors"
        >
          <span aria-hidden="true">🔴</span>
          <span className="underline decoration-dotted underline-offset-2">{hint}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTooltip((prev) => (prev === field ? null : field))}
          className="flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-800 transition-colors"
        >
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-sky-400 text-xs font-bold text-sky-600 leading-none">
            ?
          </span>
          <span className="font-medium">Toque aquí para más información</span>
        </button>
        {activeTooltip === field && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sm text-slate-700 leading-relaxed shadow-sm">
            <span className="mr-1">ℹ️</span>
            {tooltip}
          </div>
        )}
      </div>
    );
  };

  // Función específica para la foto del pasaporte
  const helpTipPhoto = (field: string, hint: string, tooltip: string) => {
    if (!isPublic) return null;
    return (
      <div className="mt-2 space-y-1.5">
        <button
          type="button"
          onClick={() => {
            respFotoRef.current?.click();
            setActiveTooltip((prev) => (prev === field ? null : field));
          }}
          className="w-full text-left text-sm text-red-600 font-medium flex items-start gap-1.5 leading-snug hover:text-red-700 transition-colors"
        >
          <span aria-hidden="true">🔴</span>
          <span className="underline decoration-dotted underline-offset-2">{hint}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTooltip((prev) => (prev === field ? null : field))}
          className="flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-800 transition-colors"
        >
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-sky-400 text-xs font-bold text-sky-600 leading-none">
            ?
          </span>
          <span className="font-medium">Toque aquí para más información</span>
        </button>
        {activeTooltip === field && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sm text-slate-700 leading-relaxed shadow-sm">
            <span className="mr-1">ℹ️</span>
            {tooltip}
          </div>
        )}
      </div>
    );
  };

  // Función para cantidad de personas
  const helpTipCantidad = (field: string, hint: string, tooltip: string) => {
    if (!isPublic) return null;
    return (
      <div className="mt-2 space-y-1.5">
        <button
          type="button"
          onClick={() => {
            document.getElementById('cantidad_personas_section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setActiveTooltip((prev) => (prev === field ? null : field));
          }}
          className="w-full text-left text-sm text-red-600 font-medium flex items-start gap-1.5 leading-snug hover:text-red-700 transition-colors"
        >
          <span aria-hidden="true">🔴</span>
          <span className="underline decoration-dotted underline-offset-2">{hint}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTooltip((prev) => (prev === field ? null : field))}
          className="flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-800 transition-colors"
        >
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-sky-400 text-xs font-bold text-sky-600 leading-none">
            ?
          </span>
          <span className="font-medium">Toque aquí para más información</span>
        </button>
        {activeTooltip === field && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sm text-slate-700 leading-relaxed shadow-sm">
            <span className="mr-1">ℹ️</span>
            {tooltip}
          </div>
        )}
      </div>
    );
  };

  if (loadingDetail) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────
  return (
    <div className={isPublic ? 'min-h-screen bg-slate-50' : ''}>

      {/* ── CABECERA PÚBLICA ── */}
      {isPublic && (
        <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
          <div className="max-w-lg mx-auto flex items-center justify-center">
            <Logo size={38} />
          </div>
        </div>
      )}

      <div className={isPublic ? 'max-w-lg mx-auto px-4 py-6' : ''}>

        {/* ── TÍTULO Y DESCRIPCIÓN ── */}
        {!isEditing && isPublic && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">
              Solicitud de Hospedaje
            </h1>
            <p className="text-base text-slate-600 mt-2 leading-relaxed">
              Para seleccionar su solicitud debe ingresar sus datos nuestro equipo verificara la información y se pondrá en contacto con Usted confirmando su reserva
            </p>
            {/* Indicador de pasos */}
            <div className="mt-4 bg-sky-50 border border-sky-200 rounded-xl p-3">
              <p className="text-sm font-semibold text-sky-800 mb-1">📋 ¿Cómo funciona?</p>
              <ol className="text-sm text-sky-700 space-y-0.5 list-decimal list-inside">
                <li>Complete todos los campos del formulario presionando el boton rojo.</li>
                <li>Pulse el botón verde al final.</li>
                <li>Le contactaremos para confirmar su reserva.</li>
              </ol>
            </div>
          </div>
        )}

        {!isEditing && !isPublic && (
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-800">Nueva Solicitud</h1>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <SuccessMessage message={successMsg} />
          <ErrorMessage message={globalError} />

          {/* ══════════════════════════════════════════
              SECCIÓN 1: DATOS DEL RESPONSABLE
              ══════════════════════════════════════════ */}
          <Card className={`p-4 space-y-4 ${isPublic ? 'shadow-md' : ''}`}>
            <SectionTitle subtitle="Persona responsable del grupo">
              <User className="inline h-4 w-4 mr-2 text-sky-500" />
              Datos del Responsable
            </SectionTitle>

            {/* Nombre */}
            <div>
              <Input
                id="resp_nombre"
                label="Nombre Completo"
                required
                placeholder="Nombre y apellidos exactos del pasaporte"
                value={respNombre}
                onChange={(e) => { setRespNombre(e.target.value); setErrors((p) => ({ ...p, respNombre: '' })); }}
                error={errors.respNombre}
                inputRef={respNombreRef}
              />
              {helpTip(
                'resp_nombre',
                'Pulse aquí y escriba sus nombres y apellidos',
                'El nombre debe coincidir letra por letra con lo que aparece en la página principal de su pasaporte, incluyendo todos los apellidos y la acentuación correcta.',
              )}
            </div>

            {/* Pasaporte */}
            <div>
              <Input
                id="resp_pasaporte"
                label="Número de Pasaporte"
                required
                placeholder="Ej: AB1234567"
                value={respPasaporte}
                onChange={(e) => { setRespPasaporte(e.target.value); setErrors((p) => ({ ...p, respPasaporte: '' })); }}
                error={errors.respPasaporte}
                inputRef={respPasaporteRef}
              />
              {helpTip(
                'resp_pasaporte',
                'Pulse aquí y escriba el número de pasaporte',
                'El número de pasaporte se encuentra en la página principal de su pasaporte, en la parte superior derecha, generalmente combinando letras y números (ej: AB1234567).',
              )}
            </div>

            {/* Correo */}
            <div>
              <Input
                id="resp_correo"
                label="Correo Electrónico"
                type="email"
                placeholder="correo@ejemplo.com (opcional)"
                value={respCorreo}
                onChange={(e) => setRespCorreo(e.target.value)}
                inputRef={respCorreoRef}
              />
              {helpTip(
                'resp_correo',
                'Si tiene correo electrónico, escríbalo aquí',
                'El correo es opcional. Si lo proporciona, le enviaremos la confirmación de su reserva directamente a su bandeja de entrada.',
              )}
            </div>

            {/* Foto de pasaporte */}
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
                    <button type="button" onClick={() => setRespFoto(null)} className="text-red-500 hover:text-red-700" aria-label="Eliminar foto">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : existingFotoUrl ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-500 truncate">Foto guardada</p>
                    <button type="button" onClick={() => setExistingFotoUrl(null)} className="text-red-500 hover:text-red-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer text-sm text-sky-600 hover:text-sky-800">
                    {isPublic ? '📷 Toque para adjuntar foto del pasaporte' : 'Toca para seleccionar imagen'}
                    <input ref={respFotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => setRespFoto(e.target.files?.[0] ?? null)} />
                  </label>
                )}
              </div>
              {isPublic && helpTipPhoto(
                'resp_foto',
                'Toque aquí para adjuntar foto del pasaporte.',
                'Una foto clara de la página principal de su pasaporte ayuda a agilizar su registro.',
              )}
            </div>
          </Card>

          {/* ══════════════════════════════════════════
              SECCIÓN 2: CANTIDAD DE PERSONAS
              ══════════════════════════════════════════ */}
          <Card className={`p-4 space-y-4 ${isPublic ? 'shadow-md' : ''}`}>
            <SectionTitle subtitle="Cuántas personas incluye la solicitud">
              <Users className="inline h-4 w-4 mr-2 text-sky-500" />
              Información del Grupo
            </SectionTitle>

            {/* Selector de cantidad */}
            <div id="cantidad_personas_section" className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Cantidad de Personas <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCantidadPersonas((v) => Math.max(1, v - 1))}
                  className="h-12 w-12 flex-shrink-0 rounded-xl border-2 border-slate-200 bg-white text-slate-600 text-2xl font-bold hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-center"
                  aria-label="Reducir cantidad"
                >
                  −
                </button>
                <span className="flex-1 text-center text-3xl font-bold text-slate-800">
                  {cantidadPersonas}
                </span>
                <button
                  type="button"
                  onClick={() => setCantidadPersonas((v) => Math.min(20, v + 1))}
                  className="h-12 w-12 flex-shrink-0 rounded-xl border-2 border-slate-200 bg-white text-slate-600 text-2xl font-bold hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-center"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
              {helpTipCantidad(
                'cantidad_personas',
                'Seleccione la cantidad total de personas que viajarán.',
                'Cuente todas las personas del grupo: adultos y niños. El costo se calcula multiplicando la cantidad de personas por las noches de estadía.',
              )}
            </div>

            {/* Alerta de celular requerido */}
            {errors.phoneRequired && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <Phone className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 font-medium">{errors.phoneRequired}</p>
              </div>
            )}

            {/* Bloques por persona */}
            <div className="space-y-4">
              {travelers.map((t, i) => (
                <div key={i} className="border-2 border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/50">
                  <p className="text-sm font-bold text-sky-700 uppercase tracking-wide">
                    👤 Persona {i + 1}
                    {i === 0 && isPublic && (
                      <span className="ml-2 text-xs font-normal text-slate-500 normal-case">(responsable del grupo)</span>
                    )}
                  </p>

                  <div>
                    <Input
                      id={`t_nombre_${i}`}
                      label="Nombre Completo"
                      required
                      placeholder="Nombre y apellidos del pasaporte"
                      value={t.nombre_completo}
                      onChange={(e) => updateTraveler(i, 'nombre_completo', e.target.value)}
                      error={errors[`traveler_${i}_nombre_completo`]}
                      inputRef={(el) => {
                        if (!travelerRefs.current[i]) travelerRefs.current[i] = { nombre: null, pasaporte: null, celular: null };
                        travelerRefs.current[i].nombre = el;
                      }}
                    />
                    {helpTip(
                      `t_nombre_${i}`,
                      'Pulse aquí y escriba sus nombres y apellidos',
                      'Incluya todos los nombres y apellidos tal como aparecen en la página principal del pasaporte.',
                    )}
                  </div>

                  <div>
                    <Input
                      id={`t_pasaporte_${i}`}
                      label="Número de Pasaporte"
                      required
                      placeholder="Ej: AB1234567"
                      value={t.numero_pasaporte}
                      onChange={(e) => updateTraveler(i, 'numero_pasaporte', e.target.value)}
                      error={errors[`traveler_${i}_numero_pasaporte`]}
                      inputRef={(el) => {
                        if (!travelerRefs.current[i]) travelerRefs.current[i] = { nombre: null, pasaporte: null, celular: null };
                        travelerRefs.current[i].pasaporte = el;
                      }}
                    />
                    {helpTip(
                      `t_pasaporte_${i}`,
                      'Pulse aquí y escriba el número de pasaporte',
                      'Busque el número en la página con la foto, en la parte superior derecha. Incluye letras y números (ej: L676591).',
                    )}
                  </div>

                  <div>
                    <Input
                      id={`t_celular_${i}`}
                      label="Número de Celular"
                      type="tel"
                      placeholder="+53 5 1234567  /  +507 6123456"
                      value={t.numero_celular}
                      onChange={(e) => updateTraveler(i, 'numero_celular', e.target.value)}
                      inputRef={(el) => {
                        if (!travelerRefs.current[i]) travelerRefs.current[i] = { nombre: null, pasaporte: null, celular: null };
                        travelerRefs.current[i].celular = el;
                      }}
                    />
                    {helpTip(
                      `t_celular_${i}`,
                      'Escriba su número de celular con el código de país.',
                      'Incluya el código de su país. Ejemplos: +53 5 1234567 para Cuba, +507 6123456 para Panamá, +1 305 1234567 para USA. Al menos una persona del grupo debe proporcionar un celular.',
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ══════════════════════════════════════════
              SECCIÓN 3: FECHAS
              ══════════════════════════════════════════ */}
          <Card className={`p-4 space-y-4 ${isPublic ? 'shadow-md' : ''}`}>
            <SectionTitle subtitle="Según boleto aéreo y salida del hotel">
              <Calendar className="inline h-4 w-4 mr-2 text-sky-500" />
              Información del Viaje
            </SectionTitle>

            {isPublic && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-sm text-blue-800">
                  📄 Tenga a mano su <strong>boleto aéreo</strong> para completar este paso.
                </p>
              </div>
            )}

            {/* Llegada */}
            <div>
              <Input
                id="llegada_panama"
                label="Llegada a Panamá"
                type="datetime-local"
                required
                value={llegadaPanama}
                onChange={(e) => { setLlegadaPanama(e.target.value); setErrors((p) => ({ ...p, llegadaPanama: '' })); }}
                error={errors.llegadaPanama}
                inputRef={llegadaPanamaRef}
              />
              {helpTip(
                'llegada_panama',
                'Seleccione la fecha y hora indicadas en su boleto aéreo.',
                'Esta es la fecha y hora de llegada de su vuelo a la Ciudad de Panamá. Se encuentra en su tiquete aéreo en la sección "Arrival" o "Llegada".',
              )}
            </div>

            {/* Salida de Panamá */}
            <div>
              <Input
                id="salida_panama"
                label="Salida de Panamá"
                type="datetime-local"
                required
                value={salidaPanama}
                onChange={(e) => { setSalidaPanama(e.target.value); setErrors((p) => ({ ...p, salidaPanama: '' })); }}
                error={errors.salidaPanama}
                inputRef={salidaPanamaRef}
              />
              {helpTip(
                'salida_panama',
                'Seleccione la fecha y hora de regreso indicadas en su boleto aéreo.',
                'Esta es la fecha y hora de su vuelo de regreso desde Panamá. Se encuentra en su tiquete en la sección "Departure" o "Salida".',
              )}
            </div>

            {/* Salida del hotel */}
            <div>
              <Input
                id="salida_hotel"
                label="Salida del Hotel (Check-out)"
                type="date"
                required
                value={salidaHotel}
                onChange={(e) => { setSalidaHotel(e.target.value); setErrors((p) => ({ ...p, salidaHotel: '' })); }}
                error={errors.salidaHotel}
                inputRef={salidaHotelRef}
              />
              {helpTip(
                'salida_hotel',
                'Seleccione el día en que dejará el hotel.',
                'Generalmente es el mismo día de su vuelo de regreso o el día anterior. El hotel hace el check-out antes del mediodía.',
              )}
            </div>
          </Card>

          {/* ══════════════════════════════════════════
              RESUMEN DE COSTO (automático)
              ══════════════════════════════════════════ */}
          {noches > 0 && (
            <Card className={`p-4 border-emerald-100 bg-emerald-50/50 ${isPublic ? 'shadow-md' : ''}`}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-700">Costo Estimado</h3>
              </div>
              <div className="space-y-2">
                <CostRow label="Personas" value={String(cantidadPersonas)} />
                <CostRow label="Noches" value={String(noches)} />
                <CostRow label="Tarifa" value={`USD $${TARIFA_POR_NOCHE}/persona/noche`} />
                <div className="border-t border-emerald-100 pt-2 flex justify-between items-center">
                  <span className="font-bold text-slate-700 text-base">Total Estimado</span>
                  <span className="font-bold text-emerald-600 text-2xl">
                    USD ${totalEstimado.toLocaleString('es-PA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                * Estimado sujeto a disponibilidad y confirmación del hotel.
              </p>
            </Card>
          )}

          {/* ══════════════════════════════════════════
              BOTONES
              ══════════════════════════════════════════ */}
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
            <Button
              type="submit"
              loading={loading}
              className={`flex-1 ${isPublic ? 'py-4 text-base font-bold' : ''}`}
            >
              {isEditing
                ? 'Guardar Cambios'
                : isPublic
                ? '✅ Enviar Solicitud de Hospedaje'
                : 'Registrar Solicitud'}
            </Button>
          </div>

          {/* Mensaje de ayuda al pie del formulario público */}
          {isPublic && (
            <div className="pb-6 text-center">
              <p className="text-sm text-slate-400 leading-relaxed">
                Si tiene alguna dificultad para completar este formulario,
                comuníquese con el hotel por{' '}
                <a href="https://wa.me/50763151015" target="_blank" rel="noopener noreferrer" className="text-green-600 font-semibold hover:underline">
                  WhatsApp
                </a>
                {' '}o llame al{' '}
                <a href="tel:+5076315-1015" className="text-sky-600 font-semibold hover:underline">
                  +507 6315-1015
                </a>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// SUB-COMPONENTE: fila del resumen de costo
// ────────────────────────────────────────────
function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-700">{value}</span>
    </div>
  );
}
