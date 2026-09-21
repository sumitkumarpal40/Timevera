export interface StoreProduct {
  id: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  categoryLabel?: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews?: number;
  reviewsCount?: number;
  image: string;
  secondaryImage?: string;
  images?: string[];
  description: string;
  features?: string[];
  badge?: string;
  tag?: string;
  color?: string;
  attributes?: Record<string, string>;

  // Optional Product Specifications (From TIMEVERA STORE / Firestore)
  dial?: string;
  dialColor?: string;
  strap?: string;
  strapMaterial?: string;
  waterResistance?: string;
  waterResistant?: boolean | string;
  case?: string;
  caseSize?: string;
  movement?: string;
  warranty?: string;
  warrantyMonths?: number;
  warrantyInfo?: string;

  isPopular?: boolean | string;
  stock?: number;
  inStock?: boolean;
  active?: boolean;
}

// Alias for backward compatibility with existing components
export type WatchProduct = StoreProduct;

export interface CartItem {
  product: WatchProduct;
  quantity: number;
}

export interface Coupon {
  code: string; // e.g. "TIMEVERA100", "WELCOME10", "STYLE200", "PREMIUM500"
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // e.g. 10 (%) or 100 (₹)
  minOrderValue: number; // minimum order subtotal required in INR
  maxDiscountAmount?: number; // max cap in INR for percentage coupons
  active: boolean;
  validUntil?: string; // ISO date string or undefined for perpetual
  perCustomerUsageLimit?: number;
  applicableCategory?: string;
}


export interface CustomerAddress {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface CustomerProfile {
  uid: string; // Firebase Auth UID
  phone: string; // 10-digit mobile number or primary phone
  fullName: string;
  email?: string;
  username?: string;
  password?: string; // Legacy
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  photoUrl?: string;
  savedAt: string;
  lastLoginAt: string;
  savedCart?: CartItem[];
  wishlist?: string[]; // Array of WatchProduct IDs
  addresses?: CustomerAddress[];
}

export interface OrderItem {
  productId?: string;
  id?: string;
  name: string;
  price: number;
  unitPrice?: number;
  quantity: number;
  image?: string;
  total?: number;
}

export interface OrderStatusHistoryItem {
  status: 'Order Received' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';
  timestamp: any;
  note?: string;
  updatedBy?: string;
}

export interface StoreOrder {
  notes?: string;
  id: string; // Order ID like ORD-1234 or TV-123456
  items: OrderItem[];
  
  productId?: string;
  productName?: string;
  productImage?: string;
  quantity?: number;
  unitPrice?: number;
  productPrice?: number;
  price?: number;
  subtotal?: number;
  subtotalAmount?: number;
  discount?: number;
  discountAmount?: number;
  couponCode?: string;
  couponDiscount?: number;
  deliveryCharge?: number;
  shipping?: number;
  finalAmount?: number;
  grandTotal?: number;
  
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerPincode: string;
  customerLandmark?: string;
  customerEmail?: string;
  paymentMethod: 'COD' | 'Online' | 'Prepaid' | 'Online Payment' | 'cod' | 'upi_qr' | string;
  paymentStatus?: 'Pending' | 'Paid' | 'Failed' | 'pending' | 'verified' | 'failed' | 'refunded';
  orderStatus: 'Order Received' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';
  statusHistory?: OrderStatusHistoryItem[];
  createdAt: string; // ISO string
  createdAtFirestore?: any;
  courierPartner?: string;
  courierTrackingNumber?: string;
  printCount?: number;
  customerUid?: string; // Links to CustomerProfile.uid
  orderDate?: string;
  timestamp?: any;
  billed?: boolean;
  printed?: boolean;
  packedAt?: string;
  billedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  utrNumber?: string;
}

export interface TicketMessage {
  id: string;
  sender: 'customer' | 'admin';
  text: string;
  timestamp: any;
}

export interface SupportTicket {
  id: string; // TKT-XXXX
  customerId?: string;
  customerUid?: string;
  customerPhone?: string;
  customerMobile?: string;
  customerName: string;
  customerEmail?: string;
  subject?: string;
  issueType?: 'order_delay' | 'wrong_item' | 'defective' | 'payment_issue' | 'other' | string;
  issueCategory?: string;
  category?: string;
  message?: string;
  customerMessage?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  createdAtFirestore?: any;
  updatedAt?: string;
  updatedAtFirestore?: any;
  orderId?: string;
  replyNotes?: string;
  timestamp?: any;
}

export interface CategoryItem {
  id: string;
  title: string;
  priceRange: string;
  description: string;
  iconName: string;
  accent: string;
  subcategories?: { id: string; title: string; }[];
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text?: string;
  date: string;
  comment?: string;
  location?: string;
  watchPurchased?: string;
}

export interface CustomerReviewFeedback {
  id: string;
  title?: string;
  productName?: string;
  orderId?: string;
  customerPhone: string;
  customerName: string;
  rating: number;
  reviewText?: string;
  comment?: string;
  verifiedBuyer?: boolean;
  createdAt: string;
  createdAtFirestore?: any;
  timestamp?: any;
}
