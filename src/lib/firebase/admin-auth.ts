/**
 * Servicio para administración de usuarios en Firebase Auth
 * Usa una segunda instancia de Firebase para no cerrar la sesión del admin
 */

import { initializeApp, deleteApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  Auth
} from 'firebase/auth';
import { auth } from './config';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Genera una contraseña aleatoria segura
 * Formato: Gw360-XxxXxx (fácil de dictar por teléfono)
 */
export function generarPasswordTemporal(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = 'Gw360-';
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Crea un usuario en Firebase Auth sin afectar la sesión actual del admin
 * Retorna el UID del nuevo usuario
 */
export async function crearUsuarioAuth(
  email: string, 
  password: string
): Promise<{ uid: string; error?: string }> {
  // Buscar si ya existe una app secundaria y eliminarla
  const existingApps = getApps();
  const secondaryApp = existingApps.find(app => app.name === 'secondary');
  if (secondaryApp) {
    await deleteApp(secondaryApp);
  }

  // Crear instancia secundaria de Firebase
  const tempApp = initializeApp(firebaseConfig, 'secondary');
  const tempAuth: Auth = getAuth(tempApp);

  try {
    // Crear el usuario en la instancia secundaria
    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
    const uid = userCredential.user.uid;

    // Cerrar sesión en la instancia secundaria (importante)
    await tempAuth.signOut();
    
    // Eliminar la app secundaria
    await deleteApp(tempApp);

    return { uid };
  } catch (error: any) {
    // Limpiar en caso de error
    try {
      await deleteApp(tempApp);
    } catch {}

    // Mapear errores de Firebase a mensajes en español
    let errorMessage = 'Error al crear el usuario';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este email ya está registrado en el sistema';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'El email no es válido';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña debe tener al menos 6 caracteres';
    }

    return { uid: '', error: errorMessage };
  }
}

/**
 * Envía un email de restablecimiento de contraseña
 */
export async function enviarEmailRestablecimiento(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    let errorMessage = 'Error al enviar el email';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No existe ningún usuario con este email';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'El email no es válido';
    }
    return { success: false, error: errorMessage };
  }
}
