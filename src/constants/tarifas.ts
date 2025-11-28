import { TipoTarifa } from '@/types';

/**
 * Tarifas por defecto del sistema
 */
export const TARIFAS_POR_DEFECTO: Record<TipoTarifa, { concepto: string; importe: number; unidad: string }> = {
  HORA_NORMAL: {
    concepto: 'Hora normal',
    importe: 0,
    unidad: 'hora',
  },
  HORA_EXTRA_LABORABLE: {
    concepto: 'Hora extra día laborable',
    importe: 15,
    unidad: 'hora',
  },
  HORA_EXTRA_SABADO: {
    concepto: 'Hora extra sábado',
    importe: 18,
    unidad: 'hora',
  },
  HORA_EXTRA_FESTIVO: {
    concepto: 'Hora extra festivo/domingo',
    importe: 25,
    unidad: 'hora',
  },
  NOCTURNIDAD: {
    concepto: 'Plus nocturnidad',
    importe: 30,
    unidad: 'noche',
  },
  DIETA_COMPLETA: {
    concepto: 'Dieta completa',
    importe: 60,
    unidad: 'dia',
  },
  DIETA_MEDIA: {
    concepto: 'Media dieta',
    importe: 30,
    unidad: 'dia',
  },
  PLUS_FESTIVO: {
    concepto: 'Plus trabajo en festivo',
    importe: 50,
    unidad: 'dia',
  },
  KM_VEHICULO_PROPIO: {
    concepto: 'Kilómetro vehículo propio',
    importe: 0.26,
    unidad: 'km',
  },
  KM_VEHICULO_EMPRESA: {
    concepto: 'Kilómetro vehículo empresa',
    importe: 0,
    unidad: 'km',
  },
};

/**
 * Colores asociados a cada tipo de tarifa
 */
export const COLORES_TARIFAS: Record<TipoTarifa, string> = {
  HORA_NORMAL: 'bg-gray-100 text-gray-800',
  HORA_EXTRA_LABORABLE: 'bg-blue-100 text-blue-800',
  HORA_EXTRA_SABADO: 'bg-purple-100 text-purple-800',
  HORA_EXTRA_FESTIVO: 'bg-orange-100 text-orange-800',
  NOCTURNIDAD: 'bg-indigo-100 text-indigo-800',
  DIETA_COMPLETA: 'bg-green-100 text-green-800',
  DIETA_MEDIA: 'bg-emerald-100 text-emerald-800',
  PLUS_FESTIVO: 'bg-red-100 text-red-800',
  KM_VEHICULO_PROPIO: 'bg-cyan-100 text-cyan-800',
  KM_VEHICULO_EMPRESA: 'bg-teal-100 text-teal-800',
};

/**
 * Iconos para categorías de gasto
 */
export const ICONOS_CATEGORIAS_GASTO: Record<string, string> = {
  dieta: '🍽️',
  kilometraje: '🚗',
  combustible: '⛽',
  hotel: '🏨',
  parking: '🅿️',
  peaje: '🛣️',
  transporte_publico: '🚇',
  comida: '🍴',
  material: '🔧',
  otro: '📎',
};
