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

/**
 * Obtiene registros de horas con filtros
 */
export async function getRegistrosHoras(filtros: FiltrosRegistros) {
  let q = query(collection(db, COLLECTIONS.REGISTROS_HORAS));
  
  // Aplicar filtros
  if (filtros.usuarioId) {
    q = query(q, where('usuarioId', '==', filtros.usuarioId));
  }
  
  if (filtros.usuarioIds && filtros.usuarioIds.length > 0) {
    q = query(q, where('usuarioId', 'in', filtros.usuarioIds));
  }
  
  if (filtros.año) {
    q = query(q, where('año', '==', filtros.año));
  }
  
  if (filtros.mes) {
    q = query(q, where('mes', '==', filtros.mes));
  }
  
  if (filtros.estado) {
    q = query(q, where('estadoHorasExtras', '==', filtros.estado));
  }
  
  if (filtros.proyectoId) {
    q = query(q, where('proyectoId', '==', filtros.proyectoId));
  }
  
  q = query(q, orderBy('fecha', 'desc'), limit(100));
  
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
 */
export async function crearRegistroHoras(
  data: Omit<RegistroHoras, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.REGISTROS_HORAS), {
    ...data,
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
