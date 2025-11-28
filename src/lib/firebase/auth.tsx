'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions, COLLECTIONS } from './config';
import { Usuario, RolUsuario } from '@/types';

// Interfaz para los Custom Claims del token
export interface CustomClaims {
  rol?: RolUsuario;
  equipoId?: string;
  equipoIds?: string[];
  esJefeEquipo?: boolean;
  activo?: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: Usuario | null;
  claims: CustomClaims | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshClaims: () => Promise<void>;
  hasRole: (roles: RolUsuario | RolUsuario[]) => boolean;
  hasClaimRole: (roles: RolUsuario | RolUsuario[]) => boolean;
  isAdmin: boolean;
  isDireccion: boolean;
  isSupervisor: boolean;
  isJefeEquipo: boolean;
  isTecnico: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<Usuario | null>(null);
  const [claims, setClaims] = useState<CustomClaims | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar los claims del token
  const loadClaims = useCallback(async (firebaseUser: User): Promise<CustomClaims | null> => {
    try {
      const tokenResult = await firebaseUser.getIdTokenResult();
      const customClaims: CustomClaims = {
        rol: tokenResult.claims.rol as RolUsuario | undefined,
        equipoId: tokenResult.claims.equipoId as string | undefined,
        equipoIds: tokenResult.claims.equipoIds as string[] | undefined,
        esJefeEquipo: tokenResult.claims.esJefeEquipo as boolean | undefined,
        activo: tokenResult.claims.activo as boolean | undefined,
      };
      console.log('Custom claims cargados:', customClaims);
      return customClaims;
    } catch (err) {
      console.error('Error cargando claims:', err);
      return null;
    }
  }, []);

  // Función para refrescar los claims (forzar nuevo token)
  const refreshClaims = useCallback(async () => {
    if (!user) return;
    
    try {
      // Forzar refresh del token para obtener claims actualizados
      await user.getIdToken(true);
      const newClaims = await loadClaims(user);
      setClaims(newClaims);
      console.log('Claims refrescados:', newClaims);
    } catch (err) {
      console.error('Error refrescando claims:', err);
    }
  }, [user, loadClaims]);

  // Función para sincronizar claims desde Firestore (llamar Cloud Function)
  const syncClaimsFromFirestore = useCallback(async () => {
    if (!user) return;
    
    try {
      const syncFunction = httpsCallable(functions, 'syncMyCustomClaims');
      await syncFunction();
      // Después de sincronizar, refrescar el token local
      await refreshClaims();
    } catch (err) {
      console.error('Error sincronizando claims:', err);
    }
  }, [user, refreshClaims]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid, firebaseUser?.email);
      setUser(firebaseUser);
      setLoading(true); // Mantener loading mientras se carga userData
      
      if (firebaseUser) {
        // Cargar claims del token
        const userClaims = await loadClaims(firebaseUser);
        setClaims(userClaims);
        
        // Si no hay claims de rol, intentar sincronizar desde Firestore
        if (!userClaims?.rol) {
          console.log('No hay claims de rol, sincronizando desde Firestore...');
          try {
            const syncFunction = httpsCallable(functions, 'syncMyCustomClaims');
            await syncFunction();
            // Refrescar token para obtener nuevos claims
            await firebaseUser.getIdToken(true);
            const newClaims = await loadClaims(firebaseUser);
            setClaims(newClaims);
          } catch (err) {
            console.warn('No se pudieron sincronizar claims:', err);
          }
        }
        
        // Cargar datos del usuario desde Firestore
        try {
          console.log('Buscando documento en usuarios/', firebaseUser.uid);
          const userDoc = await getDoc(doc(db, COLLECTIONS.USUARIOS, firebaseUser.uid));
          console.log('Documento existe:', userDoc.exists());
          if (userDoc.exists()) {
            console.log('Datos del usuario:', userDoc.data());
            setUserData({ id: userDoc.id, ...userDoc.data() } as Usuario);
            setError(null);
          } else {
            console.error('Usuario no encontrado en Firestore con UID:', firebaseUser.uid);
            setError('Usuario no encontrado en la base de datos');
            setUserData(null);
          }
        } catch (err) {
          console.error('Error loading user data:', err);
          setError('Error al cargar datos del usuario');
          setUserData(null);
        }
      } else {
        setUserData(null);
        setClaims(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadClaims]);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserData(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cerrar sesión';
      setError(errorMessage);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar email';
      setError(errorMessage);
      throw err;
    }
  };

  const hasRole = (roles: RolUsuario | RolUsuario[]): boolean => {
    if (!userData) return false;
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes(userData.rol);
  };

  // Verificar rol usando Custom Claims (más eficiente, no requiere lectura de Firestore)
  const hasClaimRole = (roles: RolUsuario | RolUsuario[]): boolean => {
    if (!claims?.rol) return false;
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes(claims.rol);
  };

  const value: AuthContextType = {
    user,
    userData,
    claims,
    loading,
    error,
    signIn,
    signOut,
    resetPassword,
    refreshClaims,
    hasRole,
    hasClaimRole,
    isAdmin: claims?.rol === 'admin' || userData?.rol === 'admin',
    isDireccion: hasClaimRole(['direccion', 'admin']) || hasRole(['direccion', 'admin']),
    isSupervisor: hasClaimRole(['supervisor_oficina', 'direccion', 'admin']) || hasRole(['supervisor_oficina', 'direccion', 'admin']),
    isJefeEquipo: (claims?.esJefeEquipo ?? false) || hasClaimRole(['jefe_equipo', 'direccion', 'admin']) || hasRole(['jefe_equipo', 'direccion', 'admin']),
    isTecnico: claims?.rol === 'tecnico' || userData?.rol === 'tecnico',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
