import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  ShoppingBag,
  Package,
  MapPin,
  Phone,
  Building,
  CheckCircle,
  Truck,
  RotateCcw,
  Star,
  Printer,
  MessageCircle,
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Edit3,
  Save,
  Calendar,
  HelpCircle,
  Send,
  Clock,
  Headphones,
  Mail,
  AlertTriangle,
  FileText,
  ExternalLink,
  Heart,
  Trash2,
  Zap,
} from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { fetchOrdersForCustomer, fetchCustomerReviews } from '../lib/customerService';
import { saveSupportTicketToFirestore, fetchCustomerSupportTickets, subscribeToCustomerSupportTickets } from '../lib/orderService';
import { StoreOrder, CustomerReviewFeedback, StoreProduct, SupportTicket } from '../types';
import { printInvoice } from '../lib/invoicePrinter';
import { BUSINESS_INFO } from '../data/watches';
import { CustomerFeedbackModal } from './CustomerFeedbackModal';
import { AddressBook } from './AddressBook';
import { SupportTicketChat } from './SupportTicketChat';

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: StoreProduct[];
  onReorderProduct?: (product: StoreProduct) => void;
  onOpenTrackOrder?: (orderId: string) => void;
  onAddToCart?: (product: StoreProduct, quantity?: number) => void;
  onBuyNow?: (product: StoreProduct, quantity?: number) => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  onClose,
  products = [],
  onReorderProduct,
  onOpenTrackOrder,
  onAddToCart,
  onBuyNow,
}) => {
  const {
    customer,
    updateProfile,
    logout,
    accountActiveTab,
    setAccountActiveTab,
    wishlist,
    removeFromWishlist,
  } = useCustomerAuth();

  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [reviews, setReviews] = useState<CustomerReviewFeedback[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Support Ticket Form State
  const [ticketCategory, setTicketCategory] = useState('Order Tracking / Delivery Delay (डिलीवरी में देरी)');
  const [ticketOrderId, setTicketOrderId] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState('');
  const [lastCreatedTicketId, setLastCreatedTicketId] = useState('');
  const [activeChatTicket, setActiveChatTicket] = useState<SupportTicket | null>(null);

  // Feedback Modal State for specific order
  const [feedbackOrder, setFeedbackOrder] = useState<StoreOrder | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Load orders, reviews & support tickets when modal opens or customer changes
  useEffect(() => {
    if (isOpen && (customer?.phone || customer?.email || customer?.username || customer?.uid)) {
      const searchKey = customer.phone || customer.email || customer.username || '';
      setIsLoadingOrders(true);
      fetchOrdersForCustomer(searchKey, customer.uid)
        .then((ords) => {
          setOrders(ords);
        })
        .finally(() => {
          setIsLoadingOrders(false);
        });

      if (customer.phone) {
        fetchCustomerReviews(customer.phone).then((revs) => {
          setReviews(revs);
        });
      }

      setIsLoadingTickets(true);
      fetchCustomerSupportTickets(searchKey, customer.uid)
        .then((tkts) => {
          setSupportTickets(tkts);
        })
        .finally(() => {
          setIsLoadingTickets(false);
        });

      // Subscribe in real time to support tickets
      const unsubTickets = subscribeToCustomerSupportTickets(searchKey, customer.uid, (liveTkts) => {
        setSupportTickets(liveTkts);
      });

      // Init profile inputs
      setEditName(customer.fullName || '');
      setEditEmail(customer.email || '');
      setEditPassword(customer.password || '');
      setEditAddress(customer.address || '');
      setEditCity(customer.city || '');
      setEditPincode(customer.pincode || '');

      return () => {
        if (typeof unsubTickets === 'function') {
          unsubTickets();
        }
      };
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  // Handle Save Profile Updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile({
        fullName: editName.trim(),
        email: editEmail.trim() || undefined,
        password: editPassword.trim() || undefined,
        address: editAddress.trim(),
        city: editCity.trim(),
        pincode: editPincode.trim(),
      });
      setIsEditingProfile(false);
      setProfileSuccessMsg('प्रोफ़ाइल और पासवर्ड सफलतापूर्वक अपडेट किया गया! (Profile updated successfully)');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Submit Support Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) {
      alert('कृपया अपनी समस्या या शिकायत का विवरण दर्ज करें।');
      return;
    }

    setIsSubmittingTicket(true);
    const genTicketId = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
    setLastCreatedTicketId(genTicketId);

    const nowIso = new Date().toISOString();
    const newTicket: SupportTicket = {
      id: genTicketId,
      customerId: customer.uid || '',
      customerName: customer.fullName || 'Valued Customer',
      customerPhone: customer.phone || '',
      customerEmail: customer.email || '',
      subject: ticketCategory,
      issueCategory: ticketCategory,
      status: 'open',
      createdAt: nowIso,
      updatedAt: nowIso,
      ...(ticketOrderId.trim() ? { orderId: ticketOrderId.trim() } : {}),
      message: ticketMessage.trim(),
      timestamp: Date.now(),
    };

    try {
      // Save directly to Firestore under support_tickets & create initial message in messages subcollection
      await saveSupportTicketToFirestore(newTicket, ticketMessage.trim());

      setSupportTickets((prev) => [newTicket, ...prev]);
      setActiveChatTicket(newTicket);
      setTicketMessage('');
      setTicketSuccessMsg(`आपकी सहायता टिकट #${genTicketId} सफलतापूर्वक दर्ज हो गई है! रियल-टाइम चैट कनेक्ट हो गया है।`);
      setTimeout(() => setTicketSuccessMsg(''), 6000);
    } catch (err) {
      console.error('Error submitting support ticket:', err);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Find product from catalogue for reordering
  const handleReorderClick = (orderItemName: string) => {
    const matched =
      products.find((w) => w.name.toLowerCase() === orderItemName.toLowerCase());
    if (matched && onReorderProduct) {
      onClose();
      onReorderProduct(matched);
    }
  };

  const getStatusBadge = (status: StoreOrder['orderStatus']) => {
    switch (status) {
      case 'Order Received':
        return {
          label: 'Order Placed (नया ऑर्डर)',
          bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          step: 1,
        };
      case 'Confirmed':
        return {
          label: 'Confirmed (कन्फ़र्म)',
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          step: 2,
        };
      case 'Packed':
        return {
          label: 'Packed (पैक हो गया)',
          bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
          step: 3,
        };
      case 'Shipped':
        return {
          label: 'Dispatched (डिस्पैच / रवाना)',
          bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          step: 4,
        };
      case 'Out for Delivery':
        return {
          label: 'Out for Delivery (डिलीवरी के लिए तैयार)',
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          step: 5,
        };
      case 'Delivered':
        return {
          label: 'Delivered (सफलतापूर्वक डिलीवर)',
          bg: 'bg-green-600/15 text-green-700 dark:text-green-300 border-green-600/20',
          step: 6,
        };
      case 'Cancelled':
        return {
          label: 'Cancelled (रद्द)',
          bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
          step: 0,
        };
      case 'Returned':
        return {
          label: 'Returned (वापस प्राप्त)',
          bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
          step: -1,
        };
      default:
        return {
          label: 'Processing',
          bg: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
          step: 1,
        };
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
        <div className="relative w-full max-w-4xl bg-white dark:bg-[#141414] text-zinc-900 dark:text-white rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
          {/* Top Brand Header */}
          <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 p-4 sm:p-6 text-white flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              {/* Customer Avatar & Bio */}
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-zinc-950 font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg border-2 border-white/40 flex-shrink-0">
                  {customer.fullName ? customer.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-brand font-bold text-lg sm:text-xl text-white">
                      {customer.fullName || 'Timevera Customer'}
                    </h3>
                    <span className="px-2 py-0.5 bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-[10px] font-black uppercase rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-300" />
                      <span>Verified Account</span>
                    </span>
                  </div>
                  <p className="text-xs text-red-100 font-mono flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3 text-amber-300" />
                    <span>+91 {customer.phone}</span>
                  </p>
                  <p className="text-[11px] text-red-200 flex items-center gap-1 mt-0.5 truncate max-w-xs sm:max-w-md">
                    <MapPin className="w-3 h-3 text-amber-300 flex-shrink-0" />
                    <span className="truncate">
                      {customer.address || 'Address pending'}, {customer.city || ''} ({customer.pincode || ''})
                    </span>
                  </p>
                </div>
              </div>

              {/* Close & Logout Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={logout}
                  className="px-3 py-2 bg-red-800/80 hover:bg-red-900 border border-red-500/30 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-md"
                  title="Logout from account"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-1.5 sm:gap-2 mt-4 pt-3 border-t border-red-500/40 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setAccountActiveTab('addresses')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  accountActiveTab === 'addresses'
                    ? 'bg-white text-red-700 shadow-md font-extrabold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Addresses</span>
              </button>
              <button
                onClick={() => setAccountActiveTab('orders')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  accountActiveTab === 'orders'
                    ? 'bg-white text-red-700 shadow-md font-extrabold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Orders & Bills ({orders.length})</span>
              </button>

              <button
                onClick={() => setAccountActiveTab('wishlist')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  accountActiveTab === 'wishlist'
                    ? 'bg-white text-red-700 shadow-md font-extrabold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Heart className="w-4 h-4 text-rose-300 fill-rose-300" />
                <span>Wishlist ({wishlist.length})</span>
              </button>

              <button
                onClick={() => setAccountActiveTab('profile')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  accountActiveTab === 'profile'
                    ? 'bg-white text-red-700 shadow-md font-extrabold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile & Address</span>
              </button>

              <button
                onClick={() => setAccountActiveTab('feedback')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  accountActiveTab === 'feedback'
                    ? 'bg-white text-red-700 shadow-md font-extrabold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Star className="w-4 h-4 text-amber-300" />
                <span>Reviews ({reviews.length})</span>
              </button>

              <button
                onClick={() => setAccountActiveTab('support')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  accountActiveTab === 'support'
                    ? 'bg-white text-red-700 shadow-md font-extrabold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-amber-300" />
                <span>Support {supportTickets.length > 0 && `(${supportTickets.length})`}</span>
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {profileSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: MY ORDERS & LIVE TRACKING                                         */}
            {/* ========================================================================= */}
            {accountActiveTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <Package className="w-4 h-4 text-red-600" />
                      <span>My Order History & Live Tracking (ऑर्डर विवरण)</span>
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Aapke mobile number se place kiye gaye sabhi orders yahan permanently saved hain.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (customer) {
                        setIsLoadingOrders(true);
                        const searchKey = customer.phone || customer.email || customer.username || '';
                        fetchOrdersForCustomer(searchKey, customer.uid)
                          .then((ords) => setOrders(ords))
                          .finally(() => setIsLoadingOrders(false));
                      }
                    }}
                    className="p-2 text-zinc-500 hover:text-red-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Refresh orders"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {isLoadingOrders ? (
                  <div className="py-12 text-center text-zinc-500 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-red-600" />
                    <p className="text-xs font-semibold">Loading your order history from cloud...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-12 px-4 text-center bg-zinc-50 dark:bg-[#181818] border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl space-y-3">
                    <div className="w-14 h-14 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-400">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <h4 className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">
                      No Orders Placed Yet
                    </h4>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      Aapne abhi tak koi ghadi order nahi ki hai. Hamara premium collection dekhein aur apna pehla order place karein!
                    </p>
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow cursor-pointer transition-all inline-flex items-center gap-1.5"
                    >
                      <span>Explore Products (उत्पाद देखें)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const badge = getStatusBadge(order.orderStatus);
                      const orderDateFormatted = order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recent Order';

                      return (
                        <div
                          key={order.id}
                          className="bg-zinc-50 dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                        >
                          {/* Order Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-sm text-red-600 dark:text-red-400">
                                  #{order.id}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 text-[11px] font-black rounded-full border uppercase tracking-wider ${badge.bg}`}
                                >
                                  {badge.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Ordered on: {orderDateFormatted}</span>
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="text-xs text-zinc-500 uppercase font-semibold">Total Amount:</span>
                              <p className="text-base font-black text-red-600 dark:text-red-400 font-mono">
                                ₹{(Number(order.totalAmount) || 0).toLocaleString('en-IN')}
                              </p>
                              <span className="text-[10px] font-bold text-zinc-500 uppercase">
                                {order.paymentMethod === 'upi_qr' ? '★ PREPAID ONLINE ★' : '★ CASH ON DELIVERY ★'}
                              </span>
                            </div>
                          </div>

                          {/* Live Progress Stage Tracker */}
                          <div className="py-2 px-3 bg-white dark:bg-[#101010] rounded-2xl border border-zinc-200 dark:border-zinc-800">
                            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-amber-500" />
                                <span>Live Delivery Timeline (लाइव ट्रैकिंग):</span>
                              </span>
                              {order.courierPartner && (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  Courier: <strong>{order.courierPartner}</strong> ({order.courierTrackingNumber || 'In-transit'})
                                </span>
                              )}
                            </div>

                            {badge.step > 0 ? (
                              <div className="grid grid-cols-6 gap-1 text-center text-[9px] sm:text-[10px] font-bold">
                                {/* 1. Placed */}
                                <div
                                  className={`p-1.5 rounded-lg flex flex-col items-center gap-0.5 ${
                                    badge.step >= 1
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                      : 'text-zinc-400 bg-zinc-100 dark:bg-zinc-900'
                                  }`}
                                >
                                  <span>1. Placed</span>
                                </div>

                                {/* 2. Confirmed */}
                                <div
                                  className={`p-1.5 rounded-lg flex flex-col items-center gap-0.5 ${
                                    badge.step >= 2
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                      : 'text-zinc-400 bg-zinc-100 dark:bg-zinc-900'
                                  }`}
                                >
                                  <span>2. Confirmed</span>
                                </div>

                                {/* 3. Packed */}
                                <div
                                  className={`p-1.5 rounded-lg flex flex-col items-center gap-0.5 ${
                                    badge.step >= 3
                                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                                      : 'text-zinc-400 bg-zinc-100 dark:bg-zinc-900'
                                  }`}
                                >
                                  <span>3. Packed</span>
                                </div>

                                {/* 4. Dispatched */}
                                <div
                                  className={`p-1.5 rounded-lg flex flex-col items-center gap-0.5 ${
                                    badge.step >= 4
                                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-extrabold'
                                      : 'text-zinc-400 bg-zinc-100 dark:bg-zinc-900'
                                  }`}
                                >
                                  <span>4. Dispatched</span>
                                </div>

                                {/* 5. Out for Delivery */}
                                <div
                                  className={`p-1.5 rounded-lg flex flex-col items-center gap-0.5 ${
                                    badge.step >= 5
                                      ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 font-extrabold'
                                      : 'text-zinc-400 bg-zinc-100 dark:bg-zinc-900'
                                  }`}
                                >
                                  <span>5. Out for Delivery</span>
                                </div>

                                {/* 6. Delivered */}
                                <div
                                  className={`p-1.5 rounded-lg flex flex-col items-center gap-0.5 ${
                                    badge.step >= 6
                                      ? 'bg-emerald-500 text-white font-extrabold shadow-sm'
                                      : 'text-zinc-400 bg-zinc-100 dark:bg-zinc-900'
                                  }`}
                                >
                                  <span>6. Delivered</span>
                                </div>
                              </div>
                            ) : badge.step === -1 ? (
                              <div className="p-2 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 rounded-xl">
                                Yeh order wapas prapt (Returned) ho chuka hai.
                              </div>
                            ) : (
                              <div className="p-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
                                Yeh order cancel ho chuka hai.
                              </div>
                            )}
                          </div>

                          {/* Items List in this order */}
                          {(() => {
                            const itemsList = order.items && order.items.length > 0
                              ? order.items
                              : [
                                  {
                                    name: order.productName || 'Timevera Watch',
                                    price: Number(order.productPrice) || Number(order.price) || Number(order.totalAmount) || 0,
                                    quantity: Number(order.quantity) || 1,
                                    image: order.productImage || '',
                                  },
                                ];

                            return (
                              <div className="space-y-2">
                                {itemsList.map((item, itIdx) => (
                                  <div
                                    key={itIdx}
                                    className="flex items-center justify-between p-2.5 bg-white dark:bg-[#121212] rounded-2xl border border-zinc-200 dark:border-zinc-800/80 gap-3"
                                  >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      {item.image && (
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="w-12 h-14 object-cover rounded-xl border border-zinc-300 dark:border-zinc-700 bg-black flex-shrink-0"
                                          referrerPolicy="no-referrer"
                                        />
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                          {item.name}
                                        </p>
                                        <p className="text-[11px] text-zinc-500">
                                          ₹{(Number(item.price) || 0).toLocaleString('en-IN')} × {item.quantity} {item.quantity === 1 ? 'piece' : 'pieces'}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Item 1-Click Reorder Action */}
                                    <button
                                      type="button"
                                      onClick={() => handleReorderClick(item.name)}
                                      className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-600 hover:text-white border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-[11px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer flex-shrink-0"
                                      title="Reorder this product again"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Reorder (पुनः मंगाएं)</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}

                          {/* Order Action Buttons Footer */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                              {/* Rate & Review Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setFeedbackOrder(order);
                                  setIsFeedbackModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span>Rate / Feedback (रिव्यू दें)</span>
                              </button>

                              {/* Print Receipt / Slip */}
                              <button
                                type="button"
                                onClick={() => printInvoice(order, 'thermal_slip')}
                                className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Print 80mm Thermal Receipt Slip"
                              >
                                <Printer className="w-3.5 h-3.5 text-zinc-500" />
                                <span>Thermal Slip</span>
                              </button>

                              {/* Print Full Tax Invoice Bill */}
                              <button
                                type="button"
                                onClick={() => printInvoice(order, 'tax_invoice')}
                                className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Print Official GST Tax Invoice Bill"
                              >
                                <FileText className="w-3.5 h-3.5 text-red-600" />
                                <span>Tax Invoice Bill</span>
                              </button>
                            </div>

                            {/* Help & Support Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setTicketOrderId(order.id);
                                setAccountActiveTab('support');
                              }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Help & Support</span>
                            </button>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB: WISHLIST (SAVED PRODUCTS)                                            */}
            {/* ========================================================================= */}
            {accountActiveTab === 'wishlist' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                      <span>My Wishlist (पसंदीदा घड़ियां) ({wishlist.length})</span>
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Aapki pasandeeda ghadiyan yahan save hain. Aap 1-click me unhe order ya bag me add kar sakte hain.
                    </p>
                  </div>
                </div>

                {wishlist.length === 0 ? (
                  <div className="py-12 text-center bg-zinc-50 dark:bg-[#181818] rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-500">
                      <Heart className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      Aapki Wishlist Khali Hai (Your wishlist is empty)
                    </h4>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      Explore our collections and click the heart icon on any product to save it for later.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {wishlist.map((productId) => {
                      const product = products.find((p) => p.id === productId);
                      if (!product) return null;
                      return (
                        <div
                          key={productId}
                          className="p-3 bg-zinc-50 dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-2xl flex gap-3 items-center justify-between"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-20 object-cover bg-white rounded-xl border border-zinc-300 dark:border-zinc-700 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-brand text-xs font-bold text-zinc-900 dark:text-white truncate">
                              {product.name}
                            </h5>
                            <p className="text-[10px] text-red-500 font-semibold mb-1">
                              {product.categoryLabel}
                            </p>
                            <div className="flex items-baseline gap-2 mb-2">
                              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                                ₹{(Number(product.price) || 0).toLocaleString('en-IN')}
                              </span>
                              {Number(product.originalPrice) > Number(product.price) && (
                                <span className="text-[10px] text-zinc-500 line-through">
                                  ₹{(Number(product.originalPrice) || 0).toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5">
                              {onBuyNow && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onBuyNow(product, 1);
                                  }}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg uppercase flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                >
                                  <Zap className="w-3 h-3 text-amber-300" />
                                  <span>Order</span>
                                </button>
                              )}
                              {onAddToCart && (
                                <button
                                  type="button"
                                  onClick={() => onAddToCart(product, 1)}
                                  className="px-2.5 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <ShoppingBag className="w-3 h-3" />
                                  <span>Add</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeFromWishlist(productId)}
                                className="p-1 text-zinc-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                title="Remove from wishlist"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
                        {/* ========================================================================= */}
            {/* TAB: ADDRESSES                                                          */}
            {/* ========================================================================= */}
            {accountActiveTab === 'addresses' && (
              <AddressBook />
            )}

            {/* TAB 2: MY PROFILE & DELIVERY ADDRESS                                     */}
            {/* ========================================================================= */}
            {accountActiveTab === 'profile' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <User className="w-4 h-4 text-red-600" />
                      <span>Customer Profile (प्रोफ़ाइल और पता)</span>
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Update your personal details here.
                    </p>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Full Name (आपका नाम) *
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Registered Mobile Number (ओटीपी सत्यापित मोबाइल)
                      </label>
                      <div className="px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                        <span>+91 {customer.phone}</span>
                        <span className="text-[10px] text-emerald-500 font-bold uppercase">✓ Verified Phone</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Email Address (जीमेल / ईमेल आईडी)
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="e.g. rahul@gmail.com"
                        className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Account Password (लॉगिन पासवर्ड बदलें / सेट करें)
                      </label>
                      <input
                        type="text"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Set or change your login password"
                        className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none font-mono"
                      />
                      <p className="text-[10px] text-zinc-400 mt-1">
                        इस पासवर्ड से आप भविष्य में सीधे बिना OTP के लॉगिन कर सकते हैं।
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Complete Delivery Address (घर / दूकान का पता) *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          City / District (शहर) *
                        </label>
                        <input
                          type="text"
                          required
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          Pincode (पिन कोड) *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={editPincode}
                          onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-red-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        {isSavingProfile ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Profile (सुरक्षित करें)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary Address Card */}
                    <div className="p-5 bg-zinc-50 dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>Primary Details</span>
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase">
                          Default
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                        <p className="font-bold text-sm text-zinc-900 dark:text-white">
                          {customer.fullName}
                        </p>
                        <p className="leading-relaxed">
                          {customer.address}
                        </p>
                        <p className="font-semibold">
                          {customer.city} - <strong className="font-mono text-red-600 dark:text-red-400">{customer.pincode}</strong>
                        </p>
                        <p className="text-zinc-500 font-mono pt-1">
                          Phone: +91 {customer.phone}
                        </p>
                        {customer.email && (
                          <p className="text-zinc-500">
                            Email: {customer.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Account Security & Info */}
                    <div className="p-5 bg-zinc-50 dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span>Security & Cloud Sync</span>
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase">
                          Active
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                        <p className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>Mobile & Gmail / Username Authentication: <strong>Active</strong></span>
                        </p>
                        <p className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>
                            Password Login: {customer.password ? (
                              <strong className="text-emerald-500">Configured (सक्रिय)</strong>
                            ) : (
                              <strong className="text-amber-500">Not Set (OTP only)</strong>
                            )}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>All past purchases synced to cloud</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>1-Tap auto-fill enabled for new orders</span>
                        </p>
                        <div className="pt-2 text-[11px] text-zinc-400 font-mono">
                          Last active: {new Date(customer.lastLoginAt || Date.now()).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: REVIEWS & FEEDBACK                                                */}
            {/* ========================================================================= */}
            {accountActiveTab === 'feedback' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>My Ratings & Feedback (मेरी रेटिंग व रिव्यू)</span>
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Aapke dwara diye gaye sabhi reviews aur ratings yahan dikhte hain.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFeedbackOrder(null);
                      setIsFeedbackModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow cursor-pointer transition-all"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>Write Review (नया रिव्यू दें)</span>
                  </button>
                </div>

                {reviews.length === 0 ? (
                  <div className="py-10 text-center bg-zinc-50 dark:bg-[#181818] border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl space-y-2.5">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 rounded-full flex items-center justify-center mx-auto text-amber-500">
                      <Star className="w-6 h-6 fill-amber-500" />
                    </div>
                    <h4 className="font-bold text-xs text-zinc-700 dark:text-zinc-300">
                      No Reviews Submitted Yet
                    </h4>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      Apni kharidi hui Timevera ghadi ke baare me review aur star rating dein!
                    </p>
                    <button
                      onClick={() => {
                        setFeedbackOrder(null);
                        setIsFeedbackModalOpen(true);
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Give Feedback Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 bg-zinc-50 dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-zinc-900 dark:text-white">
                              {rev.productName}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                              ✓ Verified Buyer
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>

                        {rev.title && (
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            "{rev.title}"
                          </p>
                        )}
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {rev.comment}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          Submitted on: {new Date(rev.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: 24x7 CUSTOMER HELP & SUPPORT (सहायता एवं शिकायत निवारण)            */}
            {/* ========================================================================= */}
            {accountActiveTab === 'support' && (
              <div className="space-y-6">
                {/* Support Banner & Top Contact Bar */}
                <div className="p-5 bg-gradient-to-br from-red-600 via-rose-600 to-red-700 rounded-3xl text-white shadow-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                        <Headphones className="w-6 h-6 text-amber-300" />
                      </div>
                      <div>
                        <h4 className="font-brand text-lg font-bold">
                          Timevera Customer Care & Support
                        </h4>
                        <p className="text-xs text-red-100">
                          24x7 Direct Helpdesk for Verified Account Holders
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                      </span>
                      <span className="text-[11px] font-bold text-amber-200">
                        Helpdesk Live: 9:00 AM – 9:00 PM
                      </span>
                    </div>
                  </div>

                  {/* Support Channels */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    <div className="p-3 bg-white/10 border border-white/20 rounded-2xl flex items-center gap-2.5 text-white">
                      <ShieldCheck className="w-4 h-4 text-amber-300 flex-shrink-0" />
                      <div className="text-left">
                        <div className="text-[10px] uppercase font-bold text-red-200">Online Helpdesk</div>
                        <div className="text-xs font-bold">Raise Support Ticket Below</div>
                      </div>
                    </div>

                    <a
                      href={`mailto:${BUSINESS_INFO.email}?subject=${encodeURIComponent(
                        `Timevera Customer Inquiry - ${customer.fullName || customer.phone}`
                      )}`}
                      className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl flex items-center gap-2.5 transition-all text-white hover:text-amber-200 group"
                    >
                      <Mail className="w-4 h-4 text-amber-300 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="text-[10px] uppercase font-bold text-red-200">Official Email</div>
                        <div className="text-xs font-mono font-bold truncate max-w-[180px]">{BUSINESS_INFO.email}</div>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Ticket Success Alert */}
                {ticketSuccessMsg && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-start gap-3 shadow-md animate-fadeIn">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm text-emerald-900 dark:text-white">
                        Complaint Registered Successfully!
                      </p>
                      <p className="mt-0.5 leading-relaxed">{ticketSuccessMsg}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left Column: Raise New Ticket Form (lg:col-span-7) */}
                  <div className="lg:col-span-7 p-5 bg-zinc-50 dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-sm">
                    <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-600" />
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-white">
                          Raise a Support Ticket (नई शिकायत / सहायता दर्ज करें)
                        </h4>
                      </div>
                      <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300 px-2 py-0.5 rounded font-bold">
                        Live Shop Sync
                      </span>
                    </div>

                    <form onSubmit={handleSubmitTicket} className="space-y-3.5">
                      {/* Customer Info (Auto-filled & Locked) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                            Customer Name (ग्राहक का नाम)
                          </label>
                          <input
                            type="text"
                            value={customer.fullName || 'Registered Customer'}
                            readOnly
                            className="w-full px-3 py-2 text-xs bg-zinc-200/70 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 cursor-not-allowed font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                            Registered Contact (फ़ोन / ईमेल)
                          </label>
                          <input
                            type="text"
                            value={`+91 ${customer.phone}${customer.email ? ` • ${customer.email}` : ''}`}
                            readOnly
                            className="w-full px-3 py-2 text-xs bg-zinc-200/70 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 cursor-not-allowed font-mono font-semibold"
                          />
                        </div>
                      </div>

                      {/* Issue Category */}
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                          Issue Category (समस्या का प्रकार) *
                        </label>
                        <select
                          value={ticketCategory}
                          onChange={(e) => setTicketCategory(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs bg-white dark:bg-[#121212] border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none cursor-pointer"
                        >
                          <option value="Order Tracking / Delivery Delay (डिलीवरी में देरी)">
                            🚚 Order Tracking & Delivery Delay (डिलीवरी में देरी या स्टेटस)
                          </option>
                          <option value="Damaged / Defective Product Received (टूटा या खराब उत्पाद)">
                            ⚠️ Damaged / Defective Product Received (टूटा या खराब उत्पाद मिला)
                          </option>
                          <option value="Wrong Item Delivered (गलत मॉडल आ गया)">
                            📦 Wrong Item Delivered (गलत मॉडल आ गया)
                          </option>
                          <option value="7-Day Free Replacement / Warranty Claim (7-दिन रिप्लेसमेंट)">
                            🔄 7-Day Free Replacement / 1-Year Warranty Claim (वारंटी दावा)
                          </option>
                          <option value="Billing / Invoice Query (बिलिंग या रसीद से जुड़ी जानकारी)">
                            🧾 Billing / Thermal Invoice Query (बिलिंग या रसीद सहायता)
                          </option>
                          <option value="Cash on Delivery & Payment Issue (सीओडी भुगतान)">
                            💰 Cash on Delivery (COD) Payment Query
                          </option>
                          <option value="General Inquiry / Other (अन्य सहायता)">
                            ❓ General Inquiry / Other (अन्य कोई प्रश्न)
                          </option>
                        </select>
                      </div>

                      {/* Select Related Order (if orders exist) */}
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>Related Order (संबंधित ऑर्डर चुनें)</span>
                          <span className="text-[10px] text-zinc-400 font-normal">Optional</span>
                        </label>
                        <select
                          value={ticketOrderId}
                          onChange={(e) => setTicketOrderId(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#121212] border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none cursor-pointer font-mono"
                        >
                          <option value="">-- No specific order / General Inquiry --</option>
                          {orders.map((ord) => (
                            <option key={ord.id} value={ord.id}>
                              {ord.id} — {ord.items?.[0]?.product?.name || 'Store Order'} (₹{ord.totalAmount})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Message / Description */}
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                          Describe Your Problem in Detail (अपनी समस्या का विवरण लिखें) *
                        </label>
                        <textarea
                          rows={3}
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          placeholder="Kripya apni samasya vistaar se likhein (e.g. delivery date, dial issue, replacement request etc.)..."
                          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#121212] border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-600 focus:outline-none resize-none"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingTicket}
                        className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isSubmittingTicket ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Transmitting Ticket to Shop...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 text-amber-300" />
                            <span>Submit Complaint Ticket (शिकायत दर्ज करें)</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Active & Past Support Tickets (lg:col-span-5) */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="p-5 bg-zinc-50 dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span>My Support Tickets ({supportTickets.length})</span>
                        </h4>
                        <button
                          onClick={() => {
                            const searchKey = customer.phone || customer.email || customer.username || '';
                            setIsLoadingTickets(true);
                            fetchCustomerSupportTickets(searchKey)
                              .then((tkts) => setSupportTickets(tkts))
                              .finally(() => setIsLoadingTickets(false));
                          }}
                          className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          title="Refresh ticket history"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTickets ? 'animate-spin' : ''}`} />
                        </button>
                      </div>

                      {isLoadingTickets ? (
                        <div className="py-8 text-center text-zinc-400 space-y-2">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-red-500" />
                          <p className="text-xs">Checking support ticket records...</p>
                        </div>
                      ) : supportTickets.length === 0 ? (
                        <div className="py-6 px-4 text-center bg-white dark:bg-[#121212] border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl space-y-2">
                          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                          <h5 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                            No Active Complaints
                          </h5>
                          <p className="text-[11px] text-zinc-500 leading-relaxed">
                            Aapki koi open shikayat nahi hai. Agar ghadi se judi koi sahayata chahiye ho, to form bhar kar ticket generate karein.
                          </p>
                        </div>
                      ) : activeChatTicket ? (
                        <div className="space-y-3">
                          <SupportTicketChat
                            ticket={activeChatTicket}
                            onClose={() => setActiveChatTicket(null)}
                          />
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                          {supportTickets.map((ticket) => (
                            <div
                              key={ticket.id}
                              className="p-3.5 bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 shadow-sm hover:border-red-500/40 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-extrabold text-xs text-red-600 dark:text-red-400">
                                  #{ticket.id}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                      ticket.status === 'resolved'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                        : ticket.status === 'in_progress'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                    }`}
                                  >
                                    {ticket.status === 'resolved'
                                      ? '✓ Resolved'
                                      : ticket.status === 'in_progress'
                                      ? '⚡ In Progress'
                                      : '● Open (दर्ज हुई)'}
                                  </span>
                                  <button
                                    onClick={() => setActiveChatTicket(ticket)}
                                    className="px-2 py-1 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Open Live Chat"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    <span>Live Chat</span>
                                  </button>
                                </div>
                              </div>

                              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                {ticket.subject || ticket.issueCategory || ticket.issueType}
                              </div>

                              {ticket.orderId && (
                                <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                                  <span>Order:</span>
                                  <strong className="text-zinc-700 dark:text-zinc-300">{ticket.orderId}</strong>
                                </div>
                              )}

                              {ticket.message && (
                                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-900/60 p-2 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
                                  "{ticket.message}"
                                </p>
                              )}

                              {ticket.replyNotes && (
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400/40 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300">
                                  <strong>Support Reply:</strong> {ticket.replyNotes}
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                                <span>{new Date(ticket.createdAt || ticket.timestamp || Date.now()).toLocaleString('en-IN')}</span>
                                <span className="text-emerald-600 font-semibold cursor-pointer hover:underline" onClick={() => setActiveChatTicket(ticket)}>
                                  Chat with Admin →
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Store Guarantees Notice */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-800/60 rounded-2xl space-y-2 text-xs text-amber-900 dark:text-amber-200">
                      <div className="font-bold flex items-center gap-1.5 text-amber-950 dark:text-amber-300">
                        <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Timevera 100% Customer Assurance</span>
                      </div>
                      <ul className="space-y-1 text-[11px] list-disc list-inside text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                        <li>1 Year Manufacturer / Replacement Warranty</li>
                        <li>7-Day Hassle-free Exchange for Damaged Deliveries</li>
                        <li>Direct store helpline with no automated robot delays</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Feedback Modal */}
      <CustomerFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        order={feedbackOrder}
        onSuccess={() => {
          if (customer?.phone) {
            fetchCustomerReviews(customer.phone).then((revs) => setReviews(revs));
          }
        }}
      />
    </>
  );
};
