import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Trip } from '../services/tripService';
import { db } from '../services/firebaseConfig';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

interface TripContextData {
  activeTrip: Trip | null;
  setActiveTrip: (trip: Trip | null) => void;
  hasUnreadMessages: boolean;
  markChatAsRead: () => void;
}

const TripContext = createContext<TripContextData>({
  activeTrip: null,
  setActiveTrip: () => {},
  hasUnreadMessages: false,
  markChatAsRead: () => {},
});

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!activeTrip?.id || !user) {
      setHasUnreadMessages(false);
      return;
    }

    // Listener para el ÚLTIMO mensaje del chat
    const messagesRef = collection(db, 'trips', activeTrip.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) return;

      const lastMsg = snapshot.docs[0];
      const lastMsgId = lastMsg.id;
      const lastMsgData = lastMsg.data();

      // Si el mensaje es mío, no marcamos como no leído
      if (lastMsgData.userId === user.uid) return;

      const savedLastReadId = await AsyncStorage.getItem(`lastRead_${activeTrip.id}`);
      
      if (savedLastReadId !== lastMsgId) {
        setHasUnreadMessages(true);
      }
    }, (error) => {
      // Ignorar errores de permisos al cerrar sesión
      if (error.code !== 'permission-denied') console.error(error);
    });

    return () => unsubscribe();
  }, [activeTrip?.id, user]);

  const markChatAsRead = async () => {
    if (!activeTrip?.id) return;
    
    // Obtenemos el último mensaje actual para marcarlo como leído
    const messagesRef = collection(db, 'trips', activeTrip.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));
    
    // Una lectura puntual para guardar el ID
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        const lastId = snapshot.docs[0].id;
        await AsyncStorage.setItem(`lastRead_${activeTrip.id}`, lastId);
        setHasUnreadMessages(false);
      }
      unsubscribe();
    });
  };

  return (
    <TripContext.Provider value={{ activeTrip, setActiveTrip, hasUnreadMessages, markChatAsRead }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => useContext(TripContext);
