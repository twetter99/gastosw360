'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Loader2, 
  Euro, 
  Clock, 
  Car, 
  UtensilsCrossed,
  Star,
  Check,
  AlertCircle,
  Lock
} from 'lucide-react';
import { 
  useTarifasAño, 
  useAñosConfigurados, 
  useGuardarTarifasAño,
  useClonarTarifasAño 
} from '@/hooks/queries/useTarifas';
import { 
  TARIFAS_DEFINICION, 
  GRUPOS_TARIFAS,
  type TarifaAnual
} from '@/lib/firebase/services/tarifas';
import { TipoTarifa } from '@/types';
import { useAuth } from '@/lib/firebase/auth';
import { toast } from 'sonner';

const ICONOS = {
  Clock,
  Car,
  UtensilsCrossed,
  Star,
};

export default function TarifasAnualesPage() {
  const { user } = useAuth();
  const añoActual = new Date().getFullYear();
  const [añoSeleccionado, setAñoSeleccionado] = useState(añoActual);
  const [tarifasEditadas, setTarifasEditadas] = useState<Record<TipoTarifa, number>>({} as Record<TipoTarifa, number>);
  const [hasChanges, setHasChanges] = useState(false);
  
  const { data: tarifasAño, isLoading, refetch } = useTarifasAño(añoSeleccionado);
  const { data: añosConfigurados = [] } = useAñosConfigurados();
  const guardarMutation = useGuardarTarifasAño();
  const clonarMutation = useClonarTarifasAño();
  
  // Verificar si el año es editable (año actual o futuro)
  const esEditable = añoSeleccionado >= añoActual;
  
  // Verificar si el año tiene datos
  const tieneData = !!tarifasAño;
  
  // Inicializar tarifas editadas cuando cambian los datos
  useEffect(() => {
    if (tarifasAño) {
      const valores: Record<TipoTarifa, number> = {} as Record<TipoTarifa, number>;
      for (const codigo of Object.keys(TARIFAS_DEFINICION) as TipoTarifa[]) {
        valores[codigo] = tarifasAño.tarifas[codigo]?.importe ?? TARIFAS_DEFINICION[codigo].defaultValue;
      }
      setTarifasEditadas(valores);
      setHasChanges(false);
    } else {
      // Si no hay datos, usar valores por defecto
      const valores: Record<TipoTarifa, number> = {} as Record<TipoTarifa, number>;
      for (const codigo of Object.keys(TARIFAS_DEFINICION) as TipoTarifa[]) {
        valores[codigo] = TARIFAS_DEFINICION[codigo].defaultValue;
      }
      setTarifasEditadas(valores);
      setHasChanges(false);
    }
  }, [tarifasAño, añoSeleccionado]);
  
  // Manejar cambio de valor
  const handleValorChange = (codigo: TipoTarifa, valor: number) => {
    setTarifasEditadas(prev => ({ ...prev, [codigo]: valor }));
    setHasChanges(true);
  };
  
  // Guardar cambios
  const handleGuardar = async () => {
    const tarifas: Record<TipoTarifa, TarifaAnual> = {} as Record<TipoTarifa, TarifaAnual>;
    
    for (const codigo of Object.keys(TARIFAS_DEFINICION) as TipoTarifa[]) {
      tarifas[codigo] = {
        codigo,
        importe: tarifasEditadas[codigo] ?? TARIFAS_DEFINICION[codigo].defaultValue,
      };
    }
    
    try {
      await guardarMutation.mutateAsync({
        año: añoSeleccionado,
        tarifas,
        userId: user?.uid,
      });
      toast.success(`Tarifas ${añoSeleccionado} guardadas correctamente`);
      setHasChanges(false);
      refetch();
    } catch (error) {
      toast.error('Error al guardar las tarifas');
      console.error(error);
    }
  };
  
  // Clonar del año anterior
  const handleClonar = async () => {
    try {
      const clonado = await clonarMutation.mutateAsync({
        añoDestino: añoSeleccionado,
        userId: user?.uid,
      });
      
      if (clonado) {
        toast.success(`Tarifas copiadas desde ${añoSeleccionado - 1}`);
      } else {
        toast.info('Se aplicaron valores por defecto (no había año anterior)');
      }
      refetch();
    } catch (error) {
      toast.error('Error al clonar tarifas');
      console.error(error);
    }
  };
  
  // Navegar entre años
  const navegarAño = (direccion: 'anterior' | 'siguiente') => {
    if (hasChanges) {
      if (!confirm('Tienes cambios sin guardar. ¿Deseas continuar?')) return;
    }
    setAñoSeleccionado(prev => direccion === 'anterior' ? prev - 1 : prev + 1);
  };

  if (isLoading && !tarifasEditadas) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con navegación de años */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarifas Anuales</h1>
          <p className="text-gray-600">Gestión de tarifas por año fiscal</p>
        </div>
        
        {/* Navegador de años */}
        <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border p-1">
          <button
            onClick={() => navegarAño('anterior')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Año anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 min-w-[120px] justify-center">
            <span className="text-xl font-bold text-gray-900">{añoSeleccionado}</span>
            {añoSeleccionado === añoActual && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                Actual
              </span>
            )}
            {!esEditable && (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          <button
            onClick={() => navegarAño('siguiente')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Año siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Indicadores de estado */}
      <div className="flex flex-wrap gap-2">
        {tieneData ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm bg-green-50 text-green-700 rounded-full">
            <Check className="w-4 h-4" />
            Configurado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm bg-amber-50 text-amber-700 rounded-full">
            <AlertCircle className="w-4 h-4" />
            Sin configurar
          </span>
        )}
        
        {!esEditable && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">
            <Lock className="w-4 h-4" />
            Solo lectura (año pasado)
          </span>
        )}
        
        {añosConfigurados.length > 0 && (
          <span className="text-sm text-gray-500 py-1">
            Años configurados: {añosConfigurados.join(', ')}
          </span>
        )}
      </div>
      
      {/* Acciones */}
      {esEditable && !tieneData && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1">
            <p className="font-medium text-blue-900">Este año no tiene tarifas configuradas</p>
            <p className="text-sm text-blue-700">Puedes copiar las del año anterior o empezar con valores por defecto</p>
          </div>
          <button
            onClick={handleClonar}
            disabled={clonarMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {clonarMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            Copiar de {añoSeleccionado - 1}
          </button>
        </div>
      )}

      {/* Grupos de tarifas */}
      <div className="grid gap-6">
        {Object.entries(GRUPOS_TARIFAS).map(([key, grupo]) => {
          const IconComponent = ICONOS[grupo.icon as keyof typeof ICONOS] || Euro;
          
          return (
            <div key={key} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {/* Header del grupo */}
              <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white shadow-sm">
                  <IconComponent className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{grupo.titulo}</h2>
              </div>
              
              {/* Tarifas del grupo */}
              <div className="divide-y">
                {grupo.tipos.map((codigo) => {
                  const def = TARIFAS_DEFINICION[codigo];
                  const valorActual = tarifasEditadas[codigo] ?? def.defaultValue;
                  
                  return (
                    <div 
                      key={codigo} 
                      className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{def.descripcion}</p>
                        <p className="text-sm text-gray-500">{codigo}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {esEditable ? (
                          <>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={valorActual}
                              onChange={(e) => handleValorChange(codigo, parseFloat(e.target.value) || 0)}
                              className="w-28 px-3 py-2 text-right border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                            <span className="text-sm text-gray-500 w-16">{def.unidad}</span>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-gray-900">
                              {valorActual.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500">{def.unidad}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de acciones fija */}
      {esEditable && (
        <div className="sticky bottom-4 flex justify-end gap-3">
          {hasChanges && (
            <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Cambios sin guardar
            </span>
          )}
          <button
            onClick={handleGuardar}
            disabled={guardarMutation.isPending || !hasChanges}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          >
            {guardarMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Guardar Tarifas {añoSeleccionado}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
