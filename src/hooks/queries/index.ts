/**
 * Exportaciones centralizadas de React Query hooks
 * 
 * USO:
 * ```tsx
 * import { useHorasUsuario, useCrearHoras, useUsuariosActivos } from '@/hooks/queries';
 * 
 * function MiComponente() {
 *   const { data: horas, isLoading } = useHorasUsuario(userId);
 *   const { mutate: crear } = useCrearHoras();
 *   const { data: usuarios } = useUsuariosActivos();
 * }
 * ```
 */

// Horas
export {
  // Query keys (para invalidación manual si es necesario)
  horasKeys,
  // Queries
  useHoras,
  useHorasUsuario,
  useHorasMes,
  useHorasPendientes,
  useHora,
  // Mutations
  useCrearHoras,
  useActualizarHoras,
  useEliminarHoras,
  useEnviarAAprobacion,
  useAprobarHoras,
  useRechazarHoras,
  useDevolverHoras,
} from './useHoras';

// Usuarios
export {
  // Query keys
  usuariosKeys,
  // Queries
  useUsuarios,
  useUsuariosActivos,
  useUsuariosByRol,
  useTecnicos,
  useUsuariosEquipo,
  useUsuario,
  useUsuarioByEmail,
  // Mutations
  useCrearUsuario,
  useActualizarUsuario,
  useEliminarUsuario,
  useDesactivarUsuario,
  useReactivarUsuario,
} from './useUsuarios';
