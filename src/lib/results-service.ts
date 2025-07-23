import type { MatchResult } from '@/types';
import { firestore } from './firebase';
import { collection, addDoc, doc, updateDoc, onSnapshot, query, where, orderBy, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';

const resultsCollection = collection(firestore, 'matchResults');
const tournamentsCollection = collection(firestore, 'tournaments');

export const addMatchResult = async (result: Omit<MatchResult, 'id' | 'submittedAt' | 'status'>) => {
  try {
    // Add the new result submission
    const resultDocRef = await addDoc(resultsCollection, {
      ...result,
      status: 'pending',
      submittedAt: serverTimestamp(),
    });

    // Update the submission status in the tournament's bracket
    const tournamentDocRef = doc(tournamentsCollection, result.tournamentId);
    await runTransaction(firestore, async (transaction) => {
      const tournamentDoc = await transaction.get(tournamentDocRef);
      if (!tournamentDoc.exists()) throw new Error("Tournament not found");

      const bracket = tournamentDoc.data().bracket;
      const round = bracket.find((r: any) => r.name === result.roundName);
      if (round) {
        const match = round.matches.find((m: any) => m.id === result.matchId);
        if (match && match.resultSubmissionStatus) {
          match.resultSubmissionStatus[result.teamId] = 'submitted';
        }
      }
      transaction.update(tournamentDocRef, { bracket });
    });

    return { success: true, id: resultDocRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getPendingResultsStream = (callback: (results: MatchResult[]) => void) => {
  const q = query(resultsCollection, where('status', '==', 'pending'), orderBy('submittedAt', 'asc'));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const results: MatchResult[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        ...data,
        submittedAt: (data.submittedAt?.toDate() ?? new Date()).toISOString(),
      } as MatchResult);
    });
    callback(results);
  });
  return unsubscribe;
};

export const approveResult = async (resultId: string, tournamentId: string, matchId: string, roundName: string, team1Score: number, team2Score: number) => {
    const resultDocRef = doc(resultsCollection, resultId);
    const tournamentDocRef = doc(tournamentsCollection, tournamentId);

    try {
        await runTransaction(firestore, async (transaction) => {
            const tournamentDoc = await transaction.get(tournamentDocRef);
            if (!tournamentDoc.exists()) throw new Error("Tournament not found.");
            
            const bracket = tournamentDoc.data().bracket;
            const roundIndex = bracket.findIndex((r: any) => r.name === roundName);
            if (roundIndex === -1) throw new Error("Round not found.");
            
            const matchIndex = bracket[roundIndex].matches.findIndex((m: any) => m.id === matchId);
            if (matchIndex === -1) throw new Error("Match not found.");

            const match = bracket[roundIndex].matches[matchIndex];
            match.scores = [team1Score, team2Score];
            match.status = 'completed';

            // Advance winner to the next round
            const winner = team1Score > team2Score ? match.teams[0] : match.teams[1];
            if (winner && roundIndex < bracket.length - 1) {
                const nextRoundIndex = roundIndex + 1;
                const nextMatchIndex = Math.floor(matchIndex / 2);
                const teamSlotInNextMatch = matchIndex % 2;

                if (bracket[nextRoundIndex]?.matches[nextMatchIndex]) {
                    bracket[nextRoundIndex].matches[nextMatchIndex].teams[teamSlotInNextMatch] = winner;
                }
            }
            
            transaction.update(tournamentDocRef, { bracket });
            transaction.update(resultDocRef, { status: 'approved' });
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const rejectResult = async (resultId: string) => {
    const resultDocRef = doc(resultsCollection, resultId);
    try {
        await updateDoc(resultDocRef, { status: 'rejected' });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};
