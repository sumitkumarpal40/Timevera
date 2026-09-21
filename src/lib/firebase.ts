import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import rawConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  ...rawConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId,
};

// Initialize Firebase App instance safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore safely with force long-polling for iframe / sandbox stability
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (e) {
  try {
    dbInstance = getFirestore(app);
  } catch (err) {
    dbInstance = getFirestore(app);
  }
}
export const db = dbInstance;

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;

