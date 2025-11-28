/**
 * Hook para detectar estado de conexión
 * Proporciona información sobre si la app está online/offline
 * y muestra indicadores visuales al usuario
 */

import { useState, useEffect, useCallback } from 'react';

interface ConnectionState {
  isOnline: boolean;
  wasOffline: boolean;  // Para mostrar "Reconectado" brevemente
  lastOnline: Date | null;
}

export function useConnectionStatus() {
  const [state, setState] = useState<ConnectionState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    lastOnline: null,
  });

  const handleOnline = useCallback(() => {
    setState(prev => ({
      isOnline: true,
      wasOffline: !prev.isOnline, // Si estaba offline, marcar que estuvo offline
      lastOnline: new Date(),
    }));
    
    // Limpiar wasOffline después de 3 segundos
    setTimeout(() => {
      setState(prev => ({ ...prev, wasOffline: false }));
    }, 3000);
  }, []);

  const handleOffline = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOnline: false,
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return state;
}

/**
 * Hook simplificado que solo devuelve boolean
 */
export function useIsOnline(): boolean {
  const { isOnline } = useConnectionStatus();
  return isOnline;
}
