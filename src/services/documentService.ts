import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  deleteDoc, 
  doc,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from './firebaseConfig';

export type DocCategory = 'Pasaporte' | 'Billete' | 'Reserva' | 'Seguro' | 'Tickets' | 'Mapas' | 'Otros';
export type DocType = 'Individual' | 'Colectivo';

export interface TravelDocument {
  id?: string;
  tripId: string;
  userId: string;
  userName: string;
  title: string;
  category: DocCategory;
  type: DocType;
  fileUrl: string;
  fileName: string;
  mimeType: string; 
  storagePath: string;
  createdAt: any;
}

export const documentService = {
  // Suscribirse a los documentos de un viaje
  subscribeToDocuments: (tripId: string, callback: (docs: TravelDocument[]) => void) => {
    if (!tripId) return () => {};
    const docsRef = collection(db, 'trips', tripId, 'documents');
    const q = query(docsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TravelDocument[];
      callback(docs);
    });
  },

  // Subir un documento
  uploadDocument: async (
    tripId: string, 
    userId: string, 
    userName: string,
    title: string,
    category: DocCategory,
    type: DocType,
    fileBlob: Blob,
    fileName: string,
    mimeType: string 
  ) => {
    try {
      const storagePath = `trips/${tripId}/documents/${Date.now()}_${fileName}`;
      const fileRef = ref(storage, storagePath);
      
      await uploadBytes(fileRef, fileBlob, { contentType: mimeType });
      const fileUrl = await getDownloadURL(fileRef);

      const docData: Omit<TravelDocument, 'id'> = {
        tripId,
        userId,
        userName,
        title,
        category,
        type,
        fileUrl,
        fileName,
        mimeType,
        storagePath,
        createdAt: Timestamp.now()
      };

      const docsRef = collection(db, 'trips', tripId, 'documents');
      await addDoc(docsRef, docData);

      return true;
    } catch (error) {
      console.error("Error en uploadDocument:", error);
      throw error;
    }
  },

  // Eliminar un documento
  deleteDocument: async (tripId: string, docId: string, storagePath: string) => {
    try {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);

      const docRef = doc(db, 'trips', tripId, 'documents', docId);
      await deleteDoc(docRef);

      return true;
    } catch (error) {
      console.error("Error en deleteDocument:", error);
      throw error;
    }
  }
};
