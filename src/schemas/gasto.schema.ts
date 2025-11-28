import { z } from 'zod';

const categoriaGastoEnum = z.enum([
  'dieta',
  'kilometraje',
  'combustible',
  'hotel',
  'parking',
  'peaje',
  'transporte_publico',
  'comida',
  'material',
  'otro',
]);

/**
 * Schema para registro de gasto
 */
export const gastoSchema = z.object({
  fecha: z.date({
    required_error: 'La fecha es obligatoria',
  }),
  categoria: categoriaGastoEnum,
  descripcion: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  importe: z.number()
    .min(0.01, 'El importe debe ser mayor que 0')
    .max(10000, 'El importe no puede superar 10.000€'),
  
  // Kilometraje
  esKilometraje: z.boolean().default(false),
  kilometros: z.number().min(0).max(2000).optional(),
  origen: z.string().max(100).optional(),
  destino: z.string().max(100).optional(),
  vehiculo: z.enum(['propio', 'empresa']).optional(),
  
  // Dieta
  esDieta: z.boolean().default(false),
  tipoDieta: z.enum(['completa', 'media']).optional(),
  
  // Vinculaciones
  proyectoId: z.string().optional(),
  desplazamientoId: z.string().optional(),
  
  observaciones: z.string().max(500).optional(),
}).refine((data) => {
  // Si es kilometraje, los km son obligatorios
  if (data.categoria === 'kilometraje' && (!data.kilometros || data.kilometros <= 0)) {
    return false;
  }
  return true;
}, {
  message: 'Los kilómetros son obligatorios para gastos de kilometraje',
  path: ['kilometros'],
}).refine((data) => {
  // Si es dieta, el tipo es obligatorio
  if (data.categoria === 'dieta' && !data.tipoDieta) {
    return false;
  }
  return true;
}, {
  message: 'El tipo de dieta es obligatorio',
  path: ['tipoDieta'],
});

export type GastoInput = z.infer<typeof gastoSchema>;

/**
 * Schema para gasto rápido (simplificado para móvil)
 */
export const gastoRapidoSchema = z.object({
  fecha: z.date().default(() => new Date()),
  categoria: categoriaGastoEnum,
  importe: z.number().min(0.01).max(10000),
  descripcion: z.string().max(200).optional(),
});

export type GastoRapidoInput = z.infer<typeof gastoRapidoSchema>;
