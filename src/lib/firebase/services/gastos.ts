/**
 * Servicio de Gastos
 */

import { where, orderBy, QueryConstraint } from 'firebase/firestore';
import { BaseFirestoreService, FirestoreDocument } from './base';
import { COLLECTIONS } from '../config';
import { EstadoAprobacion, CategoriaGasto } from '@/types';

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
   * Obtener gastos de un mes
   */
  async getByMes(año: number, mes: number, usuarioId?: string): Promise<GastoDB[]> {
    const constraints: QueryConstraint[] = [
      where('año', '==', año),
      where('mes', '==', mes),
    ];
    
    if (usuarioId) {
      constraints.push(where('usuarioId', '==', usuarioId));
    }
    
    return this.getAll(constraints);
  }

  /**
   * Crear gasto
   */
  async createGasto(input: CreateGastoInput): Promise<string> {
    const fecha = input.fecha;
    
    return this.create({
      ...input,
      año: fecha.getFullYear(),
      mes: fecha.getMonth() + 1,
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
