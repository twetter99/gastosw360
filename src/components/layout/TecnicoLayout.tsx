'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { obtenerIniciales } from '@/lib/utils/formatters';
import { OfflineIndicator, OfflineBadge } from '@/components/ui/OfflineIndicator';
import TecnicoBottomNav from './TecnicoBottomNav';

interface TecnicoLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

export default function TecnicoLayout({ 
  children, 
  title, 
  showBack = false,
  backHref = '/dashboard'
}: TecnicoLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userData, signOut, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Estados de carga
  if (loading || (user && !userData)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Determinar si estamos en home (dashboard)
  const isHome = pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Indicadores offline */}
      <OfflineIndicator />
      <OfflineBadge />

      {/* Header simplificado */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Izquierda: Back o Logo */}
          <div className="flex items-center gap-3 min-w-0">
            {showBack ? (
              <Link
                href={backHref}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            ) : isHome ? (
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-white">GE</span>
                </div>
              </Link>
            ) : null}
            
            {title && (
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {title}
              </h1>
            )}
          </div>

          {/* Derecha: Acciones */}
          <div className="flex items-center gap-2">
            {/* Notificaciones solo en home */}
            {isHome && (
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            )}

            {/* Avatar con menú simple */}
            {isHome && (
              <Link
                href="/perfil"
                className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium"
              >
                {obtenerIniciales(userData?.nombre || '', userData?.apellidos || '')}
              </Link>
            )}

            {/* Cerrar sesión en página de perfil */}
            {pathname === '/perfil' && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Contenido principal con padding para bottom nav */}
      <main className="flex-1 pb-20 lg:pb-0">
        {children}
      </main>

      {/* Bottom navigation solo móvil */}
      <TecnicoBottomNav />
    </div>
  );
}
