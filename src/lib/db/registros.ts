import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase/config';
import { 
  RegistroHoras, 
  EstadoAprobacion, 
  HistorialAprobacion,
  FiltrosRegistros 
} from '@/types';

// ============================================================
// CONSTANTES DE PAGINACIÓN
// ============================================================
export const PAGE_SIZE = 25;  // Tamaño de página por defecto

// ============================================================
// TIPOS PARA PAGINACIÓN
// ============================================================
export interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export interface FiltrosRegistrosPaginados extends FiltrosRegistros {
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData>;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Genera el campo 'periodo' a partir de año y mes
 * Formato: YYYY-MM (ej: "2025-01")
 */
export function generarPeriodo(año: number, mes: number): string {
  return `${año}-${String(mes).padStart(2, '0')}`;
}

/**
 * Extrae año y mes de un periodo
 */
export function parsearPeriodo(periodo: string): { año: number; mes: number } {
  const [año, mes] = periodo.split('-').map(Number);
  return { año, mes };
}

/**
 * Obtiene registros de horas con filtros y paginación por cursor
 */
export async function getRegistrosHoras(
  filtros: FiltrosRegistrosPaginados
): Promise<PaginatedResult<RegistroHoras>> {
  const pageSize = filtros.pageSize || PAGE_SIZE;
  let q = query(collection(db, COLLECTIONS.REGISTROS_HORAS));
  
  // Aplicar filtros
  if (filtros.usuarioId) {
    q = query(q, where('usuarioId', '==', filtros.usuarioId));
  }
  
  if (filtros.usuarioIds && filtros.usuarioIds.length > 0) {
    q = query(q, where('usuarioId', 'in', filtros.usuarioIds));
  }
  
  // OPTIMIZACIÓN: Usar 'periodo' en lugar de año+mes para evitar índices compuestos
  if (filtros.año && filtros.mes) {
    const periodo = generarPeriodo(filtros.año, filtros.mes);
    q = query(q, where('periodo', '==', periodo));
  } else if (filtros.año) {
    // Si solo se filtra por año, aún necesitamos el campo año
    q = query(q, where('año', '==', filtros.año));
  }
  
  if (filtros.estado) {
    q = query(q, where('estadoHorasExtras', '==', filtros.estado));
  }
  
  if (filtros.proyectoId) {
    q = query(q, where('proyectoId', '==', filtros.proyectoId));
  }
  
  // Ordenar y paginar
  q = query(q, orderBy('fecha', 'desc'), limit(pageSize + 1));
  
  // Aplicar cursor si existe (para paginación)
  if (filtros.cursor) {
    q = query(q, startAfter(filtros.cursor));
  }
  
  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  
  // Determinar si hay más resultados
  const hasMore = docs.length > pageSize;
  const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;
  
  return {
    data: resultDocs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RegistroHoras[],
    lastDoc: resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null,
    hasMore,
  };
}

/**
 * Obtiene TODOS los registros sin paginación (uso limitado, para exports)
 * ⚠️ USAR CON CUIDADO - puede ser lento con muchos registros
 */
export async function getRegistrosHorasSinPaginar(
  filtros: FiltrosRegistros,
  maxResults = 500
): Promise<RegistroHoras[]> {
  let q = query(collection(db, COLLECTIONS.REGISTROS_HORAS));
  
  if (filtros.usuarioId) {
    q = query(q, where('usuarioId', '==', filtros.usuarioId));
  }
  
  if (filtros.año && filtros.mes) {
    const periodo = generarPeriodo(filtros.año, filtros.mes);
    q = query(q, where('periodo', '==', periodo));
  } else if (filtros.año) {
    q = query(q, where('año', '==', filtros.año));
  }
  
  if (filtros.estado) {
    q = query(q, where('estadoHorasExtras', '==', filtros.estado));
  }
  
  q = query(q, orderBy('fecha', 'desc'), limit(maxResults));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as RegistroHoras[];
}

/**
 * Obtiene un registro de horas por ID
 */
export async function getRegistroHoras(id: string): Promise<RegistroHoras | null> {
  const docRef = doc(db, COLLECTIONS.REGISTROS_HORAS, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    id: docSnap.id,
    ...docSnap.data()
  } as RegistroHoras;
}

/**
 * Crea un nuevo registro de horas
 * Incluye automáticamente el campo 'periodo' para optimizar queries
 */
export async function crearRegistroHoras(
  data: Omit<RegistroHoras, 'id' | 'createdAt' | 'updatedAt' | 'periodo'>,
  userId: string
): Promise<string> {
  // Calcular periodo automáticamente
  const periodo = generarPeriodo(data.año, data.mes);
  
  const docRef = await addDoc(collection(db, COLLECTIONS.REGISTROS_HORAS), {
    ...data,
    periodo, // Campo desnormalizado para queries eficientes
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
    historialAprobacionHoras: [],
  });
  
  return docRef.id;
}

/**
 * Actualiza un registro de horas
 */
export async function actualizarRegistroHoras(
  id: string,
  data: Partial<RegistroHoras>
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.REGISTROS_HORAS, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Elimina un registro de horas
 */
export async function eliminarRegistroHoras(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.REGISTROS_HORAS, id);
  await deleteDoc(docRef);
}

/**
 * Envía un registro de horas para aprobación
 */
export async function enviarRegistroParaAprobacion(
  id: string,
  usuarioId: string,
  usuarioNombre: string
): Promise<void> {
  const registro = await getRegistroHoras(id);
  if (!registro) throw new Error('Registro no encontrado');
  
  if (registro.estadoHorasExtras !== 'borrador') {
    throw new Error('Solo se pueden enviar registros en borrador');
  }
  
  const historialEntry: HistorialAprobacion = {
    id: crypto.randomUUID(),
    fecha: Timestamp.now(),
    usuarioId,
    usuarioNombre,
    accion: 'enviado',
    estadoAnterior: 'borrador',
    estadoNuevo: 'pendiente',
  };
  
  await actualizarRegistroHoras(id, {
    estadoHorasExtras: 'pendiente',
    enviadoAt: Timestamp.now(),
    historialAprobacionHoras: [...registro.historialAprobacionHoras, historialEntry],
  });
}

/**
 * Aprueba un registro de horas
 */
export async function aprobarRegistroHoras(
  id: string,
  aprobadorId: string,
  aprobadorNombre: string,
  comentario?: string
): Promise<void> {
  const registro = await getRegistroHoras(id);
  if (!registro) throw new Error('Registro no encontrado');
  
  if (registro.estadoHorasExtras !== 'pendiente') {
    throw new Error('Solo se pueden aprobar registros pendientes');
  }
  
  const historialEntry: HistorialAprobacion = {
    id: crypto.randomUUID(),
    fecha: Timestamp.now(),
    usuarioId: aprobadorId,
    usuarioNombre: aprobadorNombre,
    accion: 'aprobado',
    estadoAnterior: 'pendiente',
    estadoNuevo: 'aprobado',
    comentario,
  };
  
  await actualizarRegistroHoras(id, {
    estadoHorasExtras: 'aprobado',
    historialAprobacionHoras: [...registro.historialAprobacionHoras, historialEntry],
  });
}

/**
 * Rechaza un registro de horas
 */
export async function rechazarRegistroHoras(
  id: string,
  aprobadorId: string,
  aprobadorNombre: string,
  comentario: string
): Promise<void> {
  const registro = await getRegistroHoras(id);
  if (!registro) throw new Error('Registro no encontrado');
  
  if (registro.estadoHorasExtras !== 'pendiente') {
    throw new Error('Solo se pueden rechazar registros pendientes');
  }
  
  const historialEntry: HistorialAprobacion = {
    id: crypto.randomUUID(),
    fecha: Timestamp.now(),
    usuarioId: aprobadorId,
    usuarioNombre: aprobadorNombre,
    accion: 'rechazado',
    estadoAnterior: 'pendiente',
    estadoNuevo: 'rechazado',
    comentario,
  };
  
  await actualizarRegistroHoras(id, {
    estadoHorasExtras: 'rechazado',
    observacionesRechazo: comentario,
    historialAprobacionHoras: [...registro.historialAprobacionHoras, historialEntry],
  });
}

/**
 * Devuelve un registro para corrección
 */
export async function devolverRegistroHoras(
  id: string,
  aprobadorId: string,
  aprobadorNombre: string,
  comentario: string
): Promise<void> {
  const registro = await getRegistroHoras(id);
  if (!registro) throw new Error('Registro no encontrado');
  
  if (registro.estadoHorasExtras !== 'pendiente') {
    throw new Error('Solo se pueden devolver registros pendientes');
  }
  
  const historialEntry: HistorialAprobacion = {
    id: crypto.randomUUID(),
    fecha: Timestamp.now(),
    usuarioId: aprobadorId,
    usuarioNombre: aprobadorNombre,
    accion: 'devuelto',
    estadoAnterior: 'pendiente',
    estadoNuevo: 'devuelto',
    comentario,
  };
  
  await actualizarRegistroHoras(id, {
    estadoHorasExtras: 'devuelto',
    observacionesRechazo: comentario,
    historialAprobacionHoras: [...registro.historialAprobacionHoras, historialEntry],
  });
}

/**
 * Obtiene registros pendientes de aprobar para un aprobador
 */
export async function getRegistrosPendientesAprobacion(
  aprobadorId: string
): Promise<RegistroHoras[]> {
  const q = query(
    collection(db, COLLECTIONS.REGISTROS_HORAS),
    where('aprobadorHorasId', '==', aprobadorId),
    where('estadoHorasExtras', '==', 'pendiente'),
    orderBy('enviadoAt', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as RegistroHoras[];
}
