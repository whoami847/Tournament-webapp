import { firestore } from './firebase';
import { collection, addDoc, getDocs, getDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { GameCategory } from '@/types';
import { toIsoString } from './utils';

const gamesCollection = collection(firestore, 'games');

export const addGame = async (game: Omit<GameCategory, 'id'>) => {
  try {
    await addDoc(gamesCollection, {
        ...game,
        description: game.description || "No description available.",
        createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getGamesStream = (callback: (games: GameCategory[]) => void) => {
  const q = query(gamesCollection, orderBy('name'));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const games: GameCategory[] = [];
    querySnapshot.forEach((doc) => {
      games.push({ id: doc.id, ...doc.data() } as GameCategory);
    });
    callback(games);
  });
  return unsubscribe;
};

export const getGames = async (): Promise<GameCategory[]> => {
  const q = query(gamesCollection, orderBy('name'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameCategory));
};

export const getGame = async (id: string): Promise<GameCategory | null> => {
  const gameDoc = doc(firestore, 'games', id);
  const docSnap = await getDoc(gameDoc);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as GameCategory;
  }
  return null;
};

export const updateGame = async (id: string, data: Partial<GameCategory>) => {
  const gameDoc = doc(firestore, 'games', id);
  try {
    await updateDoc(gameDoc, data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteGame = async (id: string) => {
  const gameDoc = doc(firestore, 'games', id);
  try {
    await deleteDoc(gameDoc);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
