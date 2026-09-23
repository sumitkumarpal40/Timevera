const crypto = require('crypto');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const signature = event.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('Webhook secret not set');
      return { statusCode: 200, body: 'OK' };
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(event.body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('Invalid webhook signature');
      return { statusCode: 400, body: 'Invalid signature' };
    }

    const payload = JSON.parse(event.body);
    const eventType = payload.event;

    console.log('Webhook received:', eventType);

    const paymentEntity = payload.payload?.payment?.entity;
    const refundEntity = payload.payload?.refund?.entity;

    if (!paymentEntity && !refundEntity) {
      return { statusCode: 200, body: 'OK' };
    }

    const razorpayPaymentId = paymentEntity?.id || refundEntity?.payment_id;
    const razorpayOrderId = paymentEntity?.order_id || refundEntity?.order_id;

    // Find order by razorpayPaymentId, with fallback to razorpayOrderId
    const ordersRef = db.collection('orders');
    let snapshot = await ordersRef
      .where('razorpayPaymentId', '==', razorpayPaymentId)
      .limit(1)
      .get();

    // Fallback: If not found by payment ID, attempt lookup by razorpayOrderId
    if (snapshot.empty && razorpayOrderId) {
      snapshot = await ordersRef
        .where('razorpayOrderId', '==', razorpayOrderId)
        .limit(1)
        .get();
    }

    if (snapshot.empty) {
      console.warn('Order not found for payment:', razorpayPaymentId, 'or order:', razorpayOrderId);
      return { statusCode: 200, body: 'OK' };
    }

    const orderDoc = snapshot.docs[0];
    const orderData = orderDoc.data();
    const nowIso = new Date().toISOString();
    const updates = { updatedAt: nowIso };

    // If order was found by razorpayOrderId and razorpayPaymentId was not set, record it
    if (!orderData.razorpayPaymentId && razorpayPaymentId) {
      updates.razorpayPaymentId = razorpayPaymentId;
    }

    if (eventType === 'payment.captured') {
      updates.paymentStatus = 'Paid';
    } else if (eventType === 'payment.failed') {
      updates.paymentStatus = 'Failed';
    } else if (eventType === 'refund.processed') {
      updates.paymentStatus = 'Refunded';
      if (refundEntity?.id) {
        updates.razorpayRefundId = refundEntity.id;
      }
      const existingHistory = orderData.statusHistory || [];
      updates.statusHistory = [
        ...existingHistory,
        {
          status: orderData.orderStatus || 'Cancelled',
          timestamp: nowIso,
          note: 'Razorpay webhook confirmation: 100% refund credited to source account.',
          updatedBy: 'Razorpay Webhook',
        },
      ];
    }

    await orderDoc.ref.update(updates);

    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    console.error('Webhook error:', error);
    return { statusCode: 500, body: 'Error' };
  }
};
