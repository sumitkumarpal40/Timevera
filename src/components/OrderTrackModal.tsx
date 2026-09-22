import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Printer,
  MessageCircle,
  AlertCircle,
  ShieldCheck,
  Calendar,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  RotateCcw,
  Navigation,
} from 'lucide-react';
import { StoreOrder } from '../types';
import { searchCustomerOrders, getSavedCustomerOrders, subscribeToSingleOrder } from '../lib/orderService';
import { printInvoice } from '../lib/invoicePrinter';
import { BUSINESS_INFO } from '../data/watches';

interface OrderTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
}

export const OrderTrackModal: React.FC<OrderTrackModalProps> = ({
  isOpen,
  onClose,
  initialOrderId,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialOrderId || '');
  const [searchedOrders, setSearchedOrders] = useState<StoreOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [savedOrders, setSavedOrders] = useState<StoreOrder[]>([]);

  // Load saved orders from device when modal opens
  useEffect(() => {
    if (isOpen) {
      const saved = getSavedCustomerOrders();
      setSavedOrders(saved);
      if (initialOrderId) {
        setSearchQuery(initialOrderId);
        handleSearch(initialOrderId);
      } else if (saved.length > 0) {
        // Auto-select most recent order if available
        setSelectedOrder(saved[0]);
        setSearchedOrders(saved);
      }
    }
  }, [isOpen, initialOrderId]);

  // Real-time Firestore synchronization for the currently selected order
  useEffect(() => {
    if (!isOpen || !selectedOrder?.id) return;

    const unsubscribe = subscribeToSingleOrder(selectedOrder.id, (liveOrder) => {
      if (liveOrder) {
        setSelectedOrder(liveOrder);
        setSearchedOrders((prev) =>
          prev.map((o) => (o.id === liveOrder.id ? liveOrder : o))
        );
      }
    });

    return () => unsubscribe();
  }, [isOpen, selectedOrder?.id]);

  // Listen to local/storage order updates
  useEffect(() => {
    if (!isOpen) return;

    const handleSync = () => {
      const saved = getSavedCustomerOrders();
      setSavedOrders(saved);
      if (selectedOrder) {
        const found = saved.find((o) => o.id === selectedOrder.id);
        if (found) setSelectedOrder(found);
      }
    };

    window.addEventListener('timevera_order_saved', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('timevera_order_saved', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [isOpen, selectedOrder?.id]);

  if (!isOpen) return null;

  const handleSearch = async (queryToUse?: string) => {
    const q = (queryToUse !== undefined ? queryToUse : searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      const results = await searchCustomerOrders(q);
      setSearchedOrders(results);
      if (results.length > 0) {
        setSelectedOrder(results[0]);
      } else {
        setSelectedOrder(null);
      }
    } catch (e: any) {
      console.error(e);
      if (e?.code === 'permission-denied' || e?.message?.includes('permission')) {
        setSearchError('इस order को access करने की permission नहीं है। कृपया अपने account से login करें।');
      } else {
        setSearchError('Order नहीं मिला। कृपया Order ID या Phone number check करें।');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const getStepProgress = (status: StoreOrder['orderStatus'] | string) => {
    const s = (status || '').toLowerCase().trim();
    switch (s) {
      case 'pending':
      case 'order received':
        return 1;
      case 'confirmed':
      case 'processing':
        return 2;
      case 'packed':
        return 3;
      case 'shipped':
        return 4;
      case 'out for delivery':
      case 'out_for_delivery':
        return 5;
      case 'delivered':
        return 6;
      case 'cancelled':
        return -1;
      case 'returned':
      case 'refunded':
        return -2;
      default:
        return 1;
    }
  };

  const getStatusBadge = (status: StoreOrder['orderStatus'] | string) => {
    const s = (status || '').toLowerCase().trim();
    switch (s) {
      case 'pending':
      case 'order received':
        return {
          label: 'Order Placed (दर्ज हुआ)',
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          icon: Clock,
        };
      case 'confirmed':
      case 'processing':
        return {
          label: 'Confirmed (कन्फर्म हो गया)',
          bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
          icon: CheckCircle,
        };
      case 'packed':
        return {
          label: 'Packed & Invoiced (पैक हो गया)',
          bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
          icon: Package,
        };
      case 'shipped':
        return {
          label: 'Dispatched / In Transit (रवाना हुआ)',
          bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
          icon: Truck,
        };
      case 'out for delivery':
      case 'out_for_delivery':
        return {
          label: 'Out for Delivery (डिलीवरी के लिए निकल चुका)',
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          icon: Navigation,
        };
      case 'delivered':
        return {
          label: 'Delivered (सफलतापूर्वक डिलीवर)',
          bg: 'bg-green-600/15 text-green-700 dark:text-green-300 border-green-600/30',
          icon: CheckCircle,
        };
      case 'cancelled':
        return {
          label: 'Cancelled (रद्द किया गया)',
          bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
          icon: AlertCircle,
        };
      case 'returned':
      case 'refunded':
        return {
          label: 'Returned (वापस प्राप्त हुआ)',
          bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
          icon: RotateCcw,
        };
      default:
        return {
          label: status || 'Processing',
          bg: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30',
          icon: Clock,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#141414] text-zinc-900 dark:text-white rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 backdrop-blur-md rounded-xl">
              <Truck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-brand text-lg font-bold">
                Track Your Timevera Order
              </h3>
              <p className="text-[11px] text-red-100">
                Live Status, Packaging, Bill & Courier Dispatch Details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-[#181818] border-b border-zinc-200 dark:border-zinc-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Enter Order ID (e.g. TV-123456) or 10-digit Mobile No."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#101010] border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Track</span>
            </button>
          </form>

          {/* Quick Click Saved Orders Chips */}
          {savedOrders.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                Your Recent Orders:
              </span>
              {savedOrders.slice(0, 4).map((so) => (
                <button
                  key={so.id}
                  type="button"
                  onClick={() => {
                    setSearchQuery(so.id);
                    setSelectedOrder(so);
                    setSearchedOrders([so]);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    selectedOrder?.id === so.id
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-white dark:bg-[#101010] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-red-500'
                  }`}
                >
                  {so.id} (₹{so.totalAmount})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 max-h-[65vh] overflow-y-auto space-y-5">
          {/* Multiple Orders Selector if Search Returned multiple items */}
          {searchedOrders.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                Found {searchedOrders.length} orders for this search. Select one to view:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchedOrders.map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedOrder?.id === ord.id
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-500 ring-1 ring-red-500'
                        : 'bg-zinc-50 dark:bg-[#181818] border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-xs text-red-600 dark:text-red-400">
                        {ord.id}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-zinc-500">
                        {ord.orderStatus}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate mt-1">
                      {ord.items?.map((i) => i.name).join(', ')}
                    </p>
                    <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
                      <span>₹{ord.totalAmount}</span>
                      <span>{new Date(ord.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Order Detail View */}
          {selectedOrder ? (
            <div className="space-y-5 animate-fadeIn">
              {/* Order Status Hero Card */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-[#181818] dark:to-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div>
                    <span className="text-[11px] text-zinc-500 uppercase font-bold tracking-wider">
                      Order ID
                    </span>
                    <h4 className="font-mono font-black text-xl text-red-600 dark:text-red-400">
                      {selectedOrder.id}
                    </h4>
                  </div>

                  <div className="text-right">
                    {(() => {
                      const badge = getStatusBadge(selectedOrder.orderStatus);
                      const BadgeIcon = badge.icon;
                      return (
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase border ${badge.bg}`}
                        >
                          <BadgeIcon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Progress Stepper Timeline */}
                {getStepProgress(selectedOrder.orderStatus) > 0 ? (
                  <div className="py-2">
                    <div className="relative">
                      {/* Line connecting steps */}
                      <div className="absolute top-4 left-4 right-4 h-1 bg-zinc-200 dark:bg-zinc-800 -z-0">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{
                            width: `${
                              ((Math.max(1, getStepProgress(selectedOrder.orderStatus)) - 1) / 5) * 100
                            }%`,
                          }}
                        ></div>
                      </div>

                      {/* 6 Step Icons */}
                      <div className="relative z-10 grid grid-cols-6 text-center">
                        {[
                          { step: 1, label: 'Placed', hindi: 'दर्ज' },
                          { step: 2, label: 'Confirmed', hindi: 'कन्फर्म' },
                          { step: 3, label: 'Packed', hindi: 'पैक' },
                          { step: 4, label: 'Dispatched', hindi: 'रवाना' },
                          { step: 5, label: 'Out for Delivery', hindi: 'डिलीवरी' },
                          { step: 6, label: 'Delivered', hindi: 'सफल' },
                        ].map((s) => {
                          const currentProg = getStepProgress(selectedOrder.orderStatus);
                          const isDone = currentProg >= s.step;
                          const isCurrent = currentProg === s.step;
                          return (
                            <div key={s.step} className="flex flex-col items-center">
                              <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs transition-all ${
                                  isDone
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                                } ${isCurrent ? 'ring-4 ring-emerald-500/30 scale-110' : ''}`}
                              >
                                {isDone ? '✓' : s.step}
                              </div>
                              <span
                                className={`text-[9px] sm:text-[10px] font-bold mt-1.5 leading-tight ${
                                  isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'
                                }`}
                              >
                                {s.label}
                              </span>
                              <span className="text-[8px] sm:text-[9px] text-zinc-400">({s.hindi})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (selectedOrder.orderStatus || '').toLowerCase().trim() === 'cancelled' ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>Yeh order cancel ho gaya hai. Yadi aapko sahayata chahiye to Support Ticket raise karein.</span>
                  </div>
                ) : (
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-900 rounded-xl text-orange-700 dark:text-orange-300 text-xs font-semibold flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span>Yeh order wapas prapt (Returned) ho gaya hai.</span>
                  </div>
                )}

                {/* Dispatch / Courier Details if Dispatched or Out for Delivery */}
                {(['shipped', 'out for delivery', 'out_for_delivery', 'delivered'].includes((selectedOrder.orderStatus || '').toLowerCase().trim()) || Boolean(selectedOrder.dispatchedAt)) && (
                  <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                      <Truck className="w-4 h-4" />
                      <span>Dispatch / Courier Tracking Information:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-700 dark:text-zinc-300 pt-1">
                      <div>
                        <span className="text-zinc-500">Courier Partner: </span>
                        <strong>{selectedOrder.courierPartner || 'Express Store Courier'}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500">Tracking / AWB No: </span>
                        <strong className="font-mono">{selectedOrder.courierTrackingNumber || 'In Transit'}</strong>
                      </div>
                      {selectedOrder.dispatchedAt && (
                        <div>
                          <span className="text-zinc-500">Dispatched Date: </span>
                          <span>{new Date(selectedOrder.dispatchedAt).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Items Ordered List */}
              {(() => {
                const orderItemsList = selectedOrder.items && selectedOrder.items.length > 0
                  ? selectedOrder.items
                  : [
                      {
                        name: selectedOrder.productName || 'Timevera Watch',
                        price: Number(selectedOrder.productPrice) || Number(selectedOrder.price) || Number(selectedOrder.totalAmount) || 0,
                        quantity: Number(selectedOrder.quantity) || 1,
                        image: selectedOrder.productImage || '',
                      },
                    ];

                return (
                  <div className="p-4 bg-white dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-red-500" />
                      <span>Items in this Order ({orderItemsList.length})</span>
                    </h5>

                    <div className="space-y-2">
                      {orderItemsList.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-14 object-cover rounded-lg border border-zinc-300 dark:border-zinc-700 bg-black flex-shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                ₹{(Number(item.price) || 0).toLocaleString('en-IN')} × {item.quantity} {item.quantity === 1 ? 'piece' : 'pieces'}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-black font-mono text-red-600 dark:text-red-400">
                            ₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                      <span className="font-bold text-zinc-600 dark:text-zinc-400">
                        Total Amount:
                      </span>
                      <span className="font-black text-base font-mono text-red-600 dark:text-red-400">
                        ₹{(Number(selectedOrder.totalAmount) || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Delivery Address & Details */}
              <div className="p-4 bg-white dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 text-xs">
                <h5 className="font-extrabold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>Delivery Address & Customer Info</span>
                </h5>
                <div className="space-y-1 text-zinc-700 dark:text-zinc-300 pt-1">
                  <p>
                    <strong className="text-zinc-900 dark:text-white">{selectedOrder.customerName}</strong> ({selectedOrder.customerPhone})
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {selectedOrder.customerAddress}, {selectedOrder.customerCity} - <strong>{selectedOrder.customerPincode}</strong>
                  </p>
                  <p className="text-zinc-500 text-[11px] pt-1">
                    Payment Mode:{' '}
                    <strong className="uppercase">
                      {(() => {
                        const isPrepaid = selectedOrder.paymentMethod === 'Prepaid'
                          || selectedOrder.paymentMethod === 'Online'
                          || selectedOrder.paymentMethod === 'Online Payment'
                          || selectedOrder.paymentMethod === 'upi_qr';
                        return isPrepaid ? 'Prepaid' : 'Cash on Delivery (COD)';
                      })()}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Status Audit History Timeline */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="p-4 bg-white dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2.5">
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span>Order Progress History (समय सारणी)</span>
                  </h5>
                  <div className="space-y-2 pt-1">
                    {selectedOrder.statusHistory.map((hist, hidx) => (
                      <div
                        key={hidx}
                        className="flex items-start gap-2.5 text-xs pb-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-900 dark:text-white capitalize">
                              {hist.status.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {new Date(hist.timestamp).toLocaleString('en-IN')}
                            </span>
                          </div>
                          {hist.note && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {hist.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons: Print Bill / Help & Support */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => printInvoice(selectedOrder, 'tax_invoice')}
                  className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow transition-all border border-zinc-700"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Download / Print Bill (रसीद)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    const contactEl = document.getElementById('contact');
                    if (contactEl) contactEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Help & Support / Raise Ticket</span>
                </button>
              </div>
            </div>
          ) : hasSearched && !isSearching ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-brand font-bold text-base text-zinc-900 dark:text-white">
                {searchError || `No Order Found for "${searchQuery}"`}
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {searchError
                  ? 'Yadi aapne phone ya account se order kiya tha, to Account section me login karke sabhi orders dekhein.'
                  : 'Kripya sahi Order ID (e.g. TV-849201) ya 10-digit Mobile Number daalein jo order karte waqt diya tha.'}
              </p>
            </div>
          ) : (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-brand font-bold text-base text-zinc-900 dark:text-white">
                Track Any Timevera Order
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Apna Order ID ya Mobile Number upar enter karke Live Status (Confirmed, Packed, Dispatched) dekhein.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
