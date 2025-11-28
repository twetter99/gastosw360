import { z } from 'zod';

const tipoTarifaEnum = z.enum([
  'HORA_NORMAL',
  'HORA_EXTRA_LABORABLE',
  'HORA_EXTRA_SABADO',
  'HORA_EXTRA_FESTIVO',
  'NOCTURNIDAD',
  'DIETA_COMPLETA',
  'DIETA_MEDIA',
  'PLUS_FESTIVO',
  'KM_VEHICULO_PROPIO',
  'KM_VEHICULO_EMPRESA',
]);

/**
 * Schema para tarifa
 */
export const tarifaSchema = z.object({
  codigo: tipoTarifaEnum,
  concepto: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().max(300).optional(),
  importe: z.number()
    .min(0.01, 'El importe debe ser mayor que 0')
    .max(1000, 'El importe no puede superar 1.000€'),
  unidad: z.enum(['hora', 'dia', 'noche', 'km', 'unidad']),
  vigenciaDesde: z.date({
    required_error: 'La fecha de vigencia es obligatoria',
  }),
  vigenciaHasta: z.date().optional(),
  activa: z.boolean().default(true),
}).refine((data) => {
  if (data.vigenciaHasta && data.vigenciaHasta <= data.vigenciaDesde) {
    return false;
  }
  return true;
}, {
  message: 'La fecha de fin debe ser posterior a la de inicio',
  path: ['vigenciaHasta'],
});

export type TarifaInput = z.infer<typeof tarifaSchema>;

/**
 * Schema para proyecto
 */
export const proyectoSchema = z.object({
  codigo: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Z0-9-]+$/, 'Solo mayúsculas, números y guiones'),
  nombre: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  cliente: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  ubicacion: z.string().max(200).optional(),
  fechaInicio: z.date({
    required_error: 'La fecha de inicio es obligatoria',
  }),
  fechaFin: z.date().optional(),
  responsableId: z.string().optional(),
  presupuestoHoras: z.number().min(0).optional(),
  presupuestoGastos: z.number().min(0).optional(),
  activo: z.boolean().default(true),
});

export type ProyectoInput = z.infer<typeof proyectoSchema>;

/**
 * Schema para festivo
 */
export const festivoSchema = z.object({
  fecha: z.date({
    required_error: 'La fecha es obligatoria',
  }),
  nombre: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  ambito: z.enum(['nacional', 'autonomico', 'local']),
});

export type FestivoInput = z.infer<typeof festivoSchema>;

/**
 * Schema para aprobación
 */
export const aprobacionSchema = z.object({
  accion: z.enum(['aprobar', 'rechazar', 'devolver']),
  comentario: z.string().max(500).optional(),
}).refine((data) => {
  if ((data.accion === 'rechazar' || data.accion === 'devolver') && !data.comentario) {
    return false;
  }
  return true;
}, {
  message: 'El comentario es obligatorio al rechazar o devolver',
  path: ['comentario'],
});

export type AprobacionInput = z.infer<typeof aprobacionSchema>;
