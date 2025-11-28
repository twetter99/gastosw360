import { z } from 'zod';

/**
 * Schema para desplazamiento
 */
export const desplazamientoSchema = z.object({
  fechaInicio: z.date({
    required_error: 'La fecha de inicio es obligatoria',
  }),
  fechaFin: z.date({
    required_error: 'La fecha de fin es obligatoria',
  }),
  destino: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  proyectoId: z.string().optional(),
  
  // Hotel
  incluyeHotel: z.boolean().default(false),
  hotelNombre: z.string().max(100).optional(),
  hotelDireccion: z.string().max(200).optional(),
  hotelTelefono: z.string().max(20).optional(),
  hotelConfirmacion: z.string().max(50).optional(),
  hotelCosteEstimado: z.number().min(0).optional(),
  
  // Transporte
  medioTransporte: z.enum([
    'vehiculo_empresa',
    'vehiculo_propio',
    'ave',
    'avion',
    'autobus',
    'otro',
  ]),
  detalleTransporte: z.string().max(200).optional(),
  kmIda: z.number().min(0).max(3000).optional(),
  kmVuelta: z.number().min(0).max(3000).optional(),
  costeTransporteEstimado: z.number().min(0).optional(),
  
  // Dietas
  dietasIncluidas: z.boolean().default(true),
  numeroDietas: z.number().min(0).max(60).optional(),
  
  observaciones: z.string().max(500).optional(),
}).refine((data) => {
  return data.fechaFin >= data.fechaInicio;
}, {
  message: 'La fecha de fin debe ser posterior a la de inicio',
  path: ['fechaFin'],
}).refine((data) => {
  if (data.incluyeHotel && !data.hotelNombre) {
    return false;
  }
  return true;
}, {
  message: 'El nombre del hotel es obligatorio si se incluye alojamiento',
  path: ['hotelNombre'],
});

export type DesplazamientoInput = z.infer<typeof desplazamientoSchema>;
