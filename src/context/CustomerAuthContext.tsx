import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CustomerProfile, CartItem } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

export type CustomerAccountTab =
  | 'orders'
  | 'profile'
  | 'wishlist'
  | 'addresses'
  | 'support'
  | 'invoices'
  | 'feedback'
  | 'cart';

interface CustomerAuthContextType {
  user: User | null;
  customer: CustomerProfile | null;
  isLoggedIn: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isAccountModalOpen: boolean;
  openAccountModal: (tab?: CustomerAccountTab) => void;
  closeAccountModal: () => void;
  accountActiveTab: CustomerAccountTab;
  setAccountActiveTab: (tab: CustomerAccountTab) => void;
  updateProfile: (updated: Partial<CustomerProfile>) => Promise<void>;
  wishlist: string[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  logout: () => void;
  authLoading: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const LOCAL_WISHLIST_KEY = 'timevera_local_wishlist';

export const CustomerAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_WISHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [authLoading, setAuthLoading] = useState(true);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountActiveTab, setAccountActiveTab] = useState<CustomerAccountTab>('orders');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'customers', currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as CustomerProfile;
            
            // Address Migration
            let migrated = false;
            let currentAddresses = data.addresses || [];
            
            if (!data.addresses && (data.address || data.city || data.state || data.pincode)) {
              currentAddresses = [{
                id: 'addr_' + Date.now().toString(),
                fullName: data.fullName || '',
                phone: data.phone || '',
                address: data.address || '',
                city: data.city || '',
                state: data.state || '',
                pincode: data.pincode || '',
                landmark: data.landmark || '',
                isDefault: true
              }];
              data.addresses = currentAddresses;
              migrated = true;
            }

            setCustomer(data);
            
            if (migrated) {
              await setDoc(docRef, { addresses: currentAddresses }, { merge: true });
            }
            if (Array.isArray(data.wishlist)) {
              setWishlist(data.wishlist);
              try {
                localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(data.wishlist));
              } catch {}
            }
          } else {
            const newProfile: CustomerProfile = {
              uid: currentUser.uid,
              fullName: currentUser.displayName || 'Customer',
              email: currentUser.email || '',
              phone: currentUser.phoneNumber || '',
              photoUrl: currentUser.photoURL || '',
              savedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              wishlist: wishlist,
            };
            setCustomer(newProfile);
            await setDoc(docRef, newProfile);
          }
        } catch (error) {
          console.error("Error fetching customer profile:", error);
        }
      } else {
        setCustomer(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const openAccountModal = (tab: CustomerAccountTab = 'orders') => {
    setAccountActiveTab(tab);
    setIsAccountModalOpen(true);
  };
  const closeAccountModal = () => setIsAccountModalOpen(false);

  const updateProfile = async (updated: Partial<CustomerProfile>) => {
    if (!customer) return;
    const merged: CustomerProfile = {
      ...customer,
      ...updated,
    };
    setCustomer(merged);

    if (user) {
      try {
        const docRef = doc(db, 'customers', user.uid);
        await setDoc(docRef, {
          ...merged,
          updatedAtFirestore: Timestamp.now(),
        }, { merge: true });
      } catch (e) {
        console.error("Error updating profile in Firestore:", e);
      }
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  const toggleWishlist = async (productId: string) => {
    let updatedList: string[];
    if (wishlist.includes(productId)) {
      updatedList = wishlist.filter((id) => id !== productId);
    } else {
      updatedList = [...wishlist, productId];
    }
    setWishlist(updatedList);
    try {
      localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(updatedList));
    } catch {}

    if (customer && user) {
      const merged: CustomerProfile = {
        ...customer,
        wishlist: updatedList,
      };
      setCustomer(merged);
      try {
        const docRef = doc(db, 'customers', user.uid);
        await setDoc(docRef, { wishlist: updatedList }, { merge: true });
      } catch (e) {
        console.error("Error updating wishlist in Firestore:", e);
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const updatedList = wishlist.filter((id) => id !== productId);
    setWishlist(updatedList);
    try {
      localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(updatedList));
    } catch {}

    if (customer && user) {
      const merged: CustomerProfile = {
        ...customer,
        wishlist: updatedList,
      };
      setCustomer(merged);
      try {
        const docRef = doc(db, 'customers', user.uid);
        await setDoc(docRef, { wishlist: updatedList }, { merge: true });
      } catch (e) {
        console.error("Error removing from wishlist in Firestore:", e);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCustomer(null);
      setUser(null);
      setIsAccountModalOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        customer,
        isLoggedIn: !!user,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        isAccountModalOpen,
        openAccountModal,
        closeAccountModal,
        accountActiveTab,
        setAccountActiveTab,
        updateProfile,
        wishlist,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        logout,
        authLoading,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = (): CustomerAuthContextType => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};

