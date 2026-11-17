import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Phone, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';

export const ContactView: React.FC = () => {
  const { addToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    addToast('Message Sent', 'Thank you for contacting Graphics Expert. We will respond shortly.', 'success');
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Get in Touch
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight mt-1">
          Contact & Customer Support
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Have questions regarding templates, licensing, or custom inquiries? Reach our operations team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {submitted ? (
            <div className="p-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Message Received</h3>
              <p className="text-xs text-slate-500">
                Our support team typically replies within 2–4 hours during normal business operating hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Template Inquiry, Payment Assistance, Custom Project..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                Send Message
              </button>
            </form>
          )}
        </div>

        {/* Contact Info Details */}
        <div className="lg:col-span-5 space-y-4 text-xs">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm font-display">Direct Channels</h3>
            
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 block">General & Licensing Support</span>
                <span className="text-slate-500">graphicsexpert65@gmail.com</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 block">WhatsApp & Urgent Client Inquiries</span>
                <span className="text-slate-500">+92 300 1234567 / +1 (800) 555-0199</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 block">Business Hours</span>
                <span className="text-slate-500">Monday – Saturday: 9:00 AM – 7:00 PM PKT / GMT+5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
