import { NextRequest, NextResponse } from 'next/server';
import { getActiveGateways } from '@/lib/gateways';
import { createOrder } from '@/lib/orders';
import { getDoc, doc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { amount, userId } = await request.json();

    // Validate input
    if (!amount || !userId || amount < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount or user ID' },
        { status: 400 }
      );
    }

    // Get active gateways
    const gateways = await getActiveGateways();
    if (gateways.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active payment gateways available' },
        { status: 400 }
      );
    }

    // Use the first active gateway (RupantorPay)
    const gateway = gateways[0];

    // Get user information
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Create order in database
    const orderResult = await createOrder({
      userId,
      userName: userData.name || 'Unknown User',
      amount,
      gatewayId: gateway.id,
      status: 'PENDING',
    });

    if (!orderResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to create order' },
        { status: 500 }
      );
    }

    const orderId = orderResult.id;

    // Prepare RupantorPay API request
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const rupantorPayUrl = gateway.isLive 
      ? 'https://payment.rupantorpay.com/api/payment/checkout'
      : process.env.RUPANTORPAY_CHECKOUT_URL || 'https://sandbox.rupantorpay.com/api/payment/checkout';

    const paymentData = {
      store_id: process.env.RUPANTORPAY_STORE_ID || 'your_store_id',
      store_passwd: gateway.storePassword,
      total_amount: amount,
      currency: 'BDT',
      tran_id: orderId,
      success_url: `${baseUrl}/api/payment/callback?status=success&tran_id=${orderId}`,
      fail_url: `${baseUrl}/api/payment/callback?status=fail&tran_id=${orderId}`,
      cancel_url: `${baseUrl}/api/payment/callback?status=cancel&tran_id=${orderId}`,
      ipn_url: `${baseUrl}/api/payment/callback`,
      product_name: 'Wallet Top Up',
      product_category: 'Digital Service',
      product_profile: 'general',
      cus_name: userData.name || 'Customer',
      cus_email: userData.email || 'customer@example.com',
      cus_add1: 'Dhaka',
      cus_add2: 'Dhaka',
      cus_city: 'Dhaka',
      cus_state: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: userData.phone || '01700000000',
      cus_fax: '01700000000',
      ship_name: userData.name || 'Customer',
      ship_add1: 'Dhaka',
      ship_add2: 'Dhaka',
      ship_city: 'Dhaka',
      ship_state: 'Dhaka',
      ship_postcode: '1000',
      ship_country: 'Bangladesh',
    };

    console.log('Initiating payment with RupantorPay:', {
      url: rupantorPayUrl,
      orderId,
      amount,
      userId
    });

    // Make request to RupantorPay
    const response = await fetch(rupantorPayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(paymentData).toString(),
    });

    const responseText = await response.text();
    console.log('RupantorPay response:', responseText);

    if (!response.ok) {
      console.error('RupantorPay API error:', response.status, responseText);
      return NextResponse.json(
        { success: false, error: 'Payment gateway error' },
        { status: 500 }
      );
    }

    // Parse response (RupantorPay usually returns HTML or redirect URL)
    // For RupantorPay, the response might be a redirect URL or HTML form
    // We need to handle this based on their API documentation
    
    let paymentUrl = null;
    
    // If response is JSON
    try {
      const jsonResponse = JSON.parse(responseText);
      paymentUrl = jsonResponse.GatewayPageURL || jsonResponse.payment_url;
    } catch {
      // If response is HTML with redirect or form
      const urlMatch = responseText.match(/window\.location\.href\s*=\s*["']([^"']+)["']/);
      if (urlMatch) {
        paymentUrl = urlMatch[1];
      } else {
        // Check for form action URL
        const formMatch = responseText.match(/action\s*=\s*["']([^"']+)["']/);
        if (formMatch) {
          paymentUrl = formMatch[1];
        }
      }
    }

    if (paymentUrl) {
      return NextResponse.json({
        success: true,
        payment_url: paymentUrl,
        order_id: orderId,
      });
    } else {
      console.error('No payment URL found in response:', responseText);
      return NextResponse.json(
        { success: false, error: 'Invalid payment gateway response' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}