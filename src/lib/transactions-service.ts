import type { Transaction } from '@/types';
import { firestore } from './firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { toIsoString } from './utils';

export const getTransactionsStream = (
  userId: string,
  callback: (transactions: Transaction[]) => void
) => {
  const transactionsCollection = collection(firestore, 'transactions');
  const q = query(
    transactionsCollection,
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        date: toIsoString(data.date),
      } as Transaction);
    });
    callback(transactions);
  });

  return unsubscribe;
};
