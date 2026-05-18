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
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Configuración reforzada
GoogleSignin.configure({
  webClientId: '638295579061-2hjblsi2kh06vvvkvk0fc9d6vjc0svfp.apps.googleusercontent.com',
  offlineAccess: false,
  scopes: ['profile', 'email'],
});

export const authService = {
  // Registro de usuario
  register: async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
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
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      try {
        await GoogleSignin.signOut();
      } catch (e) {}

      const response = await GoogleSignin.signIn();
      
      // Control de cancelación en versiones modernas (donde signIn() resuelve con type: 'cancelled')
      if (response && response.type === 'cancelled') {
        throw "USER_CANCELLED";
      }

      // Obtener el idToken de la estructura moderna o clásica
      let idToken = response.data?.idToken || (response as any).idToken;

      // Si no hay idToken y la respuesta no indica éxito (en la nueva API), podría ser una cancelación silenciosa
      if (!idToken) {
        if (response && response.type && response.type !== 'success') {
          throw "USER_CANCELLED";
        }
        throw new Error("No se recibió el Token de Google");
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        displayName: userCredential.user.displayName,
        email: userCredential.user.email,
        photoURL: userCredential.user.photoURL,
        lastUpdated: new Date()
      }, { merge: true });

      return userCredential.user;
    } catch (error: any) {
      console.log("Error detallado:", JSON.stringify(error, null, 2));
      
      // Si el error ya es el string "USER_CANCELLED" de arriba, volver a lanzarlo
      if (error === "USER_CANCELLED") {
        throw error;
      }

      // Capturar errores de cancelación tradicionales (cuando la promesa rechaza)
      if (
        error.code === statusCodes.SIGN_IN_CANCELLED ||
        error.code === '12501' ||
        error.message?.includes('cancel') ||
        error.message?.includes('Cancel')
      ) {
        throw "USER_CANCELLED";
      }
      if (error.code === 'DEVELOPER_ERROR') {
        throw "Error de configuración (DEVELOPER_ERROR). Verifica que el SHA-1 en Firebase sea el de Expo.";
      }
      throw error.message || "Error al iniciar con Google";
    }
  },

  // Actualizar contraseña
  updateUserPassword: async (newPassword: string) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
      } else {
        throw new Error("No hay usuario autenticado");
      }
    } catch (error: any) {
      throw error.message;
    }
  },

  // Actualizar email
  updateUserEmail: async (newEmail: string) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateEmail(user, newEmail);
        // También actualizamos en Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: newEmail,
          lastUpdated: new Date()
        }, { merge: true });
      } else {
        throw new Error("No hay usuario autenticado");
      }
    } catch (error: any) {
      throw error.message;
    }
  },

  // Cerrar sesión
  logout: async () => {
    try {
      await signOut(auth);
      await GoogleSignin.signOut();
    } catch (error: any) {
      throw error.message;
    }
  },

  // Actualizar perfil (nombre y foto)
  updateUserProfile: async (data: { displayName?: string, photoURL?: string }) => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Actualizamos perfil en Firebase Auth
        await updateProfile(user, data);
        
        // También actualizamos en Firestore para persistencia
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

  getUserData: async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      return null;
    }
  }
};
