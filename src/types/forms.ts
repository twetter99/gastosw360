/**
 * Tipos para formularios de la aplicación
 */

import { CategoriaGasto, TipoDia, TipoTarifa, RolUsuario, TipoHora } from './index';

// ============================================================
// FORMULARIO DE REGISTRO DE HORAS
// ============================================================

/**
 * Input simplificado para registro rápido de horas extra
 * (optimizado para móvil - el técnico hace lo mínimo)
 */
export interface RegistroHorasInput {
  fecha: string;              // YYYY-MM-DD
  horaInicio: string;         // HH:MM
  horaFin: string;            // HH:MM
  proyectoId: string;
  descripcion?: string;
  tipoHora?: TipoHora;        // Se detecta automáticamente según el día
}

export interface RegistroHorasFormValues {
  fecha: Date;
  horasNormales: number;
  horasExtras: number;
  horasNocturnidad: number;
  plusFestivo: boolean;
  proyectoId?: string;
  observaciones?: string;
}

export interface RegistroRapidoFormValues {
  fecha: Date;
  plantilla: 'dia_normal' | 'dia_desplazamiento' | 'festivo_trabajado' | 'personalizado';
  horasExtras?: number;
  observaciones?: string;
}

// ============================================================
// FORMULARIO DE GASTOS
// ============================================================

export interface GastoFormValues {
  fecha: Date;
  categoria: CategoriaGasto;
  descripcion: string;
  importe: number;
  
  // Kilometraje
  esKilometraje: boolean;
  kilometros?: number;
  origen?: string;
  destino?: string;
  vehiculo?: 'propio' | 'empresa';
  
  // Dieta
  esDieta: boolean;
  tipoDieta?: 'completa' | 'media';
  
  // Vinculaciones
  proyectoId?: string;
  desplazamientoId?: string;
  
  // Adjuntos
  adjuntos?: File[];
  
  observaciones?: string;
}

// ============================================================
// FORMULARIO DE USUARIO
// ============================================================

export interface UsuarioFormValues {
  email: string;
  nombre: string;
  apellidos: string;
  dni?: string;
  telefono?: string;
  
  codigo: string;
  departamento?: string;
  cargo?: string;
  
  rol: RolUsuario;
  responsableHorasId?: string;
  supervisorGastosId?: string;
  
  activo: boolean;
}

// ============================================================
// FORMULARIO DE DESPLAZAMIENTO
// ============================================================

export interface DesplazamientoFormValues {
  fechaInicio: Date;
  fechaFin: Date;
  destino: string;
  proyectoId?: string;
  
  // Hotel
  incluyeHotel: boolean;
  hotelNombre?: string;
  hotelDireccion?: string;
  hotelTelefono?: string;
  hotelConfirmacion?: string;
  hotelCosteEstimado?: number;
  
  // Transporte
  medioTransporte: 'vehiculo_empresa' | 'vehiculo_propio' | 'ave' | 'avion' | 'autobus' | 'otro';
  detalleTransporte?: string;
  kmIda?: number;
  kmVuelta?: number;
  costeTransporteEstimado?: number;
  
  // Dietas
  dietasIncluidas: boolean;
  numeroDietas?: number;
  
  observaciones?: string;
}

// ============================================================
// FORMULARIO DE TARIFA
// ============================================================

export interface TarifaFormValues {
  codigo: TipoTarifa;
  concepto: string;
  descripcion?: string;
  importe: number;
  unidad: 'hora' | 'dia' | 'noche' | 'km' | 'unidad';
  vigenciaDesde: Date;
  vigenciaHasta?: Date;
  activa: boolean;
}

// ============================================================
// FORMULARIO DE PROYECTO
// ============================================================

export interface ProyectoFormValues {
  codigo: string;
  nombre: string;
  cliente: string;
  ubicacion?: string;
  fechaInicio: Date;
  fechaFin?: Date;
  responsableId?: string;
  presupuestoHoras?: number;
  presupuestoGastos?: number;
  activo: boolean;
}

// ============================================================
// FORMULARIO DE FESTIVO
// ============================================================

export interface FestivoFormValues {
  fecha: Date;
  nombre: string;
  ambito: 'nacional' | 'autonomico' | 'local';
}

// ============================================================
// FORMULARIO DE APROBACIÓN
// ============================================================

export interface AprobacionFormValues {
  accion: 'aprobar' | 'rechazar' | 'devolver';
  comentario?: string;
}

// ============================================================
// FILTROS
// ============================================================

export interface FiltrosRegistrosForm {
  usuarioId?: string;
  proyectoId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  estado?: string;
  tipoDia?: TipoDia;
}

export interface FiltrosGastosForm {
  usuarioId?: string;
  proyectoId?: string;
  categoria?: CategoriaGasto;
  fechaDesde?: Date;
  fechaHasta?: Date;
  estado?: string;
  importeMin?: number;
  importeMax?: number;
}

export interface FiltrosReportesForm {
  año: number;
  mes?: number;
  usuarioId?: string;
  proyectoId?: string;
  agruparPor: 'mes' | 'tecnico' | 'proyecto' | 'categoria';
}
