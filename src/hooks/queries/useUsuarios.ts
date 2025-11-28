/**
 * React Query Hooks para Usuarios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usuariosService, type CreateUsuarioInput, type UsuarioDB } from '@/lib/firebase/services/usuarios';
import { RolUsuario } from '@/types';

// ============================================
// QUERY KEYS
// ============================================

export const usuariosKeys = {
  all: ['usuarios'] as const,
  lists: () => [...usuariosKeys.all, 'list'] as const,
  activos: () => [...usuariosKeys.lists(), { activo: true }] as const,
  byRol: (rol: RolUsuario) => [...usuariosKeys.lists(), { rol }] as const,
  tecnicos: () => [...usuariosKeys.byRol('tecnico')] as const,
  byEquipo: (equipoId: string) => [...usuariosKeys.lists(), { equipoId }] as const,
  detail: (id: string) => [...usuariosKeys.all, 'detail', id] as const,
  byEmail: (email: string) => [...usuariosKeys.all, 'email', email] as const,
};

// ============================================
// QUERIES
// ============================================

/**
 * Obtener todos los usuarios
 */
export function useUsuarios() {
  return useQuery({
    queryKey: usuariosKeys.lists(),
    queryFn: () => usuariosService.getAll(),
    staleTime: 1000 * 60 * 10, // 10 minutos (cambia poco)
  });
}

/**
 * Obtener usuarios activos
 */
export function useUsuariosActivos() {
  return useQuery({
    queryKey: usuariosKeys.activos(),
    queryFn: () => usuariosService.getActivos(),
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Obtener usuarios por rol
 */
export function useUsuariosByRol(rol: RolUsuario) {
  return useQuery({
    queryKey: usuariosKeys.byRol(rol),
    queryFn: () => usuariosService.getByRol(rol),
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Obtener técnicos
 */
export function useTecnicos() {
  return useQuery({
    queryKey: usuariosKeys.tecnicos(),
    queryFn: () => usuariosService.getTecnicos(),
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Obtener usuarios de un equipo
 */
export function useUsuariosEquipo(equipoId: string | undefined) {
  return useQuery({
    queryKey: usuariosKeys.byEquipo(equipoId || ''),
    queryFn: () => usuariosService.getByEquipo(equipoId!),
    enabled: !!equipoId,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Obtener un usuario por ID
 */
export function useUsuario(id: string | undefined) {
  return useQuery({
    queryKey: usuariosKeys.detail(id || ''),
    queryFn: () => usuariosService.getById(id!),
    enabled: !!id,
  });
}

/**
 * Obtener un usuario por email
 */
export function useUsuarioByEmail(email: string | undefined) {
  return useQuery({
    queryKey: usuariosKeys.byEmail(email || ''),
    queryFn: () => usuariosService.getByEmail(email!),
    enabled: !!email,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Crear nuevo usuario
 */
export function useCrearUsuario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateUsuarioInput) => usuariosService.createUsuario(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
    },
  });
}

/**
 * Actualizar usuario
 */
export function useActualizarUsuario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UsuarioDB> }) => 
      usuariosService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: usuariosKeys.lists() });
    },
  });
}

/**
 * Eliminar usuario (hard delete)
 */
export function useEliminarUsuario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => usuariosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
    },
  });
}

/**
 * Desactivar usuario (soft delete)
 */
export function useDesactivarUsuario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => usuariosService.desactivar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
    },
  });
}

/**
 * Reactivar usuario
 */
export function useReactivarUsuario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => usuariosService.reactivar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
    },
  });
}
