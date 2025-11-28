/**
 * Servicio de Proyectos
 */

import { where, orderBy } from 'firebase/firestore';
import { BaseFirestoreService, FirestoreDocument } from './base';
import { COLLECTIONS } from '../config';

// ============================================
// TIPOS
// ============================================

export interface ProyectoDB extends FirestoreDocument {
  codigo: string;
  nombre: string;
  descripcion?: string;
  cliente?: string;
  direccion?: string;
  activo: boolean;
  fechaInicio?: Date;
  fechaFin?: Date;
  responsableId?: string;
}

export interface CreateProyectoInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  cliente?: string;
  direccion?: string;
  responsableId?: string;
}

// ============================================
// SERVICIO
// ============================================

class ProyectosService extends BaseFirestoreService<ProyectoDB> {
  constructor() {
    super(COLLECTIONS.PROYECTOS);
  }

  /**
   * Obtener proyectos activos
   */
  async getActivos(): Promise<ProyectoDB[]> {
    return this.getAll([
      where('activo', '==', true),
      orderBy('nombre', 'asc'),
    ]);
  }

  /**
   * Obtener todos ordenados por nombre
   */
  async getAllOrdenados(): Promise<ProyectoDB[]> {
    return this.getAll([orderBy('nombre', 'asc')]);
  }

  /**
   * Buscar por código
   */
  async getByCodigo(codigo: string): Promise<ProyectoDB | null> {
    const proyectos = await this.getAll([where('codigo', '==', codigo)]);
    return proyectos[0] || null;
  }

  /**
   * Crear proyecto
   */
  async createProyecto(input: CreateProyectoInput): Promise<string> {
    return this.create({
      ...input,
      activo: true,
      fechaInicio: new Date(),
    } as Omit<ProyectoDB, 'id' | 'createdAt' | 'updatedAt'>);
  }

  /**
   * Desactivar proyecto
   */
  async desactivar(id: string): Promise<void> {
    await this.update(id, {
      activo: false,
      fechaFin: new Date(),
    });
  }
}

// Exportar instancia singleton
export const proyectosService = new ProyectosService();
