import React, { useEffect, useState } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  FileText,
  Truck,
  RotateCcw,
  Ban,
  Headphones,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { BUSINESS_INFO } from '../data/watches';

export type LegalPolicyTab =
  | 'privacy-policy'
  | 'terms-conditions'
  | 'shipping-policy'
  | 'refund-policy'
  | 'cancellation-policy'
  | 'contact-support';

interface LegalPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalPolicyTab;
}

export const LegalPagesModal: React.FC<LegalPagesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy-policy',
}) => {
  const [activeTab, setActiveTab] = useState<LegalPolicyTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const tabs: { id: LegalPolicyTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'privacy-policy', label: 'Privacy Policy', icon: Shield },
    { id: 'terms-conditions', label: 'Terms & Conditions', icon: FileText },
    { id: 'shipping-policy', label: 'Shipping Policy', icon: Truck },
    { id: 'refund-policy', label: 'Return & Refund', icon: RotateCcw },
    { id: 'cancellation-policy', label: 'Cancellation Policy', icon: Ban },
    { id: 'contact-support', label: 'Contact & Support', icon: Headphones },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl bg-white dark:bg-[#131313] text-zinc-900 dark:text-zinc-100 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-zinc-900 text-white p-3 sm:p-4 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-red-400 tracking-wider uppercase mb-0.5">
              TIMEVERA • Legal & Policies
            </div>
            <h2 className="font-brand text-base sm:text-lg md:text-xl font-bold">
              Customer Policies & Service Terms
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="bg-zinc-100 dark:bg-[#1a1a1a] border-b border-zinc-200 dark:border-zinc-800 px-2 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isCurrent = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'bg-white dark:bg-[#222] text-zinc-700 dark:text-zinc-300 hover:text-red-500 border border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Policy Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6 text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {/* ========================================================================= */}
          {/* 1. PRIVACY POLICY                                                         */}
          {/* ========================================================================= */}
          {activeTab === 'privacy-policy' && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 sm:pb-4">
                <h3 className="text-base sm:text-lg md:text-xl font-bold font-brand text-zinc-900 dark:text-white">
                  Privacy Policy
                </h3>
                <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Last updated: August 2026 • Effective for all customers of TIMEVERA
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                  <span>1. Information We Collect</span>
                </h4>
                <p className="text-xs sm:text-sm">
                  To provide seamless product ordering, express pan-India delivery, and dedicated customer support, we collect the following information when you place an order or create an account:
                </p>
                <ul className="list-disc pl-4 sm:pl-5 text-xs sm:text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                  <li><strong>Full Name:</strong> To address delivery packages and invoices accurately.</li>
                  <li><strong>Mobile Number:</strong> For OTP verification, order updates, courier coordination, and customer assistance.</li>
                  <li><strong>Email Address (Optional):</strong> For electronic receipts, invoices, and support tickets.</li>
                  <li><strong>Delivery Address & Pincode:</strong> Complete shipping destination, street details, landmark, and 6-digit postal code.</li>
                  <li><strong>Order Information:</strong> Products selected, order IDs, quantities, transaction records, and invoice histories.</li>
                  <li><strong>Authentication Data:</strong> Secure Firebase Auth identifiers (UID) generated during Phone OTP or Google sign-in.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">2. How Your Information Is Used</h4>
                <ul className="list-disc pl-4 sm:pl-5 text-xs sm:text-sm space-y-1">
                  <li>Processing and dispatching your product orders directly from our Greater Noida facility.</li>
                  <li>Generating GST-compliant digital tax invoices for your purchase records.</li>
                  <li>Providing real-time order tracking updates and delivery coordination.</li>
                  <li>Answering queries and resolving complaints through our 24x7 Helpdesk.</li>
                  <li>Preventing fraudulent orders and ensuring Cash on Delivery (COD) order authenticity.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">3. Data Security & Storage</h4>
                <p className="text-xs sm:text-sm">
                  We use secure Google Cloud Firestore architecture with strict Attribute-Based Access Control (ABAC). Your order histories, addresses, and wishlists are isolated so that each authenticated customer can only access their own data. We never sell or rent customer data to third-party marketing firms.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">4. Third-Party Service Providers</h4>
                <p className="text-xs sm:text-sm">
                  We share only essential shipping information (Customer Name, Phone, and Delivery Address) with our trusted logistics and courier partners solely to execute package delivery to your doorstep.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">5. Customer Rights & Account Access</h4>
                <p className="text-xs sm:text-sm">
                  You have the right to view, update, or edit your saved delivery addresses, profile details, and order history at any time directly through <strong>My Account</strong>. For account deletion inquiries, please contact our support team at <a href={`mailto:${BUSINESS_INFO.email}`} className="text-red-500 underline">{BUSINESS_INFO.email}</a>.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. TERMS & CONDITIONS                                                     */}
          {/* ========================================================================= */}
          {activeTab === 'terms-conditions' && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 sm:pb-4">
                <h3 className="text-base sm:text-lg md:text-xl font-bold font-brand text-zinc-900 dark:text-white">
                  Terms & Conditions
                </h3>
                <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  General operational terms governing the use of the TIMEVERA website and direct store purchases.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">1. Website Usage & Scope</h4>
                <p className="text-xs sm:text-sm">
                  By accessing and placing orders on the TIMEVERA platform, you agree to these operational terms. All products displayed are intended for end-user consumers across India.
                </p>

                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">2. Product Information & Pricing</h4>
                <p className="text-xs sm:text-sm">
                  We endeavor to present product images, colors, materials, and specifications as accurately as possible. Prices are displayed in Indian Rupees (₹ INR) and include applicable taxes. We reserve the right to correct typographical pricing errors before order fulfillment.
                </p>

                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">3. Orders, Order Acceptance & Availability</h4>
                <p className="text-xs sm:text-sm">
                  Receipt of an order confirmation ID does not constitute final binding acceptance. Orders are confirmed after stock verification at our store facility. In the rare event an item is out of stock, our team will promptly notify the customer to arrange a replacement or cancellation.
                </p>

                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">4. Payment Modes (COD & UPI)</h4>
                <p className="text-xs sm:text-sm">
                  We support Cash on Delivery (COD) and Instant UPI payments. For COD orders, customers agree to provide an authentic delivery address and pay the exact invoice amount upon physical parcel handover by the delivery courier.
                </p>

                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">5. Limitation of Liability & Intellectual Property</h4>
                <p className="text-xs sm:text-sm">
                  TIMEVERA, logos, taglines, and website materials are protected by proprietary branding. TIMEVERA shall not be liable for indirect or consequential damages beyond the value of the purchased product.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. SHIPPING & DELIVERY POLICY                                            */}
          {/* ========================================================================= */}
          {activeTab === 'shipping-policy' && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 sm:pb-4">
                <h3 className="text-base sm:text-lg md:text-xl font-bold font-brand text-zinc-900 dark:text-white">
                  Shipping & Delivery Policy
                </h3>
                <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Pan-India doorstep dispatch guidelines and estimated delivery timelines.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1.5">
                  <div className="text-[10px] sm:text-xs font-bold text-red-500 uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Order Processing Time</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    All product orders undergo a comprehensive quality inspection and are packed for dispatch within <strong>24–48 business hours</strong>.
                  </p>
                </div>

                <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1.5">
                  <div className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Delivery Coverage</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    We deliver across 19,000+ serviceable pincodes across India through standard express road and air courier networks.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">Estimated Delivery Timelines (By Region)</h4>
                <ul className="list-disc pl-4 sm:pl-5 text-xs sm:text-sm space-y-1.5">
                  <li><strong>Delhi-NCR & Western UP:</strong> 1 to 2 business days.</li>
                  <li><strong>North India & Metro Cities:</strong> 2 to 4 business days.</li>
                  <li><strong>Central, Western & Southern India:</strong> 3 to 5 business days.</li>
                  <li><strong>North-East & Remote Regions:</strong> 4 to 7 business days.</li>
                </ul>
                <div className="p-2.5 sm:p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Please note:</strong> Delivery timelines are realistic operational estimates calculated from our Greater Noida dispatch facility. Delivery dates may vary depending on local courier logistics, extreme weather, or regional holidays.
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">Incorrect Address & Failed Delivery Attempts</h4>
                <p className="text-xs sm:text-sm">
                  Couriers make up to 3 delivery attempts. Please ensure your contact phone number is reachable for courier verification. If an address is incomplete or incorrect, our customer support team will contact you to correct the details.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">Damaged Transit Package Reporting</h4>
                <p className="text-xs sm:text-sm">
                  If the outer shipping package appears visibly tampered or damaged upon arrival, please take a clear photo/video before unboxing and raise a ticket immediately on our <strong>Help & Support Desk</strong>.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. RETURN & REFUND POLICY                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'refund-policy' && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 sm:pb-4">
                <h3 className="text-base sm:text-lg md:text-xl font-bold font-brand text-zinc-900 dark:text-white">
                  Return & Refund Policy
                </h3>
                <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Fair and transparent return, replacement, and refund terms.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">1. Return Window & Eligibility</h4>
                <p className="text-xs sm:text-sm">
                  Customers may request a replacement or return within <strong>7 days</strong> of verified delivery for any product received in defective, non-working, or transit-damaged condition.
                </p>

                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">2. Product Condition & Unboxing Recommendation</h4>
                <p className="text-xs sm:text-sm">
                  Returned timepieces must be in original condition with brand packaging, warranty cards, protective plastic films, and accessories intact. We strongly recommend recording a continuous unboxing video when opening the parcel to expedite any damage claims.
                </p>

                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">3. Non-Returnable Conditions</h4>
                <ul className="list-disc pl-4 sm:pl-5 text-xs sm:text-sm space-y-1">
                  <li>Products showing physical damage from misuse, water ingress, or unauthorized tampering/repair.</li>
                  <li>Items requested after the 7-day post-delivery inspection window.</li>
                  <li>Missing original box, tags, or links.</li>
                </ul>

                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">4. Return Process & Inspection</h4>
                <p className="text-xs sm:text-sm">
                  To initiate a return or replacement, open a ticket under <strong>My Account → Help & Support</strong> or submit a ticket through our online Support Desk with your Order ID and photo/video evidence. Upon reverse pickup and technical inspection at our store, the replacement or refund will be processed.
                </p>

                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">5. Refund Processing (COD & Online)</h4>
                <ul className="list-disc pl-4 sm:pl-5 text-xs sm:text-sm space-y-1">
                  <li><strong>COD Orders:</strong> Refunds are transferred directly to your verified Bank Account or UPI ID within 2–4 business days following inspection.</li>
                  <li><strong>Online / UPI Payments:</strong> Refunds are credited back to the source payment account within 3–5 business days.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. CANCELLATION POLICY                                                    */}
          {/* ========================================================================= */}
          {activeTab === 'cancellation-policy' && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 sm:pb-4">
                <h3 className="text-base sm:text-lg md:text-xl font-bold font-brand text-zinc-900 dark:text-white">
                  Cancellation Policy
                </h3>
                <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Guidelines for canceling orders before and after dispatch.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">1. Cancellation Before Dispatch</h4>
                <p className="text-xs sm:text-sm">
                  You can cancel your order free of charge at any time before the package has been handed over to the courier for dispatch. Simply go to <strong>My Account → My Orders</strong> and click "Cancel Order" or contact our helpline immediately.
                </p>

                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">2. Cancellation After Shipment</h4>
                <p className="text-xs sm:text-sm">
                  Once an order is in transit with the courier, cancellation cannot be processed on-system. For Cash on Delivery (COD) shipments, you may refuse the package when the courier arrives for delivery.
                </p>

                <h4 className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-white">3. Refund for Pre-paid Cancellations</h4>
                <p className="text-xs sm:text-sm">
                  If a pre-paid or UPI order is canceled before dispatch, 100% of the paid amount is refunded to the original payment method within 2–4 working days.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. CONTACT & SUPPORT                                                      */}
          {/* ========================================================================= */}
          {activeTab === 'contact-support' && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 sm:pb-4">
                <h3 className="text-base sm:text-lg md:text-xl font-bold font-brand text-zinc-900 dark:text-white">
                  Contact & Direct Support
                </h3>
                <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Reach out to the TIMEVERA management and customer care team.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-2 sm:p-2.5 bg-red-600/10 text-red-600 rounded-xl">
                      <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] sm:text-xs text-zinc-500 font-semibold uppercase">Helpdesk & Support</div>
                      <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                        Online Support Ticket System
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-2 sm:p-2.5 bg-red-600/10 text-red-600 rounded-xl">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] sm:text-xs text-zinc-500 font-semibold uppercase">Official Email</div>
                      <a href={`mailto:${BUSINESS_INFO.email}`} className="text-xs sm:text-sm font-bold font-mono text-zinc-900 dark:text-white hover:text-red-600">
                        {BUSINESS_INFO.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="p-2 sm:p-2.5 bg-red-600/10 text-red-600 rounded-xl mt-0.5">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] sm:text-xs text-zinc-500 font-semibold uppercase">Store & Warehouse Address</div>
                      <p className="text-[11px] sm:text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {BUSINESS_INFO.address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-gradient-to-br from-red-950/30 to-zinc-900 border border-red-900/40 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] sm:text-xs font-bold text-red-400 uppercase tracking-wider">Help & Support Desk</span>
                    <h4 className="font-brand text-base sm:text-lg font-bold text-white mt-1">
                      Need assistance with your order?
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Submit a support ticket for live tracking updates, invoice copies, or replacement queries directly to our Store Desk.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      const contactEl = document.getElementById('contact');
                      if (contactEl) contactEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-2.5 sm:py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer"
                  >
                    <span>Raise Support Ticket</span>
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-zinc-100 dark:bg-[#1a1a1a] rounded-xl text-xs text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                <strong>Disclaimer:</strong> These customer policies reflect our standard operational guidelines for product sales, packaging, and pan-India dispatch. For any special enterprise or bulk corporate orders, custom terms may apply.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-50 dark:bg-[#161616] p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0 text-xs text-zinc-500">
          <span>© 2026 TIMEVERA • Greater Noida, Uttar Pradesh</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
