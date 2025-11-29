/**
 * Servicio de Tarifas
 */

import { where, orderBy, Timestamp, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { BaseFirestoreService, FirestoreDocument } from './base';
import { COLLECTIONS, db } from '../config';
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
// TIPOS PARA TARIFAS ANUALES
// ============================================

export interface TarifaAnual {
  codigo: TipoTarifa;
  importe: number;
}

export interface TarifasAnuales {
  año: number;
  tarifas: Record<TipoTarifa, TarifaAnual>;
  vigenciaDesde: Timestamp;
  vigenciaHasta: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  creadoPor?: string;
  actualizadoPor?: string;
}

// Definición de tipos de tarifas y sus valores por defecto
export const TARIFAS_DEFINICION: Record<TipoTarifa, { descripcion: string; unidad: string; defaultValue: number }> = {
  HORA_NORMAL: { descripcion: 'Hora normal', unidad: '€/hora', defaultValue: 0 },
  HORA_EXTRA_LABORABLE: { descripcion: 'Hora extra día laborable', unidad: '€/hora', defaultValue: 15 },
  HORA_EXTRA_SABADO: { descripcion: 'Hora extra sábado', unidad: '€/hora', defaultValue: 18 },
  HORA_EXTRA_FESTIVO: { descripcion: 'Hora extra festivo/domingo', unidad: '€/hora', defaultValue: 25 },
  NOCTURNIDAD: { descripcion: 'Plus nocturnidad', unidad: '€/noche', defaultValue: 30 },
  DIETA_COMPLETA: { descripcion: 'Dieta completa', unidad: '€/día', defaultValue: 60 },
  DIETA_MEDIA: { descripcion: 'Media dieta', unidad: '€/día', defaultValue: 30 },
  PLUS_FESTIVO: { descripcion: 'Plus trabajo festivo', unidad: '€/día', defaultValue: 50 },
  KM_VEHICULO_PROPIO: { descripcion: 'Kilómetro vehículo propio', unidad: '€/km', defaultValue: 0.26 },
  KM_VEHICULO_EMPRESA: { descripcion: 'Kilómetro vehículo empresa', unidad: '€/km', defaultValue: 0 },
};

// Grupos de tarifas para la UI
export const GRUPOS_TARIFAS = {
  horas: {
    titulo: 'Horas Extra',
    icon: 'Clock',
    tipos: ['HORA_NORMAL', 'HORA_EXTRA_LABORABLE', 'HORA_EXTRA_SABADO', 'HORA_EXTRA_FESTIVO', 'NOCTURNIDAD'] as TipoTarifa[],
  },
  dietas: {
    titulo: 'Dietas',
    icon: 'UtensilsCrossed',
    tipos: ['DIETA_COMPLETA', 'DIETA_MEDIA'] as TipoTarifa[],
  },
  pluses: {
    titulo: 'Pluses',
    icon: 'Star',
    tipos: ['PLUS_FESTIVO'] as TipoTarifa[],
  },
  kilometraje: {
    titulo: 'Kilometraje',
    icon: 'Car',
    tipos: ['KM_VEHICULO_PROPIO', 'KM_VEHICULO_EMPRESA'] as TipoTarifa[],
  },
};

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

  // ============================================
  // MÉTODOS PARA TARIFAS ANUALES
  // ============================================

  /**
   * Obtener tarifas de un año específico
   */
  async getTarifasAño(año: number): Promise<TarifasAnuales | null> {
    const docRef = doc(db, 'configuracion', 'tarifas', 'anuales', año.toString());
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return docSnap.data() as TarifasAnuales;
  }

  /**
   * Guardar tarifas de un año
   */
  async guardarTarifasAño(
    año: number, 
    tarifas: Record<TipoTarifa, TarifaAnual>,
    userId?: string
  ): Promise<void> {
    const docRef = doc(db, 'configuracion', 'tarifas', 'anuales', año.toString());
    const existingDoc = await getDoc(docRef);
    
    const vigenciaDesde = Timestamp.fromDate(new Date(año, 0, 1)); // 1 enero
    const vigenciaHasta = Timestamp.fromDate(new Date(año, 11, 31, 23, 59, 59)); // 31 diciembre
    
    const data: TarifasAnuales = {
      año,
      tarifas,
      vigenciaDesde,
      vigenciaHasta,
      createdAt: existingDoc.exists() 
        ? (existingDoc.data() as TarifasAnuales).createdAt 
        : Timestamp.now(),
      updatedAt: Timestamp.now(),
      creadoPor: existingDoc.exists() 
        ? (existingDoc.data() as TarifasAnuales).creadoPor 
        : userId,
      actualizadoPor: userId,
    };
    
    await setDoc(docRef, data);
  }

  /**
   * Clonar tarifas del año anterior
   */
  async clonarDelAñoAnterior(añoDestino: number, userId?: string): Promise<boolean> {
    const añoOrigen = añoDestino - 1;
    const tarifasOrigen = await this.getTarifasAño(añoOrigen);
    
    if (!tarifasOrigen) {
      // Si no hay año anterior, crear con valores por defecto
      const tarifasDefecto = this.crearTarifasDefecto();
      await this.guardarTarifasAño(añoDestino, tarifasDefecto, userId);
      return false; // Indica que se usaron valores por defecto
    }
    
    await this.guardarTarifasAño(añoDestino, tarifasOrigen.tarifas, userId);
    return true; // Indica que se clonó del año anterior
  }

  /**
   * Obtener lista de años configurados
   */
  async getAñosConfigurados(): Promise<number[]> {
    const colRef = collection(db, 'configuracion', 'tarifas', 'anuales');
    const snapshot = await getDocs(colRef);
    
    return snapshot.docs
      .map(doc => parseInt(doc.id))
      .filter(año => !isNaN(año))
      .sort((a, b) => b - a); // Ordenar de más reciente a más antiguo
  }

  /**
   * Obtener tarifa vigente para un código en una fecha (sistema anual)
   */
  async getTarifaVigenteAnual(codigo: TipoTarifa, fecha: Date = new Date()): Promise<number> {
    const año = fecha.getFullYear();
    const tarifasAño = await this.getTarifasAño(año);
    
    if (tarifasAño?.tarifas[codigo]) {
      return tarifasAño.tarifas[codigo].importe;
    }
    
    // Fallback a la tarifa por defecto
    return TARIFAS_DEFINICION[codigo]?.defaultValue || 0;
  }

  /**
   * Crear tarifas por defecto
   */
  crearTarifasDefecto(): Record<TipoTarifa, TarifaAnual> {
    const tarifas: Partial<Record<TipoTarifa, TarifaAnual>> = {};
    
    for (const [codigo, def] of Object.entries(TARIFAS_DEFINICION)) {
      tarifas[codigo as TipoTarifa] = {
        codigo: codigo as TipoTarifa,
        importe: def.defaultValue,
      };
    }
    
    return tarifas as Record<TipoTarifa, TarifaAnual>;
  }
}

// Exportar instancia singleton
export const tarifasService = new TarifasService();
