import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

export interface Translations {
  panIndiaDelivery: string;
  qualityInspected: string;
  home: string;
  collections: string;
  shopAll: string;
  aboutUs: string;
  contact: string;
  signIn: string;
  myAccount: string;
  app: string;
  wishlist: string;
  cart: string;
  searchPlaceholder: string;
  addToCart: string;
  buyNow: string;
  viewDetails: string;
  close: string;
  save: string;
  apply: string;
  checkout: string;
  cancelOrder: string;
  trackOrder: string;
  backToShopping: string;
  filter: string;
  yourCart: string;
  emptyCart: string;
  subtotal: string;
  total: string;
  delivery: string;
  free: string;
  discount: string;
  paymentMethod: string;
  prepaid: string;
  cod: string;
  proceedToPay: string;
  orderReceived: string;
  confirmed: string;
  packed: string;
  shipped: string;
  outForDelivery: string;
  delivered: string;
  cancelled: string;
  returned: string;
  refunded: string;
  paid: string;
  pending: string;
  myOrders: string;
  noOrdersFound: string;
  orderNumber: string;
  orderDate: string;
  itemCount: string;
  status: string;
  selectTheme: string;
  lightTheme: string;
  darkTheme: string;
  autoTheme: string;
  language: string;
  english: string;
  hindi: string;
}

const translations: Record<Language, Translations> = {
  en: {
    panIndiaDelivery: 'Pan-India Express Delivery & COD Available',
    qualityInspected: '100% Quality Inspected & Direct Dispatch',
    home: 'Home',
    collections: 'Collections',
    shopAll: 'Shop All',
    aboutUs: 'About Us',
    contact: 'Contact',
    signIn: 'Sign In',
    myAccount: 'My Account',
    app: 'App',
    wishlist: 'Wishlist',
    cart: 'Cart',
    searchPlaceholder: 'Search products...',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    viewDetails: 'View Details',
    close: 'Close',
    save: 'Save',
    apply: 'Apply',
    checkout: 'Checkout',
    cancelOrder: 'Cancel Order',
    trackOrder: 'Track Order',
    backToShopping: 'Back to Shopping',
    filter: 'Filter',
    yourCart: 'Your Cart',
    emptyCart: 'Your cart is empty',
    subtotal: 'Subtotal',
    total: 'Total',
    delivery: 'Delivery',
    free: 'FREE',
    discount: 'Discount',
    paymentMethod: 'Payment Method',
    prepaid: 'Prepaid (Online)',
    cod: 'Cash on Delivery (COD)',
    proceedToPay: 'Proceed to Payment',
    orderReceived: 'Order Received',
    confirmed: 'Confirmed',
    packed: 'Packed',
    shipped: 'Shipped',
    outForDelivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned',
    refunded: 'Refunded',
    paid: 'Paid',
    pending: 'Pending',
    myOrders: 'My Orders',
    noOrdersFound: 'No orders found',
    orderNumber: 'Order #',
    orderDate: 'Order Date',
    itemCount: 'Items',
    status: 'Status',
    selectTheme: 'Select Theme',
    lightTheme: 'Light Ivory',
    darkTheme: 'Obsidian Luxury',
    autoTheme: 'Match Device',
    language: 'Language',
    english: 'English',
    hindi: 'हिन्दी (Hindi)',
  },
  hi: {
    panIndiaDelivery: 'पूरे भारत में एक्सप्रेस डिलीवरी और COD उपलब्ध',
    qualityInspected: '100% गुणवत्ता जांच और सीधी डिलीवरी',
    home: 'होम',
    collections: 'कलेक्शन',
    shopAll: 'सभी उत्पाद',
    aboutUs: 'हमारे बारे में',
    contact: 'संपर्क करें',
    signIn: 'साइन इन',
    myAccount: 'मेरा खाता',
    app: 'ऐप',
    wishlist: 'विशलिस्ट',
    cart: 'कार्ट',
    searchPlaceholder: 'उत्पाद खोजें...',
    addToCart: 'कार्ट में जोड़ें',
    buyNow: 'अभी खरीदें',
    viewDetails: 'विवरण देखें',
    close: 'बंद करें',
    save: 'सहेजें',
    apply: 'लागू करें',
    checkout: 'चेकआउट',
    cancelOrder: 'ऑर्डर रद्द करें',
    trackOrder: 'ऑर्डर ट्रैक करें',
    backToShopping: 'खरीदारी जारी रखें',
    filter: 'फ़िल्टर',
    yourCart: 'आपकी कार्ट',
    emptyCart: 'आपकी कार्ट खाली है',
    subtotal: 'उप-कुल',
    total: 'कुल योग',
    delivery: 'डिलीवरी',
    free: 'मुफ्त',
    discount: 'छूट',
    paymentMethod: 'भुगतान का तरीका',
    prepaid: 'ऑनलाइन (प्रीपेड)',
    cod: 'कैश ऑन डिलीवरी (COD)',
    proceedToPay: 'भुगतान के लिए आगे बढ़ें',
    orderReceived: 'ऑर्डर प्राप्त हुआ',
    confirmed: 'पुष्टि की गई',
    packed: 'पैक्ड',
    shipped: 'डिस्पैच हुआ',
    outForDelivery: 'डिलीवरी के लिए निकला',
    delivered: 'डिलीवर हो गया',
    cancelled: 'रद्द किया गया',
    returned: 'वापस किया गया',
    refunded: 'रिफंड किया गया',
    paid: 'भुगतान प्राप्त',
    pending: 'लंबित',
    myOrders: 'मेरे ऑर्डर',
    noOrdersFound: 'कोई ऑर्डर नहीं मिला',
    orderNumber: 'ऑर्डर नं.',
    orderDate: 'ऑर्डर की तारीख',
    itemCount: 'वस्तुएं',
    status: 'स्थिति',
    selectTheme: 'थीम चुनें',
    lightTheme: 'लाइट (Light)',
    darkTheme: 'डार्क (Dark)',
    autoTheme: 'डिवाइस के अनुसार',
    language: 'भाषा',
    english: 'English',
    hindi: 'हिन्दी (Hindi)',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  translateStatus: (status: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
  translateStatus: (status: string) => status,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('timevera_language') as Language;
      return saved === 'hi' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('timevera_language', language);
    } catch (e) {
      console.error('Failed to save language preference:', e);
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = translations[language] || translations.en;

  const translateStatus = (status: string): string => {
    if (language === 'en') return status;
    switch (status?.toLowerCase()) {
      case 'order received':
        return t.orderReceived;
      case 'confirmed':
        return t.confirmed;
      case 'packed':
        return t.packed;
      case 'shipped':
        return t.shipped;
      case 'out for delivery':
        return t.outForDelivery;
      case 'delivered':
        return t.delivered;
      case 'cancelled':
        return t.cancelled;
      case 'returned':
        return t.returned;
      case 'refunded':
        return t.refunded;
      case 'paid':
        return t.paid;
      case 'pending':
        return t.pending;
      default:
        return status;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateStatus }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
