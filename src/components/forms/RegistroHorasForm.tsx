'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Calendar, 
  Clock, 
  Building2, 
  FileText, 
  Save, 
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react';
import { registroHorasSchema } from '@/schemas';
import { RegistroHorasInput } from '@/types/forms';
import { TipoHora, Proyecto, Usuario } from '@/types';
import { useAuth } from '@/lib/firebase/auth';
import { formatearFecha, getInfoDia } from '@/lib/utils/fechas';
import { calcularImporteHorasExtrasSimple } from '@/lib/utils/calculos';
import { formatearMoneda } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';

interface RegistroHorasFormProps {
  onSubmit: (data: RegistroHorasInput) => Promise<void>;
  initialData?: Partial<RegistroHorasInput>;
  proyectos: Proyecto[];
  isEditing?: boolean;
  onCancel?: () => void;
}

export function RegistroHorasForm({
  onSubmit,
  initialData,
  proyectos,
  isEditing = false,
  onCancel,
}: RegistroHorasFormProps) {
  const { userData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importeEstimado, setImporteEstimado] = useState(0);
  const [infoFecha, setInfoFecha] = useState<{ tipo: TipoHora; nombre: string } | null>(null);
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegistroHorasInput>({
    resolver: zodResolver(registroHorasSchema),
    defaultValues: {
      fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
      horaInicio: initialData?.horaInicio || '',
      horaFin: initialData?.horaFin || '',
      proyectoId: initialData?.proyectoId || '',
      descripcion: initialData?.descripcion || '',
      tipoHora: initialData?.tipoHora,
    },
  });
  
  const fecha = watch('fecha');
  const horaInicio = watch('horaInicio');
  const horaFin = watch('horaFin');
  const tipoHora = watch('tipoHora');
  
  // Detectar tipo de día automáticamente
  useEffect(() => {
    if (fecha) {
      const fechaObj = new Date(fecha);
      const info = getInfoDia(fechaObj);
      setInfoFecha(info);
      
      // Solo auto-asignar si no está en modo edición
      if (!isEditing) {
        setValue('tipoHora', info.tipo);
      }
    }
  }, [fecha, setValue, isEditing]);
  
  // Calcular importe estimado
  useEffect(() => {
    if (horaInicio && horaFin && tipoHora) {
      // Usar tarifa por defecto para estimación
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
  
  const handleFormSubmit = async (data: RegistroHorasInput) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calcular horas trabajadas
  const calcularHorasTrabajadas = () => {
    if (!horaInicio || !horaFin) return null;
    
    const [hI, mI] = horaInicio.split(':').map(Number);
    const [hF, mF] = horaFin.split(':').map(Number);
    
    let minutos = (hF * 60 + mF) - (hI * 60 + mI);
    if (minutos < 0) minutos += 24 * 60; // Cruce de medianoche
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    return { horas, minutos: mins, total: minutos / 60 };
  };
  
  const horasTrabajadas = calcularHorasTrabajadas();
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Info del día */}
      {infoFecha && (
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-lg",
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha *
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="date"
            {...register('fecha')}
            className={cn(
              "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent",
              errors.fecha ? "border-red-500" : "border-gray-300"
            )}
          />
        </div>
        {errors.fecha && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.fecha.message}
          </p>
        )}
      </div>
      
      {/* Horas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hora Inicio *
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="time"
              {...register('horaInicio')}
              className={cn(
                "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent",
                errors.horaInicio ? "border-red-500" : "border-gray-300"
              )}
            />
          </div>
          {errors.horaInicio && (
            <p className="mt-1 text-sm text-red-600">{errors.horaInicio.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hora Fin *
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="time"
              {...register('horaFin')}
              className={cn(
                "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent",
                errors.horaFin ? "border-red-500" : "border-gray-300"
              )}
            />
          </div>
          {errors.horaFin && (
            <p className="mt-1 text-sm text-red-600">{errors.horaFin.message}</p>
          )}
        </div>
      </div>
      
      {/* Resumen de horas */}
      {horasTrabajadas && horasTrabajadas.total > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total horas extra:</span>
            <span className="text-lg font-bold text-gray-900">
              {horasTrabajadas.horas}h {horasTrabajadas.minutos}min
            </span>
          </div>
          {importeEstimado > 0 && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">Importe estimado:</span>
              <span className="text-lg font-bold text-primary">
                {formatearMoneda(importeEstimado)}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Proyecto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Proyecto *
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            {...register('proyectoId')}
            className={cn(
              "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none",
              errors.proyectoId ? "border-red-500" : "border-gray-300"
            )}
          >
            <option value="">Selecciona un proyecto</option>
            {proyectos.map(proyecto => (
              <option key={proyecto.id} value={proyecto.id}>
                {proyecto.nombre} - {proyecto.cliente}
              </option>
            ))}
          </select>
        </div>
        {errors.proyectoId && (
          <p className="mt-1 text-sm text-red-600">{errors.proyectoId.message}</p>
        )}
      </div>
      
      {/* Tipo de hora (oculto si se detecta automáticamente) */}
      <input type="hidden" {...register('tipoHora')} />
      
      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción del trabajo
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <textarea
            {...register('descripcion')}
            rows={3}
            placeholder="Describe brevemente el trabajo realizado (opcional)"
            className={cn(
              "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none",
              errors.descripcion ? "border-red-500" : "border-gray-300"
            )}
          />
        </div>
        {errors.descripcion && (
          <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>
        )}
      </div>
      
      {/* Botones */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "flex-1 px-4 py-3 bg-primary text-white rounded-lg font-medium",
            "hover:bg-primary/90 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "inline-flex items-center justify-center gap-2"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {isEditing ? 'Actualizar' : 'Guardar Registro'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
