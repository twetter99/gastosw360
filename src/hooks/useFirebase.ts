'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  usuariosService, 
  horasService, 
  gastosService, 
  proyectosService,
  tarifasService,
  festivosService,
  desplazamientosService,
} from '@/lib/firebase/services.legacy';
import { DocumentData } from 'firebase/firestore';
import { toast } from 'sonner';

// ============================================
// HOOK GENÉRICO PARA CRUD
// ============================================

interface UseCrudOptions {
  loadOnMount?: boolean;
}

export function useCrud<T extends { id: string }>(
  service: {
    getAll: () => Promise<T[]>;
    create: (data: DocumentData) => Promise<string>;
    update: (id: string, data: Partial<DocumentData>) => Promise<void>;
    delete: (id: string) => Promise<void>;
  },
  options: UseCrudOptions = { loadOnMount: true }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await service.getAll();
      setData(result);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    if (options.loadOnMount) {
      loadData();
    }
  }, [loadData, options.loadOnMount]);

  const createItem = async (itemData: DocumentData) => {
    try {
      setLoading(true);
      const id = await service.create(itemData);
      toast.success('Registro creado correctamente');
      await loadData();
      return id;
    } catch (err) {
      console.error('Error creating item:', err);
      toast.error('Error al crear el registro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, itemData: Partial<DocumentData>) => {
    try {
      setLoading(true);
      await service.update(id, itemData);
      toast.success('Registro actualizado correctamente');
      await loadData();
    } catch (err) {
      console.error('Error updating item:', err);
      toast.error('Error al actualizar el registro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      setLoading(true);
      await service.delete(id);
      toast.success('Registro eliminado correctamente');
      await loadData();
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error('Error al eliminar el registro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refresh: loadData,
    create: createItem,
    update: updateItem,
    delete: deleteItem,
  };
}

// ============================================
// HOOKS ESPECÍFICOS
// ============================================

export function useUsuarios() {
  return useCrud(usuariosService);
}

export function useProyectos() {
  return useCrud(proyectosService);
}

export function useTarifas() {
  return useCrud(tarifasService);
}

export function useFestivos() {
  return useCrud(festivosService);
}

// ============================================
// HOOK PARA HORAS CON APROBACIONES
// ============================================

export function useHoras(usuarioId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = usuarioId 
        ? await horasService.getByUsuario(usuarioId)
        : await horasService.getAll();
      setData(result);
    } catch (err) {
      console.error('Error loading horas:', err);
      setError('Error al cargar las horas');
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const crear = async (horasData: DocumentData) => {
    try {
      const id = await horasService.create(horasData);
      toast.success('Horas registradas correctamente');
      await loadData();
      return id;
    } catch (err) {
      toast.error('Error al registrar las horas');
      throw err;
    }
  };

  const actualizar = async (id: string, horasData: Partial<DocumentData>) => {
    try {
      await horasService.update(id, horasData);
      toast.success('Horas actualizadas correctamente');
      await loadData();
    } catch (err) {
      toast.error('Error al actualizar las horas');
      throw err;
    }
  };

  const eliminar = async (id: string) => {
    try {
      await horasService.delete(id);
      toast.success('Registro eliminado correctamente');
      await loadData();
    } catch (err) {
      toast.error('Error al eliminar el registro');
      throw err;
    }
  };

  const aprobar = async (id: string, aprobadorId: string) => {
    try {
      await horasService.aprobar(id, aprobadorId);
      toast.success('Horas aprobadas correctamente');
      await loadData();
    } catch (err) {
      toast.error('Error al aprobar las horas');
      throw err;
    }
  };

  const rechazar = async (id: string, aprobadorId: string, motivo: string) => {
    try {
      await horasService.rechazar(id, aprobadorId, motivo);
      toast.success('Horas rechazadas');
      await loadData();
    } catch (err) {
      toast.error('Error al rechazar las horas');
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    refresh: loadData,
    crear,
    actualizar,
    eliminar,
    aprobar,
    rechazar,
  };
}

// ============================================
// HOOK PARA GASTOS CON APROBACIONES
// ============================================

export function useGastos(usuarioId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = usuarioId 
        ? await gastosService.getByUsuario(usuarioId)
        : await gastosService.getAll();
      setData(result);
    } catch (err) {
      console.error('Error loading gastos:', err);
      setError('Error al cargar los gastos');
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const crear = async (gastoData: DocumentData) => {
    try {
      const id = await gastosService.create(gastoData);
      toast.success('Gasto registrado correctamente');
      await loadData();
      return id;
    } catch (err) {
      toast.error('Error al registrar el gasto');
      throw err;
    }
  };

  const actualizar = async (id: string, gastoData: Partial<DocumentData>) => {
    try {
      await gastosService.update(id, gastoData);
      toast.success('Gasto actualizado correctamente');
      await loadData();
    } catch (err) {
      toast.error('Error al actualizar el gasto');
      throw err;
    }
  };

  const eliminar = async (id: string) => {
    try {
      await gastosService.delete(id);
      toast.success('Gasto eliminado correctamente');
      await loadData();
    } catch (err) {
      toast.error('Error al eliminar el gasto');
      throw err;
    }
  };

  const aprobar = async (id: string, aprobadorId: string) => {
    try {
      await gastosService.aprobar(id, aprobadorId);
      toast.success('Gasto aprobado correctamente');
      await loadData();
    } catch (err) {
      toast.error('Error al aprobar el gasto');
      throw err;
    }
  };

  const rechazar = async (id: string, aprobadorId: string, motivo: string) => {
    try {
      await gastosService.rechazar(id, aprobadorId, motivo);
      toast.success('Gasto rechazado');
      await loadData();
    } catch (err) {
      toast.error('Error al rechazar el gasto');
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    refresh: loadData,
    crear,
    actualizar,
    eliminar,
    aprobar,
    rechazar,
  };
}

// ============================================
// HOOK PARA HORAS PENDIENTES DE APROBACIÓN
// ============================================

export function useHorasPendientes() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await horasService.getPendientes();
      setData(result);
    } catch (err) {
      console.error('Error loading pending hours:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const aprobar = async (id: string, aprobadorId: string) => {
    await horasService.aprobar(id, aprobadorId);
    toast.success('Horas aprobadas');
    await loadData();
  };

  const rechazar = async (id: string, aprobadorId: string, motivo: string) => {
    await horasService.rechazar(id, aprobadorId, motivo);
    toast.success('Horas rechazadas');
    await loadData();
  };

  return { data, loading, refresh: loadData, aprobar, rechazar };
}

// ============================================
// HOOK PARA GASTOS PENDIENTES DE APROBACIÓN
// ============================================

export function useGastosPendientes() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await gastosService.getPendientes();
      setData(result);
    } catch (err) {
      console.error('Error loading pending expenses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const aprobar = async (id: string, aprobadorId: string) => {
    await gastosService.aprobar(id, aprobadorId);
    toast.success('Gasto aprobado');
    await loadData();
  };

  const rechazar = async (id: string, aprobadorId: string, motivo: string) => {
    await gastosService.rechazar(id, aprobadorId, motivo);
    toast.success('Gasto rechazado');
    await loadData();
  };

  return { data, loading, refresh: loadData, aprobar, rechazar };
}
