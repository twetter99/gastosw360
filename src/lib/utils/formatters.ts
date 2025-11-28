/**
 * Formatea un número como moneda (EUR)
 */
export function formatearMoneda(valor: number, decimales: number = 2): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
}

/**
 * Formatea un número con separadores de miles
 */
export function formatearNumero(valor: number, decimales: number = 0): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
}

/**
 * Formatea horas (ej: 2.5 → "2h 30min")
 */
export function formatearHoras(horas: number): string {
  const horasEnteras = Math.floor(horas);
  const minutos = Math.round((horas - horasEnteras) * 60);
  
  if (minutos === 0) {
    return `${horasEnteras}h`;
  }
  return `${horasEnteras}h ${minutos}min`;
}

/**
 * Formatea kilómetros
 */
export function formatearKm(km: number): string {
  return `${formatearNumero(km)} km`;
}

/**
 * Formatea porcentaje
 */
export function formatearPorcentaje(valor: number, decimales: number = 1): string {
  return `${formatearNumero(valor, decimales)}%`;
}

/**
 * Capitaliza la primera letra
 */
export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Trunca un texto añadiendo "..." si supera el máximo
 */
export function truncar(texto: string, maxLength: number): string {
  if (texto.length <= maxLength) return texto;
  return texto.slice(0, maxLength - 3) + '...';
}

/**
 * Genera iniciales de un nombre
 */
export function obtenerIniciales(nombre: string, apellidos?: string): string {
  const partes = apellidos ? `${nombre} ${apellidos}` : nombre;
  return partes
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
}

/**
 * Formatea el estado de aprobación
 */
export function formatearEstadoAprobacion(estado: string): string {
  const estados: Record<string, string> = {
    borrador: 'Borrador',
    pendiente: 'Pendiente',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
    devuelto: 'Devuelto',
  };
  return estados[estado] || estado;
}

/**
 * Formatea el rol del usuario
 */
export function formatearRol(rol: string): string {
  const roles: Record<string, string> = {
    tecnico: 'Técnico',
    jefe_equipo: 'Jefe de Equipo',
    supervisor_oficina: 'Supervisor de Oficina',
    direccion: 'Dirección',
    admin: 'Administrador',
  };
  return roles[rol] || rol;
}

/**
 * Formatea la categoría de gasto
 */
export function formatearCategoriaGasto(categoria: string): string {
  const categorias: Record<string, string> = {
    dieta: 'Dieta',
    kilometraje: 'Kilometraje',
    combustible: 'Combustible',
    hotel: 'Hotel',
    parking: 'Parking',
    peaje: 'Peaje',
    transporte_publico: 'Transporte público',
    comida: 'Comida',
    material: 'Material',
    otro: 'Otro',
  };
  return categorias[categoria] || categoria;
}

/**
 * Formatea el tipo de tarifa
 */
export function formatearTipoTarifa(tipo: string): string {
  const tipos: Record<string, string> = {
    HORA_NORMAL: 'Hora normal',
    HORA_EXTRA_LABORABLE: 'Hora extra laborable',
    HORA_EXTRA_SABADO: 'Hora extra sábado',
    HORA_EXTRA_FESTIVO: 'Hora extra festivo',
    NOCTURNIDAD: 'Nocturnidad',
    DIETA_COMPLETA: 'Dieta completa',
    DIETA_MEDIA: 'Media dieta',
    PLUS_FESTIVO: 'Plus festivo',
    KM_VEHICULO_PROPIO: 'Km vehículo propio',
    KM_VEHICULO_EMPRESA: 'Km vehículo empresa',
  };
  return tipos[tipo] || tipo;
}
