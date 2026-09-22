import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { CustomerProfile, CustomerReviewFeedback, StoreOrder, CartItem } from '../types';

const PROFILES_COLLECTION = 'customer_profiles';
const REVIEWS_COLLECTION = 'customer_reviews';
const ORDERS_COLLECTION = 'orders';

const LOCAL_STORAGE_KEY_CURRENT_CUSTOMER = 'timevera_logged_in_customer';
const LOCAL_STORAGE_KEY_ALL_PROFILES = 'timevera_local_customer_profiles';
const LOCAL_STORAGE_KEY_REVIEWS = 'timevera_local_customer_reviews';

/**
 * Check if string is a valid email
 */
export function isEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

/**
 * Format Indian Mobile number to clean 10 digits
 */
export function cleanPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Normalize username/identifier to either clean 10-digit phone or lowercase email
 */
export function normalizeIdentifier(identifier: string): { type: 'email' | 'phone'; clean: string } {
  const trimmed = identifier.trim();
  if (isEmail(trimmed)) {
    return { type: 'email', clean: trimmed.toLowerCase() };
  }
  const cleanPhone = cleanPhoneNumber(trimmed);
  return { type: 'phone', clean: cleanPhone };
}

/**
 * Simulated in-memory OTP cache for demo verification
 */
interface OtpEntry {
  otp: string;
  identifier: string;
  type: 'phone' | 'email';
  expiresAt: number;
}
const activeOtpMap = new Map<string, OtpEntry>();

/**
 * Generate a 6-digit OTP for phone or email login
 */
export function requestCustomerOtp(identifier: string): {
  otp: string;
  identifier: string;
  type: 'phone' | 'email';
  expiresInSeconds: number;
} {
  const { type, clean } = normalizeIdentifier(identifier);
  if (type === 'phone' && clean.length !== 10) {
    throw new Error('कृपया 10 अंकों का मान्य भारतीय मोबाइल नंबर दर्ज करें (Valid 10-digit mobile number required)');
  }
  if (type === 'email' && !clean) {
    throw new Error('कृपया मान्य जीमेल या ईमेल आईडी दर्ज करें (Valid Email ID required)');
  }

  // Generate deterministic/realistic 6-digit OTP (e.g. 583921)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresInSeconds = 120; // 2 minutes

  activeOtpMap.set(clean, {
    otp,
    identifier: clean,
    type,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });

  // Store in session storage for debug/demo visibility
  try {
    sessionStorage.setItem(`timevera_otp_${clean}`, otp);
  } catch {}

  console.log(`[Timevera OTP Service] OTP for ${type === 'phone' ? '+91-' : ''}${clean} is: ${otp}`);
  return { otp, identifier: clean, type, expiresInSeconds };
}

/**
 * Verify entered OTP for phone or email
 */
export function verifyCustomerOtp(identifier: string, enteredOtp: string): boolean {
  const { clean } = normalizeIdentifier(identifier);
  const cleanOtp = enteredOtp.trim();

  // 1. Check in-memory map
  const entry = activeOtpMap.get(clean);
  if (entry) {
    if (Date.now() <= entry.expiresAt && (entry.otp === cleanOtp || cleanOtp === '123456')) {
      activeOtpMap.delete(clean);
      return true;
    }
  }

  // 2. Check session storage fallback or universal demo OTP '123456'
  try {
    const sessionOtp = sessionStorage.getItem(`timevera_otp_${clean}`);
    if (sessionOtp && sessionOtp === cleanOtp) {
      return true;
    }
  } catch {}

  // Allow standard demo OTP for testing
  if (cleanOtp === '123456' || cleanOtp === '000000') {
    return true;
  }

  return false;
}

/**
 * Clean data for Firestore
 */
function sanitizeFirestoreData(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Timestamp)) {
        result[key] = sanitizeFirestoreData(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Save / Update Customer Profile in Firestore & Local Storage
 */
export async function saveCustomerProfile(profile: CustomerProfile): Promise<void> {
  const cleanPhone = cleanPhoneNumber(profile.phone || '');
  const cleanEmail = profile.email ? profile.email.trim().toLowerCase() : undefined;
  const username = profile.username || (cleanPhone ? cleanPhone : cleanEmail) || 'user';

  const updatedProfile: CustomerProfile = {
    ...profile,
    phone: cleanPhone,
    email: cleanEmail,
    username: username,
    password: profile.password || undefined,
    savedAt: profile.savedAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  // 1. Save to Local Storage immediately
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_CUSTOMER, JSON.stringify(updatedProfile));
    
    // Also save in all profiles list by phone AND by email
    const allProfiles: Record<string, CustomerProfile> = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY_ALL_PROFILES) || '{}'
    );
    if (cleanPhone) {
      allProfiles[cleanPhone] = updatedProfile;
    }
    if (cleanEmail) {
      allProfiles[cleanEmail] = updatedProfile;
    }
    allProfiles[username] = updatedProfile;
    localStorage.setItem(LOCAL_STORAGE_KEY_ALL_PROFILES, JSON.stringify(allProfiles));

    // Dispatch sync event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('timevera_customer_auth_changed', { detail: updatedProfile }));
    }
  } catch (e) {
    console.error('Error saving local customer profile:', e);
  }

  // 2. Save to Cloud Firestore
  try {
    const docId = cleanPhone || cleanEmail || username;
    const docRef = doc(db, PROFILES_COLLECTION, docId);
    const cleaned = sanitizeFirestoreData({
      ...updatedProfile,
      updatedAtFirestore: Timestamp.now(),
    });
    // Fire and forget - 1. customer_profiles में write (existing — preserve करो)
    setDoc(docRef, cleaned, { merge: true }).catch(console.warn);

    // 2. customers collection में भी write (Store compatibility — नया)
    try {
      const customerId = cleanPhone || cleanEmail || docId;
      setDoc(doc(db, 'customers', customerId), sanitizeFirestoreData({
        id: customerId,
        firebaseUid: profile.uid || '',
        uid: profile.uid || '',
        name: profile.fullName?.trim() || '',
        fullName: profile.fullName?.trim() || '',
        email: cleanEmail || '',
        phone: cleanPhone || profile.phone || '',
        status: 'active',
        addresses: profile.addresses || [],
        createdAt: profile.savedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }), { merge: true }).catch(err => {
        console.warn('customers collection sync deferred:', err?.message || err);
      });
    } catch (e) {
      console.warn('customers sync error:', e);
    }
  } catch (err) {
    console.warn('Firestore customer profile sync notice:', err);
  }
}

/**
 * Fetch Customer Profile by Mobile Number or Gmail / Email
 */
export async function fetchCustomerProfile(identifier: string): Promise<CustomerProfile | null> {
  if (!identifier) return null;
  const { type, clean } = normalizeIdentifier(identifier);
  if (!clean) return null;

  // 1. Check local cache first
  try {
    const current = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENT_CUSTOMER);
    if (current) {
      const parsed: CustomerProfile = JSON.parse(current);
      if (
        (cleanPhoneNumber(parsed.phone) === clean) ||
        (parsed.email && parsed.email.toLowerCase() === clean.toLowerCase()) ||
        (parsed.username && parsed.username.toLowerCase() === clean.toLowerCase())
      ) {
        return parsed;
      }
    }

    const allProfiles: Record<string, CustomerProfile> = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY_ALL_PROFILES) || '{}'
    );
    if (allProfiles[clean]) {
      return allProfiles[clean];
    }
    // Search across values
    for (const key of Object.keys(allProfiles)) {
      const p = allProfiles[key];
      if (
        cleanPhoneNumber(p.phone) === clean ||
        (p.email && p.email.toLowerCase() === clean.toLowerCase()) ||
        (p.username && p.username.toLowerCase() === clean.toLowerCase())
      ) {
        return p;
      }
    }
  } catch (e) {
    console.error('Error reading local customer profile:', e);
  }

  // 2. Fetch from Cloud Firestore
  try {
    // A. Direct doc lookup by ID (phone or email)
    const docRef = doc(db, PROFILES_COLLECTION, clean);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as CustomerProfile;
      cacheCustomerProfileLocally(clean, data);
      return data;
    }

    // B. Query by field if doc ID didn't match directly
    const colRef = collection(db, PROFILES_COLLECTION);
    let q = query(colRef, where(type === 'phone' ? 'phone' : 'email', '==', clean));
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      const data = qSnap.docs[0].data() as CustomerProfile;
      cacheCustomerProfileLocally(clean, data);
      return data;
    }
  } catch (err) {
    console.warn('Firestore customer profile fetch notice:', err);
  }

  return null;
}

/**
 * Helper to cache profile locally
 */
function cacheCustomerProfileLocally(key: string, data: CustomerProfile) {
  try {
    const allProfiles: Record<string, CustomerProfile> = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY_ALL_PROFILES) || '{}'
    );
    allProfiles[key] = data;
    if (data.phone) allProfiles[cleanPhoneNumber(data.phone)] = data;
    if (data.email) allProfiles[data.email.toLowerCase()] = data;
    localStorage.setItem(LOCAL_STORAGE_KEY_ALL_PROFILES, JSON.stringify(allProfiles));
  } catch {}
}

/**
 * Verify Customer Password Login (Username: Mobile or Email + Password)
 */
export async function verifyCustomerPassword(
  identifier: string,
  enteredPassword: string
): Promise<{ success: boolean; profile?: CustomerProfile; message?: string }> {
  const profile = await fetchCustomerProfile(identifier);
  if (!profile) {
    return {
      success: false,
      message: 'यह खाता नहीं मिला (Account not found). कृपया नया खाता बनाएं या OTP से लॉगिन करें।',
    };
  }

  // If user registered with a password
  if (profile.password) {
    if (profile.password === enteredPassword) {
      return { success: true, profile };
    } else {
      return {
        success: false,
        message: 'गलत पासवर्ड (Incorrect password). कृपया सही पासवर्ड दर्ज करें या OTP द्वारा लॉगिन करें।',
      };
    }
  }

  // If user previously only used OTP and didn't set password yet, allow setting or advise OTP
  return {
    success: false,
    message: 'इस खाते पर पासवर्ड सेट नहीं है। कृपया OTP द्वारा लॉगिन करके पासवर्ड सेट करें।',
  };
}

/**
 * Get current logged in customer from local session
 */
export function getActiveLoggedInCustomer(): CustomerProfile | null {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENT_CUSTOMER);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/**
 * Logout current customer
 */
export function logoutCustomer(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_CUSTOMER);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('timevera_customer_auth_changed', { detail: null }));
    }
  } catch (e) {
    console.error('Error logging out customer:', e);
  }
}

/**
 * Save Customer Cart to Cloud Account
 */
export async function saveCustomerCartToCloud(phone: string, cartItems: CartItem[]): Promise<void> {
  const cleanPhone = cleanPhoneNumber(phone);
  if (!cleanPhone) return;

  try {
    const current = getActiveLoggedInCustomer();
    if (current && cleanPhoneNumber(current.phone) === cleanPhone) {
      current.savedCart = cartItems;
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_CUSTOMER, JSON.stringify(current));
    }

    const docRef = doc(db, PROFILES_COLLECTION, cleanPhone);
    await updateDoc(docRef, {
      savedCart: cartItems,
      lastCartUpdate: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Error saving customer cart to cloud:', err);
  }
}

/**
 * Fetch all past orders for this customer phone number
 */
export async function fetchOrdersForCustomer(phone: string, uid?: string): Promise<StoreOrder[]> {
  const cleanPhone = cleanPhoneNumber(phone);
  const foundMap = new Map<string, StoreOrder>();

  // 1. Check local order caches if phone exists
  if (cleanPhone) {
    try {
      const customerSaved: StoreOrder[] = JSON.parse(localStorage.getItem('timevera_customer_orders') || '[]');
      const offlineSaved: StoreOrder[] = JSON.parse(localStorage.getItem('timevera_offline_orders') || '[]');

      [...customerSaved, ...offlineSaved].forEach((order) => {
        const ordPhone = cleanPhoneNumber(order.customerPhone || '');
        if (ordPhone === cleanPhone || (ordPhone && cleanPhone && ordPhone.includes(cleanPhone))) {
          foundMap.set(order.id, order);
        }
      });
    } catch (e) {
      console.error('Local order lookup error:', e);
    }
  }

  // 2. Fetch from Cloud Firestore using UID (Required for security rules)
  try {
    const qCol = collection(db, ORDERS_COLLECTION);
    
    if (uid) {
      // Query by customerUid to satisfy the Firestore rules (allow read if request.auth.uid == resource.data.customerUid)
      const qSnap = await getDocs(query(qCol, where('customerUid', '==', uid)));
      qSnap.forEach((docSnap) => {
        const ord = docSnap.data() as StoreOrder;
        foundMap.set(ord.id, ord);
      });
    }
  } catch (e) {
    console.warn('Firestore customer orders query notice:', e);
  }

  return Array.from(foundMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

/**
 * Real-time listener for customer orders by Firebase Auth UID
 */
export function subscribeToCustomerOrders(
  uid: string,
  onOrdersUpdate: (orders: StoreOrder[]) => void
): () => void {
  if (!uid) {
    onOrdersUpdate([]);
    return () => {};
  }
  const q = query(
    collection(db, 'orders'),
    where('customerUid', '==', uid)
  );
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const orders: StoreOrder[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as StoreOrder;
        orders.push({ ...data, id: data.id || docSnap.id });
      });
      orders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      onOrdersUpdate(orders);
    },
    (error) => {
      console.warn('Customer orders subscription error:', error?.message);
      onOrdersUpdate([]);
    }
  );
  return unsubscribe;
}

/**
 * =========================================================================
 * CUSTOMER REVIEWS & FEEDBACK SYSTEM
 * =========================================================================
 */

/**
 * Submit Customer Feedback / Review
 */
export async function submitCustomerFeedback(review: CustomerReviewFeedback): Promise<void> {
  // 1. Save to local storage
  try {
    const localReviews: CustomerReviewFeedback[] = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY_REVIEWS) || '[]'
    );
    const updated = [review, ...localReviews.filter((r) => r.id !== review.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY_REVIEWS, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('timevera_review_submitted', { detail: review }));
    }
  } catch (e) {
    console.error('Local review save error:', e);
  }

  // 2. Save to Cloud Firestore
  try {
    const docRef = doc(db, REVIEWS_COLLECTION, review.id);
    const cleaned = sanitizeFirestoreData({
      ...review,
      createdAtFirestore: Timestamp.now(),
    });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (err) {
    console.warn('Firestore review save notice:', err);
  }
}

/**
 * Fetch Customer Reviews (Optionally filtered by phone or product)
 */
export async function fetchCustomerReviews(phone?: string): Promise<CustomerReviewFeedback[]> {
  const cleanPhone = phone ? cleanPhoneNumber(phone) : '';
  const reviewsMap = new Map<string, CustomerReviewFeedback>();

  // 1. Local storage
  try {
    const localReviews: CustomerReviewFeedback[] = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY_REVIEWS) || '[]'
    );
    localReviews.forEach((rev) => {
      if (!cleanPhone || cleanPhoneNumber(rev.customerPhone) === cleanPhone) {
        reviewsMap.set(rev.id, rev);
      }
    });
  } catch (e) {}

  // 2. Firestore
  try {
    const qCol = collection(db, REVIEWS_COLLECTION);
    const qSnap = await getDocs(query(qCol, orderBy('timestamp', 'desc')));
    qSnap.forEach((docSnap) => {
      const rev = docSnap.data() as CustomerReviewFeedback;
      if (!cleanPhone || cleanPhoneNumber(rev.customerPhone) === cleanPhone) {
        reviewsMap.set(rev.id, rev);
      }
    });
  } catch (e) {
    console.warn('Firestore reviews fetch notice:', e);
  }

  return Array.from(reviewsMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}
