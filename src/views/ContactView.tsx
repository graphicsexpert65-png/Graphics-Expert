import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, MessageSquare, CheckCircle2, Briefcase } from 'lucide-react';

const OWNER_EMAIL = 'graphicsexpert65@gmail.com';

export const ContactView: React.FC = () => {
  const { addCustomRequest, setCurrentView } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    // The message is stored as a general enquiry so the owner sees it in the dashboard.
    const result = await addCustomRequest({
      name: name.trim(),
      email: email.trim(),
      phone: '',
      designType: 'General enquiry',
      requiredSize: '',
      description: `Subject: ${subject.trim()}\n\n${message.trim()}`,
      deadline: '',
      budget: '',
      referenceFile: null,
    });
    setBusy(false);
    if (result.id) {
      setReferenceId(result.id);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } else {
      setError(result.error || 'Your message could not be sent. Please email us directly instead.');
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#17365D]/30 focus:border-[#17365D]';

  return (
    <div className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#17365D]">Get in touch</span>
        <h1 className="text-3xl font-extrabold text-[#0B1F3A] font-display tracking-tight mt-1">
          Contact Graphics Expert
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          Questions about a design file, a licence, or a custom project? Send a message and the owner will reply by
          email.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm">
          {referenceId ? (
            <div className="p-6 text-center space-y-3" role="status">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h2 className="text-base font-bold text-[#0B1F3A]">Message received</h2>
              <p className="text-sm text-slate-600">
                Your message was saved (reference <span className="font-mono font-semibold">{referenceId}</span>). We
                will reply to the email address you provided.
              </p>
              <button
                onClick={() => setReferenceId(null)}
                className="mt-2 px-4 py-2 bg-[#17365D] hover:bg-[#0B1F3A] text-white rounded-lg text-sm font-semibold"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block font-semibold text-slate-700 mb-1">
                    Your name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    minLength={2}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block font-semibold text-slate-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="block font-semibold text-slate-700 mb-1">
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  maxLength={150}
                  placeholder="Design enquiry, licence question, custom project…"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block font-semibold text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  minLength={10}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={inputClass}
                />
              </div>

              {error && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700 space-y-1">
                  <p>{error}</p>
                  <p>
                    You can also write to{' '}
                    <a className="font-semibold underline" href={`mailto:${OWNER_EMAIL}`}>
                      {OWNER_EMAIL}
                    </a>
                    .
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 bg-[#17365D] hover:bg-[#0B1F3A] disabled:opacity-60 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                {busy ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4 text-sm">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4">
            <h2 className="font-bold text-[#0B1F3A] text-base font-display">Direct contact</h2>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#17365D] shrink-0 mt-1" />
              <div>
                <span className="font-semibold text-slate-800 block">Email</span>
                <a className="text-[#17365D] hover:underline break-all" href={`mailto:${OWNER_EMAIL}`}>
                  {OWNER_EMAIL}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Briefcase className="w-4 h-4 text-[#17365D] shrink-0 mt-1" />
              <div>
                <span className="font-semibold text-slate-800 block">Need custom design work?</span>
                <button
                  onClick={() => setCurrentView('custom-design')}
                  className="text-[#17365D] hover:underline font-medium text-left"
                >
                  Send a detailed design brief
                </button>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="w-4 h-4 text-[#17365D] shrink-0 mt-1" />
              <div>
                <span className="font-semibold text-slate-800 block">Buying a paid design?</span>
                <span className="text-slate-600">
                  Online payment is not available yet. Message us with the design name and we will reply with
                  payment details.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
