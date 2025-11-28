'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Calendar, 
  Clock, 
  Building2, 
  FileText, 
  Check,
  Loader2,
  Info,
  ChevronDown,
  Sunrise,
  Sunset,
  ArrowLeftRight,
  Edit3,
  ChevronLeft,
} from 'lucide-react';
import { registroHorasSchema } from '@/schemas';
import { RegistroHorasInput } from '@/types/forms';
import { TipoHora, Proyecto } from '@/types';
import { useAuth } from '@/lib/firebase/auth';
import { getInfoDia, formatearFecha } from '@/lib/utils/fechas';
import { calcularImporteHorasExtrasSimple } from '@/lib/utils/calculos';
import { formatearMoneda } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import TecnicoLayout from '@/components/layout/TecnicoLayout';

/**
 * HORARIOS ESTÁNDAR DE TRABAJO
 * Lunes-Jueves: 08:00-14:00 y 15:00-18:00 (9h con 1h de comida)
 * Viernes: 08:00-14:00 (6h, jornada intensiva)
 * 
 * Las horas extra se registran como tiempo FUERA de este horario:
 * - "Antes": empezar antes de las 08:00
 * - "Después": quedarse después de las 18:00 (L-J) o 14:00 (V)
 */
const HORARIOS_ESTANDAR = {
  // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  1: { inicio: '08:00', fin: '18:00', descripcion: 'Lunes: 08:00–14:00 y 15:00–18:00' },
  2: { inicio: '08:00', fin: '18:00', descripcion: 'Martes: 08:00–14:00 y 15:00–18:00' },
  3: { inicio: '08:00', fin: '18:00', descripcion: 'Miércoles: 08:00–14:00 y 15:00–18:00' },
  4: { inicio: '08:00', fin: '18:00', descripcion: 'Jueves: 08:00–14:00 y 15:00–18:00' },
  5: { inicio: '08:00', fin: '14:00', descripcion: 'Viernes: 08:00–14:00' },
  6: { inicio: '08:00', fin: '14:00', descripcion: 'Sábado' }, // Si trabaja sábado
  0: { inicio: '08:00', fin: '14:00', descripcion: 'Domingo' }, // Si trabaja domingo
} as const;

// Opciones rápidas de horas extra (en horas)
const OPCIONES_RAPIDAS = [1, 2, 3];

type ModoExtra = 'antes' | 'despues' | 'ambas' | null;
type PasoFormulario = 'seleccion' | 'configurar' | 'detalles' | 'manual';

// Hook para obtener proyectos activos
function useProyectos() {
  return useQuery({
    queryKey: ['proyectos-activos'],
    queryFn: async () => {
      const ref = collection(db, 'proyectos');
      const q = query(ref, where('activo', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Proyecto[];
    },
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Calcula la hora resultante restando horas a una hora base
 * @param horaBase - Hora en formato "HH:MM"
 * @param horasRestar - Número de horas a restar
 * @returns Hora resultante en formato "HH:MM"
 */
function restarHoras(horaBase: string, horasRestar: number): string {
  const [h, m] = horaBase.split(':').map(Number);
  let totalMinutos = h * 60 + m - (horasRestar * 60);
  if (totalMinutos < 0) totalMinutos += 24 * 60;
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

/**
 * Calcula la hora resultante sumando horas a una hora base
 * @param horaBase - Hora en formato "HH:MM"
 * @param horasSumar - Número de horas a sumar
 * @returns Hora resultante en formato "HH:MM"
 */
function sumarHoras(horaBase: string, horasSumar: number): string {
  const [h, m] = horaBase.split(':').map(Number);
  let totalMinutos = h * 60 + m + (horasSumar * 60);
  if (totalMinutos >= 24 * 60) totalMinutos -= 24 * 60;
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

export default function NuevoRegistroHorasPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, userData } = useAuth();
  const { data: proyectos = [], isLoading: loadingProyectos } = useProyectos();
  
  // Estado del flujo guiado
  const [paso, setPaso] = useState<PasoFormulario>('seleccion');
  const [modoExtra, setModoExtra] = useState<ModoExtra>(null);
  const [horasAntes, setHorasAntes] = useState<number>(0);
  const [horasDespues, setHorasDespues] = useState<number>(0);
  const [horasAntesCustom, setHorasAntesCustom] = useState<string>('');
  const [horasDespuesCustom, setHorasDespuesCustom] = useState<string>('');
  const [mostrarCustomAntes, setMostrarCustomAntes] = useState(false);
  const [mostrarCustomDespues, setMostrarCustomDespues] = useState(false);
  
  // Estado del formulario
  const [infoFecha, setInfoFecha] = useState<{ tipo: TipoHora; nombre: string } | null>(null);
  const [importeEstimado, setImporteEstimado] = useState(0);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegistroHorasInput>({
    resolver: zodResolver(registroHorasSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      horaInicio: '',
      horaFin: '',
      proyectoId: '',
      descripcion: '',
      tipoHora: 'laborable',
    },
  });
  
  const fecha = watch('fecha');
  const horaInicio = watch('horaInicio');
  const horaFin = watch('horaFin');
  const tipoHora = watch('tipoHora');
  const proyectoId = watch('proyectoId');
  
  // Obtener horario estándar del día seleccionado
  const horarioDia = useMemo(() => {
    if (!fecha) return null;
    const fechaObj = new Date(fecha + 'T12:00:00'); // Añadir hora para evitar problemas de zona horaria
    const diaSemana = fechaObj.getDay();
    return HORARIOS_ESTANDAR[diaSemana as keyof typeof HORARIOS_ESTANDAR];
  }, [fecha]);
  
  // Detectar tipo de día
  useEffect(() => {
    if (fecha) {
      const fechaObj = new Date(fecha + 'T12:00:00');
      const info = getInfoDia(fechaObj);
      setInfoFecha(info);
      setValue('tipoHora', info.tipo);
    }
  }, [fecha, setValue]);
  
  /**
   * Calcula las horas de inicio y fin basándose en:
   * - El horario estándar del día
   * - Las horas extra seleccionadas (antes/después)
   */
  const calcularHorasExtra = useMemo(() => {
    if (!horarioDia) return null;
    
    // Usar horas custom si están definidas, si no las seleccionadas
    const antesTotal = mostrarCustomAntes && horasAntesCustom 
      ? parseFloat(horasAntesCustom) || 0 
      : horasAntes;
    const despuesTotal = mostrarCustomDespues && horasDespuesCustom 
      ? parseFloat(horasDespuesCustom) || 0 
      : horasDespues;
    
    // Calcular hora de inicio (horario normal - horas antes)
    const horaInicioCalc = antesTotal > 0 
      ? restarHoras(horarioDia.inicio, antesTotal)
      : horarioDia.inicio;
    
    // Calcular hora de fin (horario normal + horas después)
    const horaFinCalc = despuesTotal > 0
      ? sumarHoras(horarioDia.fin, despuesTotal)
      : horarioDia.fin;
    
    // Total de horas extra
    const totalHorasExtra = antesTotal + despuesTotal;
    
    return {
      horaInicio: horaInicioCalc,
      horaFin: horaFinCalc,
      horasAntes: antesTotal,
      horasDespues: despuesTotal,
      totalHorasExtra,
      horarioNormal: horarioDia,
    };
  }, [horarioDia, horasAntes, horasDespues, horasAntesCustom, horasDespuesCustom, mostrarCustomAntes, mostrarCustomDespues]);
  
  // Actualizar el formulario cuando cambian las horas calculadas
  useEffect(() => {
    if (calcularHorasExtra && paso !== 'manual') {
      setValue('horaInicio', calcularHorasExtra.horaInicio);
      setValue('horaFin', calcularHorasExtra.horaFin);
    }
  }, [calcularHorasExtra, setValue, paso]);
  
  // Calcular importe estimado
  useEffect(() => {
    if (horaInicio && horaFin && tipoHora) {
      const tarifaEjemplo = {
        laborable: 12.5,
        sabado: 18,
        festivo: 25,
      };
      const importe = calcularImporteHorasExtrasSimple(
        horaInicio,
        horaFin,
        tipoHora,
        tarifaEjemplo.laborable,
        tarifaEjemplo.sabado,
        tarifaEjemplo.festivo
      );
      setImporteEstimado(importe);
    } else {
      setImporteEstimado(0);
    }
  }, [horaInicio, horaFin, tipoHora]);
  
  // Calcular horas trabajadas para modo manual
  const horasTrabajadas = useMemo(() => {
    if (!horaInicio || !horaFin) return null;
    const [hI, mI] = horaInicio.split(':').map(Number);
    const [hF, mF] = horaFin.split(':').map(Number);
    let minutos = (hF * 60 + mF) - (hI * 60 + mI);
    if (minutos < 0) minutos += 24 * 60;
    return { horas: Math.floor(minutos / 60), minutos: minutos % 60, total: minutos / 60 };
  }, [horaInicio, horaFin]);
  
  // Handlers de selección
  const handleSeleccionModo = (modo: ModoExtra) => {
    setModoExtra(modo);
    setHorasAntes(0);
    setHorasDespues(0);
    setHorasAntesCustom('');
    setHorasDespuesCustom('');
    setMostrarCustomAntes(false);
    setMostrarCustomDespues(false);
    setPaso('configurar');
  };
  
  const handleSeleccionHorasAntes = (horas: number) => {
    setHorasAntes(horas);
    setMostrarCustomAntes(false);
    setHorasAntesCustom('');
  };
  
  const handleSeleccionHorasDespues = (horas: number) => {
    setHorasDespues(horas);
    setMostrarCustomDespues(false);
    setHorasDespuesCustom('');
  };
  
  const handleContinuarADetalles = () => {
    // Verificar que hay horas seleccionadas
    const antesTotal = mostrarCustomAntes ? parseFloat(horasAntesCustom) || 0 : horasAntes;
    const despuesTotal = mostrarCustomDespues ? parseFloat(horasDespuesCustom) || 0 : horasDespues;
    
    if (modoExtra === 'antes' && antesTotal === 0) return;
    if (modoExtra === 'despues' && despuesTotal === 0) return;
    if (modoExtra === 'ambas' && antesTotal === 0 && despuesTotal === 0) return;
    
    setPaso('detalles');
  };
  
  const handleVolver = () => {
    if (paso === 'configurar') {
      setPaso('seleccion');
      setModoExtra(null);
    } else if (paso === 'detalles') {
      setPaso('configurar');
    } else if (paso === 'manual') {
      setPaso('seleccion');
    }
  };
  
  // Mutation para guardar
  const mutation = useMutation({
    mutationFn: async (data: RegistroHorasInput) => {
      if (!user || !userData) throw new Error('No autenticado');
      
      const fechaDate = new Date(data.fecha + 'T12:00:00');
      const periodo = `${fechaDate.getFullYear()}-${String(fechaDate.getMonth() + 1).padStart(2, '0')}`;
      
      const proyecto = proyectos.find(p => p.id === data.proyectoId);
      
      // Calcular horas
      const [hI, mI] = data.horaInicio.split(':').map(Number);
      const [hF, mF] = data.horaFin.split(':').map(Number);
      let minutos = (hF * 60 + mF) - (hI * 60 + mI);
      if (minutos < 0) minutos += 24 * 60;
      const horas = minutos / 60;
      
      const docRef = await addDoc(collection(db, 'horasExtras'), {
        usuarioId: user.uid,
        usuarioNombre: `${userData.nombre} ${userData.apellidos}`,
        fecha: Timestamp.fromDate(fechaDate),
        periodo,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        horas,
        tipoHora: data.tipoHora || 'laborable',
        proyectoId: data.proyectoId,
        proyectoNombre: proyecto?.nombre || '',
        descripcion: data.descripcion || '',
        estado: 'pendiente',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumen-mes'] });
      queryClient.invalidateQueries({ queryKey: ['horas-extras'] });
      router.push('/dashboard?success=horas');
    },
  });
  
  const onSubmit = (data: RegistroHorasInput) => {
    mutation.mutate(data);
  };
  
  // Obtener nombre del día para el saludo
  const nombreDia = useMemo(() => {
    if (!fecha) return 'hoy';
    const fechaObj = new Date(fecha + 'T12:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(fechaObj);
    fechaSeleccionada.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada.getTime() === hoy.getTime()) return 'hoy';
    
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (fechaSeleccionada.getTime() === ayer.getTime()) return 'ayer';
    
    return formatearFecha(fecha);
  }, [fecha]);
  
  // Verificar si hay horas válidas seleccionadas
  const hayHorasValidas = useMemo(() => {
    const antesTotal = mostrarCustomAntes ? parseFloat(horasAntesCustom) || 0 : horasAntes;
    const despuesTotal = mostrarCustomDespues ? parseFloat(horasDespuesCustom) || 0 : horasDespues;
    
    if (modoExtra === 'antes') return antesTotal > 0;
    if (modoExtra === 'despues') return despuesTotal > 0;
    if (modoExtra === 'ambas') return antesTotal > 0 || despuesTotal > 0;
    return false;
  }, [modoExtra, horasAntes, horasDespues, horasAntesCustom, horasDespuesCustom, mostrarCustomAntes, mostrarCustomDespues]);

  return (
    <TecnicoLayout 
      title={paso === 'manual' ? 'Registro manual' : 'Registrar horas'} 
      showBack 
      backHref={paso === 'seleccion' ? '/dashboard' : undefined}
    >
      {/* Botón volver custom para pasos internos */}
      {paso !== 'seleccion' && (
        <button
          onClick={handleVolver}
          className="absolute top-4 left-4 z-10 p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      
      <div className="flex flex-col min-h-[calc(100vh-8rem)]">
        {/* ============================================
            PASO 1: SELECCIÓN DEL TIPO DE HORA EXTRA
            ============================================ */}
        {paso === 'seleccion' && (
          <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full">
            {/* Fecha editable */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Fecha del registro
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  {...register('fecha')}
                  className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
            </div>
            
            {/* Saludo y pregunta */}
            <div className="text-center mb-8">
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Hola, {userData?.nombre?.split(' ')[0]} 👋
              </h1>
              <p className="text-gray-600">
                ¿Cómo han sido tus horas extra {nombreDia}?
              </p>
              {horarioDia && (
                <p className="text-sm text-gray-400 mt-2">
                  Tu horario normal: {horarioDia.inicio}–{horarioDia.fin}
                </p>
              )}
            </div>
            
            {/* Tarjetas de selección */}
            <div className="space-y-3">
              {/* He empezado antes */}
              <button
                type="button"
                onClick={() => handleSeleccionModo('antes')}
                className="w-full flex items-center gap-4 p-5 bg-white border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 rounded-2xl transition-all active:scale-[0.98] touch-manipulation text-left"
              >
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sunrise className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <span className="block text-lg font-semibold text-gray-900">He empezado antes</span>
                  <span className="block text-sm text-gray-500">Llegué antes de las {horarioDia?.inicio || '08:00'}</span>
                </div>
              </button>
              
              {/* Me he quedado después */}
              <button
                type="button"
                onClick={() => handleSeleccionModo('despues')}
                className="w-full flex items-center gap-4 p-5 bg-white border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-2xl transition-all active:scale-[0.98] touch-manipulation text-left"
              >
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sunset className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <span className="block text-lg font-semibold text-gray-900">Me he quedado después</span>
                  <span className="block text-sm text-gray-500">Salí después de las {horarioDia?.fin || '18:00'}</span>
                </div>
              </button>
              
              {/* Ambas cosas */}
              <button
                type="button"
                onClick={() => handleSeleccionModo('ambas')}
                className="w-full flex items-center gap-4 p-5 bg-white border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-2xl transition-all active:scale-[0.98] touch-manipulation text-left"
              >
                <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ArrowLeftRight className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <span className="block text-lg font-semibold text-gray-900">Ambas cosas</span>
                  <span className="block text-sm text-gray-500">Empecé antes y me quedé después</span>
                </div>
              </button>
            </div>
            
            {/* Link a modo manual */}
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setPaso('manual')}
                className="text-sm text-gray-500 hover:text-primary underline"
              >
                Introducir horas manualmente
              </button>
            </div>
          </div>
        )}
        
        {/* ============================================
            PASO 2: CONFIGURAR HORAS EXTRA
            ============================================ */}
        {paso === 'configurar' && (
          <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full">
            {/* Título según modo */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {modoExtra === 'antes' && '¿Cuánto antes has empezado?'}
                {modoExtra === 'despues' && '¿Cuánto más te has quedado?'}
                {modoExtra === 'ambas' && 'Configura tus horas extra'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {modoExtra === 'antes' && `Tu horario empieza a las ${horarioDia?.inicio}`}
                {modoExtra === 'despues' && `Tu horario termina a las ${horarioDia?.fin}`}
                {modoExtra === 'ambas' && `Horario normal: ${horarioDia?.inicio}–${horarioDia?.fin}`}
              </p>
            </div>
            
            {/* Sección ANTES (para modo 'antes' o 'ambas') */}
            {(modoExtra === 'antes' || modoExtra === 'ambas') && (
              <div className={cn("mb-6", modoExtra === 'ambas' && "pb-6 border-b border-gray-200")}>
                {modoExtra === 'ambas' && (
                  <p className="text-sm font-medium text-amber-700 mb-3 flex items-center gap-2">
                    <Sunrise className="w-4 h-4" />
                    Horas antes del inicio ({horarioDia?.inicio})
                  </p>
                )}
                
                {/* Botones rápidos */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {OPCIONES_RAPIDAS.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSeleccionHorasAntes(h)}
                      className={cn(
                        "py-4 rounded-xl font-semibold text-lg transition-all touch-manipulation",
                        horasAntes === h && !mostrarCustomAntes
                          ? "bg-amber-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {h}h
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarCustomAntes(true);
                      setHorasAntes(0);
                    }}
                    className={cn(
                      "py-4 rounded-xl font-medium transition-all touch-manipulation",
                      mostrarCustomAntes
                        ? "bg-amber-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    Otro
                  </button>
                </div>
                
                {/* Input custom */}
                {mostrarCustomAntes && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      min="0.5"
                      max="12"
                      value={horasAntesCustom}
                      onChange={(e) => setHorasAntesCustom(e.target.value)}
                      placeholder="0.5"
                      className="flex-1 px-4 py-3 text-lg border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <span className="text-gray-600 font-medium">horas antes</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Sección DESPUÉS (para modo 'despues' o 'ambas') */}
            {(modoExtra === 'despues' || modoExtra === 'ambas') && (
              <div className="mb-6">
                {modoExtra === 'ambas' && (
                  <p className="text-sm font-medium text-indigo-700 mb-3 flex items-center gap-2">
                    <Sunset className="w-4 h-4" />
                    Horas después del fin ({horarioDia?.fin})
                  </p>
                )}
                
                {/* Botones rápidos */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {OPCIONES_RAPIDAS.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSeleccionHorasDespues(h)}
                      className={cn(
                        "py-4 rounded-xl font-semibold text-lg transition-all touch-manipulation",
                        horasDespues === h && !mostrarCustomDespues
                          ? "bg-indigo-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {h}h
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarCustomDespues(true);
                      setHorasDespues(0);
                    }}
                    className={cn(
                      "py-4 rounded-xl font-medium transition-all touch-manipulation",
                      mostrarCustomDespues
                        ? "bg-indigo-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    Otro
                  </button>
                </div>
                
                {/* Input custom */}
                {mostrarCustomDespues && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      min="0.5"
                      max="12"
                      value={horasDespuesCustom}
                      onChange={(e) => setHorasDespuesCustom(e.target.value)}
                      placeholder="0.5"
                      className="flex-1 px-4 py-3 text-lg border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <span className="text-gray-600 font-medium">horas después</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Tarjeta de resumen */}
            {calcularHorasExtra && calcularHorasExtra.totalHorasExtra > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Resumen</span>
                  <span className="text-xs text-gray-400">{formatearFecha(fecha)}</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Horario normal:</span>
                    <span>{horarioDia?.inicio}–{horarioDia?.fin}</span>
                  </div>
                  
                  {calcularHorasExtra.horasAntes > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Antes del inicio:</span>
                      <span>+{calcularHorasExtra.horasAntes}h (desde {calcularHorasExtra.horaInicio})</span>
                    </div>
                  )}
                  
                  {calcularHorasExtra.horasDespues > 0 && (
                    <div className="flex justify-between text-indigo-700">
                      <span>Después del fin:</span>
                      <span>+{calcularHorasExtra.horasDespues}h (hasta {calcularHorasExtra.horaFin})</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between pt-2 border-t border-blue-200 text-lg font-bold text-gray-900">
                    <span>Total horas extra:</span>
                    <span>{calcularHorasExtra.totalHorasExtra}h</span>
                  </div>
                  
                  {importeEstimado > 0 && (
                    <div className="flex justify-between text-primary font-semibold">
                      <span>Importe estimado:</span>
                      <span>{formatearMoneda(importeEstimado)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Botón continuar */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleContinuarADetalles}
                disabled={!hayHorasValidas}
                className={cn(
                  "w-full py-4 text-lg font-semibold rounded-xl transition-all touch-manipulation",
                  hayHorasValidas
                    ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                Continuar
              </button>
            </div>
          </div>
        )}
        
        {/* ============================================
            PASO 3: DETALLES (Proyecto + Descripción)
            ============================================ */}
        {paso === 'detalles' && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full space-y-5">
              {/* Resumen compacto */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{formatearFecha(fecha)}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {calcularHorasExtra?.totalHorasExtra}h extra
                    </p>
                    {importeEstimado > 0 && (
                      <p className="text-sm text-primary font-medium">
                        ≈ {formatearMoneda(importeEstimado)}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaso('manual')}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Ajustar manualmente"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {calcularHorasExtra?.horaInicio} → {calcularHorasExtra?.horaFin}
                  {calcularHorasExtra?.horasAntes ? ` (${calcularHorasExtra.horasAntes}h antes)` : ''}
                  {calcularHorasExtra?.horasDespues ? ` (${calcularHorasExtra.horasDespues}h después)` : ''}
                </p>
              </div>
              
              {/* Proyecto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proyecto
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <select
                    {...register('proyectoId')}
                    className={cn(
                      "w-full pl-12 pr-10 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary appearance-none transition-colors bg-white",
                      errors.proyectoId ? "border-red-500" : "border-gray-200"
                    )}
                  >
                    <option value="">Selecciona un proyecto</option>
                    {loadingProyectos ? (
                      <option disabled>Cargando...</option>
                    ) : (
                      proyectos.map(proyecto => (
                        <option key={proyecto.id} value={proyecto.id}>
                          {proyecto.nombre}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.proyectoId && (
                  <p className="mt-2 text-sm text-red-600">{errors.proyectoId.message}</p>
                )}
              </div>
              
              {/* Hidden fields */}
              <input type="hidden" {...register('tipoHora')} />
              <input type="hidden" {...register('horaInicio')} />
              <input type="hidden" {...register('horaFin')} />
              
              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400 pointer-events-none" />
                  <textarea
                    {...register('descripcion')}
                    rows={3}
                    placeholder="¿Por qué hiciste horas extra?"
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-colors"
                  />
                </div>
              </div>
            </div>
            
            {/* Botón guardar */}
            <div className="sticky bottom-20 lg:bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-gray-50 via-gray-50">
              <div className="max-w-lg mx-auto">
                <button
                  type="submit"
                  disabled={isSubmitting || mutation.isPending}
                  className={cn(
                    "w-full py-4 text-lg font-semibold rounded-xl transition-all",
                    "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2 touch-manipulation"
                  )}
                >
                  {(isSubmitting || mutation.isPending) ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Guardar registro
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {mutation.isError && (
              <div className="px-4 pb-4 max-w-lg mx-auto">
                <p className="text-sm text-red-600 text-center">
                  Error al guardar. Inténtalo de nuevo.
                </p>
              </div>
            )}
          </form>
        )}
        
        {/* ============================================
            MODO MANUAL (Avanzado)
            ============================================ */}
        {paso === 'manual' && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <div className="flex-1 px-4 py-5 space-y-5 max-w-lg mx-auto w-full">
              {/* Info del día */}
              {infoFecha && (
                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-xl",
                  infoFecha.tipo === 'laborable' ? "bg-blue-50 text-blue-800" :
                  infoFecha.tipo === 'sabado' ? "bg-purple-50 text-purple-800" :
                  "bg-orange-50 text-orange-800"
                )}>
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      {infoFecha.tipo === 'laborable' ? 'Día Laborable' :
                       infoFecha.tipo === 'sabado' ? 'Sábado' : 'Festivo'}
                    </p>
                    <p className="text-sm opacity-80">{infoFecha.nombre}</p>
                  </div>
                </div>
              )}
              
              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    {...register('fecha')}
                    className={cn(
                      "w-full pl-12 pr-4 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors",
                      errors.fecha ? "border-red-500" : "border-gray-200"
                    )}
                  />
                </div>
                {errors.fecha && (
                  <p className="mt-2 text-sm text-red-600">{errors.fecha.message}</p>
                )}
              </div>
              
              {/* Horas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora inicio
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      {...register('horaInicio')}
                      className={cn(
                        "w-full pl-12 pr-4 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors",
                        errors.horaInicio ? "border-red-500" : "border-gray-200"
                      )}
                    />
                  </div>
                  {errors.horaInicio && (
                    <p className="mt-2 text-sm text-red-600">{errors.horaInicio.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora fin
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      {...register('horaFin')}
                      className={cn(
                        "w-full pl-12 pr-4 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors",
                        errors.horaFin ? "border-red-500" : "border-gray-200"
                      )}
                    />
                  </div>
                  {errors.horaFin && (
                    <p className="mt-2 text-sm text-red-600">{errors.horaFin.message}</p>
                  )}
                </div>
              </div>
              
              {/* Resumen de horas */}
              {horasTrabajadas && horasTrabajadas.total > 0 && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total horas:</span>
                    <span className="text-xl font-bold text-gray-900">
                      {horasTrabajadas.horas}h {horasTrabajadas.minutos > 0 ? `${horasTrabajadas.minutos}min` : ''}
                    </span>
                  </div>
                  {importeEstimado > 0 && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Importe estimado:</span>
                      <span className="text-xl font-bold text-primary">
                        {formatearMoneda(importeEstimado)}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Proyecto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proyecto
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <select
                    {...register('proyectoId')}
                    className={cn(
                      "w-full pl-12 pr-10 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary appearance-none transition-colors bg-white",
                      errors.proyectoId ? "border-red-500" : "border-gray-200"
                    )}
                  >
                    <option value="">Selecciona un proyecto</option>
                    {loadingProyectos ? (
                      <option disabled>Cargando...</option>
                    ) : (
                      proyectos.map(proyecto => (
                        <option key={proyecto.id} value={proyecto.id}>
                          {proyecto.nombre}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.proyectoId && (
                  <p className="mt-2 text-sm text-red-600">{errors.proyectoId.message}</p>
                )}
              </div>
              
              {/* Hidden tipo hora */}
              <input type="hidden" {...register('tipoHora')} />
              
              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400 pointer-events-none" />
                  <textarea
                    {...register('descripcion')}
                    rows={3}
                    placeholder="Describe brevemente el trabajo..."
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-colors"
                  />
                </div>
              </div>
            </div>
            
            {/* Botón guardar fijo abajo */}
            <div className="sticky bottom-20 lg:bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-gray-50 via-gray-50">
              <div className="max-w-lg mx-auto">
                <button
                  type="submit"
                  disabled={isSubmitting || mutation.isPending}
                  className={cn(
                    "w-full py-4 text-lg font-semibold rounded-xl transition-all",
                    "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2 touch-manipulation"
                  )}
                >
                  {(isSubmitting || mutation.isPending) ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Guardar registro
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {mutation.isError && (
              <div className="px-4 pb-4 max-w-lg mx-auto">
                <p className="text-sm text-red-600 text-center">
                  Error al guardar. Inténtalo de nuevo.
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </TecnicoLayout>
  );
}
