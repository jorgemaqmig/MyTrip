import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../services/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  userData: any | null; 
  loading: boolean;
}

// Contexto para la autenticación y datos del usuario
const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Escuchar cambios en la autenticación y cargar datos del usuario
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);
      
      if (authenticatedUser) {
        await AsyncStorage.setItem('user_session', JSON.stringify({
          uid: authenticatedUser.uid,
          email: authenticatedUser.email
        }));
      } else {
        setUserData(null);
        await AsyncStorage.removeItem('user_session');
      }
      
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }

    // Suscribirse a los datos del usuario en Firestore en tiempo real
    const unsubscribeSnapshot = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    }, (error) => {
      if (error.code !== 'permission-denied') {
        console.error("Error fetching user data:", error);
      }
    });

    return () => unsubscribeSnapshot();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
        {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
