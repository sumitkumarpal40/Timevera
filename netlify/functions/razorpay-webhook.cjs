const crypto = require('crypto');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '')
        .replace(/^"|"$/g, '')
        .replace(/\\n/g, '\n'),
    }),
  });
  console.log('Firebase Admin initialized for project:', process.env.FIREBASE_PROJECT_ID);
  console.log('Razorpay Key present:', !!process.env.RAZORPAY_KEY_ID);
}

const db = admin.firestore();

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
    if (!paymentEntity) {
      return { statusCode: 200, body: 'OK' };
    }

    const razorpayPaymentId = paymentEntity.id;
    const razorpayOrderId = paymentEntity.order_id;

    // Find order by razorpayPaymentId
    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef
      .where('razorpayPaymentId', '==', razorpayPaymentId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.warn('Order not found for payment:', razorpayPaymentId);
      return { statusCode: 200, body: 'OK' };
    }

    const orderDoc = snapshot.docs[0];
    const updates = { updatedAt: new Date().toISOString() };

    if (eventType === 'payment.captured') {
      updates.paymentStatus = 'Paid';
    } else if (eventType === 'payment.failed') {
      updates.paymentStatus = 'Failed';
    } else if (eventType === 'refund.processed') {
      updates.paymentStatus = 'Refunded';
    }

    await orderDoc.ref.update(updates);

    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    console.error('Webhook error:', error);
    return { statusCode: 500, body: 'Error' };
  }
};
