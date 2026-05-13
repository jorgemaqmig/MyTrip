import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface ChatMessage {
  id?: string;
  text: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  createdAt: any;
}

export const chatService = {
  // Enviar un mensaje
  sendMessage: async (tripId: string, messageData: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    try {
      const messagesRef = collection(db, 'trips', tripId, 'messages');
      await addDoc(messagesRef, {
        ...messageData,
        createdAt: serverTimestamp()
      });
    } catch (error: any) {
      console.error("Error sending message: ", error);
      throw error;
    }
  },

  // Escuchar mensajes en tiempo real
  subscribeToMessages: (tripId: string, onUpdate: (messages: ChatMessage[]) => void, onError?: (error: any) => void) => {
    const messagesRef = collection(db, 'trips', tripId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      onUpdate(messages);
    }, (error) => {
      if (onError) onError(error);
      else console.error("Snapshot error: ", error);
    });
  }
};
