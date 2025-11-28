import {
  LayoutDashboard,
  Clock,
  Receipt,
  Car,
  BarChart3,
  Settings,
  Users,
  FolderKanban,
  Calendar,
  Euro,
  CheckSquare,
  FileText,
  CalendarDays,
  LucideIcon,
} from 'lucide-react';
import { RolUsuario } from '@/types';

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  roles?: RolUsuario[];  // Si está vacío, todos pueden ver
  children?: NavigationItem[];
}

export interface NavigationSection {
  title?: string;
  items: NavigationItem[];
}

/**
 * Navegación principal del dashboard
 */
export const NAVIGATION: NavigationSection[] = [
  {
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Registros',
    items: [
      {
        name: 'Mis Horas',
        href: '/registros/horas',
        icon: Clock,
      },
      {
        name: 'Mis Gastos',
        href: '/registros/gastos',
        icon: Receipt,
      },
      {
        name: 'Desplazamientos',
        href: '/desplazamientos',
        icon: Car,
      },
      {
        name: 'Calendario',
        href: '/calendario',
        icon: Calendar,
      },
    ],
  },
  {
    title: 'Aprobaciones',
    items: [
      {
        name: 'Horas Pendientes',
        href: '/aprobaciones/horas',
        icon: CheckSquare,
        roles: ['jefe_equipo', 'direccion', 'admin'],
      },
      {
        name: 'Gastos Pendientes',
        href: '/aprobaciones/gastos',
        icon: Euro,
        roles: ['supervisor_oficina', 'direccion', 'admin'],
      },
    ],
  },
  {
    title: 'Reportes',
    items: [
      {
        name: 'Resumen Mensual',
        href: '/reportes/mensual',
        icon: FileText,
      },
      {
        name: 'Informe Anual',
        href: '/reportes/anual',
        icon: BarChart3,
        roles: ['supervisor_oficina', 'direccion', 'admin'],
      },
      {
        name: 'KPIs y Analíticas',
        href: '/reportes/kpis',
        icon: BarChart3,
        roles: ['supervisor_oficina', 'direccion', 'admin'],
      },
    ],
  },
  {
    title: 'Configuración',
    items: [
      {
        name: 'Trabajadores',
        href: '/configuracion/trabajadores',
        icon: Users,
        roles: ['direccion', 'admin'],
      },
      {
        name: 'Proyectos',
        href: '/configuracion/proyectos',
        icon: FolderKanban,
        roles: ['supervisor_oficina', 'direccion', 'admin'],
      },
      {
        name: 'Tarifas',
        href: '/configuracion/tarifas',
        icon: Euro,
        roles: ['direccion', 'admin'],
      },
      {
        name: 'Festivos',
        href: '/configuracion/festivos',
        icon: CalendarDays,
        roles: ['direccion', 'admin'],
      },
      {
        name: 'Sistema',
        href: '/configuracion/sistema',
        icon: Settings,
        roles: ['admin'],
      },
    ],
  },
];

/**
 * Filtra la navegación según el rol del usuario
 */
export function getNavigationForRole(rol: RolUsuario): NavigationSection[] {
  return NAVIGATION.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.includes(rol);
    }),
  })).filter(section => section.items.length > 0);
}

/**
 * Breadcrumbs
 */
export interface Breadcrumb {
  name: string;
  href?: string;
}

export function getBreadcrumbs(pathname: string): Breadcrumb[] {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: Breadcrumb[] = [{ name: 'Inicio', href: '/dashboard' }];
  
  let currentPath = '';
  for (const path of paths) {
    currentPath += `/${path}`;
    const name = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
    breadcrumbs.push({ name, href: currentPath });
  }
  
  // El último no tiene href
  if (breadcrumbs.length > 1) {
    delete breadcrumbs[breadcrumbs.length - 1].href;
  }
  
  return breadcrumbs;
}
