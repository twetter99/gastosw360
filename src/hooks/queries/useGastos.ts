/**
 * React Query Hooks para Gastos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gastosService, type CreateGastoInput, type GastoDB } from '@/lib/firebase/services/gastos';
import { EstadoAprobacion } from '@/types';

// ============================================
// QUERY KEYS
// ============================================

export const gastosKeys = {
  all: ['gastos'] as const,
  lists: () => [...gastosKeys.all, 'list'] as const,
  byUsuario: (usuarioId: string) => [...gastosKeys.lists(), { usuarioId }] as const,
  byEstado: (estado: EstadoAprobacion) => [...gastosKeys.lists(), { estado }] as const,
  byMes: (año: number, mes: number, usuarioId?: string) => 
    [...gastosKeys.lists(), { año, mes, usuarioId }] as const,
  pendientes: () => [...gastosKeys.lists(), { estado: 'pendiente' }] as const,
  detail: (id: string) => [...gastosKeys.all, 'detail', id] as const,
};

// ============================================
// QUERIES
// ============================================

/**
 * Obtener todos los gastos
 */
export function useGastos() {
  return useQuery({
    queryKey: gastosKeys.lists(),
    queryFn: () => gastosService.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener gastos de un usuario
 */
export function useGastosUsuario(usuarioId: string | undefined) {
  return useQuery({
    queryKey: gastosKeys.byUsuario(usuarioId || ''),
    queryFn: () => gastosService.getByUsuario(usuarioId!),
    enabled: !!usuarioId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener gastos de un mes
 */
export function useGastosMes(año: number, mes: number, usuarioId?: string) {
  return useQuery({
    queryKey: gastosKeys.byMes(año, mes, usuarioId),
    queryFn: () => gastosService.getByMes(año, mes, usuarioId),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener gastos pendientes
 */
export function useGastosPendientes() {
  return useQuery({
    queryKey: gastosKeys.pendientes(),
    queryFn: () => gastosService.getPendientes(),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Obtener un gasto por ID
 */
export function useGasto(id: string | undefined) {
  return useQuery({
    queryKey: gastosKeys.detail(id || ''),
    queryFn: () => gastosService.getById(id!),
    enabled: !!id,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Crear gasto
 */
export function useCrearGasto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateGastoInput) => gastosService.createGasto(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gastosKeys.all });
    },
  });
}

/**
 * Actualizar gasto
 */
export function useActualizarGasto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GastoDB> }) => 
      gastosService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gastosKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: gastosKeys.lists() });
    },
  });
}

/**
 * Eliminar gasto
 */
export function useEliminarGasto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => gastosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gastosKeys.all });
    },
  });
}

/**
 * Enviar gasto a aprobación
 */
export function useEnviarGastoAAprobacion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => gastosService.enviarAAprobacion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gastosKeys.all });
    },
  });
}

/**
 * Aprobar gasto
 */
export function useAprobarGasto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, aprobadoPor }: { id: string; aprobadoPor: string }) => 
      gastosService.aprobar(id, aprobadoPor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gastosKeys.all });
    },
  });
}

/**
 * Rechazar gasto
 */
export function useRechazarGasto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, motivo, rechazadoPor }: { id: string; motivo: string; rechazadoPor: string }) => 
      gastosService.rechazar(id, motivo, rechazadoPor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gastosKeys.all });
    },
  });
}
