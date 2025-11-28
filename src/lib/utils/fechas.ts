import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  getDay,
  getWeek,
  isWeekend,
  isSameDay,
  addDays,
  subDays,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { DiaSemana, TipoDia, TipoHora } from '@/types';

/**
 * Formatea una fecha para mostrar
 */
export function formatearFecha(fecha: Date | string, formato: string = 'dd/MM/yyyy'): string {
  const date = typeof fecha === 'string' ? parseISO(fecha) : fecha;
  return format(date, formato, { locale: es });
}

/**
 * Formatea fecha larga: "Miércoles, 26 de noviembre de 2025"
 */
export function formatearFechaLarga(fecha: Date | string): string {
  const date = typeof fecha === 'string' ? parseISO(fecha) : fecha;
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Formatea fecha corta: "26 nov"
 */
export function formatearFechaCorta(fecha: Date | string): string {
  const date = typeof fecha === 'string' ? parseISO(fecha) : fecha;
  return format(date, 'd MMM', { locale: es });
}

/**
 * Convierte fecha a string ISO (YYYY-MM-DD)
 */
export function fechaAString(fecha: Date): string {
  return format(fecha, 'yyyy-MM-dd');
}

/**
 * Obtiene el día de la semana
 */
export function obtenerDiaSemana(fecha: Date): DiaSemana {
  const dias: DiaSemana[] = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[getDay(fecha)];
}

/**
 * Determina el tipo de día
 */
export function obtenerTipoDia(fecha: Date, festivos: string[] = []): TipoDia {
  const fechaStr = fechaAString(fecha);
  
  if (festivos.includes(fechaStr)) {
    return 'festivo';
  }
  
  const dia = getDay(fecha);
  if (dia === 0) return 'domingo';
  if (dia === 6) return 'sabado';
  return 'laborable';
}

/**
 * Verifica si es día laborable (no es fin de semana ni festivo)
 */
export function esDiaLaborable(fecha: Date, festivos: string[] = []): boolean {
  const tipoDia = obtenerTipoDia(fecha, festivos);
  return tipoDia === 'laborable';
}

/**
 * Verifica si es fin de semana
 */
export function esFinDeSemana(fecha: Date): boolean {
  return isWeekend(fecha);
}

/**
 * Obtiene información del día (tipo y nombre)
 * Usado para mostrar al usuario qué tipo de día es
 */
export function getInfoDia(fecha: Date, festivos: string[] = []): { tipo: TipoHora; nombre: string } {
  const fechaStr = fechaAString(fecha);
  const dia = getDay(fecha);
  
  // Verificar si es festivo
  if (festivos.includes(fechaStr)) {
    return { tipo: 'festivo', nombre: 'Día festivo' };
  }
  
  // Verificar día de la semana
  if (dia === 0) {
    return { tipo: 'festivo', nombre: 'Domingo' };
  }
  if (dia === 6) {
    return { tipo: 'sabado', nombre: 'Sábado' };
  }
  
  const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return { tipo: 'laborable', nombre: nombresDias[dia] };
}

/**
 * Obtiene el número de semana del año
 */
export function obtenerSemana(fecha: Date): number {
  return getWeek(fecha, { locale: es, weekStartsOn: 1 });
}

/**
 * Obtiene los días de un mes
 */
export function obtenerDiasMes(año: number, mes: number): Date[] {
  const inicio = startOfMonth(new Date(año, mes - 1));
  const fin = endOfMonth(new Date(año, mes - 1));
  return eachDayOfInterval({ start: inicio, end: fin });
}

/**
 * Obtiene los días para mostrar en un calendario mensual (incluye días de otros meses)
 */
export function obtenerDiasCalendario(año: number, mes: number): Date[] {
  const inicio = startOfWeek(startOfMonth(new Date(año, mes - 1)), { weekStartsOn: 1 });
  const fin = endOfWeek(endOfMonth(new Date(año, mes - 1)), { weekStartsOn: 1 });
  return eachDayOfInterval({ start: inicio, end: fin });
}

/**
 * Verifica si dos fechas son el mismo día
 */
export function esMismoDia(fecha1: Date, fecha2: Date): boolean {
  return isSameDay(fecha1, fecha2);
}

/**
 * Añade días a una fecha
 */
export function agregarDias(fecha: Date, dias: number): Date {
  return dias >= 0 ? addDays(fecha, dias) : subDays(fecha, Math.abs(dias));
}

/**
 * Añade meses a una fecha
 */
export function agregarMeses(fecha: Date, meses: number): Date {
  return meses >= 0 ? addMonths(fecha, meses) : subMonths(fecha, Math.abs(meses));
}

/**
 * Nombres de los meses
 */
export const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Nombres cortos de los días
 */
export const NOMBRES_DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
