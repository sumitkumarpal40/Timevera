import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  CheckCircle,
  HelpCircle,
  Phone,
  Clock,
  ShieldCheck,
  Building,
  User,
  AlertTriangle,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { SupportTicket, TicketMessage } from '../types';
import {
  saveSupportTicketToFirestore,
  sendTicketMessage,
  subscribeToTicketMessages,
} from '../lib/orderService';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { BUSINESS_INFO } from '../data/watches';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { customer, user } = useCustomerAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [issueCategory, setIssueCategory] = useState('Order Tracking / Delivery Delay');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  // Live Chat state for active ticket
  const [chatMessages, setChatMessages] = useState<TicketMessage[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize customer fields
  useEffect(() => {
    if (customer) {
      if (customer.fullName && !name) setName(customer.fullName);
      if (customer.phone && !phone) setPhone(customer.phone);
      if (customer.email && !email) setEmail(customer.email);
    }
  }, [customer, isOpen]);

  // Real-time messages subcollection listener
  useEffect(() => {
    if (!ticketId || !isSubmitted) return;

    const unsubscribe = subscribeToTicketMessages(ticketId, (msgs) => {
      setChatMessages(msgs);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [ticketId, isSubmitted]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Kripya apna Full Name daalein.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      alert('Kripya valid 10-digit Mobile Number daalein.');
      return;
    }
    if (!message.trim()) {
      alert('Kripya apni Shikayat / Samasya vistaar se likhein.');
      return;
    }

    setIsSubmitting(true);
    const generatedTicketId = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
    setTicketId(generatedTicketId);

    const nowIso = new Date().toISOString();
    const ticket: SupportTicket = {
      id: generatedTicketId,
      customerId: user?.uid || customer?.uid || '',
      customerName: name.trim(),
      customerEmail: email.trim(),
      customerPhone: phone.trim(),
      subject: issueCategory,
      issueCategory: issueCategory,
      status: 'open',
      createdAt: nowIso,
      updatedAt: nowIso,
      ...(orderId.trim() ? { orderId: orderId.trim() } : {}),
      message: message.trim(),
      timestamp: Date.now(),
    };

    // Save directly to Firestore under support_tickets & create initial message in messages subcollection
    await saveSupportTicketToFirestore(ticket, message.trim());

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleSendChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || !ticketId || isSendingReply) return;

    const textToSend = newReply.trim();
    setNewReply('');
    setIsSendingReply(true);

    try {
      await sendTicketMessage(ticketId, textToSend, 'customer');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setName('');
    setEmail('');
    setPhone('');
    setOrderId('');
    setMessage('');
    setTicketId('');
    setChatMessages([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#141414] text-zinc-900 dark:text-white rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 backdrop-blur-md rounded-xl">
              <HelpCircle className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h3 className="font-brand text-lg font-bold">
                Customer Support & Helpdesk
              </h3>
              <p className="text-[11px] text-red-100">
                Direct Helpdesk Connected to Shop Owner App
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer"
            aria-label="Close support modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isSubmitted ? (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-emerald-900 dark:text-emerald-200">
                  Ticket #{ticketId} Active in Store
                </p>
                <p className="text-emerald-700 dark:text-emerald-300 text-[11px]">
                  Real-time live chat connected. Admin replies will appear here instantly.
                </p>
              </div>
            </div>

            {/* Live Chat Window */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-[#0f0f0f] flex flex-col h-[280px] overflow-hidden">
              <div className="px-3.5 py-2 bg-zinc-100 dark:bg-[#181818] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-red-500" /> Live Support Chat
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Realtime
                </span>
              </div>

              {/* Messages stream */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-400 text-xs">
                    Connecting to live support...
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.sender === 'customer';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-zinc-400 mb-0.5 px-1 font-semibold">
                          {isMe ? 'You (Customer)' : 'Timevera Store Support'}
                        </span>
                        <div
                          className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-red-600 text-white rounded-tr-none shadow-sm'
                              : 'bg-white dark:bg-[#1e1e1e] border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-tl-none shadow-sm'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Send message input */}
              <form onSubmit={handleSendChatReply} className="p-2 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 bg-white dark:bg-[#141414]">
                <input
                  type="text"
                  placeholder="Type a message to store support..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newReply.trim() || isSendingReply}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            <div className="pt-2">
              <button
                onClick={handleResetAndClose}
                className="w-full py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Close Support Window
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            {/* Helpdesk Notice */}
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-900 dark:text-red-200 flex items-start gap-2.5">
              <Building className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                Koi bhi samasya ho (Order Status, Delivery, Warranty, Replacement), yahan form bharein. Yeh shikayat seedha <strong>Shop Owner App</strong> me live receive hogi.
              </div>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-red-500" /> Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-red-500" /> Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Email & Order ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email ID (Optional)
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Order ID (Agar pehle se order kiya hai)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TV-829104"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-red-600 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Issue Category */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Kiski vajah se sampark kar rahe hain? *
              </label>
              <select
                value={issueCategory}
                onChange={(e) => setIssueCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-red-600 focus:outline-none cursor-pointer"
              >
                <option value="Order Tracking / Delivery Delay">📦 Order Tracking / Delivery Kab Hogi</option>
                <option value="Payment / UPI Confirmation Query">💳 Payment / UPI Confirmation</option>
                <option value="Damaged / Wrong Item Received">⚠️ Damaged / Wrong Item (Replacement)</option>
                <option value="6-Month Manufacturer Warranty Claim">🛡️ 6 Months Manufacturer Warranty Claim</option>
                <option value="Bulk / Wholesale Inquiry">💼 Bulk / Gift Order Inquiry</option>
                <option value="General Complaint / Feedback">✍️ Other Complaint / Feedback</option>
              </select>
            </div>

            {/* Message / Complaint Box */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Apni Shikayat ya Sawaal Vistaar Se Likhein *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Yahan apni samasya likhein (e.g. Mera order kab dispatch hoga ya product me koi issue hai...)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#1a0d0d] border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-red-600 focus:outline-none resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Sending to Shop Portal...' : 'Submit Complaint to Shop Support'}
                </span>
              </button>
            </div>

            {/* Direct Helpline Row */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Priority Concierge Helpdesk
              </span>
              <span className="text-zinc-400">Average response: 2–4 hrs</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

