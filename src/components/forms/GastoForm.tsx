'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Calendar,
  Receipt,
  Euro,
  FileText,
  Upload,
  X,
  MapPin,
  Car,
  Save,
  Loader2,
  AlertCircle,
  Image,
  File,
  Building2,
} from 'lucide-react';
import { gastoSchema } from '@/schemas';
import { CategoriaGasto, Proyecto } from '@/types';
import { useAuth } from '@/lib/firebase/auth';
import { formatearMoneda } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';

interface GastoFormValues {
  fecha: string;
  categoria: CategoriaGasto;
  descripcion: string;
  importe: number;
  kilometros?: number;
  origen?: string;
  destino?: string;
  vehiculo?: 'propio' | 'empresa';
  proyectoId?: string;
  observaciones?: string;
}

interface GastoFormProps {
  onSubmit: (data: GastoFormValues, adjuntos: File[]) => Promise<void>;
  initialData?: Partial<GastoFormValues>;
  proyectos: Proyecto[];
  isEditing?: boolean;
  onCancel?: () => void;
}

const CATEGORIAS: { value: CategoriaGasto; label: string; icon: string }[] = [
  { value: 'dieta', label: 'Dieta', icon: '🍽️' },
  { value: 'kilometraje', label: 'Kilometraje', icon: '🚗' },
  { value: 'combustible', label: 'Combustible', icon: '⛽' },
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'parking', label: 'Parking', icon: '🅿️' },
  { value: 'peaje', label: 'Peaje', icon: '🛣️' },
  { value: 'transporte_publico', label: 'Transporte público', icon: '🚆' },
  { value: 'comida', label: 'Comida', icon: '🍔' },
  { value: 'material', label: 'Material', icon: '🔧' },
  { value: 'otro', label: 'Otro', icon: '📦' },
];

export function GastoForm({
  onSubmit,
  initialData,
  proyectos,
  isEditing = false,
  onCancel,
}: GastoFormProps) {
  const { userData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adjuntos, setAdjuntos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GastoFormValues>({
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
      categoria: initialData?.categoria || 'dieta',
      descripcion: initialData?.descripcion || '',
      importe: initialData?.importe,
      kilometros: initialData?.kilometros,
      origen: initialData?.origen || '',
      destino: initialData?.destino || '',
      vehiculo: initialData?.vehiculo || 'propio',
      proyectoId: initialData?.proyectoId || '',
      observaciones: initialData?.observaciones || '',
    },
  });
  
  const categoria = watch('categoria');
  const kilometros = watch('kilometros');
  const esKilometraje = categoria === 'kilometraje';
  
  // Calcular importe de kilometraje automáticamente
  const TARIFA_KM = 0.26; // €/km por defecto
  const importeKmCalculado = esKilometraje && kilometros ? kilometros * TARIFA_KM : 0;
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      // Validar tipo (imágenes y PDFs)
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        return false;
      }
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return false;
      }
      return true;
    });
    
    setAdjuntos(prev => [...prev, ...validFiles].slice(0, 3)); // Máx 3 adjuntos
  };
  
  const removeAdjunto = (index: number) => {
    setAdjuntos(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleFormSubmit = async (data: GastoFormValues) => {
    setIsSubmitting(true);
    try {
      // Si es kilometraje, usar el importe calculado
      if (esKilometraje) {
        data.importe = importeKmCalculado;
      }
      await onSubmit(data, adjuntos);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha del gasto *
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
          <p className="mt-1 text-sm text-red-600">{errors.fecha.message}</p>
        )}
      </div>
      
      {/* Categoría - Grid de botones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de gasto *
        </label>
        <div className="grid grid-cols-5 gap-2">
          {CATEGORIAS.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setValue('categoria', cat.value)}
              className={cn(
                "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                categoria === cat.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 hover:border-gray-300 text-gray-600"
              )}
            >
              <span className="text-2xl mb-1">{cat.icon}</span>
              <span className="text-xs font-medium truncate w-full text-center">
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Campos específicos para kilometraje */}
      {esKilometraje && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origen
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  {...register('origen')}
                  placeholder="Ciudad origen"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destino
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  {...register('destino')}
                  placeholder="Ciudad destino"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kilómetros *
              </label>
              <input
                type="number"
                step="1"
                {...register('kilometros', { valueAsNumber: true })}
                placeholder="0"
                className={cn(
                  "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent",
                  errors.kilometros ? "border-red-500" : "border-gray-300"
                )}
              />
              {errors.kilometros && (
                <p className="mt-1 text-sm text-red-600">{errors.kilometros.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehículo
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setValue('vehiculo', 'propio')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all",
                    watch('vehiculo') === 'propio'
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <Car className="w-5 h-5" />
                  <span className="text-sm">Propio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('vehiculo', 'empresa')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all",
                    watch('vehiculo') === 'empresa'
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <Car className="w-5 h-5" />
                  <span className="text-sm">Empresa</span>
                </button>
              </div>
            </div>
          </div>
          
          {kilometros && kilometros > 0 && (
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">
                {kilometros} km × {formatearMoneda(TARIFA_KM)}/km
              </span>
              <span className="text-lg font-bold text-primary">
                {formatearMoneda(importeKmCalculado)}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Importe (solo si no es kilometraje) */}
      {!esKilometraje && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Importe *
          </label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              step="0.01"
              {...register('importe', { valueAsNumber: true })}
              placeholder="0.00"
              className={cn(
                "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent",
                errors.importe ? "border-red-500" : "border-gray-300"
              )}
            />
          </div>
          {errors.importe && (
            <p className="mt-1 text-sm text-red-600">{errors.importe.message}</p>
          )}
        </div>
      )}
      
      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción *
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            {...register('descripcion')}
            placeholder="Breve descripción del gasto"
            className={cn(
              "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent",
              errors.descripcion ? "border-red-500" : "border-gray-300"
            )}
          />
        </div>
        {errors.descripcion && (
          <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>
        )}
      </div>
      
      {/* Proyecto (opcional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Proyecto (opcional)
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            {...register('proyectoId')}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
          >
            <option value="">Sin proyecto asignado</option>
            {proyectos.map(proyecto => (
              <option key={proyecto.id} value={proyecto.id}>
                {proyecto.nombre} - {proyecto.cliente}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Adjuntos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Adjuntar ticket/factura
        </label>
        
        {/* Lista de adjuntos */}
        {adjuntos.length > 0 && (
          <div className="space-y-2 mb-3">
            {adjuntos.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {file.type.startsWith('image/') ? (
                  <Image className="w-5 h-5 text-blue-500" />
                ) : (
                  <File className="w-5 h-5 text-red-500" />
                )}
                <span className="flex-1 text-sm text-gray-700 truncate">
                  {file.name}
                </span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={() => removeAdjunto(index)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Botón de subida */}
        {adjuntos.length < 3 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>Subir imagen o PDF (máx. 5MB)</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <p className="mt-1 text-xs text-gray-500">
          Máximo 3 archivos. Formatos: JPG, PNG, WebP, PDF
        </p>
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
              {isEditing ? 'Actualizar' : 'Guardar Gasto'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
