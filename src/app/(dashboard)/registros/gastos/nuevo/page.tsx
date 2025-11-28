'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import imageCompression from 'browser-image-compression';
import { 
  Calendar,
  Euro,
  FileText,
  Upload,
  X,
  MapPin,
  Check,
  Loader2,
  Image as ImageIcon,
  File,
  Building2,
  ChevronDown,
  Camera,
  Car,
} from 'lucide-react';
import { gastoSchema } from '@/schemas';
import { CategoriaGasto, Proyecto } from '@/types';
import { useAuth } from '@/lib/firebase/auth';
import { formatearMoneda } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import TecnicoLayout from '@/components/layout/TecnicoLayout';

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

const CATEGORIAS: { value: CategoriaGasto; label: string; icon: string; color: string }[] = [
  { value: 'dieta', label: 'Dieta', icon: '🍽️', color: 'border-green-300 bg-green-50' },
  { value: 'kilometraje', label: 'Kilometraje', icon: '🚗', color: 'border-blue-300 bg-blue-50' },
  { value: 'combustible', label: 'Combustible', icon: '⛽', color: 'border-amber-300 bg-amber-50' },
  { value: 'hotel', label: 'Hotel', icon: '🏨', color: 'border-purple-300 bg-purple-50' },
  { value: 'parking', label: 'Parking', icon: '🅿️', color: 'border-cyan-300 bg-cyan-50' },
  { value: 'peaje', label: 'Peaje', icon: '🛣️', color: 'border-orange-300 bg-orange-50' },
  { value: 'comida', label: 'Comida', icon: '🍔', color: 'border-rose-300 bg-rose-50' },
  { value: 'material', label: 'Material', icon: '🔧', color: 'border-indigo-300 bg-indigo-50' },
  { value: 'otro', label: 'Otro', icon: '📦', color: 'border-gray-300 bg-gray-50' },
];

// Hook para obtener proyectos
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

export default function NuevoGastoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, userData } = useAuth();
  const { data: proyectos = [], isLoading: loadingProyectos } = useProyectos();
  
  // Si viene con tipo=desplazamiento, preseleccionar kilometraje
  const tipoInicial = searchParams.get('tipo');
  const categoriaInicial: CategoriaGasto = tipoInicial === 'desplazamiento' ? 'kilometraje' : 'dieta';
  
  const [adjuntos, setAdjuntos] = useState<File[]>([]);
  const [comprimiendo, setComprimiendo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GastoFormValues>({
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      categoria: categoriaInicial,
      descripcion: '',
      importe: undefined,
      kilometros: undefined,
      origen: '',
      destino: '',
      vehiculo: 'propio',
      proyectoId: '',
      observaciones: '',
    },
  });
  
  const categoria = watch('categoria');
  const kilometros = watch('kilometros');
  const esKilometraje = categoria === 'kilometraje';
  
  // Tarifa por km
  const TARIFA_KM = 0.26;
  const importeKmCalculado = esKilometraje && kilometros ? kilometros * TARIFA_KM : 0;
  
  // Compresión de imágenes
  const compressionOptions = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
  };
  
  const comprimirImagen = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;
    if (file.size <= 500 * 1024) return file;
    
    try {
      const compressedFile = await imageCompression(file, compressionOptions);
      return compressedFile;
    } catch (error) {
      console.error('Error al comprimir:', error);
      return file;
    }
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
    const validFiles = files.filter(file => 
      validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024
    );
    
    if (validFiles.length === 0) return;
    
    setComprimiendo(true);
    try {
      const processedFiles = await Promise.all(validFiles.map(file => comprimirImagen(file)));
      setAdjuntos(prev => [...prev, ...processedFiles].slice(0, 3));
    } finally {
      setComprimiendo(false);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const removeAdjunto = (index: number) => {
    setAdjuntos(prev => prev.filter((_, i) => i !== index));
  };
  
  // Mutation para guardar
  const mutation = useMutation({
    mutationFn: async (data: GastoFormValues) => {
      if (!user || !userData) throw new Error('No autenticado');
      
      const fechaDate = new Date(data.fecha);
      const periodo = `${fechaDate.getFullYear()}-${String(fechaDate.getMonth() + 1).padStart(2, '0')}`;
      const proyecto = proyectos.find(p => p.id === data.proyectoId);
      
      // Si es kilometraje, usar importe calculado
      const importeFinal = esKilometraje ? importeKmCalculado : data.importe;
      
      // Subir adjuntos a Storage
      const adjuntosUrls: string[] = [];
      for (const file of adjuntos) {
        const fileName = `gastos/${user.uid}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        adjuntosUrls.push(url);
      }
      
      const docRef = await addDoc(collection(db, 'gastos'), {
        usuarioId: user.uid,
        usuarioNombre: `${userData.nombre} ${userData.apellidos}`,
        fecha: Timestamp.fromDate(fechaDate),
        periodo,
        categoria: data.categoria,
        descripcion: data.descripcion,
        importe: importeFinal,
        kilometros: esKilometraje ? data.kilometros : null,
        origen: esKilometraje ? data.origen : null,
        destino: esKilometraje ? data.destino : null,
        vehiculo: esKilometraje ? data.vehiculo : null,
        proyectoId: data.proyectoId || null,
        proyectoNombre: proyecto?.nombre || null,
        observaciones: data.observaciones || '',
        adjuntos: adjuntosUrls,
        estado: 'pendiente',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumen-mes'] });
      queryClient.invalidateQueries({ queryKey: ['gastos'] });
      router.push('/dashboard?success=gasto');
    },
  });
  
  const onSubmit = (data: GastoFormValues) => {
    mutation.mutate(data);
  };
  
  const categoriaSeleccionada = CATEGORIAS.find(c => c.value === categoria);
  
  return (
    <TecnicoLayout title="Añadir gasto" showBack backHref="/dashboard">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-[calc(100vh-8rem)]">
        <div className="flex-1 px-4 py-5 space-y-5 max-w-lg mx-auto w-full">
          
          {/* Categoría - Grid de botones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de gasto
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setValue('categoria', cat.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all touch-manipulation",
                    categoria === cat.value
                      ? `${cat.color} border-current ring-2 ring-offset-1`
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
          
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
            {errors.fecha && <p className="mt-2 text-sm text-red-600">{errors.fecha.message}</p>}
          </div>
          
          {/* Campos específicos de kilometraje */}
          {esKilometraje && (
            <>
              {/* Kilometros */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kilómetros
                </label>
                <div className="relative">
                  <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    {...register('kilometros', { valueAsNumber: true })}
                    placeholder="0"
                    className={cn(
                      "w-full pl-12 pr-16 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors",
                      errors.kilometros ? "border-red-500" : "border-gray-200"
                    )}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">km</span>
                </div>
                {kilometros && kilometros > 0 && (
                  <p className="mt-2 text-sm text-primary font-medium">
                    Importe: {formatearMoneda(importeKmCalculado)} ({TARIFA_KM}€/km)
                  </p>
                )}
              </div>
              
              {/* Origen / Destino */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origen
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      {...register('origen')}
                      placeholder="Ciudad origen"
                      className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destino
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      {...register('destino')}
                      placeholder="Ciudad destino"
                      className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>
              
              {/* Vehículo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehículo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue('vehiculo', 'propio')}
                    className={cn(
                      "py-3 px-4 rounded-xl border-2 font-medium transition-all",
                      watch('vehiculo') === 'propio'
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200 text-gray-700"
                    )}
                  >
                    Vehículo propio
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('vehiculo', 'empresa')}
                    className={cn(
                      "py-3 px-4 rounded-xl border-2 font-medium transition-all",
                      watch('vehiculo') === 'empresa'
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200 text-gray-700"
                    )}
                  >
                    Vehículo empresa
                  </button>
                </div>
              </div>
            </>
          )}
          
          {/* Importe (solo si NO es kilometraje) */}
          {!esKilometraje && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Importe
              </label>
              <div className="relative">
                <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  {...register('importe', { valueAsNumber: true })}
                  placeholder="0,00"
                  className={cn(
                    "w-full pl-12 pr-16 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors",
                    errors.importe ? "border-red-500" : "border-gray-200"
                  )}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
              </div>
              {errors.importe && <p className="mt-2 text-sm text-red-600">{errors.importe.message}</p>}
            </div>
          )}
          
          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400 pointer-events-none" />
              <textarea
                {...register('descripcion')}
                rows={2}
                placeholder="Describe el gasto..."
                className={cn(
                  "w-full pl-12 pr-4 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-colors",
                  errors.descripcion ? "border-red-500" : "border-gray-200"
                )}
              />
            </div>
            {errors.descripcion && <p className="mt-2 text-sm text-red-600">{errors.descripcion.message}</p>}
          </div>
          
          {/* Proyecto (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proyecto (opcional)
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <select
                {...register('proyectoId')}
                className="w-full pl-12 pr-10 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary appearance-none bg-white"
              >
                <option value="">Sin proyecto asignado</option>
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
          </div>
          
          {/* Adjuntos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Justificante (foto o PDF)
            </label>
            
            {/* Previews de adjuntos */}
            {adjuntos.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {adjuntos.map((file, index) => (
                  <div key={index} className="relative flex-shrink-0">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Adjunto ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                        <File className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAdjunto(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Botón añadir adjunto */}
            {adjuntos.length < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={comprimiendo}
                className={cn(
                  "w-full py-4 border-2 border-dashed border-gray-300 rounded-xl",
                  "flex items-center justify-center gap-2 text-gray-600",
                  "hover:border-gray-400 hover:bg-gray-50 transition-colors touch-manipulation",
                  comprimiendo && "opacity-50 cursor-wait"
                )}
              >
                {comprimiendo ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Añadir foto o documento
                  </>
                )}
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <p className="mt-2 text-xs text-gray-500 text-center">
              Máximo 3 archivos. Las imágenes se comprimen automáticamente.
            </p>
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
                "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]",
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
                  Guardar gasto
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
    </TecnicoLayout>
  );
}
