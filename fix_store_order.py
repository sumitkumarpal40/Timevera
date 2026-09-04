import re

with open('src/types.ts', 'r') as f:
    content = f.read()

# Add fields to StoreOrder
old_store_order = """export interface StoreOrder {
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
  paymentMethod: 'cod' | 'upi_qr';
  paymentStatus?: 'pending' | 'verified' | 'failed' | 'refunded';
  orderStatus: 'Order Received' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';
"""

new_store_order = """export interface StoreOrder {
  notes?: string;
  id: string; // Order ID like ORD-1234
  items: OrderItem[]; // Kept for backwards compat
  
  // Strict Order Requirements
  productId?: string;
  productName?: string;
  productImage?: string;
  quantity?: number;
  productPrice?: number;
  discount?: number;
  deliveryCharge?: number;
  finalAmount?: number;
  
  totalAmount: number; // legacy alias for finalAmount
  
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
"""

content = content.replace(old_store_order, new_store_order)

with open('src/types.ts', 'w') as f:
    f.write(content)

