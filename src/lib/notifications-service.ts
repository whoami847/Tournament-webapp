import type { AppNotification } from '@/types';
import { firestore } from './firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

const notificationsCollection = collection(firestore, 'notifications');

export const getNotificationsStream = (
  userId: string,
  callback: (notifications: AppNotification[]) => void
) => {
  const q = query(
    notificationsCollection,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(10)
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const notifications: AppNotification[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: (data.createdAt?.toDate() ?? new Date()).toISOString(),
      } as AppNotification);
    });
    callback(notifications);
  });

  return unsubscribe;
};

export const createNotification = async (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    try {
        await addDoc(notificationsCollection, {
            ...notification,
            read: false,
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error creating notification: ", error);
        return { success: false, error: error.message };
    }
}

export const markNotificationAsRead = async (notificationId: string) => {
    const notificationDoc = doc(firestore, 'notifications', notificationId);
    try {
        await updateDoc(notificationDoc, { read: true });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export const updateNotificationStatus = async (notificationId: string, status: 'accepted' | 'rejected') => {
    const notificationDoc = doc(firestore, 'notifications', notificationId);
    try {
        await updateDoc(notificationDoc, { status, read: true });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
