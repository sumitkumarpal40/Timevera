const Razorpay = require('razorpay');
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
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
  // CORS headers
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
    const { items, couponCode } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Items required' }) };
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Fetch products from Firestore and calculate actual total
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const productId = item.productId;
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));

      if (!productId) continue;

      const productDoc = await db.collection('products').doc(productId).get();
      if (!productDoc.exists) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: `Product ${productId} not found` }) };
      }

      const productData = productDoc.data();
      const stock = Number(productData.stock || 0);

      if (stock < quantity) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: `Insufficient stock for ${productData.name || productId}` }) };
      }

      const sellingPrice = Number(productData.discountPrice) > 0
        ? Number(productData.discountPrice)
        : Number(productData.price) || 0;

      const itemTotal = sellingPrice * quantity;
      subtotal += itemTotal;

      verifiedItems.push({
        productId,
        name: productData.name || 'Product',
        price: sellingPrice,
        unitPrice: sellingPrice,
        quantity,
        total: itemTotal,
        image: productData.image || '',
      });
    }

    // Coupon discount (basic — can be enhanced)
    let couponDiscount = 0;
    if (couponCode) {
      const couponSnap = await db.collection('coupons').doc(couponCode.toUpperCase()).get();
      if (couponSnap.exists) {
        const coupon = couponSnap.data();
        if (coupon.active !== false) {
          if (coupon.discountType === 'percentage') {
            couponDiscount = Math.floor(subtotal * (Number(coupon.discountValue) / 100));
            if (coupon.maxDiscountAmount) {
              couponDiscount = Math.min(couponDiscount, Number(coupon.maxDiscountAmount));
            }
          } else {
            couponDiscount = Number(coupon.discountValue) || 0;
          }
        }
      }
    }

    const deliveryCharge = 0;
    const finalAmount = Math.max(0, subtotal - couponDiscount + deliveryCharge);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: finalAmount * 100, // paise
      currency: 'INR',
      receipt: `TV-${Date.now()}`,
      notes: {
        source: 'TIMEVERA Customer App',
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        razorpayOrderId: razorpayOrder.id,
        amount: finalAmount,
        amountInPaise: finalAmount * 100,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        verifiedItems,
        subtotal,
        couponDiscount,
        deliveryCharge,
        finalAmount,
      }),
    };
  } catch (error) {
    console.error('create-razorpay-order error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Order creation failed' }),
    };
  }
};
