const Razorpay = require('razorpay');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin (only once across container warm starts)
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
}

const db = getFirestore();

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    let bodyData = {};
    try {
      bodyData = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
    }

    const { orderId, reason, idToken } = bodyData;

    if (!orderId || typeof orderId !== 'string') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'orderId is required' }) };
    }

    const cleanOrderId = orderId.trim();

    // 1. Strict Customer Authentication (FIX 2)
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (idToken || '');

    if (!token || typeof token !== 'string' || !token.trim()) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authentication required. Missing Firebase ID token.' }),
      };
    }

    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token.trim());
    } catch (authErr) {
      console.warn('ID token verification failed:', authErr.message);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired authentication token. Please log in again.' }),
      };
    }

    const verifiedUid = decodedToken.uid;
    if (!verifiedUid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unable to identify user from authentication token.' }),
      };
    }

    // 2. Fetch Order Document from Firestore
    let orderDocRef = db.collection('orders').doc(cleanOrderId);
    let orderSnap = await orderDocRef.get();

    if (!orderSnap.exists) {
      const upperSnap = await db.collection('orders').doc(cleanOrderId.toUpperCase()).get();
      if (upperSnap.exists) {
        orderDocRef = upperSnap.ref;
        orderSnap = upperSnap;
      } else {
        const querySnap = await db.collection('orders').where('id', '==', cleanOrderId).limit(1).get();
        if (!querySnap.empty) {
          orderDocRef = querySnap.docs[0].ref;
          orderSnap = querySnap.docs[0];
        } else {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) };
        }
      }
    }

    const orderData = orderSnap.data();

    // 3. Ownership Check: decodedToken.uid MUST match customerUid or customerId (FIX 2)
    const matchesUid = (orderData.customerUid && orderData.customerUid === verifiedUid) ||
                       (orderData.customerId && orderData.customerId === verifiedUid);

    if (!matchesUid) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Unauthorized: You can only cancel your own orders.' }),
      };
    }

    // 4. Order Eligibility Check (Policy: Cancellation allowed before dispatch)
    const currentStatus = (orderData.orderStatus || '').toLowerCase().trim();

    if (currentStatus === 'cancelled') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Order is already cancelled' }) };
    }
    if (currentStatus === 'returned') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Order has already been returned' }) };
    }
    if (['shipped', 'out for delivery', 'out_for_delivery', 'delivered'].includes(currentStatus) || orderData.dispatchedAt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Order has already been dispatched/delivered. Cancellations cannot be processed on-system after shipment. Please contact customer support.',
        }),
      };
    }

    // 5. Duplicate Refund Guard
    const currentPaymentStatus = (orderData.paymentStatus || '').toLowerCase().trim();
    if (currentPaymentStatus === 'refunded') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Payment for this order has already been refunded' }) };
    }
    if (currentPaymentStatus === 'refund pending' || currentPaymentStatus === 'refund_pending') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Refund is already in progress for this order' }) };
    }

    const nowIso = new Date().toISOString();
    const rawMethod = (orderData.paymentMethod || '').toLowerCase().trim();
    const isCOD = rawMethod === 'cod';

    // 6. Case A: COD Order Cancellation (Atomic Transaction - FIX 1)
    if (isCOD) {
      let finalInventoryStatus = 'pending_deduction';

      try {
        await db.runTransaction(async (transaction) => {
          const freshOrderSnap = await transaction.get(orderDocRef);
          if (!freshOrderSnap.exists) {
            throw new Error('Order document not found during transaction');
          }
          const freshOrder = freshOrderSnap.data();

          const freshStatus = (freshOrder.orderStatus || '').toLowerCase().trim();
          if (freshStatus === 'cancelled') {
            throw new Error('ORDER_ALREADY_CANCELLED');
          }
          if (
            freshStatus === 'returned' ||
            ['shipped', 'out for delivery', 'out_for_delivery', 'delivered'].includes(freshStatus) ||
            freshOrder.dispatchedAt
          ) {
            throw new Error('ORDER_NOT_ELIGIBLE_FOR_CANCELLATION');
          }

          let newInvStatus = freshOrder.inventoryStatus || 'pending_deduction';

          // Restore stock ONLY if inventoryStatus === 'deducted'
          if (freshOrder.inventoryStatus === 'deducted') {
            // Aggregate duplicate product lines by productId
            const productQtyMap = new Map();
            const items = Array.isArray(freshOrder.items) ? freshOrder.items : [];
            for (const item of items) {
              const prodId = item.productId || item.id;
              const qty = Number(item.quantity) || 1;
              if (prodId && qty > 0) {
                productQtyMap.set(prodId, (productQtyMap.get(prodId) || 0) + qty);
              }
            }

            // Read all required product documents before writes
            const productEntries = [];
            for (const [prodId, qty] of productQtyMap.entries()) {
              const prodRef = db.collection('products').doc(prodId);
              const prodSnap = await transaction.get(prodRef);
              productEntries.push({ prodRef, prodSnap, qty });
            }

            // Perform writes on products
            for (const { prodRef, prodSnap, qty } of productEntries) {
              if (prodSnap.exists) {
                const currentStock = Number(prodSnap.data().stock) || 0;
                transaction.update(prodRef, {
                  stock: currentStock + qty,
                  updatedAt: nowIso,
                });
              }
            }
            newInvStatus = 'restored';
          }

          finalInventoryStatus = newInvStatus;

          const updatedHistory = [
            ...(freshOrder.statusHistory || []),
            {
              status: 'Cancelled',
              timestamp: nowIso,
              note: reason || 'Cash on Delivery order cancelled by customer before dispatch',
              updatedBy: 'Customer',
            },
          ];

          transaction.update(orderDocRef, {
            orderStatus: 'Cancelled',
            inventoryStatus: newInvStatus,
            statusHistory: updatedHistory,
            cancelledAt: nowIso,
            cancellationReason: reason || 'Customer cancellation',
            updatedAt: nowIso,
          });
        });
      } catch (txErr) {
        console.error('COD cancellation transaction failed:', txErr);
        if (txErr.message === 'ORDER_ALREADY_CANCELLED') {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Order is already cancelled' }) };
        }
        if (txErr.message === 'ORDER_NOT_ELIGIBLE_FOR_CANCELLATION') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Order has already been dispatched or returned and cannot be cancelled.' }),
          };
        }
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: txErr.message || 'Database error while cancelling order' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Order cancelled successfully',
          orderStatus: 'Cancelled',
          paymentStatus: orderData.paymentStatus || 'Pending',
          inventoryStatus: finalInventoryStatus,
        }),
      };
    }

    // 7. Case B: Prepaid / Razorpay Order Cancellation & Refund (FIX 1)
    if (!orderData.razorpayPaymentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Online payment record (Razorpay Payment ID) not found for this order. Please contact customer support.',
        }),
      };
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Razorpay server credentials not configured',
        }),
      };
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const refundAmountPaise = Math.round(Number(orderData.totalAmount) * 100);

    // Fetch actual payment status from Razorpay API first
    let paymentDetails;
    try {
      paymentDetails = await razorpay.payments.fetch(orderData.razorpayPaymentId);
    } catch (fetchErr) {
      console.error('Failed to fetch payment details from Razorpay:', fetchErr);
      const errMsg = fetchErr?.error?.description || fetchErr?.message || 'Unable to retrieve payment status from gateway';
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: `Razorpay payment verification failed: ${errMsg}`,
        }),
      };
    }

    const paymentState = (paymentDetails?.status || '').toLowerCase();
    let refundResult = { id: null };
    let isAuthorizedUncaptured = false;
    let isAlreadyRefunded = false;

    if (paymentState === 'authorized') {
      // Payment was authorized but never captured — no funds were debited by merchant.
      // Uncaptured payments cannot be refunded via payments.refund(). Release safely without refund API call.
      console.log(`Payment ${orderData.razorpayPaymentId} is authorized (uncaptured). Skipping refund call.`);
      isAuthorizedUncaptured = true;
    } else if (paymentState === 'refunded') {
      // Payment was already refunded at Razorpay.
      console.log(`Payment ${orderData.razorpayPaymentId} is already refunded at gateway.`);
      isAlreadyRefunded = true;
      refundResult.id = orderData.razorpayRefundId || `existing_refund_${orderData.razorpayPaymentId}`;
    } else if (paymentState === 'captured') {
      // Call Razorpay refund API FIRST (do NOT modify inventory or order status before refund succeeds)
      try {
        refundResult = await razorpay.payments.refund(orderData.razorpayPaymentId, {
          amount: refundAmountPaise,
          notes: {
            orderId: orderData.id,
            reason: reason || 'Customer cancellation before dispatch',
          },
        });
        console.log('Razorpay refund initiated successfully:', refundResult.id);
      } catch (rzpErr) {
        console.error('Razorpay refund API call failed:', rzpErr);
        const errMsg = rzpErr?.error?.description || rzpErr?.message || 'Razorpay refund execution failed';
        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({
            error: `Razorpay refund failed: ${errMsg}`,
          }),
        };
      }
    } else {
      // Handles 'failed', 'created', etc.
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Cannot process refund for payment in state '${paymentState}'. Please contact customer support.`,
        }),
      };
    }

    // Payment step completed. Now execute atomic Firestore transaction for inventory & order finalization.
    let finalInventoryStatus = 'pending_deduction';

    try {
      await db.runTransaction(async (transaction) => {
        const freshOrderSnap = await transaction.get(orderDocRef);
        if (!freshOrderSnap.exists) {
          throw new Error('Order document not found during transaction');
        }
        const freshOrder = freshOrderSnap.data();

        let newInvStatus = freshOrder.inventoryStatus || 'pending_deduction';

        // Restore stock ONLY if inventoryStatus === 'deducted'
        if (freshOrder.inventoryStatus === 'deducted') {
          // Aggregate duplicate product lines by productId
          const productQtyMap = new Map();
          const items = Array.isArray(freshOrder.items) ? freshOrder.items : [];
          for (const item of items) {
            const prodId = item.productId || item.id;
            const qty = Number(item.quantity) || 1;
            if (prodId && qty > 0) {
              productQtyMap.set(prodId, (productQtyMap.get(prodId) || 0) + qty);
            }
          }

          // Read all required product documents before writes
          const productEntries = [];
          for (const [prodId, qty] of productQtyMap.entries()) {
            const prodRef = db.collection('products').doc(prodId);
            const prodSnap = await transaction.get(prodRef);
            productEntries.push({ prodRef, prodSnap, qty });
          }

          // Perform writes on products
          for (const { prodRef, prodSnap, qty } of productEntries) {
            if (prodSnap.exists) {
              const currentStock = Number(prodSnap.data().stock) || 0;
              transaction.update(prodRef, {
                stock: currentStock + qty,
                updatedAt: nowIso,
              });
            }
          }
          newInvStatus = 'restored';
        }

        finalInventoryStatus = newInvStatus;

        let statusNote = '';
        let targetPaymentStatus = 'Refund Pending';

        if (isAuthorizedUncaptured) {
          statusNote = 'Order cancelled by customer. Payment was authorized but not captured; authorization released with no charge.';
          targetPaymentStatus = 'Cancelled';
        } else if (isAlreadyRefunded) {
          statusNote = `Order cancelled by customer. Payment was already refunded at gateway (Refund ID: ${refundResult.id}).`;
          targetPaymentStatus = 'Refunded';
        } else {
          statusNote = `Order cancelled by customer. 100% refund of ₹${freshOrder.totalAmount} initiated via Razorpay (Refund ID: ${refundResult.id}). Will credit to source account in 2-4 working days.`;
          targetPaymentStatus = 'Refund Pending';
        }

        const updatedHistory = [
          ...(freshOrder.statusHistory || []),
          {
            status: 'Cancelled',
            timestamp: nowIso,
            note: statusNote,
            updatedBy: 'Customer',
          },
        ];

        const updateFields = {
          orderStatus: 'Cancelled',
          paymentStatus: targetPaymentStatus,
          refundAmount: Number(freshOrder.totalAmount),
          refundInitiatedAt: nowIso,
          inventoryStatus: newInvStatus,
          statusHistory: updatedHistory,
          cancelledAt: nowIso,
          cancellationReason: reason || 'Customer cancellation',
          updatedAt: nowIso,
        };

        if (refundResult.id) {
          updateFields.razorpayRefundId = refundResult.id;
        }

        transaction.update(orderDocRef, updateFields);
      });
    } catch (txErr) {
      console.error('Firestore transaction failed after Razorpay payment handling:', txErr);
      // Emergency recovery: Save state on order document so retry cannot cause inconsistency
      try {
        await orderDocRef.update({
          orderStatus: 'Cancelled',
          paymentStatus: isAuthorizedUncaptured ? 'Cancelled' : 'Refund Pending',
          ...(refundResult.id ? { razorpayRefundId: refundResult.id } : {}),
          refundAmount: Number(orderData.totalAmount),
          refundInitiatedAt: nowIso,
          updatedAt: nowIso,
          statusHistory: FieldValue.arrayUnion({
            status: 'Cancelled',
            timestamp: nowIso,
            note: isAuthorizedUncaptured
              ? `Order marked cancelled for uncaptured authorization, but inventory restoration encountered a transaction error (${txErr.message}).`
              : `Refund ID ${refundResult.id} created via Razorpay, but inventory restoration encountered a transaction error (${txErr.message}). Manual review required.`,
            updatedBy: 'System Recovery',
          }),
        });
      } catch (emergencyErr) {
        console.error('Emergency update failed after payment handling:', emergencyErr);
      }

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: isAuthorizedUncaptured
            ? 'Order cancellation completed, but database inventory finalization encountered an error. Please contact customer support.'
            : `Refund was successfully initiated with Razorpay (Refund ID: ${refundResult.id}), but database finalization encountered an error. Please do not retry. Contact customer support.`,
          refundId: refundResult.id || null,
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: isAuthorizedUncaptured
          ? 'Order cancelled successfully (payment authorization released)'
          : isAlreadyRefunded
          ? 'Order cancelled successfully (payment was already refunded)'
          : 'Order cancelled and refund initiated successfully via Razorpay',
        refundId: refundResult.id || null,
        orderStatus: 'Cancelled',
        paymentStatus: isAuthorizedUncaptured ? 'Cancelled' : isAlreadyRefunded ? 'Refunded' : 'Refund Pending',
        inventoryStatus: finalInventoryStatus,
      }),
    };
  } catch (err) {
    console.error('Cancel order unexpected error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal server error while processing cancellation' }),
    };
  }
};
