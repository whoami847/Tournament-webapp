'use client';

import { create } from 'zustand';
import { 
    type User as FirebaseUser,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    getIdTokenResult,
} from 'firebase/auth';
import {
    collection,
    onSnapshot,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    getDocs,
    setDoc,
    query,
    where,
    increment,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';
import { auth, firestore as db } from './firebase';
import type { Gateway, Order, Transaction } from '@/types';
import { format } from 'date-fns';

export type User = {
    uid: string;
    email: string | null;
    balance: number;
    isBanned?: boolean;
    isAdmin?: boolean;
};

type Credentials = {
    email: string;
    password?: string;
}

type AppState = {
  balance: number;
  orders: Order[];
  transactions: Transaction[];
  users: User[];
  gateways: Gateway[];
  currentUser: User | null;
  isAuthLoading: boolean;
  isAuthDialogOpen: boolean;
  init: () => void;
  setAuthDialogOpen: (open: boolean) => void;
  // Async actions
  registerUser: (credentials: Credentials) => Promise<{ success: boolean; message: string }>;
  loginUser: (credentials: Credentials) => Promise<{ success: boolean; message: string }>;
  logoutUser: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  updateTransactionStatus: (transactionId: string, status: Transaction['status']) => Promise<void>;
  addGateway: (gateway: Omit<Gateway, 'id'>) => Promise<void>;
  updateGateway: (id: string, gateway: Partial<Omit<Gateway, 'id'>>) => Promise<void>;
  deleteGateway: (id: string) => Promise<void>;
  toggleUserBanStatus: (userId: string, isBanned: boolean) => Promise<void>;
  toggleUserAdminStatus: (userId: string, isAdmin: boolean) => Promise<void>;
};

let unsubscribers: (() => void)[] = [];
const cleanupListeners = () => {
    unsubscribers.forEach(unsub => unsub());
    unsubscribers = [];
}

export const useAppStore = create<AppState>()(
    (set, get) => ({
      balance: 0,
      orders: [],
      transactions: [],
      users: [],
      gateways: [],
      currentUser: null,
      isAuthLoading: true,
      isAuthDialogOpen: false,

      init: () => {
          cleanupListeners(); // Clear any previous listeners
          set({ isAuthLoading: true });

          // Public Listeners
          const unsubUsers = onSnapshot(collection(db, 'users'), snapshot => {
              set({ users: snapshot.docs.map(doc => ({ ...doc.data() } as User)) });
          });
           const unsubGateways = onSnapshot(collection(db, 'gateways'), snapshot => {
              set({ gateways: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gateway)) });
          });
          
          const unsubAuth = onAuthStateChanged(auth, async (user) => {
              const allSubs = [unsubUsers, unsubGateways, unsubAuth];
              // Detach all non-auth listeners
              unsubscribers.filter(unsub => !allSubs.includes(unsub)).forEach(unsub => unsub());

              if (user) {
                  const idTokenResult = await user.getIdTokenResult(true); // Force refresh to get latest claims
                  const isAdmin = idTokenResult.claims.admin === true;

                  const userDocSub = onSnapshot(doc(db, 'users', user.uid), async (userDoc) => {
                       if (!userDoc.exists()) {
                          console.log(`Creating user profile for ${user.uid}`);
                          const newUser: User = { uid: user.uid, email: user.email, balance: 0, isBanned: false, isAdmin };
                          await setDoc(doc(db, "users", user.uid), newUser);
                          set({ currentUser: newUser, balance: 0 });
                       } else {
                           const userData = userDoc.data() as User;
                           set({ currentUser: { ...userData, isAdmin }, balance: userData.balance });
                       }
                  });
                  
                  // Get all orders and transactions for admin, or user-specific for regular users.
                  const ordersQuery = query(collection(db, 'orders'));
                  const ordersSub = onSnapshot(ordersQuery, snapshot => {
                      set({ orders: snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Order) });
                  });
                  
                  const transactionsQuery = query(collection(db, 'transactions'));
                  const transactionsSub = onSnapshot(transactionsQuery, snapshot => {
                      set({ transactions: snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Transaction) });
                  });

                  unsubscribers = [unsubUsers, unsubGateways, userDocSub, ordersSub, transactionsSub, unsubAuth];
              } else {
                  set({ currentUser: null, orders: [], transactions: [], balance: 0 });
                   unsubscribers = [unsubUsers, unsubGateways, unsubAuth];
              }
              set({ isAuthLoading: false });
          });
          unsubscribers = [unsubUsers, unsubGateways, unsubAuth];
      },

      setAuthDialogOpen: (open) => set({ isAuthDialogOpen: open }),

      registerUser: async ({ email, password }) => {
        if (!password) return { success: false, message: "Password is required." };
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const newUser: User = { uid: user.uid, email: user.email, balance: 0, isBanned: false, isAdmin: false };
            await setDoc(doc(db, "users", user.uid), newUser);
            return { success: true, message: "Registration successful!" };
        } catch (error: any) {
            return { success: false, message: "Registration failed: " + error.message };
        }
      },

      loginUser: async ({ email, password }) => {
        if (!password) return { success: false, message: "Password is required." };
    
        const specialAdminEmail = 'burnersshopadmin@admin.com';
    
        try {
            // Step 1: Try to sign in normally
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userDocRef = doc(db, 'users', userCredential.user.uid);
            const userDoc = await getDoc(userDocRef);
    
            if (userDoc.exists() && userDoc.data().isBanned) {
                await signOut(auth);
                return { success: false, message: "This account has been banned." };
            }
    
            // Step 2: Bootstrap admin if it's the special admin user and not yet an admin
            if (userCredential.user.email === specialAdminEmail) {
                const tokenResult = await userCredential.user.getIdTokenResult();
                if (!tokenResult.claims.admin) {
                    console.log('Initial admin claim not found. Attempting to bootstrap...');
                    await get().toggleUserAdminStatus(userCredential.user.uid, true);
                    const freshToken = await userCredential.user.getIdTokenResult(true); 
                    
                    const userFromDb = (await getDoc(userDocRef)).data() as User;
                    set({ currentUser: { ...userFromDb, isAdmin: freshToken.claims.admin === true } });
                }
            }
    
            return { success: true, message: "Login successful!" };
        } catch (error: any) {
            // Step 3: If login fails, check if it's the special admin user who doesn't exist yet
            if (error.code === 'auth/user-not-found' && email === specialAdminEmail) {
                console.log("Admin user not found. Attempting to create and bootstrap admin...");
                try {
                    // Register the special admin user
                    const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
                    
                    // Firestore user doc creation is handled by onAuthStateChanged listener,
                    // but we can set it here to be faster.
                    const newUser: User = { uid: newUserCredential.user.uid, email: newUserCredential.user.email, balance: 0, isBanned: false, isAdmin: true };
                    await setDoc(doc(db, "users", newUserCredential.user.uid), newUser);

                    // Now, promote them to admin
                    await get().toggleUserAdminStatus(newUserCredential.user.uid, true);
                    await newUserCredential.user.getIdTokenResult(true); // Force refresh
                    console.log('Admin account created and bootstrapped successfully.');
    
                    return { success: true, message: "Admin account created. Login successful!" };
                } catch (creationError: any) {
                    console.error("Failed to create and bootstrap admin user:", creationError);
                    return { success: false, message: "Failed to create admin account: " + creationError.message };
                }
            }
    
            // For all other errors, return the generic message
            console.error("Login failed:", error);
            return { success: false, message: "Invalid email or password." };
        }
      },
      
      logoutUser: async () => {
          await signOut(auth);
      },
      
      addTransaction: async (transaction) => {
        const currentUser = get().currentUser;
        if (!currentUser) throw new Error("User not logged in.");
        await addDoc(collection(db, 'transactions'), { ...transaction, userId: currentUser.uid });
      },

      updateTransactionStatus: async (transactionId, status) => {
          const transactionRef = doc(db, 'transactions', transactionId);
          const transactionDocSnap = await getDoc(transactionRef);
          
          if (!transactionDocSnap.exists()) return;

          const transactionDoc = transactionDocSnap.data() as Transaction;
          
          if (transactionDoc.status === 'Pending' && status === 'Completed' && transactionDoc.amount > 0) {
              const userRef = doc(db, 'users', transactionDoc.userId);
              const batch = writeBatch(db);
              batch.update(transactionRef, { status });
              batch.update(userRef, { balance: increment(transactionDoc.amount) });
              await batch.commit();
          } else {
              await updateDoc(transactionRef, { status });
          }
      },

      addGateway: async (gateway) => {
        await addDoc(collection(db, 'gateways'), gateway);
      },
      
      updateGateway: async (id, updatedData) => {
        await updateDoc(doc(db, 'gateways', id), updatedData);
      },

      deleteGateway: async (id) => {
        await deleteDoc(doc(db, 'gateways', id));
      },

      toggleUserBanStatus: async (userId, isBanned) => {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { isBanned });
      },

      toggleUserAdminStatus: async (userId, isAdmin) => {
        const { currentUser } = get();
        if (!auth.currentUser) {
          throw new Error("User not authenticated.");
        }
        
        const idToken = await auth.currentUser.getIdToken();
        if (!idToken) {
            throw new Error("Authentication token not found.");
        }
        
        const response = await fetch('/api/user/set-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ userId, isAdmin }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update user role.');
        }

        // After a successful role change, force a token refresh for the current user
        // if they are the one being changed. This ensures their own isAdmin status
        // is updated immediately on the client.
        if (currentUser?.uid === userId) {
          await auth.currentUser?.getIdToken(true);
        }
      },

    })
);