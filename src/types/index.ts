/**
 * ============================================================
 * SISTEMA DE ROLES Y JERARQUÍAS - GASTOS EXTRA PRO
 * ============================================================
 * 
 * JERARQUÍA DE APROBACIÓN:
 * 
 * TÉCNICO
 *    │
 *    ├── Sus horas extra → JEFE_EQUIPO (responsable directo)
 *    └── Sus gastos → SUPERVISOR_OFICINA
 * 
 * JEFE_EQUIPO (también genera horas y gastos propios)
 *    │
 *    ├── Sus horas extra → DIRECCION
 *    └── Sus gastos → SUPERVISOR_OFICINA o DIRECCION
 * 
 * SUPERVISOR_OFICINA
 *    │
 *    ├── Sus horas extra → DIRECCION
 *    └── Sus gastos → DIRECCION
 * 
 * DIRECCION / ADMIN
 *    └── Auto-aprobación o aprobación cruzada
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================
// ENUMERACIONES
// ============================================================

/**
 * Roles del sistema - Jerarquía de menor a mayor nivel
 */
export type RolUsuario = 
  | 'tecnico'           // Nivel 1: Usuario base, registra sus horas y gastos
  | 'jefe_equipo'       // Nivel 2: Aprueba horas extra de su equipo
  | 'supervisor_oficina'// Nivel 3: Aprueba gastos de todos
  | 'direccion'         // Nivel 4: Aprueba todo, incluido jefes de equipo
  | 'admin';            // Nivel 5: Configuración del sistema

export const NIVELES_ROL: Record<RolUsuario, number> = {
  tecnico: 1,
  jefe_equipo: 2,
  supervisor_oficina: 3,
  direccion: 4,
  admin: 5,
};

/**
 * Estados de aprobación
 */
export type EstadoAprobacion = 
  | 'borrador'          // Aún no enviado
  | 'pendiente'         // Enviado, esperando aprobación
  | 'aprobado'          // Aprobado por el responsable
  | 'rechazado'         // Rechazado
  | 'devuelto';         // Devuelto para corrección

/**
 * Tipos de tarifa
 */
export type TipoTarifa = 
  | 'HORA_NORMAL'
  | 'HORA_EXTRA_LABORABLE'
  | 'HORA_EXTRA_SABADO'
  | 'HORA_EXTRA_FESTIVO'
  | 'NOCTURNIDAD'
  | 'DIETA_COMPLETA'
  | 'DIETA_MEDIA'
  | 'PLUS_FESTIVO'
  | 'KM_VEHICULO_PROPIO'
  | 'KM_VEHICULO_EMPRESA';

/**
 * Categorías de gastos
 */
export type CategoriaGasto = 
  | 'dieta'
  | 'kilometraje'
  | 'combustible'
  | 'hotel'
  | 'parking'
  | 'peaje'
  | 'transporte_publico'
  | 'comida'
  | 'material'
  | 'otro';

/**
 * Tipos de día
 */
export type TipoDia = 'laborable' | 'sabado' | 'domingo' | 'festivo';

/**
 * Tipos de hora (para cálculo de tarifas)
 */
export type TipoHora = 'laborable' | 'sabado' | 'festivo';

/**
 * Días de la semana
 */
export type DiaSemana = 
  | 'Lunes' 
  | 'Martes' 
  | 'Miércoles' 
  | 'Jueves' 
  | 'Viernes' 
  | 'Sábado' 
  | 'Domingo';

/**
 * Estados de desplazamiento
 */
export type EstadoDesplazamiento = 
  | 'planificado' 
  | 'en_curso' 
  | 'completado' 
  | 'cancelado';

// ============================================================
// INTERFACES DE ENTIDADES PRINCIPALES
// ============================================================

/**
 * Usuario del sistema
 */
export interface Usuario {
  id: string;
  
  // Datos personales
  email: string;
  nombre: string;
  apellidos: string;
  nombreCompleto: string;         // Para búsquedas: "Apellidos, Nombre"
  dni?: string;
  telefono?: string;
  avatar?: string;
  
  // Datos laborales
  codigo: string;                 // Código interno empleado (ej: "T001")
  departamento?: string;
  cargo?: string;
  fechaAlta: Timestamp;
  fechaBaja?: Timestamp;
  activo: boolean;
  
  // === SISTEMA DE ROLES Y JERARQUÍA ===
  rol: RolUsuario;
  
  /**
   * ID del responsable directo (para aprobación de HORAS EXTRA)
   * - Técnico → su Jefe de Equipo
   * - Jefe de Equipo → Dirección
   * - Supervisor → Dirección
   */
  responsableHorasId?: string;
  responsableHorasNombre?: string;  // Desnormalizado
  
  /**
   * ID del supervisor de gastos (para aprobación de GASTOS)
   * - Técnico → Supervisor de Oficina
   * - Jefe de Equipo → Supervisor de Oficina o Dirección
   */
  supervisorGastosId?: string;
  supervisorGastosNombre?: string;  // Desnormalizado
  
  /**
   * IDs de técnicos a su cargo (solo para jefes de equipo)
   */
  equipoIds?: string[];
  
  // Tarifas especiales (si aplica)
  tarifasEspeciales?: Record<TipoTarifa, number>;
  
  // Auditoría
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Tarifa configurable
 */
export interface Tarifa {
  id: string;
  codigo: TipoTarifa;
  concepto: string;
  descripcion?: string;
  importe: number;
  unidad: 'hora' | 'dia' | 'noche' | 'km' | 'unidad';
  
  // Vigencia
  vigenciaDesde: Timestamp;
  vigenciaHasta?: Timestamp;
  activa: boolean;
  
  // Auditoría
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Proyecto / Cliente
 */
export interface Proyecto {
  id: string;
  codigo: string;
  nombre: string;
  cliente: string;
  clienteId?: string;
  ubicacion?: string;
  
  fechaInicio: Timestamp;
  fechaFin?: Timestamp;
  activo: boolean;
  
  // Responsable del proyecto
  responsableId?: string;
  responsableNombre?: string;
  
  // Presupuesto (opcional)
  presupuestoHoras?: number;
  presupuestoGastos?: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Festivo configurable
 */
export interface Festivo {
  id: string;
  fecha: string;              // formato: YYYY-MM-DD
  nombre: string;
  ambito: 'nacional' | 'autonomico' | 'local';
  año: number;
  activo: boolean;
}

// ============================================================
// REGISTRO DE HORAS
// ============================================================

/**
 * Registro de horas (normales y extras)
 */
export interface RegistroHoras {
  id: string;
  
  // === Identificadores ===
  usuarioId: string;
  usuarioNombre: string;          // Desnormalizado
  usuarioCodigo: string;          // Desnormalizado
  
  // === Fecha ===
  fecha: Timestamp;
  fechaStr: string;               // formato: YYYY-MM-DD (para queries)
  año: number;
  mes: number;
  semana: number;
  diaSemana: DiaSemana;
  tipoDia: TipoDia;
  esFestivo: boolean;
  
  // === Horas normales ===
  horasNormales: number;
  
  // === Horas extras ===
  horasExtras: number;
  tipoHoraExtra?: 'HORA_EXTRA_LABORABLE' | 'HORA_EXTRA_SABADO' | 'HORA_EXTRA_FESTIVO';
  tarifaHoraExtraAplicada?: number;
  importeHorasExtras: number;
  
  // === Nocturnidad ===
  horasNocturnidad: number;
  tarifaNocturnidadAplicada?: number;
  importeNocturnidad: number;
  
  // === Plus festivo ===
  plusFestivo: boolean;
  tarifaPlusFestivoAplicada?: number;
  importePlusFestivo: number;
  
  // === Proyecto (opcional) ===
  proyectoId?: string;
  proyectoNombre?: string;
  
  // === Totales ===
  totalHoras: number;             // Normales + Extras + Nocturnidad
  totalImporte: number;           // Suma de todos los importes
  
  // === SISTEMA DE APROBACIÓN DE HORAS ===
  estadoHorasExtras: EstadoAprobacion;
  
  /**
   * Aprobador asignado para las horas extra
   * (automáticamente el responsableHorasId del usuario)
   */
  aprobadorHorasId?: string;
  aprobadorHorasNombre?: string;
  
  /**
   * Historial de aprobaciones
   */
  historialAprobacionHoras: HistorialAprobacion[];
  
  // === Observaciones ===
  observaciones?: string;
  observacionesRechazo?: string;
  
  // === Auditoría ===
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  enviadoAt?: Timestamp;          // Cuando pasó de borrador a pendiente
}

// ============================================================
// REGISTRO DE GASTOS
// ============================================================

/**
 * Registro de gasto individual
 */
export interface RegistroGasto {
  id: string;
  
  // === Identificadores ===
  usuarioId: string;
  usuarioNombre: string;
  usuarioCodigo: string;
  
  // === Fecha ===
  fecha: Timestamp;
  fechaStr: string;
  año: number;
  mes: number;
  
  // === Tipo de gasto ===
  categoria: CategoriaGasto;
  subcategoria?: string;
  descripcion: string;
  
  // === Importe ===
  importe: number;
  moneda: string;                 // Default: EUR
  
  // === Kilometraje (si aplica) ===
  kilometros?: number;
  origen?: string;
  destino?: string;
  vehiculo?: 'propio' | 'empresa';
  tarifaKmAplicada?: number;
  
  // === Dieta (si aplica) ===
  tipoDieta?: 'completa' | 'media';
  tarifaDietaAplicada?: number;
  
  // === Adjuntos ===
  adjuntos: Adjunto[];
  
  // === Vinculaciones ===
  proyectoId?: string;
  proyectoNombre?: string;
  desplazamientoId?: string;
  registroHorasId?: string;       // Si está vinculado a un día específico
  
  // === SISTEMA DE APROBACIÓN DE GASTOS ===
  estadoGasto: EstadoAprobacion;
  
  /**
   * Aprobador asignado para este gasto
   * (automáticamente el supervisorGastosId del usuario)
   */
  aprobadorGastoId?: string;
  aprobadorGastoNombre?: string;
  
  /**
   * Historial de aprobaciones
   */
  historialAprobacionGasto: HistorialAprobacion[];
  
  // === Observaciones ===
  observaciones?: string;
  observacionesRechazo?: string;
  
  // === Auditoría ===
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  enviadoAt?: Timestamp;
}

/**
 * Archivo adjunto (ticket, factura, etc.)
 */
export interface Adjunto {
  id: string;
  url: string;
  nombreOriginal: string;
  tipoMime: string;
  tamaño: number;                 // en bytes
  
  // OCR (opcional)
  ocrProcesado: boolean;
  ocrDatos?: DatosOCR;
  
  subidoAt: Timestamp;
  subidoPor: string;
}

/**
 * Datos extraídos por OCR
 */
export interface DatosOCR {
  proveedor?: string;
  cif?: string;
  fecha?: string;
  importeDetectado?: number;
  conceptos?: string[];
  confianza: number;              // 0-1
}

// ============================================================
// SISTEMA DE APROBACIONES
// ============================================================

/**
 * Entrada en el historial de aprobación
 */
export interface HistorialAprobacion {
  id: string;
  fecha: Timestamp;
  usuarioId: string;
  usuarioNombre: string;
  accion: 'enviado' | 'aprobado' | 'rechazado' | 'devuelto' | 'editado';
  estadoAnterior: EstadoAprobacion;
  estadoNuevo: EstadoAprobacion;
  comentario?: string;
}

/**
 * Resumen de aprobaciones pendientes (para dashboards)
 */
export interface ResumenAprobacionesPendientes {
  usuarioId: string;              // El aprobador
  horasExtrasPendientes: number;
  gastosPendientes: number;
  importeHorasPendiente: number;
  importeGastosPendiente: number;
  ultimaActualizacion: Timestamp;
}

// ============================================================
// DESPLAZAMIENTOS
// ============================================================

/**
 * Desplazamiento / Viaje
 */
export interface Desplazamiento {
  id: string;
  
  // === Identificadores ===
  usuarioId: string;
  usuarioNombre: string;
  
  // === Fechas ===
  fechaInicio: Timestamp;
  fechaFin: Timestamp;
  dias: number;
  
  // === Destino ===
  destino: string;
  proyectoId?: string;
  proyectoNombre?: string;
  
  // === Hotel ===
  hotel?: {
    nombre: string;
    direccion?: string;
    telefono?: string;
    confirmacion?: string;
    costeEstimado?: number;
    costeReal?: number;
  };
  
  // === Transporte ===
  medioTransporte: 'vehiculo_empresa' | 'vehiculo_propio' | 'ave' | 'avion' | 'autobus' | 'otro';
  detalleTransporte?: string;
  kmIda?: number;
  kmVuelta?: number;
  costeTransporteEstimado?: number;
  costeTransporteReal?: number;
  
  // === Dietas ===
  dietasIncluidas: boolean;
  numeroDietas: number;
  costeDietasEstimado?: number;
  costeDietasReal?: number;
  
  // === Estado ===
  estado: EstadoDesplazamiento;
  
  // === Totales ===
  costeEstimadoTotal: number;
  costeRealTotal?: number;
  
  // === Observaciones ===
  observaciones?: string;
  
  // === Auditoría ===
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================
// RESÚMENES Y KPIS
// ============================================================

/**
 * Resumen mensual por usuario
 * Documento: resumenesMensuales/{usuarioId}_{año}_{mes}
 */
export interface ResumenMensualUsuario {
  id: string;
  
  // === Identificadores ===
  usuarioId: string;
  usuarioNombre: string;
  año: number;
  mes: number;
  
  // === Horas (SOLO APROBADAS) ===
  horasNormales: number;
  horasExtrasLaborables: number;
  horasExtrasSabado: number;
  horasExtrasFestivo: number;
  horasNocturnidad: number;
  totalHorasExtras: number;
  totalHoras: number;
  
  // === Importes Horas ===
  importeHorasExtrasLaborables: number;
  importeHorasExtrasSabado: number;
  importeHorasExtrasFestivo: number;
  importeNocturnidad: number;
  importePlusFestivo: number;
  importeTotalHoras: number;
  
  // === Gastos (SOLO APROBADOS) ===
  totalDietas: number;
  importeDietas: number;
  
  totalKilometros: number;
  importeKilometraje: number;
  
  totalCombustible: number;
  importeCombustible: number;
  
  totalHoteles: number;
  importeHoteles: number;
  
  totalOtrosGastos: number;
  importeOtrosGastos: number;
  
  importeTotalGastos: number;
  
  // === Total General ===
  importeTotalMes: number;
  
  // === Estado ===
  cerrado: boolean;
  fechaCierre?: Timestamp;
  
  // === Auditoría ===
  updatedAt: Timestamp;
}

/**
 * KPIs globales para dirección
 * Documento: kpis/{año} o kpis/{año}_{mes}
 */
export interface KPIsGlobales {
  id: string;
  año: number;
  mes?: number;                   // Si es null, es anual
  
  // === HORAS ===
  totalHorasExtras: number;
  totalHorasExtrasLaborables: number;
  totalHorasExtrasSabado: number;
  totalHorasExtrasFestivo: number;
  porcentajeHorasFestivo: number;
  
  costeTotalHorasExtras: number;
  costeMedioHoraExtra: number;
  costeMedioHoraLaborable: number;
  costeMedioHoraSabado: number;
  costeMedioHoraFestivo: number;
  
  // === Por Técnico ===
  horasPorTecnico: {
    usuarioId: string;
    usuarioNombre: string;
    totalHoras: number;
    totalImporte: number;
  }[];
  
  // === Por Proyecto ===
  horasPorProyecto: {
    proyectoId: string;
    proyectoNombre: string;
    totalHoras: number;
    totalImporte: number;
  }[];
  
  // === GASTOS ===
  costeTotalDietas: number;
  costeMedioDieta: number;
  numeroDietas: number;
  
  costeTotalKilometraje: number;
  totalKilometros: number;
  
  costeTotalHoteles: number;
  costeTotalOtrosGastos: number;
  costeTotalGastos: number;
  
  // === Gastos por categoría ===
  gastosPorCategoria: {
    categoria: CategoriaGasto;
    total: number;
    cantidad: number;
  }[];
  
  // === Gastos por técnico ===
  gastosPorTecnico: {
    usuarioId: string;
    usuarioNombre: string;
    totalGastos: number;
  }[];
  
  // === Gastos por proyecto ===
  gastosPorProyecto: {
    proyectoId: string;
    proyectoNombre: string;
    totalGastos: number;
  }[];
  
  // === TOTALES ===
  costeTotalAnual: number;
  costeMedioPorTecnico: number;
  costeMedioPorProyecto: number;
  
  // === Comparativas ===
  variacionVsAñoAnterior?: number;  // Porcentaje
  variacionVsMesAnterior?: number;
  
  // === Metadata ===
  numeroTecnicos: number;
  numeroProyectos: number;
  
  updatedAt: Timestamp;
}

/**
 * Ranking de técnicos
 */
export interface RankingTecnicos {
  año: number;
  mes?: number;
  tipo: 'horas' | 'gastos' | 'coste_total';
  
  ranking: {
    posicion: number;
    usuarioId: string;
    usuarioNombre: string;
    valor: number;
    porcentajeDelTotal: number;
  }[];
  
  updatedAt: Timestamp;
}

// ============================================================
// TIPOS AUXILIARES PARA FORMULARIOS Y API
// ============================================================

/**
 * Input para crear registro de horas
 */
export interface CrearRegistroHorasInput {
  fecha: Date;
  horasNormales: number;
  horasExtras?: number;
  horasNocturnidad?: number;
  plusFestivo?: boolean;
  proyectoId?: string;
  observaciones?: string;
  enviar?: boolean;               // Si true, pasa directamente a pendiente
}

/**
 * Input para crear gasto
 */
export interface CrearGastoInput {
  fecha: Date;
  categoria: CategoriaGasto;
  descripcion: string;
  importe: number;
  kilometros?: number;
  origen?: string;
  destino?: string;
  vehiculo?: 'propio' | 'empresa';
  proyectoId?: string;
  desplazamientoId?: string;
  observaciones?: string;
  enviar?: boolean;
}

/**
 * Filtros para consultas
 */
export interface FiltrosRegistros {
  usuarioId?: string;
  usuarioIds?: string[];
  proyectoId?: string;
  año?: number;
  mes?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
  estado?: EstadoAprobacion;
  soloMisRegistros?: boolean;
  soloMiEquipo?: boolean;
  soloPendientes?: boolean;
}

export interface FiltrosKPIs {
  año: number;
  mes?: number;
  usuarioId?: string;
  proyectoId?: string;
  agruparPor?: 'mes' | 'tecnico' | 'proyecto' | 'categoria';
}
