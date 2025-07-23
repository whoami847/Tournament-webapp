import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrder } from '@/lib/orders';
import { getGatewayById } from '@/lib/gateways';
import { doc, updateDoc, addDoc, collection, serverTimestamp, runTransaction } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}

async function handleCallback(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const tranId = searchParams.get('tran_id');
    const paymentId = searchParams.get('payment_id');
    const amount = searchParams.get('amount');

    console.log('Payment callback received:', {
      status,
      tranId,
      paymentId,
      amount,
      url: request.url
    });

    if (!tranId) {
      console.error('No transaction ID provided in callback');
      redirect('/payment/fail');
    }

    // Get order from database
    const order = await getOrderById(tranId!);
    if (!order) {
      console.error('Order not found:', tranId);
      redirect('/payment/fail');
    }

    // Get gateway information
    const gateway = await getGatewayById(order.gatewayId);
    if (!gateway) {
      console.error('Gateway not found:', order.gatewayId);
      redirect('/payment/fail');
    }

    // Handle different statuses
    if (status === 'success') {
      // Verify payment with RupantorPay
      const isVerified = await verifyPayment(gateway, tranId!, paymentId);
      
      if (isVerified) {
        // Update order status and user balance
        await processSuccessfulPayment(order, paymentId);
        redirect('/payment/success?tran_id=' + tranId);
      } else {
        // Payment verification failed
        await updateOrder(order.id, { 
          status: 'FAILED',
          paymentId: paymentId || undefined 
        });
        redirect('/payment/fail');
      }
    } else if (status === 'fail') {
      // Update order status to failed
      await updateOrder(order.id, { 
        status: 'FAILED',
        paymentId: paymentId || undefined 
      });
      redirect('/payment/fail');
    } else if (status === 'cancel') {
      // Update order status to cancelled
      await updateOrder(order.id, { 
        status: 'CANCELLED',
        paymentId: paymentId || undefined 
      });
      redirect('/payment/cancel');
    } else {
      console.error('Unknown payment status:', status);
      redirect('/payment/fail');
    }

  } catch (error: any) {
    console.error('Payment callback error:', error);
    redirect('/payment/fail');
  }
}

async function verifyPayment(gateway: any, tranId: string, paymentId: string | null): Promise<boolean> {
  try {
    const verifyUrl = gateway.isLive 
      ? 'https://payment.rupantorpay.com/api/payment/verify-payment'
      : process.env.RUPANTORPAY_VERIFY_URL || 'https://sandbox.rupantorpay.com/api/payment/verify-payment';

    const verifyData = {
      store_id: process.env.RUPANTORPAY_STORE_ID || 'your_store_id',
      store_passwd: gateway.storePassword,
      tran_id: tranId,
    };

    console.log('Verifying payment with RupantorPay:', {
      url: verifyUrl,
      tranId,
      paymentId
    });

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(verifyData).toString(),
    });

    const responseText = await response.text();
    console.log('RupantorPay verify response:', responseText);

    if (!response.ok) {
      console.error('RupantorPay verify API error:', response.status, responseText);
      return false;
    }

    // Parse verification response
    try {
      const jsonResponse = JSON.parse(responseText);
      
      // Check if payment is valid
      return (
        jsonResponse.status === 'VALID' ||
        jsonResponse.status === 'SUCCESS' ||
        jsonResponse.tran_status === 'SUCCESS'
      );
    } catch {
      // If response is not JSON, check for success indicators in text
      return (
        responseText.includes('VALID') ||
        responseText.includes('SUCCESS') ||
        responseText.includes('success')
      );
    }

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return false;
  }
}

async function processSuccessfulPayment(order: any, paymentId: string | null) {
  try {
    // Use Firestore transaction to ensure data consistency
    await runTransaction(firestore, async (transaction) => {
      // Update order
      const orderRef = doc(firestore, 'orders', order.id);
      transaction.update(orderRef, {
        status: 'COMPLETED',
        paymentId: paymentId || null,
        updatedAt: serverTimestamp(),
      });

      // Update user balance
      const userRef = doc(firestore, 'users', order.userId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const currentBalance = userDoc.data().balance || 0;
      const newBalance = currentBalance + order.amount;

      transaction.update(userRef, {
        balance: newBalance,
      });

      // Create transaction record
      const transactionRef = doc(collection(firestore, 'transactions'));
      transaction.set(transactionRef, {
        userId: order.userId,
        amount: order.amount,
        type: 'deposit',
        description: `Wallet top-up via RupantorPay - Order #${order.id}`,
        date: serverTimestamp(),
      });
    });

    console.log('Payment processed successfully:', {
      orderId: order.id,
      userId: order.userId,
      amount: order.amount,
      paymentId
    });

  } catch (error: any) {
    console.error('Error processing successful payment:', error);
    throw error;
  }
}