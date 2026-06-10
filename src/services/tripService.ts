import { collection, addDoc, getDocs, getDoc, query, where, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
  inviteCode?: string;
  participants?: string[];
  organizers?: string[]; 
  dayColors?: { [dayIndex: string]: string }; 
  createdAt: any;
}

export const tripService = {
  // Crear un nuevo viaje
  createTrip: async (tripData: Omit<Trip, 'id' | 'createdAt' | 'inviteCode' | 'participants'>) => {
    try {
      // Generar código único de 6 caracteres (mayúsculas y números)
      const generateInviteCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      const docRef = await addDoc(collection(db, 'trips'), {
        ...tripData,
        inviteCode: generateInviteCode(),
        participants: [tripData.userId], 
        organizers: [tripData.userId],   
        isPublished: false,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding document: ", error);
      throw error;
    }
  },

  // Obtener viajes del usuario (donde es creador o participante)
  getUserTrips: async (userId: string) => {
    try {
      // Buscamos viajes donde el usuario esté en la lista de participantes
      const q = query(
        collection(db, 'trips'), 
        where('participants', 'array-contains', userId)
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

  // Unirse a un viaje mediante código
  joinTripByCode: async (userId: string, code: string) => {
    try {
      // 1. Buscar el viaje por código
      const q = query(
        collection(db, 'trips'),
        where('inviteCode', '==', code.toUpperCase().trim())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Código no válido. No se encontró el viaje.');
      }

      const tripDoc = querySnapshot.docs[0];
      const tripData = tripDoc.data() as Trip;
      const tripId = tripDoc.id;

      // 2. Verificar si el usuario ya está en el viaje
      if (tripData.participants?.includes(userId)) {
        return tripId; // Ya está unido
      }

      // 3. Añadir el usuario a participantes
      const updatedParticipants = [...(tripData.participants || []), userId];
      await updateDoc(doc(db, 'trips', tripId), {
        participants: updatedParticipants
      });

      return tripId;
    } catch (error: any) {
      console.error("Error joining trip: ", error);
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
  
  // Abandonar un viaje
  leaveTrip: async (tripId: string, userId: string) => {
    try {
      const tripRef = doc(db, 'trips', tripId);
      const tripSnap = await getDoc(tripRef);
      
      if (!tripSnap.exists()) throw new Error("Viaje no encontrado");
      
      const tripData = tripSnap.data() as Trip;
      const updatedParticipants = (tripData.participants || []).filter(id => id !== userId);
      
      await updateDoc(tripRef, {
        participants: updatedParticipants
      });
    } catch (error: any) {
      console.error("Error leaving trip: ", error);
      throw error;
    }
  },

  // Cambiar rol a organizador
  promoteToOrganizer: async (tripId: string, userId: string) => {
    try {
      const tripRef = doc(db, 'trips', tripId);
      const tripSnap = await getDoc(tripRef);
      if (!tripSnap.exists()) throw new Error("Viaje no encontrado");
      
      const tripData = tripSnap.data() as Trip;
      const updatedOrganizers = [...(tripData.organizers || [tripData.userId]), userId];
      
      await updateDoc(tripRef, {
        organizers: updatedOrganizers
      });
    } catch (error: any) {
      console.error("Error promoting to organizer: ", error);
      throw error;
    }
  },

  // Quitar rol de organizador
  demoteOrganizer: async (tripId: string, userId: string) => {
    try {
      const tripRef = doc(db, 'trips', tripId);
      const tripSnap = await getDoc(tripRef);
      if (!tripSnap.exists()) throw new Error("Viaje no encontrado");
      
      const tripData = tripSnap.data() as Trip;
      const updatedOrganizers = (tripData.organizers || []).filter(id => id !== userId);
      
      await updateDoc(tripRef, {
        organizers: updatedOrganizers
      });
    } catch (error: any) {
      console.error("Error demoting organizer: ", error);
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
  },

  // Obtener todos los viajes publicados
  getPublishedTrips: async () => {
    try {
      const q = query(
        collection(db, 'trips'),
        where('isPublished', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const trips: Trip[] = [];
      querySnapshot.forEach((docSnap) => {
        trips.push({ id: docSnap.id, ...docSnap.data() } as Trip);
      });
      return trips;
    } catch (error: any) {
      console.error("Error getting published trips: ", error);
      throw error;
    }
  }
};
