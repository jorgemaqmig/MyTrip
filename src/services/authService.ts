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
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
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
  },

  // 1. Buscar otros usuarios por email o nombre
  searchUsers: async (searchTerm: string, currentUid: string) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      const results: any[] = [];
      const normalizedSearch = searchTerm.trim().toLowerCase();
      
      if (!normalizedSearch) return [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const uid = docSnap.id;
        
        if (uid !== currentUid) {
          const email = (data.email || '').toLowerCase();
          const displayName = (data.displayName || '').toLowerCase();
          
          if (email === normalizedSearch || displayName.includes(normalizedSearch)) {
            results.push({ uid, ...data });
          }
        }
      });
      return results;
    } catch (error: any) {
      console.error("Error searching users:", error);
      throw error.message || error;
    }
  },

  // 2. Enviar solicitud de amistad
  sendFriendRequest: async (senderId: string, receiverId: string) => {
    try {
      // Verificar si ya existe alguna solicitud o amistad
      const friendshipsRef = collection(db, 'friendships');
      const q1 = query(friendshipsRef, where('senderId', '==', senderId), where('receiverId', '==', receiverId));
      const q2 = query(friendshipsRef, where('senderId', '==', receiverId), where('receiverId', '==', senderId));
      
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      if (!snap1.empty || !snap2.empty) {
        throw new Error("Ya existe una solicitud de amistad o son amigos.");
      }

      await addDoc(friendshipsRef, {
        senderId,
        receiverId,
        status: 'pending',
        createdAt: new Date()
      });
    } catch (error: any) {
      console.error("Error sending request:", error);
      throw error.message || error;
    }
  },

  // 3. Obtener solicitudes pendientes recibidas
  getPendingRequests: async (userId: string) => {
    try {
      const friendshipsRef = collection(db, 'friendships');
      const q = query(friendshipsRef, where('receiverId', '==', userId), where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      const requests: any[] = [];

      await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const senderId = data.senderId;
          const senderData = await authService.getUserData(senderId);
          if (senderData) {
            requests.push({
              friendshipId: docSnap.id,
              senderId,
              createdAt: data.createdAt,
              ...senderData
            });
          }
        })
      );
      return requests;
    } catch (error: any) {
      console.error("Error getting pending requests:", error);
      throw error.message || error;
    }
  },

  // 4. Aceptar solicitud de amistad
  acceptFriendRequest: async (friendshipId: string) => {
    try {
      const docRef = doc(db, 'friendships', friendshipId);
      await updateDoc(docRef, {
        status: 'accepted',
        updatedAt: new Date()
      });
    } catch (error: any) {
      console.error("Error accepting request:", error);
      throw error.message || error;
    }
  },

  // 5. Rechazar/Cancelar solicitud de amistad o eliminar amigo
  removeFriendship: async (friendshipId: string) => {
    try {
      const docRef = doc(db, 'friendships', friendshipId);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error("Error removing friendship:", error);
      throw error.message || error;
    }
  },

  // 6. Obtener lista de amigos
  getFriends: async (userId: string) => {
    try {
      const friendshipsRef = collection(db, 'friendships');
      const q1 = query(friendshipsRef, where('senderId', '==', userId), where('status', '==', 'accepted'));
      const q2 = query(friendshipsRef, where('receiverId', '==', userId), where('status', '==', 'accepted'));
      
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const friends: any[] = [];

      const processSnap = async (snap: any, isSender: boolean) => {
        await Promise.all(
          snap.docs.map(async (docSnap: any) => {
            const data = docSnap.data();
            const friendId = isSender ? data.receiverId : data.senderId;
            const friendData = await authService.getUserData(friendId);
            if (friendData) {
              friends.push({
                friendshipId: docSnap.id,
                uid: friendId,
                ...friendData
              });
            }
          })
        );
      };

      await Promise.all([
        processSnap(snap1, true),
        processSnap(snap2, false)
      ]);

      return friends;
    } catch (error: any) {
      console.error("Error getting friends:", error);
      throw error.message || error;
    }
  },

  // 7. Obtener el estado de la relación con un usuario específico
  getRelationshipStatus: async (currentUid: string, targetUid: string) => {
    try {
      const friendshipsRef = collection(db, 'friendships');
      const q1 = query(friendshipsRef, where('senderId', '==', currentUid), where('receiverId', '==', targetUid));
      const q2 = query(friendshipsRef, where('senderId', '==', targetUid), where('receiverId', '==', currentUid));
      
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      if (!snap1.empty) {
        const docSnap = snap1.docs[0];
        return { friendshipId: docSnap.id, status: docSnap.data().status, isSender: true };
      }
      if (!snap2.empty) {
        const docSnap = snap2.docs[0];
        return { friendshipId: docSnap.id, status: docSnap.data().status, isSender: false };
      }
      return null;
    } catch (error) {
      console.error("Error getting relationship status:", error);
      return null;
    }
  }
};
