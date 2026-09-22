import { runTransaction,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { StoreOrder, SupportTicket, OrderStatusHistoryItem } from '../types';

const ORDERS_COLLECTION = 'orders';
const SUPPORT_COLLECTION = 'support_tickets';

/**
 * Helper to get current Date string YYYY-MM-DD
 */
export function getFormattedDateString(dateInput?: string | number | Date): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
}

/**
 * Helper to remove undefined fields from objects before sending to Firestore
 */
function cleanFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Timestamp)) {
        result[key] = cleanFirestoreData(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Helper to update local storage caches safely
 */
function updateLocalOrderCaches(order: StoreOrder, isDelete: boolean = false) {
  try {
    // 1. Offline / Merchant orders cache
    const offlineSaved: StoreOrder[] = JSON.parse(localStorage.getItem('timevera_offline_orders') || '[]');
    let updatedOffline: StoreOrder[];
    if (isDelete) {
      updatedOffline = offlineSaved.filter((o) => o.id !== order.id);
    } else {
      const idx = offlineSaved.findIndex((o) => o.id === order.id);
      if (idx >= 0) {
        offlineSaved[idx] = { ...offlineSaved[idx], ...order };
        updatedOffline = [...offlineSaved];
      } else {
        updatedOffline = [order, ...offlineSaved];
      }
    }
    localStorage.setItem('timevera_offline_orders', JSON.stringify(updatedOffline));

    // 2. Customer personal orders cache
    const customerSaved: StoreOrder[] = JSON.parse(localStorage.getItem('timevera_customer_orders') || '[]');
    let updatedCustomer: StoreOrder[];
    if (isDelete) {
      updatedCustomer = customerSaved.filter((o) => o.id !== order.id);
    } else {
      const idx = customerSaved.findIndex((o) => o.id === order.id);
      if (idx >= 0) {
        customerSaved[idx] = { ...customerSaved[idx], ...order };
        updatedCustomer = [...customerSaved];
      } else {
        updatedCustomer = [order, ...customerSaved];
      }
    }
    localStorage.setItem('timevera_customer_orders', JSON.stringify(updatedCustomer));

    // 3. Dispatch global sync event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('timevera_order_saved', { detail: order }));
    }
  } catch (e) {
    console.error('Error updating local order caches:', e);
  }
}

/**
 * Save new order to Cloud Firestore & local storage
 */
export async function saveOrderToFirestore(orderData: StoreOrder): Promise<void> {
  const nowIso = new Date().toISOString();
  const orderDate = orderData.orderDate || getFormattedDateString(orderData.createdAt || nowIso);
  
  const initialHistory: OrderStatusHistoryItem[] = [
    {
      status: 'Order Received',
      timestamp: nowIso,
      note: 'Order placed by customer',
      updatedBy: 'Customer',
    },
  ];

  // Ensure authenticated customer UID is set for both customerUid and customerId
  const authUid = auth.currentUser?.uid || orderData.customerUid || orderData.customerId;

  const completeOrder: StoreOrder = {
    ...orderData,
    customerUid: authUid,
    customerId: authUid,
    orderStatus: 'Order Received' as any,
    orderDate,
    statusHistory: initialHistory,
  };

  // Convert status to strict format requested
  if (completeOrder.orderStatus === 'Order Received') {
    completeOrder.orderStatus = 'Order Received' as any;
  }

  // Create order directly in Firestore /orders collection without unauthorized /products stock updates
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, completeOrder.id);
    const cleanedData = cleanFirestoreData({
      ...completeOrder,
      createdAtFirestore: Timestamp.now(),
    });

    await setDoc(orderRef, cleanedData);
    
    // Save locally for quick access
    updateLocalOrderCaches(completeOrder);
  } catch (error: any) {
    console.error("Order Creation Failed: ", error);
    throw error;
  }
}

/**
 * Subscribe to Real-Time Orders for Shop App (instant cache + live Firestore sync)
 */
export function subscribeToOrders(
  onOrdersUpdated: (orders: StoreOrder[]) => void,
  onError?: (err: any) => void
) {
  // 1. Immediately provide local cached orders so merchant never waits
  try {
    const local = JSON.parse(localStorage.getItem('timevera_offline_orders') || '[]');
    if (local && local.length > 0) {
      onOrdersUpdated(local);
    }
  } catch (e) {
    console.error(e);
  }

  // 2. Listen to instant custom local events
  const handleLocalOrderEvent = () => {
    try {
      const local = JSON.parse(localStorage.getItem('timevera_offline_orders') || '[]');
      if (local) {
        onOrdersUpdated(local);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('timevera_order_saved', handleLocalOrderEvent);
    window.addEventListener('storage', handleLocalOrderEvent);
  }

  // 3. Connect to live Cloud Firestore snapshot
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('timestamp', 'desc'));

  const unsubSnapshot = onSnapshot(
    q,
    (snapshot) => {
      const firestoreOrders: StoreOrder[] = [];
      snapshot.forEach((docSnap) => {
        firestoreOrders.push(docSnap.data() as StoreOrder);
      });

      // Merge with any offline orders not yet uploaded
      try {
        const local = JSON.parse(localStorage.getItem('timevera_offline_orders') || '[]') as StoreOrder[];
        const orderMap = new Map<string, StoreOrder>();
        // Firestore takes precedence for status updates
        firestoreOrders.forEach((o) => orderMap.set(o.id, o));
        local.forEach((o) => {
          if (!orderMap.has(o.id)) {
            orderMap.set(o.id, o);
          }
        });
        const combined = Array.from(orderMap.values()).sort(
          (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
        );

        // Update offline cache with merged data
        localStorage.setItem('timevera_offline_orders', JSON.stringify(combined));
        onOrdersUpdated(combined);
      } catch {
        onOrdersUpdated(firestoreOrders);
      }
    },
    (error) => {
      console.error('Real-time orders listener error:', error);
      try {
        const local = JSON.parse(localStorage.getItem('timevera_offline_orders') || '[]');
        onOrdersUpdated(local);
      } catch {}
      if (onError) onError(error);
    }
  );

  return () => {
    unsubSnapshot();
    if (typeof window !== 'undefined') {
      window.removeEventListener('timevera_order_saved', handleLocalOrderEvent);
      window.removeEventListener('storage', handleLocalOrderEvent);
    }
  };
}

/**
 * Update order status (e.g. 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled')
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: StoreOrder['orderStatus'],
  extraDetails?: {
    note?: string;
    courierPartner?: string;
    courierTrackingNumber?: string;
    updatedBy?: string;
  }
): Promise<void> {
  const nowIso = new Date().toISOString();
  
  const historyEntry: OrderStatusHistoryItem = {
    status: newStatus,
    timestamp: nowIso,
    note: extraDetails?.note || getStatusDefaultNote(newStatus),
    updatedBy: extraDetails?.updatedBy || 'Merchant Admin',
  };

  const payload: Partial<StoreOrder> = {
    orderStatus: newStatus,
  };

  if (newStatus === 'Packed') {
    payload.packedAt = nowIso;
  } else if (newStatus === 'Shipped') {
    payload.dispatchedAt = nowIso;
    if (extraDetails?.courierPartner) payload.courierPartner = extraDetails.courierPartner;
    if (extraDetails?.courierTrackingNumber) payload.courierTrackingNumber = extraDetails.courierTrackingNumber;
  } else if (newStatus === 'Delivered') {
    payload.deliveredAt = nowIso;
  }

  // 1. Update local cache immediately
  try {
    const offlineSaved: StoreOrder[] = JSON.parse(localStorage.getItem('timevera_offline_orders') || '[]');
    const targetOrder = offlineSaved.find((o) => o.id === orderId);
    if (targetOrder) {
      const updatedHistory = [...(targetOrder.statusHistory || []), historyEntry];
      const mergedOrder: StoreOrder = {
        ...targetOrder,
        ...payload,
        statusHistory: updatedHistory,
      };
      updateLocalOrderCaches(mergedOrder);
    }
  } catch (e) {
    console.error(e);
  }

  // 2. Update Cloud Firestore
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const existingData = docSnap.data() as StoreOrder;
      const updatedHistory = [...(existingData.statusHistory || []), historyEntry];
      await updateDoc(docRef, cleanFirestoreData({
        ...payload,
        statusHistory: updatedHistory,
      }));
    } else {
      await updateDoc(docRef, cleanFirestoreData(payload));
    }
  } catch (error) {
    console.warn('Firestore update error (persisted locally):', error);
  }
}

function getStatusDefaultNote(status: StoreOrder['orderStatus']): string {
  switch (status) {
    case 'Confirmed':
      return 'Order verified & confirmed by store';
    case 'Packed':
      return 'Watch inspected, quality tested and packed securely';
    case 'Shipped':
      return 'Handed over to courier partner for express delivery';
    case 'Delivered':
      return 'Package successfully delivered to customer';
    case 'Cancelled':
      return 'Order cancelled';
    default:
      return 'Status updated';
  }
}

/**
 * Mark order as printed and billed (with thermal/billing machine counter)
 */
export async function markOrderPrinted(orderId: string, currentCount: number = 0): Promise<void> {
  const nowIso = new Date().toISOString();
  const updateData = {
    printed: true,
    billed: true,
    billedAt: nowIso,
    printCount: (currentCount || 0) + 1,
    printedAt: nowIso,
  };

  // Update locally
  try {
    const offlineSaved: StoreOrder[] = JSON.parse(localStorage.getItem('timevera_offline_orders') || '[]');
    const target = offlineSaved.find((o) => o.id === orderId);
    if (target) {
      updateLocalOrderCaches({
        ...target,
        ...updateData,
      });
    }
  } catch (e) {
    console.error(e);
  }

  // Update in Firestore
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.warn('Firestore print update notice:', error);
  }
}

/**
 * Delete order from system
 */
export async function deleteOrder(orderId: string): Promise<void> {
  try {
    updateLocalOrderCaches({ id: orderId } as StoreOrder, true);
  } catch (e) {
    console.error(e);
  }

  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Firestore delete error:', error);
  }
}

/**
 * Subscribe in real-time to a specific order document by ID
 */
export function subscribeToSingleOrder(
  orderId: string,
  onOrderUpdated: (order: StoreOrder | null) => void,
  onError?: (err: any) => void
) {
  if (!orderId) return () => {};
  const cleanId = orderId.trim();

  // 1. Immediately provide local cache if available
  try {
    const custLocal: StoreOrder[] = JSON.parse(localStorage.getItem('timevera_customer_orders') || '[]');
    const offLocal: StoreOrder[] = JSON.parse(localStorage.getItem('timevera_offline_orders') || '[]');
    const found = [...custLocal, ...offLocal].find((o) => o.id.toLowerCase() === cleanId.toLowerCase());
    if (found) onOrderUpdated(found);
  } catch (e) {
    console.error(e);
  }

  // 2. Attach real-time snapshot listener to Firestore
  const docRef = doc(db, ORDERS_COLLECTION, cleanId.toUpperCase());
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const orderData = docSnap.data() as StoreOrder;
        updateLocalOrderCaches(orderData);
        onOrderUpdated(orderData);
      } else {
        // Try exact casing if uppercase didn't match
        if (cleanId !== cleanId.toUpperCase()) {
          const directRef = doc(db, ORDERS_COLLECTION, cleanId);
          getDoc(directRef).then((altSnap) => {
            if (altSnap.exists()) {
              const orderData = altSnap.data() as StoreOrder;
              updateLocalOrderCaches(orderData);
              onOrderUpdated(orderData);
            }
          });
        }
      }
    },
    (err) => {
      console.warn('Real-time single order listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Customer Order Tracking: Search orders by Order ID (TV-123456) or Phone number
 */
export async function searchCustomerOrders(queryText: string): Promise<StoreOrder[]> {
  const cleanQuery = queryText.trim();
  if (!cleanQuery) return [];

  const foundOrders = new Map<string, StoreOrder>();
  const cleanPhone = cleanQuery.replace(/\D/g, '');

  // 1. Check local customer cache and offline cache
  try {
    const custLocal: StoreOrder[] = JSON.parse(localStorage.getItem('timevera_customer_orders') || '[]');
    const offLocal: StoreOrder[] = JSON.parse(localStorage.getItem('timevera_offline_orders') || '[]');
    const allLocal = [...custLocal, ...offLocal];

    allLocal.forEach((ord) => {
      const matchId = ord.id && ord.id.toLowerCase().includes(cleanQuery.toLowerCase());
      const matchPhone = cleanPhone && ord.customerPhone && ord.customerPhone.replace(/\D/g, '').includes(cleanPhone);
      const matchName = ord.customerName && ord.customerName.toLowerCase().includes(cleanQuery.toLowerCase());

      if (matchId || matchPhone || matchName) {
        foundOrders.set(ord.id, ord);
      }
    });
  } catch (e) {
    console.error('Local search error:', e);
  }

  // 2. Search Firestore by ID directly (both uppercase and exact)
  try {
    const directDoc = await getDoc(doc(db, ORDERS_COLLECTION, cleanQuery.toUpperCase()));
    if (directDoc.exists()) {
      const data = directDoc.data() as StoreOrder;
      foundOrders.set(data.id, data);
      updateLocalOrderCaches(data);
    } else if (cleanQuery !== cleanQuery.toUpperCase()) {
      const directDocRaw = await getDoc(doc(db, ORDERS_COLLECTION, cleanQuery));
      if (directDocRaw.exists()) {
        const data = directDocRaw.data() as StoreOrder;
        foundOrders.set(data.id, data);
        updateLocalOrderCaches(data);
      }
    }
  } catch (e) {
    console.warn('Firestore direct fetch notice:', e);
  }

  // 3. Search Firestore by Phone number if numeric
  if (cleanPhone && cleanPhone.length >= 7) {
    try {
      const qPhone = query(collection(db, ORDERS_COLLECTION), where('customerPhone', '==', cleanPhone));
      const phoneSnap = await getDocs(qPhone);
      phoneSnap.forEach((d) => {
        const data = d.data() as StoreOrder;
        foundOrders.set(data.id, data);
        updateLocalOrderCaches(data);
      });
    } catch (e) {
      console.warn('Firestore phone search notice:', e);
    }
  }

  return Array.from(foundOrders.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

/**
 * Get customer orders saved on this device (for instant 1-click tracking)
 */
export function getSavedCustomerOrders(): StoreOrder[] {
  try {
    const saved = localStorage.getItem('timevera_customer_orders');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * =========================================================================
 * SUPPORT TICKETS & COMPLAINTS SYSTEM (Connected directly to Shop App)
 * Schema:
 * Ticket: { id, customerId, customerName, customerEmail, customerPhone, subject, status: 'open', createdAt, updatedAt }
 * Messages: Sub-collection support_tickets/{ticketId}/messages with { id, sender: 'customer' | 'admin', text, timestamp }
 * =========================================================================
 */

/**
 * Save customer complaint / support ticket to Cloud Firestore with initial message subcollection
 */
export async function saveSupportTicketToFirestore(
  ticket: SupportTicket,
  initialMessageText?: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  const messageText = (initialMessageText || ticket.message || ticket.customerMessage || '').trim();
  const msgId = 'msg_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7);

  const ticketPayload: SupportTicket = {
    id: ticket.id,
    customerId: ticket.customerId,
    customerUid: (ticket as any).customerUid || ticket.customerId,
    customerName: ticket.customerName,
    customerPhone: ticket.customerPhone,
    customerMobile: ticket.customerPhone,
    customerEmail: ticket.customerEmail,
    issueType: ticket.issueType,
    category: ticket.issueType || (ticket as any).category || '',
    issueCategory: ticket.issueType || (ticket as any).issueCategory || '',
    status: 'open',
    customerMessage: messageText,
    message: messageText,
    createdAt: ticket.createdAt || nowIso,
    updatedAt: ticket.updatedAt || nowIso,
    timestamp: ticket.timestamp || Date.now(),
  };

  try {
    const docRef = doc(db, SUPPORT_COLLECTION, ticketPayload.id);
    const cleanedData = cleanFirestoreData({
      ...ticketPayload,
      lastMessage: messageText,
      lastSender: 'customer',
      createdAtFirestore: Timestamp.now(),
      updatedAtFirestore: Timestamp.now(),
    });
    await setDoc(docRef, cleanedData);

    if (messageText) {
      const msgRef = doc(db, SUPPORT_COLLECTION, ticketPayload.id, 'messages', msgId);
      await setDoc(msgRef, {
        id: msgId,
        sender: 'customer',
        text: messageText,
        timestamp: Timestamp.now(),
        createdAt: nowIso,
      });
    }

    // Save locally
    try {
      const existing: SupportTicket[] = JSON.parse(localStorage.getItem('timevera_offline_tickets') || '[]');
      const filtered = existing.filter((t) => t.id !== ticketPayload.id);
      localStorage.setItem('timevera_offline_tickets', JSON.stringify([ticketPayload, ...filtered]));
    } catch {}
  } catch (error) {
    console.error('Error saving support ticket to Firestore:', error);
    try {
      const existing = JSON.parse(localStorage.getItem('timevera_offline_tickets') || '[]');
      existing.unshift(ticketPayload);
      localStorage.setItem('timevera_offline_tickets', JSON.stringify(existing));
    } catch (e) {
      console.error(e);
    }
  }
}

/**
 * Send a message within a support ticket (writes to support_tickets/{ticketId}/messages and updates parent ticket)
 */
export async function sendTicketMessage(
  ticketId: string,
  text: string,
  sender: 'customer' | 'admin' = 'customer'
): Promise<void> {
  if (!ticketId || !text.trim()) return;
  const nowIso = new Date().toISOString();
  const msgId = 'msg_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7);
  const msgRef = doc(db, SUPPORT_COLLECTION, ticketId, 'messages', msgId);
  const ticketRef = doc(db, SUPPORT_COLLECTION, ticketId);

  // 1. Write message to sub-collection
  await setDoc(msgRef, {
    id: msgId,
    sender,
    text: text.trim(),
    timestamp: Timestamp.now(),
    createdAt: nowIso,
  });

  // 2. Update parent ticket document with lastMessage and timestamp
  await updateDoc(ticketRef, {
    updatedAt: nowIso,
    updatedAtFirestore: Timestamp.now(),
    lastMessage: text.trim(),
    lastSender: sender,
  }).catch((err) => console.warn('Ticket updatedAt sync warning:', err));
}

/**
 * Subscribe to real-time messages in a support ticket's messages sub-collection & parent ticket
 */
export function subscribeToTicketMessages(
  ticketId: string,
  onMessagesUpdated: (messages: import('../types').TicketMessage[]) => void,
  onError?: (err: any) => void
) {
  if (!ticketId) return () => {};

  const messagesColRef = collection(db, SUPPORT_COLLECTION, ticketId, 'messages');
  const q = query(messagesColRef, orderBy('timestamp', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: import('../types').TicketMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let ts: any = data.timestamp || data.createdAt || Date.now();
        // अगर Firestore Timestamp है तो ISO string में convert करो
        if (ts && typeof ts.toDate === 'function') {
          ts = ts.toDate().toISOString();
        } else if (ts && typeof ts.toMillis === 'function') {
          ts = new Date(ts.toMillis()).toISOString();
        } else if (typeof ts === 'number') {
          ts = new Date(ts).toISOString();
        }
        // अगर अभी भी string नहीं है तो fallback
        if (typeof ts !== 'string') {
          ts = new Date().toISOString();
        }

        msgs.push({
          id: docSnap.id,
          sender: data.sender || 'customer',
          text: data.text || data.message || '',
          timestamp: ts,
        });
      });
      onMessagesUpdated(msgs);
    },
    (error) => {
      console.error(`Real-time messages listener error for ticket ${ticketId}:`, error);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribe to Real-Time Support Tickets & Complaints in Customer Website
 */
export function subscribeToCustomerSupportTickets(
  customerPhoneOrEmail: string,
  uid: string | undefined,
  onTicketsUpdated: (tickets: SupportTicket[]) => void,
  onError?: (err: any) => void
) {
  const clean = (customerPhoneOrEmail || '').trim();
  const cleanPhone = clean.replace(/\D/g, '');

  // 1. Immediately provide cached tickets
  try {
    const offTickets: SupportTicket[] = JSON.parse(localStorage.getItem('timevera_offline_tickets') || '[]');
    if (offTickets.length > 0) {
      const matched = offTickets.filter((t) => {
        const customerPhone = t.customerPhone || (t as any).customerMobile || '';
        const pMatch = cleanPhone && customerPhone && customerPhone.replace(/\D/g, '').includes(cleanPhone);
        const eMatch = clean && t.customerEmail && t.customerEmail.toLowerCase().includes(clean.toLowerCase());
        const uMatch = uid && t.customerId === uid;
        return pMatch || eMatch || uMatch;
      });
      if (matched.length > 0) onTicketsUpdated(matched);
    }
  } catch (e) {
    console.error(e);
  }

  // 2. Live snapshot listener on support_tickets
  const q = query(collection(db, SUPPORT_COLLECTION));

  return onSnapshot(
    q,
    (snapshot) => {
      const tickets: SupportTicket[] = [];
      snapshot.forEach((docSnap) => {
        const t = docSnap.data() as SupportTicket;
        const customerPhone = t.customerPhone || (t as any).customerMobile || '';
        const pMatch = cleanPhone && customerPhone && customerPhone.replace(/\D/g, '').includes(cleanPhone);
        const eMatch = clean && t.customerEmail && t.customerEmail.toLowerCase().includes(clean.toLowerCase());
        const uMatch = uid && (t.customerId === uid || t.customerUid === uid);

        if (!clean && !uid) {
          tickets.push(t);
        } else if (pMatch || eMatch || uMatch) {
          tickets.push(t);
        }
      });

      // Update local storage cache
      try {
        localStorage.setItem('timevera_offline_tickets', JSON.stringify(tickets));
      } catch {}

      tickets.sort((a, b) => {
        const aTime = (a as any).timestamp || new Date(a.createdAt).getTime();
        const bTime = (b as any).timestamp || new Date(b.createdAt).getTime();
        return bTime - aTime;
      });

      onTicketsUpdated(tickets);
    },
    (error) => {
      console.warn('Real-time customer tickets listener warning:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribe to Real-Time Support Tickets & Complaints in Shop Portal
 */
export function subscribeToSupportTickets(
  onTicketsUpdated: (tickets: SupportTicket[]) => void,
  onError?: (err: any) => void
) {
  const q = query(collection(db, SUPPORT_COLLECTION), orderBy('timestamp', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const tickets: SupportTicket[] = [];
      snapshot.forEach((docSnap) => {
        tickets.push(docSnap.data() as SupportTicket);
      });
      onTicketsUpdated(tickets);
    },
    (error) => {
      console.error('Real-time support tickets listener error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Update Support Ticket Status (e.g. 'open', 'in_progress', 'resolved')
 */
export async function updateSupportTicketStatus(
  ticketId: string,
  status: SupportTicket['status'],
  replyNotes?: string
): Promise<void> {
  const docRef = doc(db, SUPPORT_COLLECTION, ticketId);
  const payload: Record<string, any> = { status };
  if (replyNotes !== undefined) {
    payload.replyNotes = replyNotes;
  }
  await updateDoc(docRef, payload);
}

/**
 * Delete support ticket
 */
export async function deleteSupportTicket(ticketId: string): Promise<void> {
  const docRef = doc(db, SUPPORT_COLLECTION, ticketId);
  await deleteDoc(docRef);
}

/**
 * Fetch all support tickets for a specific customer by phone or email
 */
export async function fetchCustomerSupportTickets(customerPhoneOrEmail: string, uid?: string): Promise<SupportTicket[]> {
  const clean = customerPhoneOrEmail.trim();
  if (!clean) return [];

  const foundMap = new Map<string, SupportTicket>();

  // 1. Check local offline cache
  try {
    const offTickets: SupportTicket[] = JSON.parse(localStorage.getItem('timevera_offline_tickets') || '[]');
    offTickets.forEach((t) => {
      const matchPhone = t.customerPhone && t.customerPhone.replace(/\D/g, '').includes(clean.replace(/\D/g, ''));
      const matchEmail = t.customerEmail && t.customerEmail.toLowerCase().includes(clean.toLowerCase());
      if (matchPhone || matchEmail) {
        foundMap.set(t.id, t);
      }
    });
  } catch (e) {
    console.error('Offline tickets cache error:', e);
  }

  // 2. Fetch from Cloud Firestore
  try {
    const q = query(collection(db, SUPPORT_COLLECTION), orderBy('timestamp', 'desc'));
    const qSnapshot = await getDocs(q);
    qSnapshot.forEach((docSnap) => {
      const t = docSnap.data() as SupportTicket;
      const matchPhone = t.customerPhone && t.customerPhone.replace(/\D/g, '').includes(clean.replace(/\D/g, ''));
      const matchEmail = t.customerEmail && t.customerEmail.toLowerCase().includes(clean.toLowerCase());
      if (matchPhone || matchEmail) {
        foundMap.set(t.id, t);
      }
    });
  } catch (err) {
    console.warn('Firestore tickets query notice:', err);
  }

  return Array.from(foundMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}
