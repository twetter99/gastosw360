'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Bell,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { getNavigationForRole, NAVIGATION } from '@/constants/navigation';
import { formatearRol, obtenerIniciales } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userData, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Redirigir al login si no hay usuario autenticado
  useEffect(() => {
    // Solo redirigir si NO está cargando Y NO hay usuario de Firebase Auth
    if (!loading && !user) {
      console.log('Redirecting to login: no user');
      router.push('/login');
    }
  }, [loading, user, router]);

  // Obtener navegación filtrada por rol
  const navigation = userData ? getNavigationForRole(userData.rol) : [];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si hay usuario de Auth pero aún no cargó userData de Firestore, esperar
  if (user && !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // El useEffect de arriba se encarga de la redirección
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar móvil */}
      <div 
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
      >
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <SidebarContent 
            navigation={navigation} 
            pathname={pathname} 
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-hidden">
          <SidebarContent navigation={navigation} pathname={pathname} />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Botón menú móvil */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Título página */}
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold text-gray-900">
                {getCurrentPageTitle(pathname)}
              </h1>
            </div>

            {/* Acciones derecha */}
            <div className="flex items-center gap-4">
              {/* Notificaciones */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Menú usuario */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {obtenerIniciales(userData.nombre, userData.apellidos)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {userData.nombre} {userData.apellidos}
                    </p>
                    <p className="text-xs text-gray-500">{formatearRol(userData.rol)}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-fade-in">
                    <Link
                      href="/perfil"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Mi perfil
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// Componente del sidebar
function SidebarContent({ 
  navigation, 
  pathname, 
  onClose 
}: { 
  navigation: typeof NAVIGATION;
  pathname: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white">GE</span>
          </div>
          <span className="font-semibold text-gray-900">GastosW360</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 min-h-0">
        {navigation.map((section, idx) => (
          <div key={idx} className="mb-6">
            {section.title && (
              <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                      {item.badge && item.badge > 0 && (
                        <span className={cn(
                          "ml-auto px-2 py-0.5 text-xs rounded-full",
                          isActive ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

// Helper para obtener título de página
function getCurrentPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/registros/horas': 'Mis Horas',
    '/registros/gastos': 'Mis Gastos',
    '/desplazamientos': 'Desplazamientos',
    '/calendario': 'Calendario',
    '/aprobaciones/horas': 'Horas Pendientes',
    '/aprobaciones/gastos': 'Gastos Pendientes',
    '/reportes/mensual': 'Resumen Mensual',
    '/reportes/anual': 'Informe Anual',
    '/reportes/kpis': 'KPIs y Analíticas',
    '/configuracion/trabajadores': 'Trabajadores',
    '/configuracion/proyectos': 'Proyectos',
    '/configuracion/tarifas': 'Tarifas',
    '/configuracion/festivos': 'Festivos',
    '/configuracion/sistema': 'Sistema',
  };
  
  return titles[pathname] || 'GastosW360';
}
