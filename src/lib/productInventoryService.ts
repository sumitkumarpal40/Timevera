import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { WatchProduct } from '../types';

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
