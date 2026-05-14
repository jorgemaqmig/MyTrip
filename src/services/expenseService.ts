import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export type ExpenseCategory = 'Comida' | 'Transporte' | 'Ocio' | 'Souvenir' | 'Alojamiento' | 'Otro';
export type ExpenseType = 'Individual' | 'Colectivo';

export interface Expense {
  id?: string;
  tripId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  name: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  type: ExpenseType;
  createdAt: any;
}

export const expenseService = {
  // Añadir un nuevo gasto
  addExpense: async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    try {
      const expensesRef = collection(db, 'trips', expense.tripId, 'expenses');
      await addDoc(expensesRef, {
        ...expense,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding expense: ", error);
      throw error;
    }
  },

  // Escuchar gastos de un viaje en tiempo real
  subscribeToExpenses: (tripId: string, onUpdate: (expenses: Expense[]) => void) => {
    if (!tripId) return () => {};

    const expensesRef = collection(db, 'trips', tripId, 'expenses');
    
    return onSnapshot(expensesRef, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
      onUpdate(expenses);
    }, (error) => {
      console.error("Error subscribing to expenses: ", error);
    });
  },

  // Eliminar un gasto
  deleteExpense: async (tripId: string, expenseId: string) => {
    try {
      await deleteDoc(doc(db, 'trips', tripId, 'expenses', expenseId));
    } catch (error) {
      console.error("Error deleting expense: ", error);
      throw error;
    }
  },

  // Actualizar un gasto
  updateExpense: async (tripId: string, expenseId: string, data: Partial<Expense>) => {
    try {
      const expenseRef = doc(db, 'trips', tripId, 'expenses', expenseId);
      // Evitamos enviar el id en el objeto de actualización
      const { id, ...updateData } = data as any;
      await updateDoc(expenseRef, updateData);
    } catch (error) {
      console.error("Error updating expense: ", error);
      throw error;
    }
  }
};
