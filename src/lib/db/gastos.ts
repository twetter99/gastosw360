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
  RegistroGasto, 
  EstadoAprobacion, 
  HistorialAprobacion,
  FiltrosRegistros,
  CategoriaGasto 
} from '@/types';

interface FiltrosGastos extends FiltrosRegistros {
  categoria?: CategoriaGasto;
}

/**
 * Obtiene gastos con filtros
 */
export async function getGastos(filtros: FiltrosGastos) {
  let q = query(collection(db, COLLECTIONS.GASTOS));
  
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
    q = query(q, where('estadoGasto', '==', filtros.estado));
  }
  
  if (filtros.categoria) {
    q = query(q, where('categoria', '==', filtros.categoria));
  }
  
  if (filtros.proyectoId) {
    q = query(q, where('proyectoId', '==', filtros.proyectoId));
  }
  
  q = query(q, orderBy('fecha', 'desc'), limit(100));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data()
  })) as RegistroGasto[];
}

/**
 * Obtiene un gasto por ID
 */
export async function getGasto(id: string): Promise<RegistroGasto | null> {
  const docRef = doc(db, COLLECTIONS.GASTOS, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    id: docSnap.id,
    ...docSnap.data()
  } as RegistroGasto;
}

/**
 * Crea un nuevo gasto
 */
export async function crearGasto(
  data: Omit<RegistroGasto, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.GASTOS), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
    historialAprobacionGasto: [],
  });
  
  return docRef.id;
}

/**
 * Actualiza un gasto
 */
export async function actualizarGasto(
  id: string,
  data: Partial<RegistroGasto>
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.GASTOS, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Elimina un gasto
 */
export async function eliminarGasto(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.GASTOS, id);
  await deleteDoc(docRef);
}

/**
 * Envía un gasto para aprobación
 */
export async function enviarGastoParaAprobacion(
  id: string,
  usuarioId: string,
  usuarioNombre: string
): Promise<void> {
  const gasto = await getGasto(id);
  if (!gasto) throw new Error('Gasto no encontrado');
  
  if (gasto.estadoGasto !== 'borrador') {
    throw new Error('Solo se pueden enviar gastos en borrador');
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
  
  await actualizarGasto(id, {
    estadoGasto: 'pendiente',
    enviadoAt: Timestamp.now(),
    historialAprobacionGasto: [...gasto.historialAprobacionGasto, historialEntry],
  });
}

/**
 * Aprueba un gasto
 */
export async function aprobarGasto(
  id: string,
  aprobadorId: string,
  aprobadorNombre: string,
  comentario?: string
): Promise<void> {
  const gasto = await getGasto(id);
  if (!gasto) throw new Error('Gasto no encontrado');
  
  if (gasto.estadoGasto !== 'pendiente') {
    throw new Error('Solo se pueden aprobar gastos pendientes');
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
  
  await actualizarGasto(id, {
    estadoGasto: 'aprobado',
    historialAprobacionGasto: [...gasto.historialAprobacionGasto, historialEntry],
  });
}

/**
 * Rechaza un gasto
 */
export async function rechazarGasto(
  id: string,
  aprobadorId: string,
  aprobadorNombre: string,
  comentario: string
): Promise<void> {
  const gasto = await getGasto(id);
  if (!gasto) throw new Error('Gasto no encontrado');
  
  if (gasto.estadoGasto !== 'pendiente') {
    throw new Error('Solo se pueden rechazar gastos pendientes');
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
  
  await actualizarGasto(id, {
    estadoGasto: 'rechazado',
    observacionesRechazo: comentario,
    historialAprobacionGasto: [...gasto.historialAprobacionGasto, historialEntry],
  });
}

/**
 * Devuelve un gasto para corrección
 */
export async function devolverGasto(
  id: string,
  aprobadorId: string,
  aprobadorNombre: string,
  comentario: string
): Promise<void> {
  const gasto = await getGasto(id);
  if (!gasto) throw new Error('Gasto no encontrado');
  
  if (gasto.estadoGasto !== 'pendiente') {
    throw new Error('Solo se pueden devolver gastos pendientes');
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
  
  await actualizarGasto(id, {
    estadoGasto: 'devuelto',
    observacionesRechazo: comentario,
    historialAprobacionGasto: [...gasto.historialAprobacionGasto, historialEntry],
  });
}

/**
 * Obtiene gastos pendientes de aprobar para un supervisor
 */
export async function getGastosPendientesAprobacion(
  aprobadorId: string
): Promise<RegistroGasto[]> {
  const q = query(
    collection(db, COLLECTIONS.GASTOS),
    where('aprobadorGastoId', '==', aprobadorId),
    where('estadoGasto', '==', 'pendiente'),
    orderBy('enviadoAt', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data()
  })) as RegistroGasto[];
}

/**
 * Obtiene resumen de gastos por categoría
 */
export async function getResumenGastosPorCategoria(
  usuarioId: string,
  año: number,
  mes?: number
): Promise<Record<CategoriaGasto, { cantidad: number; importe: number }>> {
  let q = query(
    collection(db, COLLECTIONS.GASTOS),
    where('usuarioId', '==', usuarioId),
    where('año', '==', año),
    where('estadoGasto', '==', 'aprobado')
  );
  
  if (mes) {
    q = query(q, where('mes', '==', mes));
  }
  
  const snapshot = await getDocs(q);
  const resumen: Record<string, { cantidad: number; importe: number }> = {};
  
  snapshot.docs.forEach((d) => {
    const data = d.data() as RegistroGasto;
    if (!resumen[data.categoria]) {
      resumen[data.categoria] = { cantidad: 0, importe: 0 };
    }
    resumen[data.categoria].cantidad++;
    resumen[data.categoria].importe += data.importe;
  });
  
  return resumen as Record<CategoriaGasto, { cantidad: number; importe: number }>;
}
