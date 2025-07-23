import type { WithdrawMethod } from '@/types';
import { firestore } from './firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, where, getDocs } from 'firebase/firestore';

const methodsCollection = collection(firestore, 'withdrawMethods');

export const addWithdrawMethod = async (method: Omit<WithdrawMethod, 'id'>) => {
  try {
    await addDoc(methodsCollection, method);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getWithdrawMethodsStream = (callback: (methods: WithdrawMethod[]) => void) => {
  const q = query(methodsCollection, orderBy('name'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const methods: WithdrawMethod[] = [];
    snapshot.forEach((doc) => {
      methods.push({ id: doc.id, ...doc.data() } as WithdrawMethod);
    });
    callback(methods);
  });
  return unsubscribe;
};

export const getActiveWithdrawMethods = async (): Promise<WithdrawMethod[]> => {
    const q = query(methodsCollection, where('status', '==', 'active'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawMethod));
}

export const updateWithdrawMethod = async (id: string, data: Partial<Omit<WithdrawMethod, 'id'>>) => {
  const methodDoc = doc(firestore, 'withdrawMethods', id);
  try {
    await updateDoc(methodDoc, data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteWithdrawMethod = async (id: string) => {
  const methodDoc = doc(firestore, 'withdrawMethods', id);
  try {
    await deleteDoc(methodDoc);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
