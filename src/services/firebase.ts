/**
 * @file src/services/firebase.ts
 * @description Inicialización central de la aplicación Firebase, cliente Firestore y proveedor de autenticación Google.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

/** Configuración del proyecto Firebase proveniente del archivo inyectado */
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

/** Instancia única de Firebase App */
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * Instancia de Firestore asociada a la base de datos provisionada.
 */
export const db = firebaseConfigJson.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

/** Instancia de Firebase Authentication */
export const auth = getAuth(app);

/** Proveedor de inicio de sesión con Google */
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
