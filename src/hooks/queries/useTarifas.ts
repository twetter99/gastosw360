/**
 * React Query Hooks para Tarifas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tarifasService, type CreateTarifaInput, type TarifaDB } from '@/lib/firebase/services/tarifas';
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
