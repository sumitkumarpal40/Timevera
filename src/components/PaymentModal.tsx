import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  ShieldCheck,
  ShieldAlert,
  Truck,
  ArrowRight,
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Building,
  Zap,
  ShoppingBag,
  Package,
  CreditCard,
  Smartphone,
  ExternalLink,
  Check,
  Printer,
  MessageCircle,
  Clock,
  Plus,
  Minus,
  Trash2,
  Lock,
  Sparkles,
  LogIn,
  AlertCircle,
} from 'lucide-react';
import { WatchProduct, CartItem, StoreOrder, OrderItem } from '../types';
import { saveOrderToFirestore, updateLocalOrderCaches } from '../lib/orderService';
import { auth } from '../lib/firebase';
import { BUSINESS_INFO } from '../data/watches';
import { printInvoice } from '../lib/invoicePrinter';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { CouponValidationResult } from '../lib/couponService';
import { getDeliveryEstimate } from '../lib/deliveryEstimator';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  singleProduct?: WatchProduct | null;
  initialQuantity?: number;
  cartItems?: CartItem[];
  appliedCoupon?: CouponValidationResult | null;
  initialCoupon?: CouponValidationResult | null;
  onOrderSuccess?: () => void;
  onUpdateCartQuantity?: (productId: string, quantity: number) => void;
  onOpenTrackOrder?: (orderId?: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  singleProduct,
  initialQuantity = 1,
  cartItems = [],
  appliedCoupon = null,
  initialCoupon = null,
  onOrderSuccess,
  onUpdateCartQuantity,
  onOpenTrackOrder,
}) => {
  const activeCoupon = appliedCoupon || initialCoupon;
  // Step state: 1 (Summary), 2 (Delivery Address), 3 (Payment Mode), 4 (Review & Place Order)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Customer Auth Context
  const { customer, isLoggedIn, openLoginModal, updateProfile } = useCustomerAuth();

  // Editable checkout items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Sync / Initialize items when modal opens or props change
  useEffect(() => {
    if (!isOpen) return;

    if (singleProduct) {
      setOrderItems([
        {
          productId: singleProduct.id,
          id: singleProduct.id,
          name: singleProduct.name,
          price: Number(singleProduct.price) || 0,
          unitPrice: Number(singleProduct.price) || 0,
          quantity: Math.max(1, initialQuantity),
          image: singleProduct.image,
          total: (Number(singleProduct.price) || 0) * Math.max(1, initialQuantity),
        },
      ]);
    } else if (cartItems.length > 0) {
      setOrderItems(
        cartItems.map((item) => ({
          productId: item.product.id,
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price) || 0,
          unitPrice: Number(item.product.price) || 0,
          quantity: Math.max(1, Number(item.quantity) || 1),
          image: item.product.image,
          total: (Number(item.product.price) || 0) * Math.max(1, Number(item.quantity) || 1),
        }))
      );
    } else {
      setOrderItems([]);
    }
  }, [isOpen, singleProduct, initialQuantity, cartItems]);


  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');

  // Auto-fill from Customer Account when available
  useEffect(() => {
    if (isOpen && customer) {
      // Find default address or first address
      const defaultAddr = customer.addresses?.find(a => a.isDefault) || customer.addresses?.[0];
      
      if (defaultAddr) {
        if (!customerName) setCustomerName(defaultAddr.fullName);
        if (!customerPhone) setCustomerPhone(defaultAddr.phone);
        if (!customerAddress) setCustomerAddress(defaultAddr.address);
        if (!customerCity) setCustomerCity(defaultAddr.city);
        if (!customerPincode) setCustomerPincode(defaultAddr.pincode);
      } else {
        if (customer.fullName && !customerName) setCustomerName(customer.fullName);
        if (customer.phone && !customerPhone) setCustomerPhone(customer.phone);
        if (customer.address && !customerAddress) setCustomerAddress(customer.address);
        if (customer.city && !customerCity) setCustomerCity(customer.city);
        if (customer.pincode && !customerPincode) setCustomerPincode(customer.pincode);
      }
    }
  }, [isOpen, customer]);


  // Payment Method Selection ('upi' = Pay Online / Razorpay, 'cod' = Cash on Delivery)
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('cod');
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  // Validation errors
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<StoreOrder | null>(null);

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setPlacedOrder(null);
    setCurrentStep(1);
    onClose();
  };

  if (!isOpen) return null;

  // Calculate order items and total dynamically
  const items = orderItems;
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  const couponDiscount = activeCoupon && activeCoupon.valid ? Number(activeCoupon.discountAmount) || 0 : 0;
  const totalAmount = Math.max(0, subtotal - couponDiscount);
  const finalAmount = totalAmount;

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setOrderItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, quantity: newQty, total: (Number(item.price) || 0) * newQty } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMergeCartItems = () => {
    const existingNames = new Set(orderItems.map((i) => i.name));
    const extraItems: OrderItem[] = cartItems
      .filter((ci) => !existingNames.has(ci.product.name))
      .map((ci) => ({
        productId: ci.product.id,
        id: ci.product.id,
        name: ci.product.name,
        price: Number(ci.product.price) || 0,
        unitPrice: Number(ci.product.price) || 0,
        quantity: Math.max(1, Number(ci.quantity) || 1),
        image: ci.product.image,
        total: (Number(ci.product.price) || 0) * Math.max(1, Number(ci.quantity) || 1),
      }));

    setOrderItems((prev) => [...prev, ...extraItems]);
  };

  // Validate Step 2: Customer Address
  const validateStep2 = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!isLoggedIn || !customer) {
      errors.profile = 'ऑर्डर करने के लिए कस्टमर प्रोफ़ाइल अनिवार्य है। कृपया OTP द्वारा लॉगिन करें।';
      setFormErrors(errors);
      openLoginModal();
      return false;
    }

    if (!customerName.trim()) {
      errors.name = 'Kripya apna poora naam (Full Name) likhein';
    }
    const cleanPhone = customerPhone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = 'Kripya 10 digit ka valid Mobile number daalein';
    }
    if (!customerAddress.trim()) {
      errors.address = 'Kripya apna ghar/dukan ka pata (Address) likhein';
    }
    if (!customerCity.trim()) {
      errors.city = 'Kripya apna Sheher / Zila (City) likhein';
    }
    const cleanPincode = customerPincode.trim().replace(/\D/g, '');
    if (!cleanPincode || cleanPincode.length < 6) {
      errors.pincode = 'Kripya 6-digit Pincode daalein';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Razorpay Checkout Handler
  const handleRazorpayPayment = async () => {
    setFormErrors({});

    // Validate delivery details first
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    if (!isLoggedIn || !customer) {
      openLoginModal();
      return;
    }

    if (orderItems.length === 0) {
      alert('Kripya kam se kam 1 ghadi select karein');
      setCurrentStep(1);
      return;
    }

    setRazorpayLoading(true);

    try {
      // STEP 1: Create Razorpay order via backend
      const items = orderItems.map((it) => ({
        productId: it.productId || it.id,
        quantity: Math.max(1, Number(it.quantity) || 1),
      }));

      const createResponse = await fetch('/.netlify/functions/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          couponCode: activeCoupon?.code || null,
        }),
      });

      if (!createResponse.ok) {
        const errData = await createResponse.json().catch(() => ({}));
        throw new Error(
          errData.error || `Server error (${createResponse.status})`
        );
      }

      const createData = await createResponse.json();

      if (!createData.success) {
        throw new Error(createData.error || 'Failed to create Razorpay order');
      }

      // STEP 2: Open Razorpay checkout
      const options = {
        key: createData.keyId,
        amount: createData.amountInPaise,
        currency: 'INR',
        name: 'TIMEVERA WATCH',
        description: `Order for ${items.length} item(s)`,
        order_id: createData.razorpayOrderId,
        handler: async function (response: any) {
          // STEP 3: Verify payment
          try {
            setRazorpayLoading(true);

            const orderId = 'TV-' + Math.random().toString(36).substr(2, 6).toUpperCase();
            const now = new Date().toISOString();

            const sanitizedItems = createData.verifiedItems.map((vi: any) => ({
              productId: vi.productId,
              id: vi.productId,
              name: vi.name,
              productName: vi.name,
              price: vi.price,
              unitPrice: vi.unitPrice,
              quantity: vi.quantity,
              image: vi.image,
              total: vi.total,
              totalPrice: vi.total,
            }));

            const firstItem = sanitizedItems[0] || {};
            const totalQty = sanitizedItems.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0);

            const orderData = {
              id: orderId,
              customerUid: customer.uid,
              customerId: customer.uid,
              customerName: customerName.trim(),
              customerPhone: customerPhone.trim(),
              customerEmail: customer?.email || '',
              customerAddress: customerAddress.trim(),
              customerCity: customerCity.trim(),
              customerPincode: customerPincode.trim(),
              items: sanitizedItems,
              productId: firstItem.productId || firstItem.id || '',
              productName: sanitizedItems.length === 1 ? firstItem.name : sanitizedItems.map((i: any) => `${i.name} (x${i.quantity})`).join(', '),
              productImage: firstItem.image || '',
              quantity: totalQty,
              productPrice: Number(firstItem.price) || 0,
              price: Number(firstItem.price) || 0,
              unitPrice: Number(firstItem.price) || 0,
              subtotal: createData.subtotal,
              subtotalAmount: createData.subtotal,
              discount: createData.couponDiscount,
              discountAmount: createData.couponDiscount,
              couponCode: activeCoupon?.code || undefined,
              couponDiscount: createData.couponDiscount > 0 ? createData.couponDiscount : undefined,
              deliveryCharge: createData.deliveryCharge,
              shipping: createData.deliveryCharge,
              finalAmount: createData.finalAmount,
              totalAmount: createData.finalAmount,
              grandTotal: createData.finalAmount,
              paymentMethod: 'Prepaid',
              paymentStatus: 'Paid',
              orderStatus: 'Order Received',
              inventoryStatus: 'pending_deduction',
              createdAt: now,
              orderDate: now.split('T')[0],
              timestamp: Date.now(),
              notes: 'PREPAID ORDER (Razorpay)',
            };

            const verifyResponse = await fetch('/.netlify/functions/verify-razorpay-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            // Sync customer address profile
            if (isLoggedIn && customer) {
              let newAddresses = customer.addresses ? [...customer.addresses] : [];
              const isExisting = newAddresses.some(
                a => a.address.toLowerCase() === customerAddress.trim().toLowerCase() && 
                     a.pincode === customerPincode.trim()
              );
              
              if (!isExisting) {
                newAddresses.push({
                  id: 'addr_' + Date.now().toString(),
                  fullName: customerName.trim(),
                  phone: customerPhone.trim(),
                  address: customerAddress.trim(),
                  city: customerCity.trim(),
                  state: customerCity.trim(),
                  pincode: customerPincode.trim(),
                  isDefault: newAddresses.length === 0,
                });
              }
              
              updateProfile({
                fullName: customerName.trim(),
                address: customerAddress.trim(),
                city: customerCity.trim(),
                pincode: customerPincode.trim(),
                addresses: newAddresses
              }).catch((e) => console.warn('Customer profile sync error:', e));
            }

            // Success!
            orderData.id = verifyData.orderId;
            updateLocalOrderCaches(orderData as StoreOrder);
            setPlacedOrder(orderData as any);
            setIsSubmitting(false);
            setIsSubmitted(true);
            setRazorpayLoading(false);
            if (onOrderSuccess) {
              onOrderSuccess();
            }

          } catch (err: any) {
            console.error('Verification error:', err);
            setFormErrors({ _form: err.message || 'Payment verification failed. Please contact support.' });
            setRazorpayLoading(false);
          }
        },
        prefill: {
          name: customerName.trim() || customer?.fullName || '',
          email: customer?.email || '',
          contact: customerPhone.trim() || customer?.phone || '',
        },
        theme: {
          color: '#D4AF37',
        },
        modal: {
          ondismiss: function () {
            setRazorpayLoading(false);
          },
        },
      };

      if (typeof (window as any).Razorpay === 'undefined') {
        throw new Error(
          'Razorpay payment gateway failed to load. Please check your internet connection and try again.'
        );
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error('Razorpay error:', error);
      setFormErrors({ _form: error.message || 'Failed to start payment. Please try again.' });
      setRazorpayLoading(false);
    }
  };

  // Step 4: Final Order Place Handler (Instantaneous 1-Click placement for COD)
  const handleFinalOrderPlace = async () => {
    // Guard against duplicate submission from rapid repeated clicks
    if (isSubmitting) return;

    if (items.length === 0) {
      alert('Kripya kam se kam 1 ghadi select karein');
      setCurrentStep(1);
      return;
    }

    // STRICT CUSTOMER PROFILE CHECK: Customer profile must exist to place order
    const authUid = auth.currentUser?.uid || customer?.uid;
    if (!isLoggedIn || !customer || !authUid) {
      setFormErrors({
        profile: 'ऑर्डर करने के लिए कस्टमर प्रोफ़ाइल अनिवार्य है (Customer Profile Required). कृपया OTP द्वारा लॉगिन / प्रोफ़ाइल बनाएं।',
      });
      openLoginModal();
      return;
    }

    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    // Reset previous submit error
    setFormErrors((prev) => ({ ...prev, _form: undefined }));
    setIsSubmitting(true);
    const selectedPayType = paymentMethod === 'upi' ? 'upi_qr' : 'cod';

    const now = new Date().toISOString();
    const orderId = `TV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const firstItem = items[0] || {
      productId: '',
      id: '',
      name: 'Timevera Watch',
      price: totalAmount,
      unitPrice: totalAmount,
      quantity: 1,
      image: '',
      total: totalAmount,
    };
    const deliveryCharge = 0;
    const discount = couponDiscount;
    const productPrice = Number(firstItem.price) || 0;
    const finalAmount = totalAmount;
    const isOnline = paymentMethod === 'upi';
    const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

    const sanitizedItems: OrderItem[] = items.map((it) => {
      const p = Number(it.price) || 0;
      const q = Math.max(1, Number(it.quantity) || 1);
      return {
        productId: it.productId || it.id || '',
        id: it.productId || it.id || '',
        name: it.name || 'Timevera Watch',
        price: p,
        unitPrice: p,
        quantity: q,
        image: it.image || '',
        total: p * q,
      };
    });

    const orderData: StoreOrder = {
      id: orderId,
      customerUid: authUid,
      customerId: authUid,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customer?.email || '',
      customerAddress: customerAddress.trim(),
      customerCity: customerCity.trim(),
      customerPincode: customerPincode.trim(),
      
      // Strict required Store fields
      productId: firstItem.productId || firstItem.id || '',
      productName: items.length === 1 ? firstItem.name : items.map((i) => `${i.name} (x${i.quantity})`).join(', '),
      productImage: firstItem.image || '',
      quantity: totalQty,
      productPrice: productPrice,
      price: productPrice,
      unitPrice: productPrice,
      subtotal: subtotal,
      subtotalAmount: subtotal,
      discount: discount,
      discountAmount: discount,
      couponCode: activeCoupon?.code || undefined,
      couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
      deliveryCharge: deliveryCharge,
      shipping: deliveryCharge,
      finalAmount: finalAmount,
      totalAmount: finalAmount,
      grandTotal: finalAmount,
      
      paymentMethod: isOnline ? 'Prepaid' : 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'Order Received',
      inventoryStatus: 'pending_deduction',
      
      createdAt: now,
      orderDate: now.split('T')[0],
      timestamp: Date.now(),
      items: sanitizedItems,
      notes: isOnline ? 'PREPAID ORDER (Online)' : 'CASH ON DELIVERY (COD)',
    };

    try {
      // 1. Await secure server-side transaction and rules validation
      await saveOrderToFirestore(orderData);
      
      // 2. Sync customer profile if logged in
      if (isLoggedIn && customer) {
        let newAddresses = customer.addresses ? [...customer.addresses] : [];
        const isExisting = newAddresses.some(
          a => a.address.toLowerCase() === customerAddress.trim().toLowerCase() && 
               a.pincode === customerPincode.trim()
        );
        
        if (!isExisting) {
          newAddresses.push({
            id: 'addr_' + Date.now().toString(),
            fullName: customerName.trim(),
            phone: customerPhone.trim(),
            address: customerAddress.trim(),
            city: customerCity.trim(),
            state: customerCity.trim(),
            pincode: customerPincode.trim(),
            isDefault: newAddresses.length === 0,
          });
        }
        
        updateProfile({
          fullName: customerName.trim(),
          address: customerAddress.trim(), // Keep legacy fields for backward compat
          city: customerCity.trim(),
          pincode: customerPincode.trim(),
          addresses: newAddresses
        }).catch((e) => console.warn('Customer profile sync error:', e));
      }
      
      setPlacedOrder(orderData);
      setIsSubmitting(false);
      setIsSubmitted(true);
      if (onOrderSuccess) {
        onOrderSuccess();
      }
    } catch (err: any) {
      console.error("Order failed:", err);
      setFormErrors({ _form: err.message || 'Failed to place order due to server validation.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111216] text-neutral-900 dark:text-neutral-100 rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="bg-neutral-900 dark:bg-[#16171d] border-b border-neutral-800 p-3 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 sm:p-2 bg-amber-400/10 border border-amber-400/20 rounded-lg sm:rounded-xl">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h3 className="font-brand text-base sm:text-lg font-bold text-white tracking-wide">
                Timevera Checkout
              </h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-400">
                100% Genuine Quality • Fast Free Delivery • Secure System
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 sm:p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* 4-Step Progress Indicator (Shown during checkout wizard) */}
        {!isSubmitted && (
          <div className="bg-neutral-100 dark:bg-[#0d0e12] border-b border-neutral-200 dark:border-neutral-800/80 p-2 sm:p-2.5">
            <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
              {/* Step 1 */}
              <div
                onClick={() => setCurrentStep(1)}
                className={`py-1 sm:py-1.5 px-1 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                  currentStep === 1
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-sm'
                    : currentStep > 1
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'text-neutral-400'
                }`}
              >
                <span>1. Summary</span>
              </div>

              {/* Step 2 */}
              <div
                onClick={() => {
                  setCurrentStep(2);
                }}
                className={`py-1 sm:py-1.5 px-1 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                  currentStep === 2
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-sm'
                    : currentStep > 2
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'text-neutral-400'
                }`}
              >
                <span>2. Address</span>
              </div>

              {/* Step 3 */}
              <div
                onClick={() => {
                  if (validateStep2()) setCurrentStep(3);
                  else setCurrentStep(2);
                }}
                className={`py-1 sm:py-1.5 px-1 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                  currentStep === 3
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-sm'
                    : currentStep > 3
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'text-neutral-400'
                }`}
              >
                <span>3. Payment</span>
              </div>

              {/* Step 4 */}
              <div
                onClick={() => {
                  if (validateStep2()) setCurrentStep(4);
                  else setCurrentStep(2);
                }}
                className={`py-1 sm:py-1.5 px-1 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                  currentStep === 4
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-sm'
                    : 'text-neutral-400'
                }`}
              >
                <span>4. Confirm</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        {isSubmitted && placedOrder ? (
          /* ========================================================= */
          /* SUCCESS SCREEN (ORDER PLACED)                             */
          /* ========================================================= */
          <div className="p-4 sm:p-7 text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-6 h-6 sm:w-9 sm:h-9" />
            </div>

            <div className="space-y-0.5 sm:space-y-1">
              <span className="text-[10px] sm:text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Order Confirmed Successfully
              </span>
              <h3 className="font-brand font-bold text-lg sm:text-xl md:text-2xl text-neutral-900 dark:text-white">
                Thank You, {placedOrder.customerName}!
              </h3>
              <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400">
                Order ID <strong className="text-amber-600 dark:text-amber-300 font-mono text-xs sm:text-sm">{placedOrder.id}</strong> has been registered.
              </p>
            </div>

            {/* Order Card */}
            <div className="p-2.5 sm:p-4 bg-neutral-50 dark:bg-[#15161c] border border-neutral-200 dark:border-neutral-800 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs space-y-2 sm:space-y-3 text-left shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                <span className="text-neutral-500 font-semibold uppercase">Total Bill:</span>
                <span className="font-black text-base sm:text-lg text-neutral-900 dark:text-amber-200 font-mono">
                  ₹{(Number(placedOrder.totalAmount) || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* PAYMENT TYPE BADGE (PREPAID OR COD) */}
              <div className="flex items-center justify-between py-1.5 sm:py-2 px-2.5 sm:px-3 bg-neutral-100 dark:bg-[#0c0d10] rounded-lg sm:rounded-xl border border-neutral-200 dark:border-neutral-800/80">
                <span className="font-bold uppercase text-[9px] sm:text-[11px] text-neutral-600 dark:text-neutral-400">
                  Payment Status:
                </span>
                <span
                  className={`px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-black rounded-full uppercase font-mono tracking-wider ${
                    placedOrder.paymentMethod === 'upi_qr'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-amber-400 text-neutral-950 shadow-sm'
                  }`}
                >
                  {placedOrder.paymentMethod === 'upi_qr' ? 'PREPAID (ONLINE PAID)' : 'CASH ON DELIVERY (COD)'}
                </span>
              </div>

              <div className="space-y-1 text-neutral-600 dark:text-neutral-400 pt-0.5">
                <div className="flex items-start gap-1 sm:gap-1.5">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                    {placedOrder.customerAddress}, {placedOrder.customerCity} - <strong>{placedOrder.customerPincode}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-neutral-800 dark:text-neutral-200 font-mono font-bold">
                    {placedOrder.customerPhone}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 flex-shrink-0" />
                  <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                    {placedOrder.paymentMethod === 'upi_qr'
                      ? 'Prepaid Order: Priority Dispatch'
                      : `Cash on Delivery: Pay ₹${(Number(placedOrder.totalAmount) || 0).toLocaleString('en-IN')} upon delivery`}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions: Track Order, Print Bill & Continue */}
            <div className="space-y-1.5 sm:space-y-2 pt-1">
              {onOpenTrackOrder && (
                <button
                  type="button"
                  onClick={() => {
                    const ordId = placedOrder.id;
                    handleResetAndClose();
                    onOpenTrackOrder(ordId);
                  }}
                  className="w-full py-2 px-3 sm:py-3.5 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 shadow-md cursor-pointer transition-all"
                >
                  <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                  <span>Track This Order Live</span>
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => printInvoice(placedOrder, 'thermal_slip')}
                  className="py-2 px-3 sm:py-3 sm:px-4 bg-neutral-900 dark:bg-[#1d1f27] hover:bg-neutral-800 text-white border border-neutral-700 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow transition-all"
                >
                  <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span>Print Slip</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="py-2 px-3 sm:py-3 sm:px-4 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 shadow cursor-pointer transition-all"
                >
                  <span>Continue Shopping</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* 4-STEP WIZARD CHECKOUT FORM                               */
          /* ========================================================= */
          <div className="p-2.5 sm:p-6 space-y-3 sm:space-y-4">
            {/* STEP 1: ORDER & PRODUCT SUMMARY */}
            {currentStep === 1 && (
              <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                  <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1 sm:gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                    <span>Step 1: Order Summary</span>
                  </h4>
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 sm:px-2 py-0.5 rounded">
                    Free Delivery
                  </span>
                </div>

                {/* Items List with Interactive Quantity Adjustment */}
                {items.length === 0 ? (
                  <div className="p-4 sm:p-6 text-center text-neutral-500 bg-neutral-50 dark:bg-[#15161c] rounded-xl sm:rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800">
                    <p className="text-[11px] sm:text-xs font-semibold">No watches selected in order.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 sm:max-h-64 overflow-y-auto pr-1">
                    {items.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 sm:p-3 bg-neutral-50 dark:bg-[#15161c] border border-neutral-200 dark:border-neutral-800/80 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2.5 sm:gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                          <img
                            src={it.image}
                            alt={it.name}
                            className="w-10 h-12 sm:w-12 sm:h-14 object-cover rounded-lg sm:rounded-xl border border-neutral-200 dark:border-neutral-700 bg-black flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] sm:text-xs font-bold text-neutral-900 dark:text-white truncate">
                              {it.name}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 mb-1 sm:mb-1.5">
                              ₹{(Number(it.price) || 0).toLocaleString('en-IN')} / pc
                            </p>

                            {/* In-Checkout Quantity Stepper */}
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="text-[9px] sm:text-[10px] text-neutral-400 font-semibold">Qty:</span>
                              <div className="flex items-center border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#0c0d10] rounded-md sm:rounded-lg overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQty(idx, it.quantity - 1)}
                                  className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                >
                                  <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                </button>
                                <span className="px-1.5 sm:px-2.5 text-[11px] sm:text-xs font-bold text-neutral-900 dark:text-white">
                                  {it.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQty(idx, it.quantity + 1)}
                                  className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                >
                                  <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                </button>
                              </div>

                              {items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1 text-neutral-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 pl-1.5">
                          <p className="text-xs sm:text-sm font-black text-neutral-900 dark:text-amber-200 font-mono">
                            ₹{((Number(it.price) || 0) * (Number(it.quantity) || 1)).toLocaleString('en-IN')}
                          </p>
                          <span className="text-[9px] sm:text-[10px] text-neutral-400">
                            ({it.quantity} {it.quantity === 1 ? 'pc' : 'pcs'})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Merge other Bag items banner if available */}
                {singleProduct && cartItems.length > 0 && cartItems.some((ci) => !items.some((it) => it.name === ci.product.name)) && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg sm:rounded-xl flex items-center justify-between gap-1.5 text-[11px] sm:text-xs">
                    <div className="flex items-center gap-1 text-amber-800 dark:text-amber-300">
                      <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                      <span>{cartItems.length} other items in bag</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleMergeCartItems}
                      className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded text-[10px] sm:text-[11px] transition-colors cursor-pointer flex-shrink-0"
                    >
                      + Add All
                    </button>
                  </div>
                )}

                {/* Total Bill Row */}
                <div className="p-2.5 sm:p-3.5 bg-neutral-100 dark:bg-[#15161c] border border-neutral-200 dark:border-neutral-800 rounded-xl sm:rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] sm:text-xs text-neutral-500 uppercase font-bold">
                      Total Items ({items.reduce((s, it) => s + it.quantity, 0)} pcs):
                    </span>
                    <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ Free Express Delivery included
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg sm:text-xl font-black text-neutral-900 dark:text-amber-200 font-mono">
                      ₹{(Number(totalAmount) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-neutral-600 dark:text-neutral-400 pt-0.5">
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-neutral-100 dark:bg-[#15161c] p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                    <span>100% Genuine Watch</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-neutral-100 dark:bg-[#15161c] p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
                    <span>Free Home Delivery</span>
                  </div>
                </div>

                {/* Profile Status Banner & Step 1 Proceed Button */}
                {!isLoggedIn || !customer ? (
                  <div className="space-y-1.5 sm:space-y-2 pt-0.5">
                    <div className="p-2 sm:p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl sm:rounded-2xl flex items-start gap-2 text-xs">
                      <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-amber-900 dark:text-amber-300 text-[10px] sm:text-[11px] leading-tight">
                        <strong className="block text-xs font-bold text-amber-700 dark:text-amber-400">
                          Customer Profile Required
                        </strong>
                        <span>
                          Please login or create your verified customer profile to proceed with your order.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openLoginModal()}
                      className="w-full py-2.5 sm:py-3.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-[10px] sm:text-xs uppercase tracking-wider rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Step 1: Login / Create Profile (OTP)</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="w-full py-1.5 text-[10px] sm:text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 font-semibold cursor-pointer text-center"
                    >
                      Or proceed to view delivery form ➔
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 sm:space-y-2 pt-0.5">
                    <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl sm:rounded-2xl flex items-center justify-between gap-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span className="text-emerald-900 dark:text-emerald-300 text-[10px] sm:text-[11px] font-semibold">
                          Profile: <strong>{customer.fullName || 'Customer'}</strong> (+91-{customer.phone})
                        </span>
                      </div>
                      <span className="text-[8px] sm:text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Verified
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="w-full py-2.5 sm:py-3.5 bg-neutral-900 dark:bg-amber-400 hover:bg-neutral-800 dark:hover:bg-amber-300 text-white dark:text-neutral-950 font-extrabold text-[10px] sm:text-xs uppercase tracking-wider rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
                    >
                      <span>Step 2: Delivery Address & Details</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: DELIVERY ADDRESS & DETAILS */}
            {currentStep === 2 && (
              <div className="space-y-3 sm:space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                  <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1 sm:gap-1.5">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                    <span>Step 2: Delivery Details</span>
                  </h4>
                  <span className="text-[10px] text-neutral-400">* All Fields Required</span>
                </div>

                {/* Customer Account Status / Auto-fill Banner */}
                {isLoggedIn && customer ? (
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl sm:rounded-2xl flex items-center justify-between gap-1.5 sm:gap-2 text-xs">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span className="text-emerald-900 dark:text-emerald-300 text-[10px] sm:text-[11px] font-semibold">
                          Logged in as <strong>{customer.fullName || 'Customer'}</strong> (+91-{customer.phone})
                        </span>
                      </div>
                      <span className="text-[8px] sm:text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                        Auto-Filled
                      </span>
                    </div>
                    {customer.addresses && customer.addresses.length > 0 && (
                      <div className="space-y-1 sm:space-y-2">
                        <label className="block text-[10px] sm:text-xs font-bold text-neutral-700 dark:text-neutral-300">
                          Select from Saved Addresses:
                        </label>
                        <select
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white dark:bg-[#0c0d10] border border-neutral-300 dark:border-neutral-700 rounded-lg sm:rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none text-neutral-900 dark:text-white"
                          onChange={(e) => {
                            const addrId = e.target.value;
                            if (addrId) {
                              const sel = customer.addresses?.find(a => a.id === addrId);
                              if (sel) {
                                setCustomerName(sel.fullName);
                                setCustomerPhone(sel.phone);
                                setCustomerAddress(sel.address);
                                setCustomerCity(sel.city);
                                setCustomerPincode(sel.pincode);
                              }
                            } else {
                                setCustomerName('');
                                setCustomerPhone('');
                                setCustomerAddress('');
                                setCustomerCity('');
                                setCustomerPincode('');
                            }
                          }}
                        >
                          {customer.addresses.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.fullName} - {a.address}, {a.city} - {a.pincode}
                            </option>
                          ))}
                          <option value="">+ Enter New Address</option>
                        </select>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 sm:p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 rounded-xl sm:rounded-2xl space-y-1.5 sm:space-y-2 text-xs">
                    <div className="flex items-start gap-1.5 sm:gap-2 text-amber-900 dark:text-amber-300 text-[10px] sm:text-[11px]">
                      <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-amber-800 dark:text-amber-300 font-bold">
                          Customer Profile Required to Place Order:
                        </strong>
                        <span>
                          Please verify your mobile OTP to create a profile before ordering.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openLoginModal}
                      className="w-full py-2 sm:py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl uppercase tracking-wider cursor-pointer shadow flex items-center justify-center gap-1 sm:gap-1.5 transition-all"
                    >
                      <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Verify Mobile OTP & Create Profile</span>
                    </button>
                  </div>
                )}

                {formErrors.profile && (
                  <div className="p-2 sm:p-2.5 bg-rose-500/10 border border-rose-500/40 rounded-lg sm:rounded-xl text-rose-500 text-[11px] sm:text-xs flex items-center gap-1.5 sm:gap-2 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>{formErrors.profile}</span>
                  </div>
                )}

                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400 absolute left-2.5 sm:left-3 top-2 sm:top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                        }}
                        className={`w-full pl-8 sm:pl-9 pr-2.5 sm:pr-3 py-1.5 sm:py-2 bg-white dark:bg-[#0c0d10] border rounded-lg sm:rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none text-neutral-900 dark:text-white ${
                          formErrors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                        }`}
                      />
                    </div>
                    {formErrors.name && (
                      <p className="text-[9px] sm:text-[10px] text-rose-500 mt-1 font-semibold">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400 absolute left-2.5 sm:left-3 top-2 sm:top-2.5" />
                      <input
                        type="tel"
                        maxLength={15}
                        placeholder="e.g. 9876543210"
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value);
                          if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                        }}
                        className={`w-full pl-8 sm:pl-9 pr-2.5 sm:pr-3 py-1.5 sm:py-2 bg-white dark:bg-[#0c0d10] border rounded-lg sm:rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-neutral-900 dark:text-white ${
                          formErrors.phone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                        }`}
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-[9px] sm:text-[10px] text-rose-500 mt-1 font-semibold">{formErrors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Complete Address */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    House No, Street, Landmark & Area *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. House No. 42, Gali No. 3, Near Shiv Temple"
                    value={customerAddress}
                    onChange={(e) => {
                      setCustomerAddress(e.target.value);
                      if (formErrors.address) setFormErrors({ ...formErrors, address: '' });
                    }}
                    className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white dark:bg-[#0c0d10] border rounded-lg sm:rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none text-neutral-900 dark:text-white ${
                      formErrors.address ? 'border-rose-500 ring-1 ring-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                    }`}
                  />
                  {formErrors.address && (
                    <p className="text-[9px] sm:text-[10px] text-rose-500 mt-0.5 font-semibold">{formErrors.address}</p>
                  )}
                </div>

                {/* City & Pincode */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      City / District *
                    </label>
                    <div className="relative">
                      <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400 absolute left-2.5 sm:left-3 top-2 sm:top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. Mumbai"
                        value={customerCity}
                        onChange={(e) => {
                          setCustomerCity(e.target.value);
                          if (formErrors.city) setFormErrors({ ...formErrors, city: '' });
                        }}
                        className={`w-full pl-8 sm:pl-9 pr-2.5 sm:pr-3 py-1.5 sm:py-2 bg-white dark:bg-[#0c0d10] border rounded-lg sm:rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none text-neutral-900 dark:text-white ${
                          formErrors.city ? 'border-rose-500 ring-1 ring-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                        }`}
                      />
                    </div>
                    {formErrors.city && (
                      <p className="text-[9px] sm:text-[10px] text-rose-500 mt-1 font-semibold">{formErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 400001"
                      value={customerPincode}
                      onChange={(e) => {
                        setCustomerPincode(e.target.value);
                        if (formErrors.pincode) setFormErrors({ ...formErrors, pincode: '' });
                      }}
                      className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white dark:bg-[#0c0d10] border rounded-lg sm:rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-neutral-900 dark:text-white ${
                        formErrors.pincode ? 'border-rose-500 ring-1 ring-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                      }`}
                    />
                    {formErrors.pincode && (
                      <p className="text-[9px] sm:text-[10px] text-rose-500 mt-1 font-semibold">{formErrors.pincode}</p>
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="py-2 sm:py-3 px-3 sm:px-4 bg-neutral-100 dark:bg-[#1c1d25] hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep2()) {
                        setCurrentStep(3);
                      }
                    }}
                    className="flex-1 py-2 sm:py-3.5 bg-neutral-900 dark:bg-amber-400 hover:bg-neutral-800 dark:hover:bg-amber-300 text-white dark:text-neutral-950 font-extrabold text-[10px] sm:text-xs uppercase tracking-wider rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
                  >
                    <span>Step 3: Choose Payment Mode</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT MODE SELECTION */}
            {currentStep === 3 && (
              <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                  <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1 sm:gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                    <span>Step 3: Payment Mode</span>
                  </h4>
                  <span className="text-xs sm:text-sm font-black text-neutral-900 dark:text-amber-200 font-mono">
                    ₹{(Number(totalAmount) || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Option 1: Online Razorpay */}
                <div
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'upi'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                      : 'bg-neutral-50 dark:bg-[#15161c] border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 sm:p-2 bg-emerald-600 text-white rounded-lg sm:rounded-xl">
                        <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] sm:text-xs font-extrabold text-neutral-900 dark:text-white flex items-center gap-1 sm:gap-1.5">
                          <span>Pay Online (Prepaid)</span>
                          <span className="px-1 sm:px-1.5 py-0.5 bg-emerald-600 text-white text-[8px] sm:text-[9px] font-black uppercase rounded">
                            Fast Dispatch
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          Cards, UPI, NetBanking, Wallets (Secure Razorpay)
                        </p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'upi' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-neutral-400'
                    }`}>
                      {paymentMethod === 'upi' && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Razorpay 1-Click Pay Button in Step 3 */}
                  {paymentMethod === 'upi' && (
                    <div className="mt-2.5 pt-2.5 border-t border-emerald-500/20 space-y-2">
                      {formErrors._form && (
                        <div className="p-2.5 sm:p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl sm:rounded-2xl flex items-start gap-2 text-xs text-red-700 dark:text-red-300 animate-fadeIn">
                          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                          <span className="font-semibold leading-relaxed text-[10px] sm:text-xs">{formErrors._form}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={razorpayLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRazorpayPayment();
                        }}
                        className="w-full py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        {razorpayLoading ? (
                          <span>Processing...</span>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            <span>Pay ₹{(Number(totalAmount) || 0).toLocaleString('en-IN')} with Razorpay</span>
                          </>
                        )}
                      </button>
                      <p className="text-[10px] text-center text-neutral-500 dark:text-neutral-400 font-medium">
                        🔒 Powered by <strong className="text-neutral-800 dark:text-neutral-200">Razorpay</strong> • 100% Safe & Secure
                      </p>
                    </div>
                  )}
                </div>

                {/* Option 2: Cash on Delivery (COD) */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                      : 'bg-neutral-50 dark:bg-[#15161c] border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 sm:p-2 bg-amber-400 text-neutral-950 rounded-lg sm:rounded-xl">
                        <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] sm:text-xs font-extrabold text-neutral-900 dark:text-white flex items-center gap-1 sm:gap-1.5">
                          <span>Cash on Delivery (COD)</span>
                          <span className="px-1 sm:px-1.5 py-0.5 bg-amber-400 text-neutral-950 text-[8px] sm:text-[9px] font-black uppercase rounded">
                            Popular
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          Pay cash to the delivery agent upon receiving your order
                        </p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'cod' ? 'border-amber-400 bg-amber-400 text-neutral-950' : 'border-neutral-400'
                    }`}>
                      {paymentMethod === 'cod' && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="py-2 sm:py-3 px-3 sm:px-4 bg-neutral-100 dark:bg-[#1c1d25] hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="flex-1 py-2 sm:py-3.5 bg-neutral-900 dark:bg-amber-400 hover:bg-neutral-800 dark:hover:bg-amber-300 text-white dark:text-neutral-950 font-extrabold text-[10px] sm:text-xs uppercase tracking-wider rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
                  >
                    <span>Step 4: Review & Place Order</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & FINAL ORDER PLACE */}
            {currentStep === 4 && (
              <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                  <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1 sm:gap-1.5">
                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                    <span>Step 4: Review & Confirm Order</span>
                  </h4>
                  <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded">
                    Final Step
                  </span>
                </div>

                {/* Review Card */}
                <div className="p-3 bg-neutral-50 dark:bg-[#15161c] border border-neutral-200 dark:border-neutral-800 rounded-xl sm:rounded-2xl text-xs space-y-2 sm:space-y-3 shadow-sm">
                  {/* Delivery Info */}
                  <div className="space-y-0.5 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase">Deliver To:</span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-[9px] sm:text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        Edit Address
                      </button>
                    </div>
                    <p className="font-bold text-neutral-900 dark:text-white text-[11px] sm:text-xs">
                      {customerName} • <span className="font-mono text-emerald-600 dark:text-emerald-400">{customerPhone}</span>
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-300 text-[10px] sm:text-[11px]">
                      {customerAddress}, {customerCity} - <strong>{customerPincode}</strong>
                    </p>
                  </div>

                  {/* Payment Mode Highlight */}
                  <div className="flex items-center justify-between py-1.5 px-2.5 bg-neutral-100 dark:bg-[#0c0d10] rounded-lg sm:rounded-xl border border-neutral-200 dark:border-neutral-800/80">
                    <div>
                      <span className="text-[9px] sm:text-[10px] uppercase font-bold text-neutral-500">Payment Option:</span>
                      <p className="font-extrabold text-neutral-900 dark:text-white text-[10px] sm:text-xs">
                        {paymentMethod === 'upi' ? 'Pay Online (Razorpay)' : 'Cash on Delivery (COD)'}
                      </p>
                    </div>
                    <span
                      className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-black rounded-md sm:rounded-lg uppercase font-mono ${
                        paymentMethod === 'upi'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-400 text-neutral-950'
                      }`}
                    >
                      {paymentMethod === 'upi' ? 'PREPAID' : 'COD'}
                    </span>
                  </div>

                  {/* Total Bill to Pay */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="font-bold text-neutral-700 dark:text-neutral-300 uppercase text-[10px] sm:text-xs">
                      Total Payable Amount:
                    </span>
                    <span className="font-black text-lg sm:text-xl text-neutral-900 dark:text-amber-200 font-mono">
                      ₹{(Number(totalAmount) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Error Display */}
                {formErrors._form && (
                  <div className="p-2.5 sm:p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl sm:rounded-2xl flex items-start gap-2 text-xs text-red-700 dark:text-red-300 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <span className="font-semibold leading-relaxed text-[10px] sm:text-xs">{formErrors._form}</span>
                  </div>
                )}

                {/* Navigation & Submit */}
                <div className="space-y-1.5 sm:space-y-2 pt-0.5">
                  {!isLoggedIn || !customer ? (
                    <button
                      type="button"
                      onClick={() => openLoginModal()}
                      className="w-full py-2.5 sm:py-4 font-extrabold text-[11px] sm:text-sm uppercase tracking-wider rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all transform active:scale-98 cursor-pointer bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black"
                    >
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Login / Create Profile to Place Order (OTP)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : paymentMethod === 'upi' ? (
                    <button
                      type="button"
                      disabled={razorpayLoading}
                      onClick={handleRazorpayPayment}
                      className="w-full py-2.5 sm:py-4 font-extrabold text-[11px] sm:text-sm uppercase tracking-wider rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {razorpayLoading ? (
                        <span>Processing...</span>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Pay ₹{(Number(totalAmount) || 0).toLocaleString('en-IN')} with Razorpay</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleFinalOrderPlace}
                      className="w-full py-2.5 sm:py-4 font-extrabold text-[11px] sm:text-sm uppercase tracking-wider rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50 bg-neutral-900 dark:bg-amber-400 hover:bg-neutral-800 dark:hover:bg-amber-300 text-white dark:text-neutral-950"
                    >
                      <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>
                        {isSubmitting
                          ? 'Placing Order in System...'
                          : `Confirm & Place Order (COD) - ₹${(Number(totalAmount) || 0).toLocaleString('en-IN')}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="w-full py-1.5 sm:py-2.5 text-[10px] sm:text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-semibold cursor-pointer text-center"
                  >
                    ⬅️ Back to Step 3 (Change Payment Mode)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

