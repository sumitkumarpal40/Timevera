import re

with open('src/types.ts', 'r') as f:
    content = f.read()

old = """export interface StoreOrder {
  notes?: string;
  id: string; // Order ID like ORD-1234
  items: OrderItem[];
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerPincode: string;
  customerLandmark?: string;
  customerEmail?: string;
  paymentMethod: 'COD' | 'Online' | 'cod' | 'upi_qr';
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
}"""

new_if = """export interface StoreOrder {
  notes?: string;
  id: string; // Order ID like ORD-1234
  items: OrderItem[];
  
  productId?: string;
  productName?: string;
  productImage?: string;
  quantity?: number;
  productPrice?: number;
  discount?: number;
  deliveryCharge?: number;
  finalAmount?: number;
  
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerPincode: string;
  customerLandmark?: string;
  customerEmail?: string;
  paymentMethod: 'COD' | 'Online' | 'cod' | 'upi_qr';
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
}"""

content = content.replace(old, new_if)

with open('src/types.ts', 'w') as f:
    f.write(content)
