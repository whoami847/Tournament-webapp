import { firestore } from './firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  onSnapshot, 
  serverTimestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import type { Order } from '@/types';

const ordersCollection = collection(firestore, 'orders');

// Create a new order
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(ordersCollection, {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
};

// Update an existing order
export const updateOrder = async (id: string, orderData: Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>) => {
  try {
    const orderRef = doc(firestore, 'orders', id);
    await updateDoc(orderRef, {
      ...orderData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating order:', error);
    return { success: false, error: error.message };
  }
};

// Get a single order by ID
export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const docRef = doc(firestore, 'orders', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Order;
    }
    return null;
  } catch (error) {
    console.error('Error getting order:', error);
    return null;
  }
};

// Get orders for a specific user
export const getUserOrdersStream = (userId: string, callback: (orders: Order[]) => void) => {
  const q = query(
    ordersCollection, 
    where('userId', '==', userId), 
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      } as Order);
    });
    callback(orders);
  }, (error) => {
    console.error('Error in user orders stream:', error);
    callback([]);
  });
};