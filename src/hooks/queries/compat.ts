/**
 * Hooks de Compatibilidad
 * 
 * Estos hooks exponen la misma API que los hooks legacy de useFirebase
 * pero usan React Query internamente.
 * 
 * API: { data, loading, refresh, create, update, delete }
 * 
 * NOTA: Estos hooks usan 'any' para mantener compatibilidad con las páginas
 * existentes que tienen estructuras de datos diferentes a los nuevos servicios.
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Servicios directos para operaciones flexibles
import { usuariosService } from '@/lib/firebase/services/usuarios';
import { proyectosService } from '@/lib/firebase/services/proyectos';
import { tarifasService } from '@/lib/firebase/services/tarifas';
import { festivosService } from '@/lib/firebase/services/festivos';

// Query Keys
import { usuariosKeys } from './useUsuarios';
import { proyectosKeys } from './useProyectos';
import { tarifasKeys } from './useTarifas';
import { festivosKeys } from './useFestivos';

// ============================================
// USUARIOS COMPAT HOOK
// ============================================

export function useUsuariosCompat() {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: usuariosKeys.lists(),
    queryFn: () => usuariosService.getAll(),
    staleTime: 1000 * 60 * 10,
  });

  const crearMutation = useMutation({
    mutationFn: (input: any) => usuariosService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usuariosKeys.all }),
  });

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usuariosService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usuariosKeys.all }),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => usuariosService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usuariosKeys.all }),
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
  }, [queryClient]);

  const create = useCallback(async (input: any) => {
    try {
      const result = await crearMutation.mutateAsync(input);
      toast.success('Trabajador creado correctamente');
      return result;
    } catch (error) {
      toast.error('Error al crear trabajador');
      throw error;
    }
  }, [crearMutation]);

  const update = useCallback(async (id: string, data: any) => {
    try {
      await actualizarMutation.mutateAsync({ id, data });
      toast.success('Trabajador actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar trabajador');
      throw error;
    }
  }, [actualizarMutation]);

  const deleteUsuario = useCallback(async (id: string) => {
    try {
      await eliminarMutation.mutateAsync(id);
      toast.success('Trabajador eliminado correctamente');
    } catch (error) {
      toast.error('Error al eliminar trabajador');
      throw error;
    }
  }, [eliminarMutation]);

  return {
    data: data || [],
    loading: isLoading,
    error,
    refresh,
    create,
    update,
    delete: deleteUsuario,
  };
}

// ============================================
// PROYECTOS COMPAT HOOK
// ============================================

export function useProyectosCompat() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: proyectosKeys.lists(),
    queryFn: () => proyectosService.getAllOrdenados(),
    staleTime: 1000 * 60 * 10,
  });

  const crearMutation = useMutation({
    mutationFn: (input: any) => proyectosService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: proyectosKeys.all }),
  });

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => proyectosService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: proyectosKeys.all }),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => proyectosService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: proyectosKeys.all }),
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: proyectosKeys.all });
  }, [queryClient]);

  const create = useCallback(async (input: any) => {
    try {
      const result = await crearMutation.mutateAsync(input);
      toast.success('Proyecto creado correctamente');
      return result;
    } catch (error) {
      toast.error('Error al crear proyecto');
      throw error;
    }
  }, [crearMutation]);

  const update = useCallback(async (id: string, data: any) => {
    try {
      await actualizarMutation.mutateAsync({ id, data });
      toast.success('Proyecto actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar proyecto');
      throw error;
    }
  }, [actualizarMutation]);

  const deleteProyecto = useCallback(async (id: string) => {
    try {
      await eliminarMutation.mutateAsync(id);
      toast.success('Proyecto eliminado correctamente');
    } catch (error) {
      toast.error('Error al eliminar proyecto');
      throw error;
    }
  }, [eliminarMutation]);

  return {
    data: data || [],
    loading: isLoading,
    error,
    refresh,
    create,
    update,
    delete: deleteProyecto,
  };
}

// ============================================
// TARIFAS COMPAT HOOK
// ============================================

export function useTarifasCompat() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: tarifasKeys.lists(),
    queryFn: () => tarifasService.getAllOrdenadas(),
    staleTime: 1000 * 60 * 10,
  });

  const crearMutation = useMutation({
    mutationFn: (input: any) => tarifasService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tarifasKeys.all }),
  });

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tarifasService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tarifasKeys.all }),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => tarifasService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tarifasKeys.all }),
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: tarifasKeys.all });
  }, [queryClient]);

  const create = useCallback(async (input: any) => {
    try {
      const result = await crearMutation.mutateAsync(input);
      toast.success('Tarifa creada correctamente');
      return result;
    } catch (error) {
      toast.error('Error al crear tarifa');
      throw error;
    }
  }, [crearMutation]);

  const update = useCallback(async (id: string, data: any) => {
    try {
      await actualizarMutation.mutateAsync({ id, data });
      toast.success('Tarifa actualizada correctamente');
    } catch (error) {
      toast.error('Error al actualizar tarifa');
      throw error;
    }
  }, [actualizarMutation]);

  const deleteTarifa = useCallback(async (id: string) => {
    try {
      await eliminarMutation.mutateAsync(id);
      toast.success('Tarifa eliminada correctamente');
    } catch (error) {
      toast.error('Error al eliminar tarifa');
      throw error;
    }
  }, [eliminarMutation]);

  return {
    data: data || [],
    loading: isLoading,
    error,
    refresh,
    create,
    update,
    delete: deleteTarifa,
  };
}

// ============================================
// FESTIVOS COMPAT HOOK
// ============================================

export function useFestivosCompat() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: festivosKeys.lists(),
    queryFn: () => festivosService.getAllOrdenados(),
    staleTime: 1000 * 60 * 10,
  });

  const crearMutation = useMutation({
    mutationFn: (input: any) => festivosService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: festivosKeys.all }),
  });

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => festivosService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: festivosKeys.all }),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => festivosService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: festivosKeys.all }),
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: festivosKeys.all });
  }, [queryClient]);

  const create = useCallback(async (input: any) => {
    try {
      const result = await crearMutation.mutateAsync(input);
      toast.success('Festivo creado correctamente');
      return result;
    } catch (error) {
      toast.error('Error al crear festivo');
      throw error;
    }
  }, [crearMutation]);

  const update = useCallback(async (id: string, data: any) => {
    try {
      await actualizarMutation.mutateAsync({ id, data });
      toast.success('Festivo actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar festivo');
      throw error;
    }
  }, [actualizarMutation]);

  const deleteFestivo = useCallback(async (id: string) => {
    try {
      await eliminarMutation.mutateAsync(id);
      toast.success('Festivo eliminado correctamente');
    } catch (error) {
      toast.error('Error al eliminar festivo');
      throw error;
    }
  }, [eliminarMutation]);

  return {
    data: data || [],
    loading: isLoading,
    error,
    refresh,
    create,
    update,
    delete: deleteFestivo,
  };
}

// ============================================
// RE-EXPORT CON NOMBRES LEGACY
// ============================================

export { 
  useUsuariosCompat as useUsuarios,
  useProyectosCompat as useProyectos,
  useTarifasCompat as useTarifas,
  useFestivosCompat as useFestivos,
};
