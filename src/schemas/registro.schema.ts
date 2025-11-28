import { z } from 'zod';

/**
 * Schema para registro de horas
 */
export const registroHorasSchema = z.object({
  fecha: z.date({
    required_error: 'La fecha es obligatoria',
  }),
  horasNormales: z.number()
    .min(0, 'Las horas no pueden ser negativas')
    .max(24, 'Las horas no pueden superar 24'),
  horasExtras: z.number()
    .min(0, 'Las horas extras no pueden ser negativas')
    .max(16, 'Las horas extras no pueden superar 16')
    .default(0),
  horasNocturnidad: z.number()
    .min(0, 'Las horas de nocturnidad no pueden ser negativas')
    .max(12, 'Las horas de nocturnidad no pueden superar 12')
    .default(0),
  plusFestivo: z.boolean().default(false),
  proyectoId: z.string().optional(),
  observaciones: z.string().max(500, 'Máximo 500 caracteres').optional(),
}).refine((data) => {
  return data.horasNormales + data.horasExtras <= 24;
}, {
  message: 'La suma de horas normales y extras no puede superar 24',
  path: ['horasExtras'],
});

export type RegistroHorasInput = z.infer<typeof registroHorasSchema>;

/**
 * Schema para registro rápido
 */
export const registroRapidoSchema = z.object({
  fecha: z.date({
    required_error: 'La fecha es obligatoria',
  }),
  plantilla: z.enum(['dia_normal', 'dia_desplazamiento', 'festivo_trabajado', 'personalizado']),
  horasExtras: z.number().min(0).max(16).optional(),
  observaciones: z.string().max(500).optional(),
});

export type RegistroRapidoInput = z.infer<typeof registroRapidoSchema>;
