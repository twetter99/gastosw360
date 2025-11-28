/**
 * Servicio de Festivos
 */

import { where, orderBy, Timestamp } from 'firebase/firestore';
import { BaseFirestoreService, FirestoreDocument } from './base';
import { COLLECTIONS } from '../config';

// ============================================
// TIPOS
// ============================================

export interface FestivoDB extends FirestoreDocument {
  fecha: Timestamp;
  nombre: string;
  descripcion?: string;
  ambito: 'nacional' | 'autonomico' | 'local';
  localidad?: string;
  año: number;
}

export interface CreateFestivoInput {
  fecha: Date;
  nombre: string;
  descripcion?: string;
  ambito: 'nacional' | 'autonomico' | 'local';
  localidad?: string;
}

// ============================================
// SERVICIO
// ============================================

class FestivosService extends BaseFirestoreService<FestivoDB> {
  constructor() {
    super(COLLECTIONS.FESTIVOS);
  }

  /**
   * Obtener festivos de un año
   */
  async getByAño(año: number): Promise<FestivoDB[]> {
    return this.getAll([
      where('año', '==', año),
      orderBy('fecha', 'asc'),
    ]);
  }

  /**
   * Obtener todos ordenados por fecha
   */
  async getAllOrdenados(): Promise<FestivoDB[]> {
    return this.getAll([orderBy('fecha', 'desc')]);
  }

  /**
   * Verificar si una fecha es festivo
   */
  async esFestivo(fecha: Date, localidad?: string): Promise<boolean> {
    const año = fecha.getFullYear();
    const festivos = await this.getByAño(año);
    
    const fechaStr = fecha.toISOString().split('T')[0];
    
    return festivos.some(f => {
      const festivoFechaStr = f.fecha.toDate().toISOString().split('T')[0];
      if (festivoFechaStr !== fechaStr) return false;
      
      // Si es nacional, aplica a todos
      if (f.ambito === 'nacional') return true;
      
      // Si hay localidad especificada, verificar
      if (localidad && f.localidad === localidad) return true;
      
      return f.ambito === 'autonomico'; // Autonómicos aplican si no se especifica localidad
    });
  }

  /**
   * Crear festivo
   */
  async createFestivo(input: CreateFestivoInput): Promise<string> {
    const fecha = input.fecha;
    
    return this.create({
      ...input,
      fecha: Timestamp.fromDate(fecha),
      año: fecha.getFullYear(),
    } as unknown as Omit<FestivoDB, 'id' | 'createdAt' | 'updatedAt'>);
  }
}

// Exportar instancia singleton
export const festivosService = new FestivosService();
