/**
 * Servicios de Firebase - Exportaciones centralizadas
 * 
 * USO:
 * ```ts
 * import { horasService, usuariosService, proyectosService } from '@/lib/firebase/services';
 * 
 * // Obtener datos
 * const horas = await horasService.getByUsuario(userId);
 * const usuarios = await usuariosService.getActivos();
 * const proyectos = await proyectosService.getActivos();
 * 
 * // Crear
 * const id = await horasService.createRegistro({ ... });
 * 
 * // Actualizar
 * await horasService.update(id, { ... });
 * 
 * // Eliminar
 * await horasService.delete(id);
 * ```
 */

// Base class para crear nuevos servicios
export { BaseFirestoreService, type FirestoreDocument, type ServiceOptions } from './base';

// Servicios específicos
export { horasService, type RegistroHorasDB, type CreateHorasInput } from './horas';
export { usuariosService, type UsuarioDB, type CreateUsuarioInput } from './usuarios';
export { proyectosService, type ProyectoDB, type CreateProyectoInput } from './proyectos';
export { tarifasService, type TarifaDB, type CreateTarifaInput } from './tarifas';
export { festivosService, type FestivoDB, type CreateFestivoInput } from './festivos';
export { gastosService, type GastoDB, type CreateGastoInput } from './gastos';

// Re-exportar tipos comunes
export type { QueryConstraint } from 'firebase/firestore';
