/**
 * React Query Hooks para Festivos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { festivosService, type CreateFestivoInput, type FestivoDB } from '@/lib/firebase/services/festivos';

// ============================================
// QUERY KEYS
// ============================================

export const festivosKeys = {
  all: ['festivos'] as const,
  lists: () => [...festivosKeys.all, 'list'] as const,
  byAño: (año: number) => [...festivosKeys.lists(), { año }] as const,
  detail: (id: string) => [...festivosKeys.all, 'detail', id] as const,
};

// ============================================
// QUERIES
// ============================================

/**
 * Obtener todos los festivos
 */
export function useFestivos() {
  return useQuery({
    queryKey: festivosKeys.lists(),
    queryFn: () => festivosService.getAllOrdenados(),
    staleTime: 1000 * 60 * 60, // 1 hora (casi nunca cambia)
  });
}

/**
 * Obtener festivos de un año
 */
export function useFestivosAño(año: number) {
  return useQuery({
    queryKey: festivosKeys.byAño(año),
    queryFn: () => festivosService.getByAño(año),
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Obtener un festivo por ID
 */
export function useFestivo(id: string | undefined) {
  return useQuery({
    queryKey: festivosKeys.detail(id || ''),
    queryFn: () => festivosService.getById(id!),
    enabled: !!id,
  });
}

/**
 * Verificar si una fecha es festivo
 */
export function useEsFestivo(fecha: Date | undefined, localidad?: string) {
  return useQuery({
    queryKey: [...festivosKeys.all, 'check', fecha?.toISOString(), localidad],
    queryFn: () => festivosService.esFestivo(fecha!, localidad),
    enabled: !!fecha,
    staleTime: 1000 * 60 * 60,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Crear festivo
 */
export function useCrearFestivo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateFestivoInput) => festivosService.createFestivo(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: festivosKeys.all });
    },
  });
}

/**
 * Actualizar festivo
 */
export function useActualizarFestivo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FestivoDB> }) => 
      festivosService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: festivosKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: festivosKeys.lists() });
    },
  });
}

/**
 * Eliminar festivo
 */
export function useEliminarFestivo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => festivosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: festivosKeys.all });
    },
  });
}
