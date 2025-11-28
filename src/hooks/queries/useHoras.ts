/**
 * React Query Hooks para Horas
 * 
 * Estos hooks manejan:
 * - Caché automática
 * - Revalidación inteligente
 * - Estados de loading/error
 * - Optimistic updates
 * 
 * USO:
 * ```tsx
 * function MisHoras() {
 *   const { data: horas, isLoading, error } = useHorasUsuario(userId);
 *   const { mutate: crearHora } = useCrearHoras();
 *   
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   
 *   return <Lista items={horas} />;
 * }
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { horasService, type CreateHorasInput, type RegistroHorasDB } from '@/lib/firebase/services/horas';
import { EstadoAprobacion } from '@/types';

// ============================================
// QUERY KEYS
// ============================================

export const horasKeys = {
  all: ['horas'] as const,
  lists: () => [...horasKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...horasKeys.lists(), filters] as const,
  byUsuario: (usuarioId: string) => [...horasKeys.lists(), { usuarioId }] as const,
  byEstado: (estado: EstadoAprobacion) => [...horasKeys.lists(), { estado }] as const,
  byMes: (año: number, mes: number, usuarioId?: string) => 
    [...horasKeys.lists(), { año, mes, usuarioId }] as const,
  pendientes: () => [...horasKeys.lists(), { estado: 'pendiente' }] as const,
  detail: (id: string) => [...horasKeys.all, 'detail', id] as const,
};

// ============================================
// QUERIES (LECTURA)
// ============================================

/**
 * Obtener todas las horas (para admin/supervisores)
 */
export function useHoras() {
  return useQuery({
    queryKey: horasKeys.lists(),
    queryFn: () => horasService.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Obtener horas de un usuario específico
 */
export function useHorasUsuario(usuarioId: string | undefined) {
  return useQuery({
    queryKey: horasKeys.byUsuario(usuarioId || ''),
    queryFn: () => horasService.getByUsuario(usuarioId!),
    enabled: !!usuarioId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener horas de un mes específico
 */
export function useHorasMes(año: number, mes: number, usuarioId?: string) {
  return useQuery({
    queryKey: horasKeys.byMes(año, mes, usuarioId),
    queryFn: () => horasService.getByMes(año, mes, usuarioId),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener horas pendientes de aprobar
 */
export function useHorasPendientes() {
  return useQuery({
    queryKey: horasKeys.pendientes(),
    queryFn: () => horasService.getPendientes(),
    staleTime: 1000 * 60 * 2, // 2 minutos (más frecuente para aprobaciones)
  });
}

/**
 * Obtener un registro específico
 */
export function useHora(id: string | undefined) {
  return useQuery({
    queryKey: horasKeys.detail(id || ''),
    queryFn: () => horasService.getById(id!),
    enabled: !!id,
  });
}

// ============================================
// MUTATIONS (ESCRITURA)
// ============================================

/**
 * Crear nuevo registro de horas
 */
export function useCrearHoras() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateHorasInput) => horasService.createRegistro(input),
    onSuccess: () => {
      // Invalidar todas las queries de horas
      queryClient.invalidateQueries({ queryKey: horasKeys.all });
    },
  });
}

/**
 * Actualizar registro de horas
 */
export function useActualizarHoras() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RegistroHorasDB> }) => 
      horasService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: horasKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: horasKeys.lists() });
    },
  });
}

/**
 * Eliminar registro de horas
 */
export function useEliminarHoras() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => horasService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: horasKeys.all });
    },
  });
}

/**
 * Enviar a aprobación
 */
export function useEnviarAAprobacion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => horasService.enviarAAprobacion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: horasKeys.all });
    },
  });
}

/**
 * Aprobar registro (supervisores)
 */
export function useAprobarHoras() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, aprobadoPor }: { id: string; aprobadoPor: string }) => 
      horasService.aprobar(id, aprobadoPor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: horasKeys.all });
    },
  });
}

/**
 * Rechazar registro
 */
export function useRechazarHoras() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, motivo, rechazadoPor }: { id: string; motivo: string; rechazadoPor: string }) => 
      horasService.rechazar(id, motivo, rechazadoPor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: horasKeys.all });
    },
  });
}

/**
 * Devolver para corrección
 */
export function useDevolverHoras() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, observaciones }: { id: string; observaciones: string }) => 
      horasService.devolver(id, observaciones),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: horasKeys.all });
    },
  });
}
