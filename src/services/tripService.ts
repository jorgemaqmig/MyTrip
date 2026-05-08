import { collection, addDoc, getDocs, query, where, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface TripPoint {
  id?: string;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
  dayIndex: number;
  order: number;
  color: string;
}

export interface Trip {
  id?: string;
  userId: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  startDate: string;
  endDate: string;
  numPeople?: number;
  status: 'Próximamente' | 'Planeado' | 'En curso' | 'Finalizado';
  image?: string;
  isPublished?: boolean;
  createdAt: any;
}

export const tripService = {
  // Crear un nuevo viaje
  createTrip: async (tripData: Omit<Trip, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'trips'), {
        ...tripData,
        isPublished: false, // Por defecto no publicado
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
      const q = query(
        collection(db, 'trips'), 
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const trips: Trip[] = [];
      
      querySnapshot.forEach((docSnap) => {
        trips.push({ id: docSnap.id, ...docSnap.data() } as Trip);
      });
      
      return trips.sort((a, b) => {
        if (!a.startDate || !b.startDate) return 0;
        return a.startDate.localeCompare(b.startDate);
      });
    } catch (error: any) {
      console.error("Error getting documents: ", error);
      throw error;
    }
  },

  // Actualizar un viaje
  updateTrip: async (tripId: string, tripData: Partial<Trip>) => {
    try {
      const tripRef = doc(db, 'trips', tripId);
      await updateDoc(tripRef, tripData);
    } catch (error: any) {
      console.error("Error updating trip: ", error);
      throw error;
    }
  },

  // Eliminar un viaje
  deleteTrip: async (tripId: string) => {
    try {
      await deleteDoc(doc(db, 'trips', tripId));
    } catch (error: any) {
      console.error("Error deleting document: ", error);
      throw error;
    }
  },

  // --- MÉTODOS PARA PUNTOS DEL ITINERARIO ---

  // Añadir un punto al viaje
  addPointToTrip: async (tripId: string, pointData: Omit<TripPoint, 'id'>) => {
    try {
      const pointsRef = collection(db, 'trips', tripId, 'points');
      const docRef = await addDoc(pointsRef, pointData);
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding point: ", error);
      throw error;
    }
  },

  // Obtener puntos de un viaje
  getTripPoints: async (tripId: string) => {
    try {
      const pointsRef = collection(db, 'trips', tripId, 'points');
      const querySnapshot = await getDocs(pointsRef);
      const points: TripPoint[] = [];
      querySnapshot.forEach((docSnap) => {
        points.push({ id: docSnap.id, ...docSnap.data() } as TripPoint);
      });
      // Sort by dayIndex then order
      return points.sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
        return a.order - b.order;
      });
    } catch (error: any) {
      console.error("Error getting points: ", error);
      throw error;
    }
  },

  // Actualizar un punto
  updateTripPoint: async (tripId: string, pointId: string, pointData: Partial<TripPoint>) => {
    try {
      const pointRef = doc(db, 'trips', tripId, 'points', pointId);
      await updateDoc(pointRef, pointData);
    } catch (error: any) {
      console.error("Error updating point: ", error);
      throw error;
    }
  },

  // Eliminar un punto
  deleteTripPoint: async (tripId: string, pointId: string) => {
    try {
      const pointRef = doc(db, 'trips', tripId, 'points', pointId);
      await deleteDoc(pointRef);
    } catch (error: any) {
      console.error("Error deleting point: ", error);
      throw error;
    }
  }
};
