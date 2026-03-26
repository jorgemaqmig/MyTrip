import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

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

  // Cerrar sesión
  logout: async () => {
    try {
      await signOut(auth);
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
