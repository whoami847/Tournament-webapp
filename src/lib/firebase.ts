import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDReCAxTGjgho2rWUQKCwU8Z3aoB0ZiYN4",
  authDomain: "aff-tour-1-0.firebaseapp.com",
  projectId: "aff-tour-1-0",
  storageBucket: "aff-tour-1-0.firebasestorage.app",
  messagingSenderId: "362331001350",
  appId: "1:362331001350:web:e756adec103071c849e987"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
