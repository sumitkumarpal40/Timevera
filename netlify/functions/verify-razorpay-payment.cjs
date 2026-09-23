const crypto = require('crypto');
const Razorpay = require('razorpay');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

if (!getApps().length) {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '')
    .replace(/^"|"$/g, '')
    .replace(/\\n/g, '\n');

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  } else if (process.env.FIREBASE_PROJECT_ID) {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    initializeApp({
      projectId: 'timevera-customer',
    });
  }
  console.log('Firebase Admin initialized for project:', process.env.FIREBASE_PROJECT_ID);
  console.log('Razorpay Key present:', !!process.env.RAZORPAY_KEY_ID);
}

const db = getFirestore();

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Payment details missing' }) };
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
    }

    // Signature verified — fetch payment status from Razorpay API
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Razorpay server credentials not configured' }) };
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    let payment;
    try {
      payment = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (fetchErr) {
      console.error('Failed to fetch payment details from Razorpay:', fetchErr);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Unable to verify payment with payment gateway' }),
      };
    }

    // Reject order_id mismatch
    if (payment.order_id && payment.order_id !== razorpay_order_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Payment gateway order ID mismatch' }),
      };
    }

    // Ensure payment is captured
    let paymentStatusState = payment.status;
    if (paymentStatusState === 'authorized') {
      try {
        const capturedPayment = await razorpay.payments.capture(
          razorpay_payment_id,
          payment.amount,
          payment.currency || 'INR'
        );
        paymentStatusState = capturedPayment.status;
      } catch (captureErr) {
        console.error('Failed to capture authorized payment:', captureErr);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Payment capture failed. Order cannot be marked Paid.' }),
        };
      }
    }

    if (paymentStatusState !== 'captured') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Payment is not captured (status: ${paymentStatusState}). Order cannot be created.` }),
      };
    }

    // Signature verified and payment captured — save order to Firestore
    const orderId = orderData.id || `TV-${Date.now()}`;
    const now = new Date().toISOString();

    const finalOrder = {
      ...orderData,
      id: orderId,
      paymentMethod: 'Prepaid',
      paymentStatus: 'Paid',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      orderStatus: 'Order Received',
      status: 'Order Received',
      inventoryStatus: orderData.inventoryStatus || 'pending_deduction',
      createdAt: orderData.createdAt || now,
      updatedAt: now,
      timestamp: Date.now(),
      createdAtFirestore: Timestamp.now(),
      statusHistory: [
        {
          status: 'Order Received',
          timestamp: now,
          note: 'Prepaid order placed successfully',
          updatedBy: 'Customer',
        },
      ],
    };

    await db.collection('orders').doc(orderId).set(finalOrder);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        orderId,
        message: 'Payment verified and order created',
      }),
    };
  } catch (error) {
    console.error('verify-razorpay-payment error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Verification failed' }),
    };
  }
};
