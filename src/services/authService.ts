import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  updateEmail,
  updatePassword,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configurar Google Sign-In con el Client ID del .env
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
});

export const authService = {
  // Registro de usuario
  register: async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Actualizar el perfil con el nombre
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      // Crear documento de usuario en Firestore para datos adicionales
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        displayName: name,
        email: email,
        createdAt: new Date()
      });

      return userCredential.user;
    } catch (error: any) {
      throw error.message;
    }
  },

  // Inicio de sesión
  login: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw error.message;
    }
  },

  // Inicio de sesión y Registro con Google
  loginWithGoogle: async () => {
    try {
      // Comprobar si Google Play Services está disponible
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Iniciar el flujo de autenticación nativo
      const userInfo = await GoogleSignin.signIn();
      
      // La API v11+ devuelve userInfo.data.idToken, versiones anteriores userInfo.idToken
      const idToken = userInfo.data?.idToken || (userInfo as any).idToken;

      if (!idToken) {
        throw new Error("No se pudo obtener el token de Google");
      }

      // Crear una credencial de Firebase con el token
      const credential = GoogleAuthProvider.credential(idToken);
      
      // Iniciar sesión en Firebase (esto registra si es la primera vez)
      const userCredential = await signInWithCredential(auth, credential);
      
      // Asegurarnos de que el usuario existe en nuestra base de datos de Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        displayName: userCredential.user.displayName,
        email: userCredential.user.email,
        photoURL: userCredential.user.photoURL,
        lastUpdated: new Date()
      }, { merge: true });

      return userCredential.user;
    } catch (error: any) {
      console.error(error);
      throw error.message || "Error al iniciar sesión con Google";
    }
  },

  // Cerrar sesión
  logout: async () => {
    try {
      await signOut(auth);
      // Intentar cerrar sesión de Google también para limpiar el estado
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Puede fallar si no estaba logueado con Google, ignorar
      }
    } catch (error: any) {
      throw error.message;
    }
  },

  // Actualizar Perfil (Nombre en Auth, Foto en Firestore)
  updateUserProfile: async (data: { displayName?: string, photoURL?: string }) => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Actualizar nombre en Auth (es corto, no hay problema)
        if (data.displayName) {
          await updateProfile(user, { displayName: data.displayName });
        }
        
        // Guardar TODO (incluida la foto larga) en Firestore
        await setDoc(doc(db, 'users', user.uid), {
          ...data,
          lastUpdated: new Date()
        }, { merge: true });

      } else {
        throw new Error("No hay usuario autenticado");
      }
    } catch (error: any) {
      throw error.message;
    }
  },

  // Obtener datos extendidos del usuario
  getUserData: async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error: any) {
      console.error("Error al obtener datos de usuario:", error);
      return null;
    }
  },

  // Actualizar Correo Electrónico
  updateUserEmail: async (newEmail: string) => {
    try {
      if (auth.currentUser) {
        await updateEmail(auth.currentUser, newEmail);
      } else {
        throw new Error("No hay usuario autenticado");
      }
    } catch (error: any) {
      throw error.message;
    }
  },

  // Actualizar Contraseña
  updateUserPassword: async (newPassword: string) => {
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      } else {
        throw new Error("No hay usuario autenticado");
      }
    } catch (error: any) {
      throw error.message;
    }
  }
};
