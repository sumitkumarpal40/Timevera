import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  RefreshCw,
  MessageCircle,
  Clock,
  ShieldCheck,
  User,
  AlertCircle,
} from 'lucide-react';
import { SupportTicket, TicketMessage } from '../types';
import { sendTicketMessage, subscribeToTicketMessages } from '../lib/orderService';

interface SupportTicketChatProps {
  ticket: SupportTicket;
  onClose?: () => void;
}

export const SupportTicketChat: React.FC<SupportTicketChatProps> = ({ ticket, onClose }) => {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe in real-time to subcollection: support_tickets/{ticketId}/messages
  useEffect(() => {
    if (!ticket?.id) return;

    const unsubscribe = subscribeToTicketMessages(ticket.id, (fetchedMsgs) => {
      setMessages(fetchedMsgs);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [ticket?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending || !ticket?.id) return;

    const messageText = text.trim();
    setText('');
    setIsSending(true);

    try {
      await sendTicketMessage(ticket.id, messageText, 'customer');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[380px] bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Chat Header */}
      <div className="px-4 py-2.5 bg-zinc-100 dark:bg-[#181818] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-red-600" />
          <span className="text-xs font-bold text-zinc-900 dark:text-white">
            Ticket #{ticket.id}
          </span>
          <span
            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
              ticket.status === 'resolved'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : ticket.status === 'in_progress'
                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
            }`}
          >
            {ticket.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Live Sync
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-zinc-50/50 dark:bg-[#0c0c0c]/50">
        {/* Ticket initial context message */}
        {(ticket.message || ticket.customerMessage) && messages.length === 0 && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-400 mb-0.5 px-1 font-semibold">
              You (Initial Message)
            </span>
            <div className="max-w-[85%] px-3.5 py-2 rounded-2xl rounded-tr-none bg-red-600 text-white text-xs leading-relaxed shadow-sm">
              {ticket.message || ticket.customerMessage || ''}
            </div>
            {ticket.createdAt && (
              <span className="text-[9px] text-zinc-400 mt-0.5 px-1">
                {new Date(ticket.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}

        {/* Store Admin Reply Notes if present and no separate admin message yet */}
        {ticket.replyNotes && messages.length === 0 && (
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-zinc-400 mb-0.5 px-1 font-semibold">
              Store Support
            </span>
            <div className="max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-sm bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-tl-none">
              {ticket.replyNotes}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isCustomer = msg.sender === 'customer';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[10px] text-zinc-400 mb-0.5 px-1 font-semibold">
                {isCustomer ? 'You' : 'Store Admin'}
              </span>
              <div
                className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  isCustomer
                    ? 'bg-red-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
              {msg.createdAt && (
                <span className="text-[9px] text-zinc-400 mt-0.5 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Send Message Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-2 bg-white dark:bg-[#141414] border-t border-zinc-200 dark:border-zinc-800 flex gap-2"
      >
        <input
          type="text"
          placeholder="Reply to store support in real-time..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-3 py-2 text-xs bg-zinc-100 dark:bg-[#1a1a1a] border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || isSending}
          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </button>
      </form>
    </div>
  );
};
