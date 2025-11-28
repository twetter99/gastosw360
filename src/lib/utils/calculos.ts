import { Tarifa, TipoDia, TipoTarifa, TipoHora, TarifaSnapshot } from '@/types';
import { Timestamp } from 'firebase/firestore';

/**
 * Determina el tipo de tarifa de hora extra según el tipo de día
 */
export function obtenerTipoTarifaHoraExtra(tipoDia: TipoDia): TipoTarifa {
  switch (tipoDia) {
    case 'festivo':
    case 'domingo':
      return 'HORA_EXTRA_FESTIVO';
    case 'sabado':
      return 'HORA_EXTRA_SABADO';
    default:
      return 'HORA_EXTRA_LABORABLE';
  }
}

/**
 * Obtiene la tarifa activa para un código
 */
export function obtenerTarifaActiva(
  tarifas: Tarifa[], 
  codigo: TipoTarifa, 
  fecha: Date = new Date()
): Tarifa | undefined {
  return tarifas.find(t => 
    t.codigo === codigo && 
    t.activa && 
    t.vigenciaDesde.toDate() <= fecha &&
    (!t.vigenciaHasta || t.vigenciaHasta.toDate() >= fecha)
  );
}

/**
 * Calcula horas trabajadas desde hora inicio y fin
 */
export function calcularHorasTrabajadas(horaInicio: string, horaFin: string): number {
  const [hI, mI] = horaInicio.split(':').map(Number);
  const [hF, mF] = horaFin.split(':').map(Number);
  
  let minutos = (hF * 60 + mF) - (hI * 60 + mI);
  if (minutos < 0) minutos += 24 * 60; // Cruce de medianoche
  
  return minutos / 60;
}

/**
 * Calcula el importe de horas extras (versión simple para formularios)
 * @param horaInicio - Hora de inicio (formato HH:MM)
 * @param horaFin - Hora de fin (formato HH:MM)
 * @param tipoHora - Tipo de hora (laborable, sabado, festivo)
 * @param tarifaLaborable - Tarifa por hora laborable
 * @param tarifaSabado - Tarifa por hora de sábado (opcional, default = tarifaLaborable * 1.5)
 * @param tarifaFestivo - Tarifa por hora festivo (opcional, default = tarifaLaborable * 2)
 */
export function calcularImporteHorasExtrasSimple(
  horaInicio: string,
  horaFin: string,
  tipoHora: TipoHora,
  tarifaLaborable: number,
  tarifaSabado?: number,
  tarifaFestivo?: number
): number {
  const horas = calcularHorasTrabajadas(horaInicio, horaFin);
  
  const tarifaS = tarifaSabado ?? tarifaLaborable * 1.5;
  const tarifaF = tarifaFestivo ?? tarifaLaborable * 2;
  
  switch (tipoHora) {
    case 'festivo':
      return horas * tarifaF;
    case 'sabado':
      return horas * tarifaS;
    default:
      return horas * tarifaLaborable;
  }
}

/**
 * Calcula el importe de horas extras (versión completa con tarifas de BD)
 */
export function calcularImporteHorasExtras(
  horas: number,
  tipoDia: TipoDia,
  tarifas: Tarifa[],
  tarifasEspeciales?: Record<string, number>
): { tipoTarifa: TipoTarifa; tarifaAplicada: number; importe: number } {
  const tipoTarifa = obtenerTipoTarifaHoraExtra(tipoDia);
  
  // Primero buscar tarifa especial del usuario
  let tarifaAplicada = tarifasEspeciales?.[tipoTarifa];
  
  // Si no hay especial, usar la general
  if (!tarifaAplicada) {
    const tarifa = obtenerTarifaActiva(tarifas, tipoTarifa);
    tarifaAplicada = tarifa?.importe ?? 0;
  }
  
  return {
    tipoTarifa,
    tarifaAplicada,
    importe: horas * tarifaAplicada,
  };
}

/**
 * Calcula el importe de nocturnidad
 */
export function calcularImporteNocturnidad(
  horas: number,
  tarifas: Tarifa[],
  tarifasEspeciales?: Record<string, number>
): { tarifaAplicada: number; importe: number } {
  let tarifaAplicada = tarifasEspeciales?.['NOCTURNIDAD'];
  
  if (!tarifaAplicada) {
    const tarifa = obtenerTarifaActiva(tarifas, 'NOCTURNIDAD');
    tarifaAplicada = tarifa?.importe ?? 0;
  }
  
  return {
    tarifaAplicada,
    importe: horas * tarifaAplicada,
  };
}

/**
 * Calcula el importe de dieta
 */
export function calcularImporteDieta(
  tipo: 'completa' | 'media',
  tarifas: Tarifa[],
  tarifasEspeciales?: Record<string, number>
): { tarifaAplicada: number; importe: number } {
  const codigoTarifa: TipoTarifa = tipo === 'completa' ? 'DIETA_COMPLETA' : 'DIETA_MEDIA';
  
  let tarifaAplicada = tarifasEspeciales?.[codigoTarifa];
  
  if (!tarifaAplicada) {
    const tarifa = obtenerTarifaActiva(tarifas, codigoTarifa);
    tarifaAplicada = tarifa?.importe ?? 0;
  }
  
  return {
    tarifaAplicada,
    importe: tarifaAplicada,
  };
}

/**
 * Calcula el importe de plus festivo
 */
export function calcularImportePlusFestivo(
  tarifas: Tarifa[],
  tarifasEspeciales?: Record<string, number>
): { tarifaAplicada: number; importe: number } {
  let tarifaAplicada = tarifasEspeciales?.['PLUS_FESTIVO'];
  
  if (!tarifaAplicada) {
    const tarifa = obtenerTarifaActiva(tarifas, 'PLUS_FESTIVO');
    tarifaAplicada = tarifa?.importe ?? 0;
  }
  
  return {
    tarifaAplicada,
    importe: tarifaAplicada,
  };
}

/**
 * Calcula el importe de kilometraje
 */
export function calcularImporteKilometraje(
  km: number,
  vehiculo: 'propio' | 'empresa',
  tarifas: Tarifa[]
): { tarifaAplicada: number; importe: number } {
  const codigoTarifa: TipoTarifa = vehiculo === 'propio' 
    ? 'KM_VEHICULO_PROPIO' 
    : 'KM_VEHICULO_EMPRESA';
  
  const tarifa = obtenerTarifaActiva(tarifas, codigoTarifa);
  const tarifaAplicada = tarifa?.importe ?? 0;
  
  return {
    tarifaAplicada,
    importe: km * tarifaAplicada,
  };
}

/**
 * Calcula todos los totales de un registro diario
 */
export interface TotalesRegistroDiario {
  importeHorasExtras: number;
  importeNocturnidad: number;
  importeDieta: number;
  importePlusFestivo: number;
  importeGastos: number;
  totalDia: number;
}

export function calcularTotalesRegistro(
  horasExtras: number,
  horasNocturnidad: number,
  aplicaDieta: boolean,
  tipoDieta: 'completa' | 'media',
  aplicaPlusFestivo: boolean,
  gastos: { importe: number }[],
  tipoDia: TipoDia,
  tarifas: Tarifa[],
  tarifasEspeciales?: Record<string, number>
): TotalesRegistroDiario {
  const importeHorasExtras = horasExtras > 0 
    ? calcularImporteHorasExtras(horasExtras, tipoDia, tarifas, tarifasEspeciales).importe 
    : 0;
  
  const importeNocturnidad = horasNocturnidad > 0 
    ? calcularImporteNocturnidad(horasNocturnidad, tarifas, tarifasEspeciales).importe 
    : 0;
  
  const importeDieta = aplicaDieta 
    ? calcularImporteDieta(tipoDieta, tarifas, tarifasEspeciales).importe 
    : 0;
  
  const importePlusFestivo = aplicaPlusFestivo 
    ? calcularImportePlusFestivo(tarifas, tarifasEspeciales).importe 
    : 0;
  
  const importeGastos = gastos.reduce((sum, g) => sum + g.importe, 0);
  
  return {
    importeHorasExtras,
    importeNocturnidad,
    importeDieta,
    importePlusFestivo,
    importeGastos,
    totalDia: importeHorasExtras + importeNocturnidad + importeDieta + importePlusFestivo + importeGastos,
  };
}

/**
 * Calcula resumen mensual a partir de registros
 */
export interface ResumenMensualCalculado {
  horasNormales: number;
  horasExtrasLaborables: number;
  horasExtrasSabado: number;
  horasExtrasFestivo: number;
  horasNocturnidad: number;
  totalHorasExtras: number;
  
  importeHorasExtrasLaborables: number;
  importeHorasExtrasSabado: number;
  importeHorasExtrasFestivo: number;
  importeNocturnidad: number;
  importePlusFestivo: number;
  importeTotalHoras: number;
  
  totalDietas: number;
  importeDietas: number;
  
  totalKilometros: number;
  importeKilometraje: number;
  
  importeOtrosGastos: number;
  importeTotalGastos: number;
  
  importeTotalMes: number;
}

export function calcularResumenMensual(
  registrosHoras: { 
    horasNormales: number;
    horasExtras: number;
    tipoHoraExtra?: string;
    importeHorasExtras: number;
    horasNocturnidad: number;
    importeNocturnidad: number;
    importePlusFestivo: number;
    estadoHorasExtras: string;
  }[],
  gastos: {
    categoria: string;
    importe: number;
    kilometros?: number;
    estadoGasto: string;
  }[]
): ResumenMensualCalculado {
  // Solo contar registros aprobados
  const horasAprobadas = registrosHoras.filter(r => r.estadoHorasExtras === 'aprobado');
  const gastosAprobados = gastos.filter(g => g.estadoGasto === 'aprobado');
  
  // Calcular horas
  const horasNormales = horasAprobadas.reduce((sum, r) => sum + r.horasNormales, 0);
  const horasExtrasLaborables = horasAprobadas
    .filter(r => r.tipoHoraExtra === 'HORA_EXTRA_LABORABLE')
    .reduce((sum, r) => sum + r.horasExtras, 0);
  const horasExtrasSabado = horasAprobadas
    .filter(r => r.tipoHoraExtra === 'HORA_EXTRA_SABADO')
    .reduce((sum, r) => sum + r.horasExtras, 0);
  const horasExtrasFestivo = horasAprobadas
    .filter(r => r.tipoHoraExtra === 'HORA_EXTRA_FESTIVO')
    .reduce((sum, r) => sum + r.horasExtras, 0);
  const horasNocturnidad = horasAprobadas.reduce((sum, r) => sum + r.horasNocturnidad, 0);
  
  const importeHorasExtrasLaborables = horasAprobadas
    .filter(r => r.tipoHoraExtra === 'HORA_EXTRA_LABORABLE')
    .reduce((sum, r) => sum + r.importeHorasExtras, 0);
  const importeHorasExtrasSabado = horasAprobadas
    .filter(r => r.tipoHoraExtra === 'HORA_EXTRA_SABADO')
    .reduce((sum, r) => sum + r.importeHorasExtras, 0);
  const importeHorasExtrasFestivo = horasAprobadas
    .filter(r => r.tipoHoraExtra === 'HORA_EXTRA_FESTIVO')
    .reduce((sum, r) => sum + r.importeHorasExtras, 0);
  const importeNocturnidad = horasAprobadas.reduce((sum, r) => sum + r.importeNocturnidad, 0);
  const importePlusFestivo = horasAprobadas.reduce((sum, r) => sum + r.importePlusFestivo, 0);
  
  // Calcular gastos
  const dietasAprobadas = gastosAprobados.filter(g => g.categoria === 'dieta');
  const kmAprobados = gastosAprobados.filter(g => g.categoria === 'kilometraje');
  const otrosGastosAprobados = gastosAprobados.filter(g => 
    !['dieta', 'kilometraje'].includes(g.categoria)
  );
  
  const totalDietas = dietasAprobadas.length;
  const importeDietas = dietasAprobadas.reduce((sum, g) => sum + g.importe, 0);
  
  const totalKilometros = kmAprobados.reduce((sum, g) => sum + (g.kilometros || 0), 0);
  const importeKilometraje = kmAprobados.reduce((sum, g) => sum + g.importe, 0);
  
  const importeOtrosGastos = otrosGastosAprobados.reduce((sum, g) => sum + g.importe, 0);
  const importeTotalGastos = importeDietas + importeKilometraje + importeOtrosGastos;
  
  const importeTotalHoras = importeHorasExtrasLaborables + importeHorasExtrasSabado + 
    importeHorasExtrasFestivo + importeNocturnidad + importePlusFestivo;
  
  return {
    horasNormales,
    horasExtrasLaborables,
    horasExtrasSabado,
    horasExtrasFestivo,
    horasNocturnidad,
    totalHorasExtras: horasExtrasLaborables + horasExtrasSabado + horasExtrasFestivo,
    
    importeHorasExtrasLaborables,
    importeHorasExtrasSabado,
    importeHorasExtrasFestivo,
    importeNocturnidad,
    importePlusFestivo,
    importeTotalHoras,
    
    totalDietas,
    importeDietas,
    
    totalKilometros,
    importeKilometraje,
    
    importeOtrosGastos,
    importeTotalGastos,
    
    importeTotalMes: importeTotalHoras + importeTotalGastos,
  };
}

// ============================================================
// SISTEMA DE SNAPSHOTS DE TARIFAS
// ============================================================

/**
 * Crea un snapshot inmutable de una tarifa en el momento actual.
 * Este snapshot se guarda junto con el registro para mantener trazabilidad.
 * 
 * IMPORTANTE: Usar este snapshot garantiza que:
 * 1. Cambios futuros en tarifas NO afectan registros históricos
 * 2. Se puede auditar qué tarifa exacta se usó
 * 3. Al editar un registro, se puede recalcular con la tarifa actual si se desea
 * 
 * @param tarifa - La tarifa actual del sistema
 * @returns TarifaSnapshot - Copia inmutable de la tarifa
 */
export function crearTarifaSnapshot(tarifa: Tarifa): TarifaSnapshot {
  return {
    tarifaId: tarifa.id,
    codigo: tarifa.codigo,
    concepto: tarifa.concepto,
    importe: tarifa.importe,
    unidad: tarifa.unidad,
    vigenciaDesde: tarifa.vigenciaDesde,
    capturadoAt: Timestamp.now(),
  };
}

/**
 * Calcula el importe usando el snapshot guardado (para reportes históricos)
 * o la tarifa actual (para recálculo)
 */
export function calcularConSnapshot(
  unidades: number,
  snapshot?: TarifaSnapshot,
  tarifaActual?: Tarifa
): { importe: number; usandoSnapshot: boolean; tarifa: number } {
  // Priorizar snapshot (datos históricos inmutables)
  if (snapshot) {
    return {
      importe: unidades * snapshot.importe,
      usandoSnapshot: true,
      tarifa: snapshot.importe,
    };
  }
  
  // Si no hay snapshot, usar tarifa actual
  if (tarifaActual) {
    return {
      importe: unidades * tarifaActual.importe,
      usandoSnapshot: false,
      tarifa: tarifaActual.importe,
    };
  }
  
  // Sin tarifa disponible
  return {
    importe: 0,
    usandoSnapshot: false,
    tarifa: 0,
  };
}

/**
 * Estructura de resultado de cálculo con información de tarifa
 */
export interface ResultadoCalculo {
  unidades: number;           // Horas, km, días, etc.
  tarifa: number;             // Tarifa aplicada
  importe: number;            // unidades * tarifa
  snapshot: TarifaSnapshot;   // Snapshot para guardar
}

/**
 * Calcula horas extras guardando el snapshot de tarifa
 * Esta es la función que debe usarse al CREAR/EDITAR un registro
 */
export function calcularHorasExtrasConSnapshot(
  horas: number,
  tipoDia: TipoDia,
  tarifas: Tarifa[],
  tarifasEspeciales?: Record<string, number>
): ResultadoCalculo | null {
  const tipoTarifa = obtenerTipoTarifaHoraExtra(tipoDia);
  
  // Buscar tarifa especial del usuario primero
  const tarifaEspecial = tarifasEspeciales?.[tipoTarifa];
  
  // Buscar tarifa general
  const tarifa = obtenerTarifaActiva(tarifas, tipoTarifa);
  
  if (!tarifa && !tarifaEspecial) {
    return null;
  }
  
  // Usar tarifa especial si existe, sino la general
  const importeTarifa = tarifaEspecial ?? tarifa!.importe;
  
  // Crear snapshot (si hay tarifa del sistema)
  const snapshot = tarifa ? crearTarifaSnapshot(tarifa) : {
    tarifaId: 'especial',
    codigo: tipoTarifa,
    concepto: `Tarifa especial ${tipoTarifa}`,
    importe: tarifaEspecial!,
    unidad: 'hora' as const,
    vigenciaDesde: Timestamp.now(),
    capturadoAt: Timestamp.now(),
  };
  
  return {
    unidades: horas,
    tarifa: importeTarifa,
    importe: horas * importeTarifa,
    snapshot,
  };
}

/**
 * Calcula kilometraje guardando el snapshot de tarifa
 */
export function calcularKilometrajeConSnapshot(
  kilometros: number,
  tarifas: Tarifa[],
  vehiculo: 'propio' | 'empresa' = 'propio'
): ResultadoCalculo | null {
  const codigoTarifa: TipoTarifa = vehiculo === 'propio' ? 'KM_VEHICULO_PROPIO' : 'KM_VEHICULO_EMPRESA';
  const tarifa = obtenerTarifaActiva(tarifas, codigoTarifa);
  
  if (!tarifa) {
    return null;
  }
  
  return {
    unidades: kilometros,
    tarifa: tarifa.importe,
    importe: kilometros * tarifa.importe,
    snapshot: crearTarifaSnapshot(tarifa),
  };
}

/**
 * Calcula dieta guardando el snapshot de tarifa
 */
export function calcularDietaConSnapshot(
  tipo: 'completa' | 'media',
  tarifas: Tarifa[]
): ResultadoCalculo | null {
  const codigoTarifa: TipoTarifa = tipo === 'completa' ? 'DIETA_COMPLETA' : 'DIETA_MEDIA';
  const tarifa = obtenerTarifaActiva(tarifas, codigoTarifa);
  
  if (!tarifa) {
    return null;
  }
  
  return {
    unidades: 1, // Una dieta
    tarifa: tarifa.importe,
    importe: tarifa.importe,
    snapshot: crearTarifaSnapshot(tarifa),
  };
}

/**
 * Calcula nocturnidad guardando el snapshot de tarifa
 */
export function calcularNocturnidadConSnapshot(
  horas: number,
  tarifas: Tarifa[]
): ResultadoCalculo | null {
  const tarifa = obtenerTarifaActiva(tarifas, 'NOCTURNIDAD');
  
  if (!tarifa) {
    return null;
  }
  
  return {
    unidades: horas,
    tarifa: tarifa.importe,
    importe: horas * tarifa.importe,
    snapshot: crearTarifaSnapshot(tarifa),
  };
}
