import { collection, onSnapshot, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { WatchProduct } from '../types';

/**
 * Generate a unique short code from a product ID.
 */
export function generateUniqueShortCode(productId: string): string {
  const hash = productId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  const code = Math.abs(hash).toString(36).slice(0, 6).padStart(6, '0');
  return code;
}

/**
 * Fetch a single active product by ID from Firestore.
 */
export const getProductById = async (id: string): Promise<WatchProduct | null> => {
  try {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as any;
      const isInactive = data.active === false || data.status === 'inactive';
      if (!isInactive) {
        const mrp = Number(data.price) || 0;
        const sellingPrice = Number(data.discountPrice) > 0 ? Number(data.discountPrice) : mrp;
        return { 
          id: docSnap.id, 
          ...data,
          price: sellingPrice,
          originalPrice: mrp,
        } as WatchProduct;
      }
    }
    return null;
  } catch (err) {
    console.error('Error fetching product by ID from Firestore:', err);
    return null;
  }
};

/**
 * Real-time subscription to active products strictly from Firestore.
 * If Firestore returns an empty snapshot or encounters an error, it returns [] (empty array).
 * No localStorage or dummy/mock fallback lists are used.
 */
export const subscribeToProducts = (
  callback: (products: WatchProduct[]) => void,
  onError?: (error: Error) => void
) => {
  try {
    const productsRef = collection(db, 'products');
    return onSnapshot(
      productsRef,
      (snapshot) => {
        const prods: WatchProduct[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const productId = docSnap.id;

          // Auto-generate and save shortCode if missing
          if (!data.shortCode) {
            const code = generateUniqueShortCode(productId);
            updateDoc(doc(db, 'products', productId), { shortCode: code })
              .catch(err => console.warn('shortCode save failed:', err));
            data.shortCode = code;
          }

          // Hide only explicitly inactive products; missing active field defaults to active
          const isInactive = data.active === false || data.status === 'inactive';
          if (!isInactive) {
            const mrp = Number(data.price) || 0;
            const sellingPrice = Number(data.discountPrice) > 0 ? Number(data.discountPrice) : mrp;
            prods.push({ 
              id: docSnap.id, 
              ...data,
              price: sellingPrice,
              originalPrice: mrp,
            } as WatchProduct);
          }
        });
        callback(prods);
      },
      (err) => {
        console.error('Error fetching live products from Firestore:', err);
        if (onError) onError(err);
        callback([]);
      }
    );
  } catch (err: any) {
    console.error('Failed to initialize Firestore product listener:', err);
    if (onError) onError(err);
    callback([]);
    return () => {};
  }
};

/**
 * One-time fetch of active products directly from Firestore.
 * Returns an empty array [] if no products are found.
 */
export const getProducts = async (): Promise<WatchProduct[]> => {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    const prods: WatchProduct[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      const productId = docSnap.id;

      // Auto-generate and save shortCode if missing
      if (!data.shortCode) {
        const code = generateUniqueShortCode(productId);
        updateDoc(doc(db, 'products', productId), { shortCode: code })
          .catch(err => console.warn('shortCode save failed:', err));
        data.shortCode = code;
      }

      const isInactive = data.active === false || data.status === 'inactive';
      if (!isInactive) {
        const mrp = Number(data.price) || 0;
        const sellingPrice = Number(data.discountPrice) > 0 ? Number(data.discountPrice) : mrp;
        prods.push({ 
          id: docSnap.id, 
          ...data,
          price: sellingPrice,
          originalPrice: mrp,
        } as WatchProduct);
      }
    });
    return prods;
  } catch (err) {
    console.error('Error in getProducts from Firestore:', err);
    return [];
  }
};
