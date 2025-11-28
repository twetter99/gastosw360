/**
 * Exportaciones centralizadas de React Query hooks
 * 
 * USO:
 * ```tsx
 * import { 
 *   useHorasUsuario, 
 *   useCrearHoras, 
 *   useUsuariosActivos,
 *   useProyectosActivos 
 * } from '@/hooks/queries';
 * 
 * function MiComponente() {
 *   const { data: horas, isLoading } = useHorasUsuario(userId);
 *   const { mutate: crear, isPending } = useCrearHoras();
 *   const { data: usuarios } = useUsuariosActivos();
 *   const { data: proyectos } = useProyectosActivos();
 * }
 * ```
 */

// Horas
export {
  horasKeys,
  useHoras,
  useHorasUsuario,
  useHorasMes,
  useHorasPendientes,
  useHora,
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
  usuariosKeys,
  useUsuarios,
  useUsuariosActivos,
  useUsuariosByRol,
  useTecnicos,
  useUsuariosEquipo,
  useUsuario,
  useUsuarioByEmail,
  useCrearUsuario,
  useActualizarUsuario,
  useEliminarUsuario,
  useDesactivarUsuario,
  useReactivarUsuario,
} from './useUsuarios';

// Proyectos
export {
  proyectosKeys,
  useProyectos,
  useProyectosActivos,
  useProyecto,
  useCrearProyecto,
  useActualizarProyecto,
  useEliminarProyecto,
  useDesactivarProyecto,
} from './useProyectos';

// Tarifas
export {
  tarifasKeys,
  useTarifas,
  useTarifasActivas,
  useTarifaVigente,
  useTarifa,
  useCrearTarifa,
  useActualizarTarifa,
  useEliminarTarifa,
  useDesactivarTarifa,
} from './useTarifas';

// Festivos
export {
  festivosKeys,
  useFestivos,
  useFestivosAño,
  useFestivo,
  useEsFestivo,
  useCrearFestivo,
  useActualizarFestivo,
  useEliminarFestivo,
} from './useFestivos';

// Gastos
export {
  gastosKeys,
  useGastos,
  useGastosUsuario,
  useGastosMes,
  useGastosPendientes,
  useGasto,
  useCrearGasto,
  useActualizarGasto,
  useEliminarGasto,
  useEnviarGastoAAprobacion,
  useAprobarGasto,
  useRechazarGasto,
} from './useGastos';

// Hooks de compatibilidad (API legacy con React Query)
export {
  useUsuariosCompat,
  useProyectosCompat,
  useTarifasCompat,
  useFestivosCompat,
} from './compat';
