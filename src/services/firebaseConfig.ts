import { initializeApp } from 'firebase/app';
import { 
  initializeAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBux5CXsDIbJ4gc8aLaKzoJdc3gnYg8VuA",
  authDomain: "mytrip-d4dcb.firebaseapp.com",
  projectId: "mytrip-d4dcb",
  storageBucket: "mytrip-d4dcb.firebasestorage.app",
  messagingSenderId: "941204475296",
  appId: "1:941204475296:web:7deef6fd29713061cda8c5",
  measurementId: "G-RJ25BF646J"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios con persistencia específica para React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
