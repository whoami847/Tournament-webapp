import { firestore } from './firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  onSnapshot, 
  serverTimestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import type { Gateway } from '@/types';

const gatewaysCollection = collection(firestore, 'gateways');

// Add a new gateway
export const addGateway = async (gatewayData: Omit<Gateway, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(gatewaysCollection, {
      ...gatewayData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error adding gateway:', error);
    return { success: false, error: error.message };
  }
};

// Update an existing gateway
export const updateGateway = async (id: string, gatewayData: Partial<Omit<Gateway, 'id' | 'createdAt' | 'updatedAt'>>) => {
  try {
    const gatewayRef = doc(firestore, 'gateways', id);
    await updateDoc(gatewayRef, {
      ...gatewayData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating gateway:', error);
    return { success: false, error: error.message };
  }
};

// Delete a gateway
export const deleteGateway = async (id: string) => {
  try {
    const gatewayRef = doc(firestore, 'gateways', id);
    await deleteDoc(gatewayRef);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting gateway:', error);
    return { success: false, error: error.message };
  }
};

// Get all gateways
export const getAllGateways = async (): Promise<Gateway[]> => {
  try {
    const querySnapshot = await getDocs(query(gatewaysCollection, orderBy('createdAt', 'desc')));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Gateway));
  } catch (error) {
    console.error('Error getting gateways:', error);
    return [];
  }
};

// Get active gateways only
export const getActiveGateways = async (): Promise<Gateway[]> => {
  try {
    const q = query(gatewaysCollection, where('enabled', '==', true), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Gateway));
  } catch (error) {
    console.error('Error getting active gateways:', error);
    return [];
  }
};

// Get a single gateway by ID
export const getGatewayById = async (id: string): Promise<Gateway | null> => {
  try {
    const docRef = doc(firestore, 'gateways', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Gateway;
    }
    return null;
  } catch (error) {
    console.error('Error getting gateway:', error);
    return null;
  }
};

// Real-time listener for gateways
export const getGatewaysStream = (callback: (gateways: Gateway[]) => void) => {
  const q = query(gatewaysCollection, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const gateways: Gateway[] = [];
    querySnapshot.forEach((doc) => {
      gateways.push({
        id: doc.id,
        ...doc.data()
      } as Gateway);
    });
    callback(gateways);
  }, (error) => {
    console.error('Error in gateways stream:', error);
    callback([]);
  });
};