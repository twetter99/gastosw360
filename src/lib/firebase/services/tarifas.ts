/**
 * Servicio de Tarifas
 */

import { where, orderBy, Timestamp } from 'firebase/firestore';
import { BaseFirestoreService, FirestoreDocument } from './base';
import { COLLECTIONS } from '../config';
import { TipoTarifa } from '@/types';

// ============================================
// TIPOS
// ============================================

export interface TarifaDB extends FirestoreDocument {
  codigo: TipoTarifa;
  descripcion: string;
  importe: number;
  activa: boolean;
  vigenciaDesde: Timestamp;
  vigenciaHasta?: Timestamp;
  observaciones?: string;
}

export interface CreateTarifaInput {
  codigo: TipoTarifa;
  descripcion: string;
  importe: number;
  vigenciaDesde: Date;
  vigenciaHasta?: Date;
  observaciones?: string;
}

// ============================================
// SERVICIO
// ============================================

class TarifasService extends BaseFirestoreService<TarifaDB> {
  constructor() {
    super(COLLECTIONS.TARIFAS);
  }

  /**
   * Obtener tarifas activas
   */
  async getActivas(): Promise<TarifaDB[]> {
    return this.getAll([
      where('activa', '==', true),
      orderBy('codigo', 'asc'),
    ]);
  }

  /**
   * Obtener todas ordenadas
   */
  async getAllOrdenadas(): Promise<TarifaDB[]> {
    return this.getAll([orderBy('codigo', 'asc')]);
  }

  /**
   * Obtener tarifa por código
   */
  async getByCodigo(codigo: TipoTarifa): Promise<TarifaDB[]> {
    return this.getAll([
      where('codigo', '==', codigo),
      where('activa', '==', true),
    ]);
  }

  /**
   * Obtener tarifa vigente para un código en una fecha
   */
  async getTarifaVigente(codigo: TipoTarifa, fecha: Date = new Date()): Promise<TarifaDB | null> {
    const tarifas = await this.getByCodigo(codigo);
    
    for (const tarifa of tarifas) {
      const vigenciaDesde = tarifa.vigenciaDesde.toDate();
      const vigenciaHasta = tarifa.vigenciaHasta?.toDate();
      
      if (vigenciaDesde <= fecha && (!vigenciaHasta || vigenciaHasta >= fecha)) {
        return tarifa;
      }
    }
    
    return null;
  }

  /**
   * Crear tarifa
   */
  async createTarifa(input: CreateTarifaInput): Promise<string> {
    return this.create({
      ...input,
      activa: true,
      vigenciaDesde: Timestamp.fromDate(input.vigenciaDesde),
      vigenciaHasta: input.vigenciaHasta ? Timestamp.fromDate(input.vigenciaHasta) : undefined,
    } as unknown as Omit<TarifaDB, 'id' | 'createdAt' | 'updatedAt'>);
  }

  /**
   * Desactivar tarifa
   */
  async desactivar(id: string): Promise<void> {
    await this.update(id, { activa: false });
  }
}

// Exportar instancia singleton
export const tarifasService = new TarifasService();
