import type { PendingPrize, PlayerProfile } from '@/types';
import { firestore } from './firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { createNotification } from './notifications-service';

const prizesCollection = collection(firestore, 'pendingPrizes');
const usersCollection = collection(firestore, 'users');
const transactionsCollection = collection(firestore, 'transactions');

export const getPendingPrizesStream = (callback: (prizes: PendingPrize[]) => void) => {
    const q = query(prizesCollection, where('status', '==', 'pending'), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const prizes: PendingPrize[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            prizes.push({
                id: doc.id,
                ...data,
                createdAt: (data.createdAt?.toDate() ?? new Date()).toISOString(),
            } as PendingPrize);
        });
        callback(prizes);
    });

    return unsubscribe;
};

export const processPendingPrize = async (prizeId: string, newStatus: 'approved' | 'rejected') => {
    const prizeDocRef = doc(firestore, 'pendingPrizes', prizeId);

    try {
        await runTransaction(firestore, async (transaction) => {
            const prizeDoc = await transaction.get(prizeDocRef);
            if (!prizeDoc.exists()) {
                throw new Error("Prize request not found.");
            }

            const prize = prizeDoc.data() as PendingPrize;
            const userDocRef = doc(usersCollection, prize.userId);
            const userDoc = await transaction.get(userDocRef);

            if (!userDoc.exists()) {
                throw new Error("User not found.");
            }
            
            const userData = userDoc.data() as PlayerProfile;

            // Update prize status
            transaction.update(prizeDocRef, { status: newStatus });

            if (newStatus === 'approved') {
                // Adjust user balance
                const newBalance = (userData.balance || 0) + prize.amount;
                const newPendingBalance = Math.max(0, (userData.pendingBalance || 0) - prize.amount);
                transaction.update(userDocRef, { balance: newBalance, pendingBalance: newPendingBalance });
                
                // Create a transaction log
                const newTransactionRef = doc(transactionsCollection);
                transaction.set(newTransactionRef, {
                    userId: prize.userId,
                    amount: prize.amount,
                    type: 'prize',
                    description: `Prize from ${prize.tournamentName}: ${prize.reason}`,
                    date: serverTimestamp(),
                });
            } else { // Rejected
                 const newPendingBalance = Math.max(0, (userData.pendingBalance || 0) - prize.amount);
                 transaction.update(userDocRef, { pendingBalance: newPendingBalance });
            }
        });
        
        const prizeData = (await getDoc(prizeDocRef)).data() as PendingPrize;
        await createNotification({
            userId: prizeData.userId,
            title: `Prize Money ${newStatus}`,
            description: `Your prize of ${prizeData.amount} TK from ${prizeData.tournamentName} has been ${newStatus}.`,
            link: '/wallet'
        });

        return { success: true };

    } catch (error: any) {
        console.error("Error processing prize: ", error);
        return { success: false, error: error.message };
    }
};
