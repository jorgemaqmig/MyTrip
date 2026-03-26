import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebaseConfig';

export const authService = {
  // Registro de usuario
  register: async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Actualizar el perfil con el nombre
      await updateProfile(userCredential.user, {
        displayName: name
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

  // Cerrar sesión
  logout: async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw error.message;
    }
  }
};
