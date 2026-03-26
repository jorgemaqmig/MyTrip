import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../services/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  userData: any | null; // Datos adicionales de Firestore
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);
      
      if (authenticatedUser) {
        // Suscribirse a los datos del usuario en Firestore en tiempo real
        unsubscribeSnapshot = onSnapshot(doc(db, 'users', authenticatedUser.uid), (doc) => {
          if (doc.exists()) {
            setUserData(doc.data());
          }
        });

        await AsyncStorage.setItem('user_session', JSON.stringify({
          uid: authenticatedUser.uid,
          email: authenticatedUser.email
        }));
      } else {
        setUserData(null);
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }
        await AsyncStorage.removeItem('user_session');
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
        {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
