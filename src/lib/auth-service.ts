import {
  getAuth,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as signOutFirebase,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import type { AuthUser, PlayerProfile } from '@/types';
import { auth, firestore } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export function onAuthStateChanged(callback: (user: AuthUser | null) => void) {
  return onFirebaseAuthStateChanged(auth, (user) => {
    if (user) {
      const { uid, email, displayName, photoURL } = user;
      callback({ uid, email, displayName, photoURL });
    } else {
      callback(null);
    }
  });
}

export async function signUp(email: string, password: string, fullName: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const photoURL = `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.uid}`;
    
    await updateProfile(user, {
      displayName: fullName,
      photoURL: photoURL
    });
    
    await createUserProfile(user.uid, {
        name: fullName,
        email: email,
        avatar: photoURL,
    });
    
    return userCredential;
}

export async function signIn(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signOutUser() {
    return signOutFirebase(auth);
}

export async function sendPasswordReset(email: string) {
    return sendPasswordResetEmail(auth, email);
}

export const createUserProfile = async (uid: string, data: Partial<PlayerProfile>) => {
    const userRef = doc(firestore, "users", uid);
    return setDoc(userRef, {
        id: uid,
        ...data,
        gamerId: `player_${uid.substring(0, 6)}`,
        joined: serverTimestamp(),
        role: 'Player',
        winrate: 0,
        games: 0,
        wins: 0,
        balance: 100, // Welcome bonus
        pendingBalance: 0,
        status: 'active',
    }, { merge: true });
}

export const ensureUserProfile = async (user: AuthUser) => {
    const userRef = doc(firestore, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
        const { displayName, email, photoURL } = user;
        const newProfileData: Partial<PlayerProfile> = {
            name: displayName || 'New Player',
            email: email || '',
            avatar: photoURL || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.uid}`,
        };
        await createUserProfile(user.uid, newProfileData);
    }
}
