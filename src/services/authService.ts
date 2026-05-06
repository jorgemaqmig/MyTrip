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
      const idToken = response.data?.idToken;

      if (!idToken) {
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

  // Cerrar sesión
  logout: async () => {
    try {
      await signOut(auth);
      await GoogleSignin.signOut();
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
