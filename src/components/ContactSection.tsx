import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, CheckCircle, Clock, ShieldCheck, HelpCircle, Building } from 'lucide-react';
import { BUSINESS_INFO } from '../data/watches';
import { saveSupportTicketToFirestore } from '../lib/orderService';
import { SupportTicket } from '../types';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const targetEmail = BUSINESS_INFO.email; // timeverawatch@gmail.com

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !message.trim()) {
      alert('Kripya apna Naam, Phone aur Message bharein.');
      return;
    }

    setIsSubmitting(true);
    const genTicketId = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
    setTicketId(genTicketId);

    const newTicket: SupportTicket = {
      id: genTicketId,
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
      customerName: name.trim(),
      customerPhone: phone.trim(),
      ...(orderId.trim() ? { orderId: orderId.trim() } : {}),
      issueType: 'General Complaint / Contact Form',
      message: message.trim(),
      status: 'open',
    };

    // Save directly into Firestore database for Shop Portal
    await saveSupportTicketToFirestore(newTicket);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-8 sm:py-12 bg-[#0B0C10] border-t border-[#252A36]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="text-xs font-semibold tracking-widest text-[#D4AF37] uppercase">
            Customer Concierge & Inquiries
          </span>
          <h2 className="font-brand text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#F8FAFC] mt-2 mb-3">
            Direct Customer Support
          </h2>
          <p className="text-[#A7AFBF] text-xs sm:text-sm">
            For order inquiries, customizations, or assistance, submit your request below. Your request synchronizes directly with our <strong>Store Management Desk</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Contact Details Card (Left) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-4 sm:p-6 bg-[#131620] border border-[#252A36] rounded-2xl space-y-4 sm:space-y-6">
              <h3 className="font-brand text-lg sm:text-xl font-bold text-[#F8FAFC] border-b border-[#252A36] pb-3 flex items-center justify-between">
                <span>Official Concierge Desk</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">Live Sync</span>
              </h3>

              <div className="space-y-4 sm:space-y-5">
                {/* Official Email */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="p-2.5 sm:p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] rounded-xl flex-shrink-0">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-[#A7AFBF] uppercase tracking-wider font-semibold">Official Store Email</div>
                    <a
                      href={`mailto:${targetEmail}`}
                      className="text-[#F8FAFC] hover:text-[#E5C07B] font-mono text-xs sm:text-sm font-semibold transition-colors break-all"
                    >
                      {targetEmail}
                    </a>
                    <div className="text-[10px] sm:text-[11px] text-[#A7AFBF]/70 mt-0.5">24x7 Customer Support Desk</div>
                  </div>
                </div>

                {/* Priority Ticket Desk */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="p-2.5 sm:p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] rounded-xl flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-[#A7AFBF] uppercase tracking-wider font-semibold">Priority Helpdesk & Tickets</div>
                    <div className="text-[#F8FAFC] font-semibold text-xs sm:text-sm">
                      Help & Support
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-[#A7AFBF]/70 mt-0.5">Live Sync with Store Desk • Fast Resolution</div>
                  </div>
                </div>

                {/* Physical Location */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="p-2.5 sm:p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] rounded-xl flex-shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-[#A7AFBF] uppercase tracking-wider font-semibold">Store Location</div>
                    <p className="text-[#F8FAFC] text-xs sm:text-sm mt-0.5">
                      Village Mubarikpur, Post Surajpur, Greater Noida, Uttar Pradesh
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Complaint Form (Right) */}
          <div className="lg:col-span-7">
            <div className="p-4 sm:p-6 bg-[#131620] border border-[#252A36] rounded-2xl">
              <h3 className="font-brand text-lg sm:text-xl font-bold text-[#F8FAFC] mb-1 sm:mb-2">
                Send Direct Message to Support
              </h3>
              <p className="text-xs text-[#A7AFBF] mb-4 sm:mb-6">
                Fill the form below to transmit your message directly to our Concierge Team.
              </p>

              {submitted ? (
                <div className="p-4 sm:p-6 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-center space-y-3 animate-fadeIn">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <h4 className="font-brand font-bold text-base sm:text-lg text-[#F8FAFC]">
                    Thank you, {name}!
                  </h4>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    Your Ticket ID <strong className="font-mono text-white">{ticketId}</strong> has been transmitted directly to Timevera Support. Our team will contact you promptly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setPhone('');
                      setOrderId('');
                      setMessage('');
                    }}
                    className="px-4 py-2 bg-[#1A1E2B] text-xs font-semibold text-[#F8FAFC] rounded-lg hover:bg-[#252A36] border border-[#252A36] transition-colors cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-[#A7AFBF] uppercase tracking-wider mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full h-10 sm:h-11 px-3.5 py-2 bg-[#0B0C10] border border-[#252A36] focus:border-[#D4AF37] rounded-lg text-sm text-[#F8FAFC] placeholder-[#A7AFBF]/50 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-[#A7AFBF] uppercase tracking-wider mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full h-10 sm:h-11 px-3.5 py-2 bg-[#0B0C10] border border-[#252A36] focus:border-[#D4AF37] rounded-lg text-sm text-[#F8FAFC] placeholder-[#A7AFBF]/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#A7AFBF] uppercase tracking-wider mb-1">
                      Order ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="e.g. TV-829104"
                      className="w-full h-10 sm:h-11 px-3.5 py-2 bg-[#0B0C10] border border-[#252A36] focus:border-[#D4AF37] rounded-lg text-sm text-[#F8FAFC] placeholder-[#A7AFBF]/50 focus:outline-none transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#A7AFBF] uppercase tracking-wider mb-1">
                      Message / Inquiry *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your inquiry or assistance request here..."
                      className="w-full px-3.5 py-2.5 bg-[#0B0C10] border border-[#252A36] focus:border-[#D4AF37] rounded-lg text-sm text-[#F8FAFC] placeholder-[#A7AFBF]/50 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-[#D4AF37] to-[#C59B27] hover:from-[#E5C07B] hover:to-[#D4AF37] text-[#0B0C10] font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-[#D4AF37]/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Transmitting to Desk...' : 'Submit Inquiry to Desk'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
