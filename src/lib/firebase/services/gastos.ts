/**
 * Servicio de Gastos
 */

import { where, orderBy, QueryConstraint, limit, startAfter, QueryDocumentSnapshot, DocumentData, getDocs, query, collection } from 'firebase/firestore';
import { BaseFirestoreService, FirestoreDocument } from './base';
import { COLLECTIONS, db } from '../config';
import { EstadoAprobacion, CategoriaGasto } from '@/types';

// ============================================
// CONSTANTES
// ============================================
export const GASTOS_PAGE_SIZE = 25;

// ============================================
// TIPOS
// ============================================

export interface GastoDB extends FirestoreDocument {
  // Datos básicos
  usuarioId: string;
  proyectoId: string;
  fecha: Date;
  año: number;
  mes: number;
  periodo: string;  // formato: YYYY-MM para queries eficientes
  
  // Gasto
  categoria: CategoriaGasto;
  descripcion: string;
  importe: number;
  
  // Kilometraje (si aplica)
  kilometros?: number;
  origen?: string;
  destino?: string;
  tarifaKm?: number;
  
  // Adjunto
  adjuntoUrl?: string;
  adjuntoNombre?: string;
  
  // Workflow
  estadoGasto: EstadoAprobacion;
  
  // Metadatos
  observaciones?: string;
  motivoRechazo?: string;
  aprobadoPor?: string;
  fechaAprobacion?: Date;
}

export interface CreateGastoInput {
  usuarioId: string;
  proyectoId: string;
  fecha: Date;
  categoria: CategoriaGasto;
  descripcion: string;
  importe: number;
  kilometros?: number;
  origen?: string;
  destino?: string;
  estadoGasto?: EstadoAprobacion;
}

export interface PaginatedGastosResult {
  data: GastoDB[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

// ============================================
// HELPERS
// ============================================

/**
 * Genera el campo 'periodo' a partir de una fecha
 */
function generarPeriodo(fecha: Date): string {
  const año = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;
  return `${año}-${String(mes).padStart(2, '0')}`;
}

// ============================================
// SERVICIO
// ============================================

class GastosService extends BaseFirestoreService<GastoDB> {
  constructor() {
    super(COLLECTIONS.GASTOS);
  }

  /**
   * Obtener gastos de un usuario
   */
  async getByUsuario(usuarioId: string, constraints: QueryConstraint[] = []): Promise<GastoDB[]> {
    return this.getAll([
      where('usuarioId', '==', usuarioId),
      orderBy('fecha', 'desc'),
      ...constraints,
    ]);
  }

  /**
   * Obtener gastos por estado
   */
  async getByEstado(estado: EstadoAprobacion): Promise<GastoDB[]> {
    return this.getAll([
      where('estadoGasto', '==', estado),
      orderBy('fecha', 'desc'),
    ]);
  }

  /**
   * Obtener gastos pendientes
   */
  async getPendientes(): Promise<GastoDB[]> {
    return this.getByEstado('pendiente');
  }

  /**
   * Obtener gastos de un mes - OPTIMIZADO con periodo
   */
  async getByMes(año: number, mes: number, usuarioId?: string): Promise<GastoDB[]> {
    const periodo = `${año}-${String(mes).padStart(2, '0')}`;
    const constraints: QueryConstraint[] = [
      where('periodo', '==', periodo),  // Una sola igualdad, más eficiente
      orderBy('fecha', 'desc'),
    ];
    
    if (usuarioId) {
      constraints.unshift(where('usuarioId', '==', usuarioId));
    }
    
    return this.getAll(constraints);
  }

  /**
   * Obtener gastos con paginación
   */
  async getGastosPaginados(
    filtros: {
      usuarioId?: string;
      periodo?: string;
      año?: number;
      mes?: number;
      estado?: EstadoAprobacion;
      categoria?: CategoriaGasto;
    },
    pageSize = GASTOS_PAGE_SIZE,
    cursor?: QueryDocumentSnapshot<DocumentData>
  ): Promise<PaginatedGastosResult> {
    const constraints: QueryConstraint[] = [];
    
    if (filtros.usuarioId) {
      constraints.push(where('usuarioId', '==', filtros.usuarioId));
    }
    
    // Usar periodo si está disponible (más eficiente)
    if (filtros.periodo) {
      constraints.push(where('periodo', '==', filtros.periodo));
    } else if (filtros.año && filtros.mes) {
      const periodo = `${filtros.año}-${String(filtros.mes).padStart(2, '0')}`;
      constraints.push(where('periodo', '==', periodo));
    }
    
    if (filtros.estado) {
      constraints.push(where('estadoGasto', '==', filtros.estado));
    }
    
    if (filtros.categoria) {
      constraints.push(where('categoria', '==', filtros.categoria));
    }
    
    constraints.push(orderBy('fecha', 'desc'));
    constraints.push(limit(pageSize + 1));
    
    if (cursor) {
      constraints.push(startAfter(cursor));
    }
    
    let q = query(collection(db, this.collectionName), ...constraints);
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    
    const hasMore = docs.length > pageSize;
    const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;
    
    return {
      data: resultDocs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as GastoDB[],
      lastDoc: resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null,
      hasMore,
    };
  }

  /**
   * Crear gasto - incluye campo periodo automáticamente
   */
  async createGasto(input: CreateGastoInput): Promise<string> {
    const fecha = input.fecha;
    const periodo = generarPeriodo(fecha);
    
    return this.create({
      ...input,
      año: fecha.getFullYear(),
      mes: fecha.getMonth() + 1,
      periodo,  // Campo desnormalizado para queries eficientes
      estadoGasto: input.estadoGasto || 'borrador',
    } as Omit<GastoDB, 'id' | 'createdAt' | 'updatedAt'>);
  }

  /**
   * Enviar a aprobación
   */
  async enviarAAprobacion(id: string): Promise<void> {
    await this.update(id, { estadoGasto: 'pendiente' });
  }

  /**
   * Aprobar gasto
   */
  async aprobar(id: string, aprobadoPor: string): Promise<void> {
    await this.update(id, {
      estadoGasto: 'aprobado',
      aprobadoPor,
      fechaAprobacion: new Date(),
    });
  }

  /**
   * Rechazar gasto
   */
  async rechazar(id: string, motivoRechazo: string, rechazadoPor: string): Promise<void> {
    await this.update(id, {
      estadoGasto: 'rechazado',
      motivoRechazo,
      aprobadoPor: rechazadoPor,
      fechaAprobacion: new Date(),
    });
  }
}

// Exportar instancia singleton
export const gastosService = new GastosService();
