/**
 * React Query Hooks para Proyectos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proyectosService, type CreateProyectoInput, type ProyectoDB } from '@/lib/firebase/services/proyectos';

// ============================================
// QUERY KEYS
// ============================================

export const proyectosKeys = {
  all: ['proyectos'] as const,
  lists: () => [...proyectosKeys.all, 'list'] as const,
  activos: () => [...proyectosKeys.lists(), { activo: true }] as const,
  detail: (id: string) => [...proyectosKeys.all, 'detail', id] as const,
  byCodigo: (codigo: string) => [...proyectosKeys.all, 'codigo', codigo] as const,
};

// ============================================
// QUERIES
// ============================================

/**
 * Obtener todos los proyectos
 */
export function useProyectos() {
  return useQuery({
    queryKey: proyectosKeys.lists(),
    queryFn: () => proyectosService.getAllOrdenados(),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Obtener proyectos activos
 */
export function useProyectosActivos() {
  return useQuery({
    queryKey: proyectosKeys.activos(),
    queryFn: () => proyectosService.getActivos(),
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Obtener un proyecto por ID
 */
export function useProyecto(id: string | undefined) {
  return useQuery({
    queryKey: proyectosKeys.detail(id || ''),
    queryFn: () => proyectosService.getById(id!),
    enabled: !!id,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Crear proyecto
 */
export function useCrearProyecto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateProyectoInput) => proyectosService.createProyecto(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
    },
  });
}

/**
 * Actualizar proyecto
 */
export function useActualizarProyecto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProyectoDB> }) => 
      proyectosService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.lists() });
    },
  });
}

/**
 * Eliminar proyecto
 */
export function useEliminarProyecto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => proyectosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
    },
  });
}

/**
 * Desactivar proyecto (soft delete)
 */
export function useDesactivarProyecto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => proyectosService.desactivar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
    },
  });
}
