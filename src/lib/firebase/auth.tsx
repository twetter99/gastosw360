'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from './config';
import { Usuario, RolUsuario } from '@/types';

interface AuthContextType {
  user: User | null;
  userData: Usuario | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  hasRole: (roles: RolUsuario | RolUsuario[]) => boolean;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid, firebaseUser?.email);
      setUser(firebaseUser);
      setLoading(true); // Mantener loading mientras se carga userData
      
      if (firebaseUser) {
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
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const value: AuthContextType = {
    user,
    userData,
    loading,
    error,
    signIn,
    signOut,
    resetPassword,
    hasRole,
    isAdmin: userData?.rol === 'admin',
    isDireccion: hasRole(['direccion', 'admin']),
    isSupervisor: hasRole(['supervisor_oficina', 'direccion', 'admin']),
    isJefeEquipo: hasRole(['jefe_equipo', 'direccion', 'admin']),
    isTecnico: userData?.rol === 'tecnico',
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
