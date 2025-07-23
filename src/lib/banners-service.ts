import { firestore } from './firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { FeaturedBanner } from '@/types';

const bannersCollection = collection(firestore, 'banners');

export const addBanner = async (banner: Omit<FeaturedBanner, 'id'>) => {
  try {
    await addDoc(bannersCollection, {
      ...banner,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getBannersStream = (callback: (banners: FeaturedBanner[]) => void) => {
  const q = query(bannersCollection, orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const banners: FeaturedBanner[] = [];
    querySnapshot.forEach((doc) => {
      banners.push({ id: doc.id, ...doc.data() } as FeaturedBanner);
    });
    callback(banners);
  });
  return unsubscribe;
};

export const updateBanner = async (id: string, data: Partial<Omit<FeaturedBanner, 'id'>>) => {
  const bannerDoc = doc(firestore, 'banners', id);
  try {
    await updateDoc(bannerDoc, data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteBanner = async (id: string) => {
  const bannerDoc = doc(firestore, 'banners', id);
  try {
    await deleteDoc(bannerDoc);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
