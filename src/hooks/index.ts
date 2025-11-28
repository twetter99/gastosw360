'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/auth';
import { RegistroHoras, RegistroGasto, Proyecto, EstadoAprobacion } from '@/types';
import { PERMISOS_POR_ROL, Permisos } from '@/types/permisos';

/**
 * Hook para obtener los permisos del usuario actual
 */
export function usePermisos(): Permisos | null {
  const { userData } = useAuth();
  
  if (!userData?.rol) return null;
  
  return PERMISOS_POR_ROL[userData.rol];
}

/**
 * Hook para saber si el usuario puede ver una sección
 */
export function usePuedeVer(seccion: keyof Permisos['puedeVer']): boolean {
  const permisos = usePermisos();
  return permisos?.puedeVer[seccion] ?? false;
}

/**
 * Hook para obtener registros de horas
 */
export function useRegistrosHoras(filtros?: {
  usuarioId?: string;
  año?: number;
  mes?: number;
  estado?: EstadoAprobacion;
}) {
  const { user, userData } = useAuth();
  const [registros, setRegistros] = useState<RegistroHoras[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    let q = query(collection(db, 'registrosHoras'), orderBy('fecha', 'desc'));
    
    // Aplicar filtros según rol
    if (userData?.rol === 'tecnico') {
      q = query(q, where('usuarioId', '==', user.uid));
    } else if (filtros?.usuarioId) {
      q = query(q, where('usuarioId', '==', filtros.usuarioId));
    }
    
    if (filtros?.estado) {
      q = query(q, where('estadoHorasExtras', '==', filtros.estado));
    }
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as RegistroHoras[];
        
        // Filtrar por año/mes en cliente (Firestore no soporta múltiples filtros de rango)
        let filteredData = data;
        if (filtros?.año) {
          filteredData = filteredData.filter(r => r.año === filtros.año);
        }
        if (filtros?.mes) {
          filteredData = filteredData.filter(r => r.mes === filtros.mes);
        }
        
        setRegistros(filteredData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching registros:', err);
        setError(err as Error);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [user, userData?.rol, filtros?.usuarioId, filtros?.año, filtros?.mes, filtros?.estado]);
  
  return { registros, loading, error };
}

/**
 * Hook para obtener gastos
 */
export function useGastos(filtros?: {
  usuarioId?: string;
  año?: number;
  mes?: number;
  estado?: EstadoAprobacion;
  categoria?: string;
}) {
  const { user, userData } = useAuth();
  const [gastos, setGastos] = useState<RegistroGasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    let q = query(collection(db, 'gastos'), orderBy('fecha', 'desc'));
    
    if (userData?.rol === 'tecnico') {
      q = query(q, where('usuarioId', '==', user.uid));
    } else if (filtros?.usuarioId) {
      q = query(q, where('usuarioId', '==', filtros.usuarioId));
    }
    
    if (filtros?.estado) {
      q = query(q, where('estadoGasto', '==', filtros.estado));
    }
    
    if (filtros?.categoria) {
      q = query(q, where('categoria', '==', filtros.categoria));
    }
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as RegistroGasto[];
        
        let filteredData = data;
        if (filtros?.año) {
          filteredData = filteredData.filter(g => g.año === filtros.año);
        }
        if (filtros?.mes) {
          filteredData = filteredData.filter(g => g.mes === filtros.mes);
        }
        
        setGastos(filteredData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching gastos:', err);
        setError(err as Error);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [user, userData?.rol, filtros?.usuarioId, filtros?.año, filtros?.mes, filtros?.estado, filtros?.categoria]);
  
  return { gastos, loading, error };
}

/**
 * Hook para obtener proyectos activos
 */
export function useProyectos() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const q = query(
      collection(db, 'proyectos'),
      where('activo', '==', true),
      orderBy('nombre', 'asc')
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Proyecto[];
        setProyectos(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching proyectos:', err);
        setError(err as Error);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, []);
  
  return { proyectos, loading, error };
}

/**
 * Hook para obtener registros pendientes de aprobación
 */
export function useRegistrosPendientesAprobacion(tipo: 'horas' | 'gastos') {
  const { user, userData } = useAuth();
  const [pendientes, setPendientes] = useState<(RegistroHoras | RegistroGasto)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!user || !userData) {
      setLoading(false);
      return;
    }
    
    const collectionName = tipo === 'horas' ? 'registrosHoras' : 'gastos';
    const estadoField = tipo === 'horas' ? 'estadoHorasExtras' : 'estadoGasto';
    const aprobadorField = tipo === 'horas' ? 'aprobadorHorasId' : 'aprobadorGastoId';
    
    // Los registros pendientes son aquellos donde el usuario actual es el aprobador
    const q = query(
      collection(db, collectionName),
      where(estadoField, '==', 'pendiente'),
      where(aprobadorField, '==', user.uid),
      orderBy('enviadoAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as (RegistroHoras | RegistroGasto)[];
        setPendientes(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching pendientes:', err);
        setError(err as Error);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [user, userData, tipo]);
  
  return { pendientes, loading, error };
}

/**
 * Hook para contar pendientes (para badges en navegación)
 */
export function useContadorPendientes() {
  const { user, userData } = useAuth();
  const [horasPendientes, setHorasPendientes] = useState(0);
  const [gastosPendientes, setGastosPendientes] = useState(0);
  
  useEffect(() => {
    if (!user || !userData) return;
    
    const permisos = PERMISOS_POR_ROL[userData.rol];
    
    // Solo contar si puede aprobar
    if (permisos.puedeAprobar.horasExtras) {
      const qHoras = query(
        collection(db, 'registrosHoras'),
        where('estadoHorasExtras', '==', 'pendiente'),
        where('aprobadorHorasId', '==', user.uid)
      );
      
      const unsubHoras = onSnapshot(qHoras, (snapshot) => {
        setHorasPendientes(snapshot.size);
      });
      
      return () => unsubHoras();
    }
  }, [user, userData]);
  
  useEffect(() => {
    if (!user || !userData) return;
    
    const permisos = PERMISOS_POR_ROL[userData.rol];
    
    if (permisos.puedeAprobar.gastos) {
      const qGastos = query(
        collection(db, 'gastos'),
        where('estadoGasto', '==', 'pendiente'),
        where('aprobadorGastoId', '==', user.uid)
      );
      
      const unsubGastos = onSnapshot(qGastos, (snapshot) => {
        setGastosPendientes(snapshot.size);
      });
      
      return () => unsubGastos();
    }
  }, [user, userData]);
  
  return { 
    horasPendientes, 
    gastosPendientes, 
    totalPendientes: horasPendientes + gastosPendientes 
  };
}

/**
 * Hook para debounce
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Hook para manejar estado de loading
 */
export function useLoading(initialState = false) {
  const [loading, setLoading] = useState(initialState);
  
  const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      return await fn();
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { loading, setLoading, withLoading };
}

/**
 * Hook para manejar la fecha actual del mes navegable
 */
export function useMesNavegable(fechaInicial?: Date) {
  const [mesActual, setMesActual] = useState(fechaInicial || new Date());
  
  const irAlMesAnterior = useCallback(() => {
    setMesActual(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }, []);
  
  const irAlMesSiguiente = useCallback(() => {
    setMesActual(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }, []);
  
  const irAHoy = useCallback(() => {
    setMesActual(new Date());
  }, []);
  
  return {
    mesActual,
    año: mesActual.getFullYear(),
    mes: mesActual.getMonth() + 1,
    irAlMesAnterior,
    irAlMesSiguiente,
    irAHoy,
  };
}
