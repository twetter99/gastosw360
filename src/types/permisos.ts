/**
 * ============================================================
 * SISTEMA DE PERMISOS - GASTOS EXTRA PRO
 * ============================================================
 * 
 * Define qué puede hacer cada rol en el sistema
 */

import { RolUsuario, NIVELES_ROL } from './index';

// ============================================================
// DEFINICIÓN DE PERMISOS
// ============================================================

export type Permiso =
  // === Registros propios ===
  | 'registros:crear'
  | 'registros:ver_propios'
  | 'registros:editar_propios'
  | 'registros:eliminar_propios'
  | 'registros:enviar'
  
  // === Registros de equipo (jefe_equipo) ===
  | 'registros:ver_equipo'
  | 'registros:aprobar_horas_equipo'
  
  // === Registros globales ===
  | 'registros:ver_todos'
  | 'registros:editar_todos'
  | 'registros:aprobar_horas_todos'
  
  // === Gastos propios ===
  | 'gastos:crear'
  | 'gastos:ver_propios'
  | 'gastos:editar_propios'
  | 'gastos:eliminar_propios'
  | 'gastos:enviar'
  
  // === Gastos globales ===
  | 'gastos:ver_todos'
  | 'gastos:aprobar_todos'
  
  // === Reportes y KPIs ===
  | 'reportes:ver_propios'
  | 'reportes:ver_equipo'
  | 'reportes:ver_todos'
  | 'reportes:exportar'
  | 'kpis:ver'
  | 'kpis:ver_detalle'
  
  // === Configuración ===
  | 'config:tarifas'
  | 'config:proyectos'
  | 'config:festivos'
  | 'config:usuarios'
  | 'config:roles'
  | 'config:sistema';

// ============================================================
// PERMISOS POR ROL
// ============================================================

export const PERMISOS_POR_ROL: Record<RolUsuario, Permiso[]> = {
  /**
   * TÉCNICO
   * - Solo gestiona sus propios registros y gastos
   * - Ve solo sus propios reportes
   */
  tecnico: [
    'registros:crear',
    'registros:ver_propios',
    'registros:editar_propios',
    'registros:eliminar_propios',
    'registros:enviar',
    'gastos:crear',
    'gastos:ver_propios',
    'gastos:editar_propios',
    'gastos:eliminar_propios',
    'gastos:enviar',
    'reportes:ver_propios',
  ],

  /**
   * JEFE DE EQUIPO
   * - Todo lo del técnico
   * - Ve y aprueba horas de su equipo
   * - Ve reportes de su equipo
   */
  jefe_equipo: [
    // Propios
    'registros:crear',
    'registros:ver_propios',
    'registros:editar_propios',
    'registros:eliminar_propios',
    'registros:enviar',
    'gastos:crear',
    'gastos:ver_propios',
    'gastos:editar_propios',
    'gastos:eliminar_propios',
    'gastos:enviar',
    'reportes:ver_propios',
    // Equipo
    'registros:ver_equipo',
    'registros:aprobar_horas_equipo',
    'reportes:ver_equipo',
    'reportes:exportar',
  ],

  /**
   * SUPERVISOR DE OFICINA
   * - Todo lo del técnico para sus propios registros
   * - Ve todos los gastos y los aprueba
   * - Ve reportes globales de gastos
   * - Puede configurar proyectos
   */
  supervisor_oficina: [
    // Propios
    'registros:crear',
    'registros:ver_propios',
    'registros:editar_propios',
    'registros:eliminar_propios',
    'registros:enviar',
    'gastos:crear',
    'gastos:ver_propios',
    'gastos:editar_propios',
    'gastos:eliminar_propios',
    'gastos:enviar',
    'reportes:ver_propios',
    // Gestión de gastos
    'gastos:ver_todos',
    'gastos:aprobar_todos',
    // Reportes
    'reportes:ver_todos',
    'reportes:exportar',
    'kpis:ver',
    // Config limitada
    'config:proyectos',
  ],

  /**
   * DIRECCIÓN
   * - Aprueba horas de jefes de equipo
   * - Aprueba gastos de supervisores
   * - Ve todos los KPIs y reportes
   * - Puede configurar casi todo
   */
  direccion: [
    // Propios
    'registros:crear',
    'registros:ver_propios',
    'registros:editar_propios',
    'registros:eliminar_propios',
    'registros:enviar',
    'gastos:crear',
    'gastos:ver_propios',
    'gastos:editar_propios',
    'gastos:eliminar_propios',
    'gastos:enviar',
    // Globales
    'registros:ver_todos',
    'registros:aprobar_horas_todos',
    'gastos:ver_todos',
    'gastos:aprobar_todos',
    // Reportes
    'reportes:ver_propios',
    'reportes:ver_equipo',
    'reportes:ver_todos',
    'reportes:exportar',
    'kpis:ver',
    'kpis:ver_detalle',
    // Config
    'config:tarifas',
    'config:proyectos',
    'config:festivos',
    'config:usuarios',
  ],

  /**
   * ADMIN
   * - Acceso total al sistema
   * - Configuración de roles y sistema
   */
  admin: [
    // Todo
    'registros:crear',
    'registros:ver_propios',
    'registros:editar_propios',
    'registros:eliminar_propios',
    'registros:enviar',
    'registros:ver_equipo',
    'registros:aprobar_horas_equipo',
    'registros:ver_todos',
    'registros:editar_todos',
    'registros:aprobar_horas_todos',
    'gastos:crear',
    'gastos:ver_propios',
    'gastos:editar_propios',
    'gastos:eliminar_propios',
    'gastos:enviar',
    'gastos:ver_todos',
    'gastos:aprobar_todos',
    'reportes:ver_propios',
    'reportes:ver_equipo',
    'reportes:ver_todos',
    'reportes:exportar',
    'kpis:ver',
    'kpis:ver_detalle',
    'config:tarifas',
    'config:proyectos',
    'config:festivos',
    'config:usuarios',
    'config:roles',
    'config:sistema',
  ],
};

// ============================================================
// HELPERS DE PERMISOS
// ============================================================

/**
 * Verifica si un rol tiene un permiso específico
 */
export function tienePermiso(rol: RolUsuario, permiso: Permiso): boolean {
  return PERMISOS_POR_ROL[rol]?.includes(permiso) ?? false;
}

/**
 * Verifica si un rol tiene alguno de los permisos dados
 */
export function tieneAlgunPermiso(rol: RolUsuario, permisos: Permiso[]): boolean {
  return permisos.some(p => tienePermiso(rol, p));
}

/**
 * Verifica si un rol tiene todos los permisos dados
 */
export function tieneTodosLosPermisos(rol: RolUsuario, permisos: Permiso[]): boolean {
  return permisos.every(p => tienePermiso(rol, p));
}

/**
 * Obtiene todos los permisos de un rol
 */
export function obtenerPermisos(rol: RolUsuario): Permiso[] {
  return PERMISOS_POR_ROL[rol] ?? [];
}

/**
 * Verifica si un rol puede aprobar a otro rol
 */
export function puedeAprobar(rolAprobador: RolUsuario, rolSolicitante: RolUsuario): boolean {
  return NIVELES_ROL[rolAprobador] > NIVELES_ROL[rolSolicitante];
}

/**
 * Obtiene el rol mínimo que puede aprobar a un rol dado
 */
export function rolAprobadorMinimo(rol: RolUsuario): RolUsuario | null {
  switch (rol) {
    case 'tecnico':
      return 'jefe_equipo';
    case 'jefe_equipo':
      return 'direccion';
    case 'supervisor_oficina':
      return 'direccion';
    case 'direccion':
      return 'admin';
    case 'admin':
      return null; // Auto-aprobación
  }
}

// ============================================================
// TABLA RESUMEN DE VISIBILIDAD
// ============================================================

/**
 * Matriz de visibilidad: Qué puede ver cada rol
 */
export const MATRIZ_VISIBILIDAD = {
  tecnico: {
    registrosPropios: true,
    registrosEquipo: false,
    registrosTodos: false,
    gastosPropios: true,
    gastosTodos: false,
    reportesPropios: true,
    reportesEquipo: false,
    reportesTodos: false,
    kpis: false,
  },
  jefe_equipo: {
    registrosPropios: true,
    registrosEquipo: true,
    registrosTodos: false,
    gastosPropios: true,
    gastosTodos: false,
    reportesPropios: true,
    reportesEquipo: true,
    reportesTodos: false,
    kpis: false,
  },
  supervisor_oficina: {
    registrosPropios: true,
    registrosEquipo: false,
    registrosTodos: false,
    gastosPropios: true,
    gastosTodos: true,
    reportesPropios: true,
    reportesEquipo: false,
    reportesTodos: true,
    kpis: true,
  },
  direccion: {
    registrosPropios: true,
    registrosEquipo: true,
    registrosTodos: true,
    gastosPropios: true,
    gastosTodos: true,
    reportesPropios: true,
    reportesEquipo: true,
    reportesTodos: true,
    kpis: true,
  },
  admin: {
    registrosPropios: true,
    registrosEquipo: true,
    registrosTodos: true,
    gastosPropios: true,
    gastosTodos: true,
    reportesPropios: true,
    reportesEquipo: true,
    reportesTodos: true,
    kpis: true,
  },
};

// ============================================================
// TABLA RESUMEN DE APROBACIONES
// ============================================================

/**
 * Matriz de aprobación: Quién aprueba qué
 */
export const MATRIZ_APROBACION = {
  // Horas extra del técnico → las aprueba su jefe de equipo
  tecnico_horas: 'jefe_equipo',
  // Gastos del técnico → los aprueba el supervisor de oficina
  tecnico_gastos: 'supervisor_oficina',
  
  // Horas extra del jefe de equipo → las aprueba dirección
  jefe_equipo_horas: 'direccion',
  // Gastos del jefe de equipo → los aprueba supervisor o dirección
  jefe_equipo_gastos: 'supervisor_oficina', // o 'direccion'
  
  // Horas/gastos del supervisor → los aprueba dirección
  supervisor_oficina_horas: 'direccion',
  supervisor_oficina_gastos: 'direccion',
  
  // Dirección → auto-aprobación o aprobación cruzada
  direccion_horas: 'admin',
  direccion_gastos: 'admin',
} as const;
