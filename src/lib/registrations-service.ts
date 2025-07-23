import { firestore } from './firebase';
import { collection, addDoc, serverTimestamp, type WriteBatch } from 'firebase/firestore';
import type { RegistrationLog, TeamType } from '@/types';

const registrationLogsCollection = collection(firestore, 'registrationLogs');

// This function is designed to be used within a Firebase WriteBatch/Transaction
export const createRegistrationLog = (
  batch: WriteBatch,
  logData: {
    tournamentId: string;
    tournamentName: string;
    game: string;
    teamName: string;
    teamType: TeamType;
    players: { name: string; gamerId: string }[];
  }
) => {
  const newLogRef = doc(registrationLogsCollection); // Generate a new doc reference
  const newLog: Omit<RegistrationLog, 'id'> = {
    ...logData,
    status: 'approved',
    registeredAt: serverTimestamp() as any, // Let the server set the timestamp
  };
  batch.set(newLogRef, newLog);
};

// Standalone function for streaming all registration logs
export const getRegistrationsStream = (callback: (logs: RegistrationLog[]) => void) => {
  const q = query(registrationLogsCollection, orderBy('registeredAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const logs: RegistrationLog[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        ...data,
        registeredAt: (data.registeredAt?.toDate() ?? new Date()).toISOString(),
      } as RegistrationLog);
    });
    callback(logs);
  });
  return unsubscribe;
};
