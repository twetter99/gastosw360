/**
 * Servicio base genérico para operaciones CRUD en Firestore
 * 
 * Este es el ÚNICO patrón a seguir para crear servicios de entidades.
 * No usar useEffect + onSnapshot directamente en componentes.
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
  onSnapshot,
  Timestamp,
  DocumentData,
  QueryConstraint,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config';

// ============================================
// TIPOS
// ============================================

export interface FirestoreDocument {
  id: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ServiceOptions {
  /** Añadir timestamps automáticamente */
  timestamps?: boolean;
}

// ============================================
// CLASE BASE DE SERVICIO
// ============================================

/**
 * Clase base para servicios de Firestore.
 * Extiende esta clase para crear servicios específicos de cada entidad.
 * 
 * @example
 * ```ts
 * class UsuariosService extends BaseFirestoreService<Usuario> {
 *   constructor() {
 *     super('usuarios');
 *   }
 *   
 *   // Métodos específicos
 *   async getActivos() {
 *     return this.getAll([where('activo', '==', true)]);
 *   }
 * }
 * ```
 */
export class BaseFirestoreService<T extends FirestoreDocument> {
  protected collectionName: string;
  protected options: ServiceOptions;

  constructor(collectionName: string, options: ServiceOptions = { timestamps: true }) {
    this.collectionName = collectionName;
    this.options = options;
  }

  /**
   * Obtiene la referencia a la colección
   */
  protected getCollectionRef() {
    return collection(db, this.collectionName);
  }

  /**
   * Obtiene la referencia a un documento
   */
  protected getDocRef(id: string) {
    return doc(db, this.collectionName, id);
  }

  // ============================================
  // OPERACIONES DE LECTURA
  // ============================================

  /**
   * Obtener todos los documentos con filtros opcionales
   */
  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(this.getCollectionRef(), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  }

  /**
   * Obtener un documento por ID
   */
  async getById(id: string): Promise<T | null> {
    const snapshot = await getDoc(this.getDocRef(id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as T;
  }

  /**
   * Suscribirse a cambios en tiempo real (para casos específicos)
   * Retorna función para cancelar suscripción
   */
  subscribe(
    constraints: QueryConstraint[],
    onData: (data: T[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(this.getCollectionRef(), ...constraints);
    
    return onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        onData(data);
      },
      (error) => {
        console.error(`Error subscribing to ${this.collectionName}:`, error);
        onError?.(error);
      }
    );
  }

  /**
   * Suscribirse a un documento específico
   */
  subscribeToDoc(
    id: string,
    onData: (data: T | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      this.getDocRef(id),
      (snapshot) => {
        if (!snapshot.exists()) {
          onData(null);
          return;
        }
        onData({ id: snapshot.id, ...snapshot.data() } as T);
      },
      (error) => {
        console.error(`Error subscribing to ${this.collectionName}/${id}:`, error);
        onError?.(error);
      }
    );
  }

  // ============================================
  // OPERACIONES DE ESCRITURA
  // ============================================

  /**
   * Crear un nuevo documento
   * @returns ID del documento creado
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docData: DocumentData = { ...data };
    
    if (this.options.timestamps) {
      docData.createdAt = Timestamp.now();
      docData.updatedAt = Timestamp.now();
    }
    
    const docRef = await addDoc(this.getCollectionRef(), docData);
    return docRef.id;
  }

  /**
   * Actualizar un documento existente
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<void> {
    const docData: DocumentData = { ...data };
    
    if (this.options.timestamps) {
      docData.updatedAt = Timestamp.now();
    }
    
    await updateDoc(this.getDocRef(id), docData);
  }

  /**
   * Eliminar un documento
   */
  async delete(id: string): Promise<void> {
    await deleteDoc(this.getDocRef(id));
  }

  /**
   * Crear o actualizar (upsert)
   */
  async upsert(id: string | null, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (id) {
      await this.update(id, data as Partial<Omit<T, 'id' | 'createdAt'>>);
      return id;
    }
    return this.create(data);
  }
}
