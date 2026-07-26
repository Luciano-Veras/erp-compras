/**
 * @file src/services/authService.ts
 * @description Servicio de autenticación con Firebase Auth mediante Google Sign-In.
 */

import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { UserProfile } from '../types';

/**
 * Inicia sesión utilizando Google Sign-In con emergente (popup).
 * 
 * @returns {Promise<UserProfile>} Perfil del usuario autenticado.
 * @throws {Error} Si el inicio de sesión falla o es cancelado por el usuario.
 */
export async function loginWithGoogle(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      uid: user.uid,
      displayName: user.displayName || user.email || 'Operario de Planta',
      email: user.email,
      photoURL: user.photoURL
    };
  } catch (error: any) {
    console.error('Error al iniciar sesión con Google:', error);
    throw new Error(error.message || 'No se pudo completar el inicio de sesión con Google.');
  }
}

/**
 * Cierra la sesión activa en Firebase Auth.
 * 
 * @returns {Promise<void>}
 */
export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Error al cerrar sesión:', error);
    throw new Error('No se pudo cerrar la sesión.');
  }
}

/**
 * Suscribe un observador a los cambios de estado de autenticación.
 * 
 * @param {(user: UserProfile | null) => void} callback Función invocada al cambiar el usuario.
 * @returns {() => void} Función de cancelación de suscripción (unsubscribe).
 */
export function subscribeAuthState(callback: (user: UserProfile | null) => void): () => void {
  return onAuthStateChanged(auth, (firebaseUser: User | null) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || firebaseUser.email || 'Operario Pastelero',
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL
      });
    } else {
      callback(null);
    }
  });
}
