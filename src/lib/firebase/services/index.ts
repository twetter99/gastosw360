/**
 * Servicios de Firebase - Exportaciones centralizadas
 * 
 * USO:
 * ```ts
 * import { horasService, usuariosService } from '@/lib/firebase/services';
 * 
 * // Obtener datos
 * const horas = await horasService.getByUsuario(userId);
 * const usuarios = await usuariosService.getActivos();
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

// Re-exportar tipos comunes
export type { QueryConstraint } from 'firebase/firestore';
