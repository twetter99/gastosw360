/**
 * Servicios de Firebase para operaciones CRUD
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './config';

// ============================================
// TIPOS GENÉRICOS
// ============================================

export interface FirestoreDocument {
  id: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================
// FUNCIONES GENÉRICAS
// ============================================

/**
 * Obtener todos los documentos de una colección
 */
export async function getAll<T extends FirestoreDocument>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
}

/**
 * Obtener un documento por ID
 */
export async function getById<T extends FirestoreDocument>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as T;
}

/**
 * Crear un nuevo documento
 */
export async function create<T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

/**
 * Actualizar un documento
 */
export async function update(
  collectionName: string,
  id: string,
  data: Partial<DocumentData>
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Eliminar un documento
 */
export async function remove(
  collectionName: string,
  id: string
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
}

// ============================================
// SERVICIOS DE USUARIOS
// ============================================

export const usuariosService = {
  getAll: (constraints?: QueryConstraint[]) => 
    getAll(COLLECTIONS.USUARIOS, constraints),
  
  getById: (id: string) => 
    getById(COLLECTIONS.USUARIOS, id),
  
  create: (data: DocumentData) => 
    create(COLLECTIONS.USUARIOS, data),
  
  update: (id: string, data: Partial<DocumentData>) => 
    update(COLLECTIONS.USUARIOS, id, data),
  
  delete: (id: string) => 
    remove(COLLECTIONS.USUARIOS, id),

  getByRole: (rol: string) =>
    getAll(COLLECTIONS.USUARIOS, [where('rol', '==', rol)]),

  getActivos: () =>
    getAll(COLLECTIONS.USUARIOS, [where('activo', '==', true)]),
};

// ============================================
// SERVICIOS DE REGISTROS DE HORAS
// ============================================

export const horasService = {
  getAll: (constraints?: QueryConstraint[]) => 
    getAll(COLLECTIONS.REGISTROS_HORAS, constraints),
  
  getById: (id: string) => 
    getById(COLLECTIONS.REGISTROS_HORAS, id),
  
  create: (data: DocumentData) => 
    create(COLLECTIONS.REGISTROS_HORAS, data),
  
  update: (id: string, data: Partial<DocumentData>) => 
    update(COLLECTIONS.REGISTROS_HORAS, id, data),
  
  delete: (id: string) => 
    remove(COLLECTIONS.REGISTROS_HORAS, id),

  getByUsuario: (usuarioId: string) =>
    getAll(COLLECTIONS.REGISTROS_HORAS, [
      where('usuarioId', '==', usuarioId),
      orderBy('fecha', 'desc'),
    ]),

  getPendientes: () =>
    getAll(COLLECTIONS.REGISTROS_HORAS, [
      where('estado', '==', 'pendiente'),
      orderBy('fecha', 'desc'),
    ]),

  getPendientesByAprobador: (aprobadorId: string) =>
    getAll(COLLECTIONS.REGISTROS_HORAS, [
      where('estado', '==', 'pendiente'),
      where('aprobadorId', '==', aprobadorId),
    ]),

  aprobar: (id: string, aprobadorId: string) =>
    update(COLLECTIONS.REGISTROS_HORAS, id, {
      estado: 'aprobado',
      aprobadoPor: aprobadorId,
      fechaAprobacion: Timestamp.now(),
    }),

  rechazar: (id: string, aprobadorId: string, motivo: string) =>
    update(COLLECTIONS.REGISTROS_HORAS, id, {
      estado: 'rechazado',
      rechazadoPor: aprobadorId,
      motivoRechazo: motivo,
      fechaRechazo: Timestamp.now(),
    }),
};

// ============================================
// SERVICIOS DE GASTOS
// ============================================

export const gastosService = {
  getAll: (constraints?: QueryConstraint[]) => 
    getAll(COLLECTIONS.GASTOS, constraints),
  
  getById: (id: string) => 
    getById(COLLECTIONS.GASTOS, id),
  
  create: (data: DocumentData) => 
    create(COLLECTIONS.GASTOS, data),
  
  update: (id: string, data: Partial<DocumentData>) => 
    update(COLLECTIONS.GASTOS, id, data),
  
  delete: (id: string) => 
    remove(COLLECTIONS.GASTOS, id),

  getByUsuario: (usuarioId: string) =>
    getAll(COLLECTIONS.GASTOS, [
      where('usuarioId', '==', usuarioId),
      orderBy('fecha', 'desc'),
    ]),

  getPendientes: () =>
    getAll(COLLECTIONS.GASTOS, [
      where('estado', '==', 'pendiente'),
      orderBy('fecha', 'desc'),
    ]),

  aprobar: (id: string, aprobadorId: string) =>
    update(COLLECTIONS.GASTOS, id, {
      estado: 'aprobado',
      aprobadoPor: aprobadorId,
      fechaAprobacion: Timestamp.now(),
    }),

  rechazar: (id: string, aprobadorId: string, motivo: string) =>
    update(COLLECTIONS.GASTOS, id, {
      estado: 'rechazado',
      rechazadoPor: aprobadorId,
      motivoRechazo: motivo,
      fechaRechazo: Timestamp.now(),
    }),
};

// ============================================
// SERVICIOS DE PROYECTOS
// ============================================

export const proyectosService = {
  getAll: (constraints?: QueryConstraint[]) => 
    getAll(COLLECTIONS.PROYECTOS, constraints),
  
  getById: (id: string) => 
    getById(COLLECTIONS.PROYECTOS, id),
  
  create: (data: DocumentData) => 
    create(COLLECTIONS.PROYECTOS, data),
  
  update: (id: string, data: Partial<DocumentData>) => 
    update(COLLECTIONS.PROYECTOS, id, data),
  
  delete: (id: string) => 
    remove(COLLECTIONS.PROYECTOS, id),

  getActivos: () =>
    getAll(COLLECTIONS.PROYECTOS, [where('activo', '==', true)]),
};

// ============================================
// SERVICIOS DE TARIFAS
// ============================================

export const tarifasService = {
  getAll: (constraints?: QueryConstraint[]) => 
    getAll(COLLECTIONS.TARIFAS, constraints),
  
  getById: (id: string) => 
    getById(COLLECTIONS.TARIFAS, id),
  
  create: (data: DocumentData) => 
    create(COLLECTIONS.TARIFAS, data),
  
  update: (id: string, data: Partial<DocumentData>) => 
    update(COLLECTIONS.TARIFAS, id, data),

  delete: (id: string) => 
    remove(COLLECTIONS.TARIFAS, id),

  getActual: async () => {
    const tarifas = await getAll(COLLECTIONS.TARIFAS, [
      where('activo', '==', true),
      limit(1),
    ]);
    return tarifas[0] || null;
  },
};

// ============================================
// SERVICIOS DE FESTIVOS
// ============================================

export const festivosService = {
  getAll: (constraints?: QueryConstraint[]) => 
    getAll(COLLECTIONS.FESTIVOS, constraints),
  
  getById: (id: string) => 
    getById(COLLECTIONS.FESTIVOS, id),
  
  create: (data: DocumentData) => 
    create(COLLECTIONS.FESTIVOS, data),
  
  update: (id: string, data: Partial<DocumentData>) => 
    update(COLLECTIONS.FESTIVOS, id, data),
  
  delete: (id: string) => 
    remove(COLLECTIONS.FESTIVOS, id),

  getByYear: (year: number) => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    return getAll(COLLECTIONS.FESTIVOS, [
      where('fecha', '>=', Timestamp.fromDate(startDate)),
      where('fecha', '<=', Timestamp.fromDate(endDate)),
    ]);
  },
};

// ============================================
// SERVICIOS DE DESPLAZAMIENTOS
// ============================================

export const desplazamientosService = {
  getAll: (constraints?: QueryConstraint[]) => 
    getAll(COLLECTIONS.DESPLAZAMIENTOS, constraints),
  
  getById: (id: string) => 
    getById(COLLECTIONS.DESPLAZAMIENTOS, id),
  
  create: (data: DocumentData) => 
    create(COLLECTIONS.DESPLAZAMIENTOS, data),
  
  update: (id: string, data: Partial<DocumentData>) => 
    update(COLLECTIONS.DESPLAZAMIENTOS, id, data),
  
  delete: (id: string) => 
    remove(COLLECTIONS.DESPLAZAMIENTOS, id),

  getByUsuario: (usuarioId: string) =>
    getAll(COLLECTIONS.DESPLAZAMIENTOS, [
      where('usuarioId', '==', usuarioId),
      orderBy('fecha', 'desc'),
    ]),
};
