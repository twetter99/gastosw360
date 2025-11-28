import { z } from 'zod';

const rolUsuarioEnum = z.enum([
  'tecnico',
  'jefe_equipo',
  'supervisor_oficina',
  'direccion',
  'admin',
]);

/**
 * Schema base para usuario (sin refinements)
 */
export const usuarioBaseSchema = z.object({
  email: z.string()
    .email('Email no válido')
    .min(1, 'El email es obligatorio'),
  nombre: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  apellidos: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  dni: z.string()
    .regex(/^[0-9]{8}[A-Z]$/, 'DNI no válido (formato: 12345678A)')
    .optional()
    .or(z.literal('')),
  telefono: z.string()
    .regex(/^[6-9][0-9]{8}$/, 'Teléfono no válido')
    .optional()
    .or(z.literal('')),
  
  codigo: z.string()
    .min(1, 'El código es obligatorio')
    .max(10, 'Máximo 10 caracteres'),
  departamento: z.string().max(50).optional(),
  cargo: z.string().max(50).optional(),
  
  rol: rolUsuarioEnum,
  responsableHorasId: z.string().optional(),
  supervisorGastosId: z.string().optional(),
  
  activo: z.boolean().default(true),
});

/**
 * Schema para usuario con validaciones
 */
export const usuarioSchema = usuarioBaseSchema.refine((data) => {
  // Si no es admin/direccion, debe tener responsable de horas
  if (['tecnico', 'jefe_equipo', 'supervisor_oficina'].includes(data.rol) && !data.responsableHorasId) {
    return false;
  }
  return true;
}, {
  message: 'Debe asignar un responsable para las horas extra',
  path: ['responsableHorasId'],
}).refine((data) => {
  // Todos excepto admin/direccion deben tener supervisor de gastos
  if (['tecnico', 'jefe_equipo', 'supervisor_oficina'].includes(data.rol) && !data.supervisorGastosId) {
    return false;
  }
  return true;
}, {
  message: 'Debe asignar un supervisor de gastos',
  path: ['supervisorGastosId'],
});

export type UsuarioInput = z.infer<typeof usuarioSchema>;

/**
 * Schema para editar usuario (campos opcionales)
 */
export const editarUsuarioSchema = usuarioBaseSchema.partial().extend({
  id: z.string(),
});

export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>;
