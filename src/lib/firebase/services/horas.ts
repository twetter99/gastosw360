/**
 * Servicio de Horas Extras
 * 
 * IMPORTANTE: Los cálculos de importes se hacen en Cloud Functions,
 * no en el cliente. El cliente solo envía horas y tipo, el servidor
 * calcula el importe aplicando las tarifas vigentes.
 */

import { where, orderBy, QueryConstraint } from 'firebase/firestore';
import { BaseFirestoreService, FirestoreDocument } from './base';
import { COLLECTIONS } from '../config';
import { EstadoAprobacion, TipoHora } from '@/types';

// ============================================
// TIPOS
// ============================================

export interface RegistroHorasDB extends FirestoreDocument {
  // Datos básicos
  usuarioId: string;
  proyectoId: string;
  fecha: Date;
  año: number;
  mes: number;
  semana: number;
  
  // Horas
  horaInicio: string;
  horaFin: string;
  horasExtras: number;
  tipoHora: TipoHora;
  
  // Calculados por Cloud Function (NO modificables desde cliente)
  tipoTarifa?: string;
  tarifaAplicada?: number;
  importeHorasExtras?: number;
  
  // Workflow
  estadoHorasExtras: EstadoAprobacion;
  
  // Metadatos
  descripcion?: string;
  observaciones?: string;
  motivoRechazo?: string;
  aprobadoPor?: string;
  fechaAprobacion?: Date;
}

export interface CreateHorasInput {
  usuarioId: string;
  proyectoId: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  tipoHora: TipoHora;
  descripcion?: string;
  estadoHorasExtras?: EstadoAprobacion;
}

// ============================================
// SERVICIO
// ============================================

class HorasService extends BaseFirestoreService<RegistroHorasDB> {
  constructor() {
    super(COLLECTIONS.REGISTROS_HORAS);
  }

  /**
   * Obtener registros de un usuario
   */
  async getByUsuario(usuarioId: string, constraints: QueryConstraint[] = []): Promise<RegistroHorasDB[]> {
    return this.getAll([
      where('usuarioId', '==', usuarioId),
      orderBy('fecha', 'desc'),
      ...constraints,
    ]);
  }

  /**
   * Obtener registros por estado
   */
  async getByEstado(estado: EstadoAprobacion): Promise<RegistroHorasDB[]> {
    return this.getAll([
      where('estadoHorasExtras', '==', estado),
      orderBy('fecha', 'desc'),
    ]);
  }

  /**
   * Obtener registros pendientes de aprobar
   */
  async getPendientes(): Promise<RegistroHorasDB[]> {
    return this.getByEstado('pendiente');
  }

  /**
   * Obtener registros de un mes específico
   */
  async getByMes(año: number, mes: number, usuarioId?: string): Promise<RegistroHorasDB[]> {
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
   * Crear registro de horas
   * NOTA: El importe se calculará en Cloud Function al crear
   */
  async createRegistro(input: CreateHorasInput): Promise<string> {
    const fecha = input.fecha;
    
    // Calcular campos derivados
    const año = fecha.getFullYear();
    const mes = fecha.getMonth() + 1;
    const semana = this.getWeekNumber(fecha);
    const horasExtras = this.calcularHoras(input.horaInicio, input.horaFin);
    
    return this.create({
      ...input,
      año,
      mes,
      semana,
      horasExtras,
      estadoHorasExtras: input.estadoHorasExtras || 'borrador',
    } as Omit<RegistroHorasDB, 'id' | 'createdAt' | 'updatedAt'>);
  }

  /**
   * Enviar a aprobación
   */
  async enviarAAprobacion(id: string): Promise<void> {
    await this.update(id, { estadoHorasExtras: 'pendiente' });
  }

  /**
   * Aprobar registro (solo para supervisores)
   */
  async aprobar(id: string, aprobadoPor: string): Promise<void> {
    await this.update(id, {
      estadoHorasExtras: 'aprobado',
      aprobadoPor,
      fechaAprobacion: new Date(),
    });
  }

  /**
   * Rechazar registro
   */
  async rechazar(id: string, motivoRechazo: string, rechazadoPor: string): Promise<void> {
    await this.update(id, {
      estadoHorasExtras: 'rechazado',
      motivoRechazo,
      aprobadoPor: rechazadoPor,
      fechaAprobacion: new Date(),
    });
  }

  /**
   * Devolver para corrección
   */
  async devolver(id: string, observaciones: string): Promise<void> {
    await this.update(id, {
      estadoHorasExtras: 'devuelto',
      observaciones,
    });
  }

  // ============================================
  // HELPERS PRIVADOS
  // ============================================

  private calcularHoras(horaInicio: string, horaFin: string): number {
    const [hI, mI] = horaInicio.split(':').map(Number);
    const [hF, mF] = horaFin.split(':').map(Number);
    
    let minutos = (hF * 60 + mF) - (hI * 60 + mI);
    if (minutos < 0) minutos += 24 * 60; // Cruce de medianoche
    
    return Math.round((minutos / 60) * 100) / 100; // 2 decimales
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}

// Exportar instancia singleton
export const horasService = new HorasService();
