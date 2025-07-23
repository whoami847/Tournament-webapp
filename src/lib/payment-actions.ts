'use server';

import { redirect } from 'next/navigation';
import { firestore } from './firebase';
import { doc, runTransaction, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { getGatewaySettings } from './gateway-service';

// Helper function to get user profile
async function getUserProfile(userId: string) {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

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

  try {
    // Get gateway settings
    const gatewaySettings = await getGatewaySettings();
    
    if (!gatewaySettings.name || !gatewaySettings.accessToken || !gatewaySettings.checkoutUrl) {
      return { error: 'Payment gateway is not properly configured. Please contact support.' };
    }

    // Get user profile for customer information
    const userProfile = await getUserProfile(userId);

    const transactionRef = doc(firestore, 'transactions', `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const transaction_id = transactionRef.id;
    const amount = parseFloat(rawFormData.amount.toString());
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const success_url = `${baseUrl}/payment/success?transaction_id=${transaction_id}`;
    const cancel_url = `${baseUrl}/payment/cancel`;
    const fail_url = `${baseUrl}/payment/fail`;

    // Create a pending transaction document
    const transactionData = {
      userId,
      amount: amount,
      type: 'deposit',
      description: 'Online Deposit',
      date: serverTimestamp(),
      status: 'pending',
      gatewayTransactionId: transaction_id,
    };
    await setDoc(transactionRef, transactionData);

    // Prepare RupantorPay checkout request - trying multiple possible formats
    const checkoutData = {
      // Common fields
      amount: amount,
      currency: 'BDT',
      order_id: transaction_id,
      transaction_id: transaction_id,
      
      // Return URLs
      success_url: success_url,
      cancel_url: cancel_url,
      fail_url: fail_url,
      return_url: success_url,
      
      // Customer information
      customer_name: userProfile?.name || 'Customer',
      customer_email: userProfile?.email || 'customer@example.com',
      customer_phone: userProfile?.phone || '01700000000',
      
      // Additional possible fields
      merchant_order_id: transaction_id,
      description: 'Online Payment',
      product_name: 'Wallet Top Up',
    };

    console.log('Sending payment request to:', gatewaySettings.checkoutUrl);
    console.log('Request data:', JSON.stringify(checkoutData, null, 2));

    // Make API call to RupantorPay
    const response = await fetch(gatewaySettings.checkoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewaySettings.accessToken}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(checkoutData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    if (!response.ok) {
      console.error('RupantorPay API Error:', response.status, responseText);
      return { error: `Failed to initiate transaction. API Error: ${response.status}. Please check your gateway configuration and try again.` };
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      return { error: 'Invalid response from payment gateway. Please try again.' };
    }

    console.log('Parsed response:', JSON.stringify(result, null, 2));
    
    // Handle different possible response formats
    let payment_url = null;
    
    // Try different possible response structures
    if (result.payment_url) {
      payment_url = result.payment_url;
    } else if (result.checkout_url) {
      payment_url = result.checkout_url;
    } else if (result.redirect_url) {
      payment_url = result.redirect_url;
    } else if (result.url) {
      payment_url = result.url;
    } else if (result.data && result.data.payment_url) {
      payment_url = result.data.payment_url;
    } else if (result.data && result.data.checkout_url) {
      payment_url = result.data.checkout_url;
    } else if (result.data && result.data.redirect_url) {
      payment_url = result.data.redirect_url;
    }

    // Check for success status in different formats
    const isSuccess = 
      result.status === 'success' || 
      result.status === 'SUCCESS' ||
      result.success === true ||
      result.success === 'true' ||
      (result.data && result.data.status === 'success') ||
      (result.code && result.code === 200) ||
      response.ok;

    if (isSuccess && payment_url) {
      console.log('Redirecting to payment URL:', payment_url);
      redirect(payment_url);
    } else {
      console.error('Payment initiation failed or no payment URL received:', result);
      return { 
        error: result.message || result.error || result.error_message || 'Failed to initiate transaction. Please try again.' 
      };
    }
  } catch (error: any) {
    console.error('Payment initiation error:', error);
    if (error.message && error.message.includes('NEXT_REDIRECT')) {
      // This is actually a successful redirect, re-throw it
      throw error;
    }
    return { error: `Failed to initiate transaction: ${error.message}. Please try again.` };
  }
}

export async function verifyPayment(transaction_id: string | null) {
  if (!transaction_id) {
    return { status: 'error' as const, message: 'Transaction ID is missing.' };
  }
  
  try {
    // Get gateway settings
    const gatewaySettings = await getGatewaySettings();
    
    if (!gatewaySettings.verifyUrl || !gatewaySettings.accessToken) {
      return { status: 'error' as const, message: 'Payment gateway verification is not configured.' };
    }

    console.log('Verifying payment with ID:', transaction_id);
    console.log('Verify URL:', gatewaySettings.verifyUrl);

    // Verify payment with RupantorPay - try different possible request formats
    const verifyData = {
      order_id: transaction_id,
      transaction_id: transaction_id,
      merchant_order_id: transaction_id,
    };

    const verifyResponse = await fetch(gatewaySettings.verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewaySettings.accessToken}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(verifyData),
    });

    console.log('Verify response status:', verifyResponse.status);

    const verifyResponseText = await verifyResponse.text();
    console.log('Verify raw response:', verifyResponseText);

    if (!verifyResponse.ok) {
      console.error('RupantorPay Verify API Error:', verifyResponse.status, verifyResponseText);
      return { status: 'error' as const, message: `Failed to verify payment status. API Error: ${verifyResponse.status}` };
    }

    let verifyResult;
    try {
      verifyResult = JSON.parse(verifyResponseText);
    } catch (parseError) {
      console.error('Failed to parse verify response as JSON:', parseError);
      return { status: 'error' as const, message: 'Invalid verification response from payment gateway.' };
    }

    console.log('Parsed verify response:', JSON.stringify(verifyResult, null, 2));
    
    // Check if payment was successful - try different possible response formats
    const isPaymentSuccess = 
      (verifyResult.status === 'success' || verifyResult.status === 'SUCCESS') ||
      (verifyResult.payment_status === 'paid' || verifyResult.payment_status === 'PAID' || verifyResult.payment_status === 'completed') ||
      (verifyResult.success === true || verifyResult.success === 'true') ||
      (verifyResult.data && (verifyResult.data.status === 'success' || verifyResult.data.payment_status === 'paid'));

    if (!isPaymentSuccess) {
      console.log('Payment not successful:', verifyResult);
      return { status: 'fail' as const, message: 'Payment verification failed or payment was not completed.' };
    }

    // Update transaction and user balance
    const transactionRef = doc(firestore, 'transactions', transaction_id);
    const transactionDoc = await getDoc(transactionRef);
    
    if (!transactionDoc.exists()) {
      return { status: 'error' as const, message: 'Transaction not found.' };
    }

    const transactionData = transactionDoc.data();
    const userRef = doc(firestore, 'users', transactionData.userId);

    await runTransaction(firestore, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error("User not found.");
      }

      if (transactionData.status !== 'pending') {
        throw new Error("Transaction already processed.");
      }

      const newBalance = (userDoc.data().balance || 0) + transactionData.amount;
      
      transaction.update(userRef, { balance: newBalance });
      transaction.update(transactionRef, { 
        status: 'success',
        gatewayResponse: verifyResult,
        completedAt: serverTimestamp()
      });
    });

    return { status: 'success' as const, message: 'Payment verified and balance updated.' };
  } catch (error: any) {
    console.error("Payment verification failed:", error);
    return { status: 'fail' as const, message: error.message || 'Payment verification failed.' };
  }
}
