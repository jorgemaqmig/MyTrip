import { initializeApp } from 'firebase/app';
import { 
  initializeAuth, 
  getAuth, 
  // @ts-ignore - A veces los tipos de Firebase no exportan esto correctamente en el punto de entrada principal
  getReactNativePersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Tu configuración de Firebase desde variables de entorno (.env)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: "mytrip-6adc8.firebasestorage.app", // Forzamos el bucket que funciona
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth con persistencia en React Native (Evitando doble inicialización)
let auth: any;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (e) {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
// Inicializamos Storage apuntando al bucket correcto
export const storage = getStorage(app, "gs://mytrip-6adc8.firebasestorage.app");

export default app;
