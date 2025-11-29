/**
 * React Query Hooks para Tarifas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  tarifasService, 
  type CreateTarifaInput, 
  type TarifaDB,
  type TarifaAnual,
  type TarifasAnuales 
} from '@/lib/firebase/services/tarifas';
import { TipoTarifa } from '@/types';

// ============================================
// QUERY KEYS
// ============================================

export const tarifasKeys = {
  all: ['tarifas'] as const,
  lists: () => [...tarifasKeys.all, 'list'] as const,
  activas: () => [...tarifasKeys.lists(), { activa: true }] as const,
  byCodigo: (codigo: TipoTarifa) => [...tarifasKeys.lists(), { codigo }] as const,
  detail: (id: string) => [...tarifasKeys.all, 'detail', id] as const,
  // Claves para tarifas anuales
  anuales: () => [...tarifasKeys.all, 'anuales'] as const,
  porAño: (año: number) => [...tarifasKeys.anuales(), { año }] as const,
  añosConfigurados: () => [...tarifasKeys.anuales(), 'años'] as const,
};

// ============================================
// QUERIES
// ============================================

/**
 * Obtener todas las tarifas
 */
export function useTarifas() {
  return useQuery({
    queryKey: tarifasKeys.lists(),
    queryFn: () => tarifasService.getAllOrdenadas(),
    staleTime: 1000 * 60 * 30, // 30 minutos (cambia poco)
  });
}

/**
 * Obtener tarifas activas
 */
export function useTarifasActivas() {
  return useQuery({
    queryKey: tarifasKeys.activas(),
    queryFn: () => tarifasService.getActivas(),
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Obtener tarifa vigente por código
 */
export function useTarifaVigente(codigo: TipoTarifa | undefined) {
  return useQuery({
    queryKey: tarifasKeys.byCodigo(codigo!),
    queryFn: () => tarifasService.getTarifaVigente(codigo!),
    enabled: !!codigo,
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Obtener una tarifa por ID
 */
export function useTarifa(id: string | undefined) {
  return useQuery({
    queryKey: tarifasKeys.detail(id || ''),
    queryFn: () => tarifasService.getById(id!),
    enabled: !!id,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Crear tarifa
 */
export function useCrearTarifa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateTarifaInput) => tarifasService.createTarifa(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tarifasKeys.all });
    },
  });
}

/**
 * Actualizar tarifa
 */
export function useActualizarTarifa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TarifaDB> }) => 
      tarifasService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: tarifasKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tarifasKeys.lists() });
    },
  });
}

/**
 * Eliminar tarifa
 */
export function useEliminarTarifa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => tarifasService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tarifasKeys.all });
    },
  });
}

/**
 * Desactivar tarifa
 */
export function useDesactivarTarifa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => tarifasService.desactivar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tarifasKeys.all });
    },
  });
}

// ============================================
// HOOKS PARA TARIFAS ANUALES
// ============================================

/**
 * Obtener tarifas de un año específico
 */
export function useTarifasAño(año: number) {
  return useQuery({
    queryKey: tarifasKeys.porAño(año),
    queryFn: () => tarifasService.getTarifasAño(año),
    staleTime: 1000 * 60 * 30, // 30 minutos
  });
}

/**
 * Obtener lista de años configurados
 */
export function useAñosConfigurados() {
  return useQuery({
    queryKey: tarifasKeys.añosConfigurados(),
    queryFn: () => tarifasService.getAñosConfigurados(),
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Guardar tarifas de un año
 */
export function useGuardarTarifasAño() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ año, tarifas, userId }: { 
      año: number; 
      tarifas: Record<TipoTarifa, TarifaAnual>;
      userId?: string;
    }) => tarifasService.guardarTarifasAño(año, tarifas, userId),
    onSuccess: (_, { año }) => {
      queryClient.invalidateQueries({ queryKey: tarifasKeys.porAño(año) });
      queryClient.invalidateQueries({ queryKey: tarifasKeys.añosConfigurados() });
    },
  });
}

/**
 * Clonar tarifas del año anterior
 */
export function useClonarTarifasAño() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ añoDestino, userId }: { añoDestino: number; userId?: string }) => 
      tarifasService.clonarDelAñoAnterior(añoDestino, userId),
    onSuccess: (_, { añoDestino }) => {
      queryClient.invalidateQueries({ queryKey: tarifasKeys.porAño(añoDestino) });
      queryClient.invalidateQueries({ queryKey: tarifasKeys.añosConfigurados() });
    },
  });
}

/**
 * Obtener tarifa vigente anual
 */
export function useTarifaVigenteAnual(codigo: TipoTarifa | undefined, fecha?: Date) {
  return useQuery({
    queryKey: [...tarifasKeys.byCodigo(codigo!), 'vigente', fecha?.toISOString()],
    queryFn: () => tarifasService.getTarifaVigenteAnual(codigo!, fecha),
    enabled: !!codigo,
    staleTime: 1000 * 60 * 30,
  });
}
