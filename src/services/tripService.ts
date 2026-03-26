import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface Trip {
  id?: string;
  userId: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  numPeople: number;
  status: 'Próximamente' | 'Planeado' | 'En curso' | 'Finalizado';
  createdAt: any;
}

export const tripService = {
  // Crear un nuevo viaje
  createTrip: async (tripData: Omit<Trip, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'trips'), {
        ...tripData,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding document: ", error);
      throw error;
    }
  },

  // Obtener viajes del usuario
  getUserTrips: async (userId: string) => {
    try {
      // Hacemos una query simple sin orderBy para evitar el error de índice compuesto de Firestore
      const q = query(
        collection(db, 'trips'), 
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const trips: Trip[] = [];
      
      querySnapshot.forEach((doc) => {
        trips.push({ id: doc.id, ...doc.data() } as Trip);
      });
      
      // Ordenamos localmente por fecha de inicio
      return trips.sort((a, b) => {
        if (!a.startDate || !b.startDate) return 0;
        return a.startDate.localeCompare(b.startDate);
      });
    } catch (error: any) {
      console.error("Error getting documents: ", error);
      throw error;
    }
  }
};
