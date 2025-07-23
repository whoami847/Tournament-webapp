'use server';

import { redirect } from 'next/navigation';
import { firestore } from './firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export async function createPaymentUrl(
  userId: string | null,
  state: { error: string } | null,
  formData: FormData
) {
  if (!userId) {
    return { error: 'User is not authenticated. Please log in again.' };
  }

  const rawFormData = {
    amount: formData.get('amount'),
  };

  if (!rawFormData.amount || +rawFormData.amount < 10) {
    return { error: 'Amount is required and must be at least 10.' };
  }
  
  const transactionRef = doc(firestore, 'transactions', `temp_${Date.now()}`); // Create a temp ref

  // In a real app, this would call the payment gateway API
  // and get a checkout URL. For now, we simulate success.
  const transaction_id = transactionRef.id;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const success_url = `${baseUrl}/payment/success?transaction_id=${transaction_id}`;
  
  // Create a pending transaction document
  try {
    const transactionData = {
      userId,
      amount: parseFloat(rawFormData.amount.toString()),
      type: 'deposit',
      description: 'Online Deposit',
      date: serverTimestamp(),
      status: 'pending',
      gatewayTransactionId: transaction_id,
    };
    await setDoc(transactionRef, transactionData);
  } catch (error: any) {
    return { error: 'Failed to initiate transaction. Please try again.' }
  }

  // In a real app, you would redirect to the payment gateway's URL
  // For the demo, we redirect directly to our success page
  redirect(success_url);
}


export async function verifyPayment(transaction_id: string | null) {
  if (!transaction_id) {
    return { status: 'error' as const, message: 'Transaction ID is missing.' };
  }
  
  // This is a simplified verification for demo.
  // A real app would get this from the payment gateway callback and verify it securely on the backend.
  
  const transactionRef = doc(firestore, 'transactions', transaction_id);
  const userRef = doc(firestore, 'users', (await getDoc(transactionRef)).data()?.userId);

  try {
    await runTransaction(firestore, async (transaction) => {
      const transactionDoc = await transaction.get(transactionRef);
      if (!transactionDoc.exists() || transactionDoc.data().status !== 'pending') {
        throw new Error("Transaction not found or already processed.");
      }
      
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error("User not found.");
      }

      const newBalance = userDoc.data().balance + transactionDoc.data().amount;
      
      transaction.update(userRef, { balance: newBalance });
      transaction.update(transactionRef, { status: 'success' });
    });
    return { status: 'success' as const, message: 'Payment verified and balance updated.' };
  } catch (error: any) {
    console.error("Payment verification failed:", error);
    return { status: 'fail' as const, message: error.message };
  }
}
