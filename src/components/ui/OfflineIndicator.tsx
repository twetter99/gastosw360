'use client';

/**
 * Componente indicador de estado offline
 * Se muestra en la parte superior de la pantalla cuando no hay conexión
 */

import { Wifi, WifiOff, Check } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useConnectionStatus();

  // Si está online y nunca estuvo offline, no mostrar nada
  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-sm font-medium transition-all duration-300",
        isOnline
          ? "bg-green-500 text-white"
          : "bg-amber-500 text-white"
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Check className="w-4 h-4" />
            <span>Conexión restaurada - Sincronizando datos...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Sin conexión - Los cambios se guardarán localmente</span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Badge pequeño para mostrar en la esquina de la UI
 */
export function OfflineBadge() {
  const { isOnline } = useConnectionStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-800 rounded-full shadow-lg border border-amber-200">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">Offline</span>
    </div>
  );
}
