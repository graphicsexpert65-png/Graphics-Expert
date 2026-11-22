import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  ArrowRight,
  PenTool,
  CreditCard,
  Flag,
  Share2,
  Printer,
  Package,
  Palette,
  Mail,
} from 'lucide-react';

const OWNER_EMAIL = 'graphicsexpert65@gmail.com';

const SERVICES: Array<{ title: string; description: string; icon: React.ReactNode }> = [
  {
    title: 'Logo design',
    description: 'Clean, scalable vector logos delivered as editable files for print and screen.',
    icon: <PenTool className="w-5 h-5" />,
  },
  {
    title: 'Business card design',
    description: 'Single or double-sided visiting cards set up with bleed for the press.',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    title: 'Banner & panaflex design',
    description: 'Shop boards, flex banners and roll-up standees at the exact size you print.',
    icon: <Flag className="w-5 h-5" />,
  },
  {
    title: 'Social media designs',
    description: 'Posts, covers, ads and thumbnails sized for each platform.',
    icon: <Share2 className="w-5 h-5" />,
  },
  {
    title: 'Printing designs',
    description: 'Flyers, brochures, menus, bill books and wedding cards prepared as print-ready artwork.',
    icon: <Printer className="w-5 h-5" />,
  },
  {
    title: 'Packaging design',
    description: 'Labels, boxes and product packaging layouts with die-cut guides.',
    icon: <Package className="w-5 h-5" />,
  },
  {
    title: 'General graphic design',
    description: 'Anything else you need designed. Describe it in your brief and we will tell you if we can help.',
    icon: <Palette className="w-5 h-5" />,
  },
];

const SERVICE_OPTIONS = [...SERVICES.map((s) => s.title), 'Other'];

const ALLOWED_REFERENCE = ['.png', '.jpg', '.jpeg', '.webp', '.pdf'];
const MAX_REFERENCE_MB = 10;

export const CustomDesignView: React.FC = () => {
  const { addCustomRequest, setCurrentView } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designType, setDesignType] = useState(SERVICE_OPTIONS[0]);
  const [requiredSize, setRequiredSize] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [budget, setBudget] = useState('');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ id: string; name: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileError(null);
    if (!file) {
      setReferenceFile(null);
      return;
    }
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_REFERENCE.includes(ext)) {
      setFileError('Reference file must be PNG, JPG, WEBP or PDF.');
      setReferenceFile(null);
      e.target.value = '';
      return;
    }
    if (file.size > MAX_REFERENCE_MB * 1024 * 1024) {
      setFileError(`Reference file must be ${MAX_REFERENCE_MB} MB or smaller.`);
      setReferenceFile(null);
      e.target.value = '';
      return;
    }
    setReferenceFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setSubmissionError(null);
    setBusy(true);
    const result = await addCustomRequest({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      designType,
      requiredSize: requiredSize.trim(),
      description: description.trim(),
      deadline,
      budget: budget.trim(),
      referenceFile,
    });
    setBusy(false);
    // Only show success when the server confirmed that the brief was saved.
    if (result.id) {
      setSubmitted({ id: result.id, name: name.trim() });
    } else {
      setSubmissionError(result.error || 'Your brief could not be submitted.');
    }
  };

  const mailtoHref = `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(
    `Graphics Expert design request: ${designType}`
  )}&body=${encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${designType}\nSize: ${requiredSize}\nDescription: ${description}\nDeadline: ${deadline}\nBudget: ${budget}\n`
  )}`;

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#17365D]/30 focus:border-[#17365D]';

  if (submitted) {
    return (
      <div className="py-14 px-4 max-w-2xl mx-auto text-center space-y-4" role="status">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Brief saved</span>
        <h1 className="text-3xl font-bold text-[#0B1F3A] font-display">Thank you, {submitted.name}</h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          Your design brief was saved with reference{' '}
          <strong className="text-slate-900 font-mono">{submitted.id}</strong>. We will review it and reply to the
          email address you provided with questions or a quote.
        </p>
        <div className="pt-4 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setSubmitted(null)}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-semibold"
          >
            Submit another brief
          </button>
          <button
            onClick={() => setCurrentView('marketplace')}
            className="px-5 py-2.5 bg-[#17365D] hover:bg-[#0B1F3A] text-white rounded-xl text-sm font-semibold"
          >
            Browse ready-made designs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="max-w-3xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#17365D]">Graphic design services</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A] font-display tracking-tight mt-1">
          Custom graphic design for print and digital
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
          Need a logo, a panaflex banner, business cards or social media artwork? Send a design brief and we will come
          back with questions or a quote before any work starts.
        </p>
      </div>

      {/* Services */}
      <section aria-labelledby="services-heading">
        <h2 id="services-heading" className="text-xl font-bold text-[#0B1F3A] font-display mb-4">
          What we design
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map((service) => (
            <button
              key={service.title}
              type="button"
              onClick={() => {
                setDesignType(service.title);
                document.getElementById('brief-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="text-left p-5 bg-white rounded-2xl border border-slate-200 hover:border-[#17365D] hover:shadow-md transition-all space-y-2"
            >
              <span className="w-10 h-10 rounded-xl bg-[#EAF0F8] text-[#17365D] flex items-center justify-center">
                {service.icon}
              </span>
              <h3 className="font-bold text-[#0B1F3A] text-sm font-display">{service.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{service.description}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Brief form */}
        <div
          id="brief-form"
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm scroll-mt-24"
        >
          <h2 className="text-lg font-bold text-[#0B1F3A] font-display mb-4">Send your design brief</h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {submissionError && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 space-y-2">
                <p className="font-semibold">Your brief was not sent.</p>
                <p>{submissionError}</p>
                <p>
                  Your details are still in the form. You can try again, or{' '}
                  <a className="font-semibold underline" href={mailtoHref}>
                    email this brief to us
                  </a>
                  .
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="brief-name" className="block font-semibold text-slate-700 mb-1">
                  Your name *
                </label>
                <input
                  id="brief-name"
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
                <label htmlFor="brief-email" className="block font-semibold text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  id="brief-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="brief-phone" className="block font-semibold text-slate-700 mb-1">
                  Phone / WhatsApp <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input
                  id="brief-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="brief-service" className="block font-semibold text-slate-700 mb-1">
                  Design service *
                </label>
                <select
                  id="brief-service"
                  value={designType}
                  onChange={(e) => setDesignType(e.target.value)}
                  className={`${inputClass} bg-white`}
                >
                  {SERVICE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="brief-description" className="block font-semibold text-slate-700 mb-1">
                Project description *
              </label>
              <textarea
                id="brief-description"
                required
                minLength={10}
                rows={5}
                placeholder="What do you need, who is it for, and any text, colours or style you want included?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="brief-size" className="block font-semibold text-slate-700 mb-1">
                  Size <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input
                  id="brief-size"
                  type="text"
                  placeholder="e.g. 8 × 4 ft"
                  value={requiredSize}
                  onChange={(e) => setRequiredSize(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="brief-deadline" className="block font-semibold text-slate-700 mb-1">
                  Deadline <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input
                  id="brief-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="brief-budget" className="block font-semibold text-slate-700 mb-1">
                  Budget <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input
                  id="brief-budget"
                  type="text"
                  placeholder="Your budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="brief-file" className="block font-semibold text-slate-700 mb-1">
                Reference image <span className="font-normal text-slate-500">(optional, PNG, JPG, WEBP or PDF, up to {MAX_REFERENCE_MB} MB)</span>
              </label>
              <input
                id="brief-file"
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.pdf"
                onChange={handleFileChange}
                className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#EAF0F8] file:text-[#17365D] hover:file:bg-[#DCE6F3]"
              />
              {referenceFile && (
                <p className="text-xs text-slate-600 mt-1">Attached: {referenceFile.name}</p>
              )}
              {fileError && (
                <p role="alert" className="text-xs text-red-700 mt-1">
                  {fileError}
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 px-4 bg-[#17365D] hover:bg-[#0B1F3A] disabled:opacity-60 text-white rounded-xl font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>{busy ? 'Sending…' : 'Submit design brief'}</span>
                {!busy && <ArrowRight className="w-4 h-4" />}
              </button>
              <p className="text-xs text-slate-500 text-center mt-2">
                Sending a brief is free and does not commit you to anything.
              </p>
            </div>
          </form>
        </div>

        {/* How it works */}
        <aside className="lg:col-span-5 space-y-6">
          <div className="bg-[#EAF0F8] rounded-2xl border border-[#C7D4E5] p-6 space-y-4">
            <h2 className="text-base font-bold text-[#0B1F3A] font-display">How it works</h2>
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex gap-3">
                <span className="w-6 h-6 shrink-0 rounded-full bg-[#17365D] text-white text-xs font-bold flex items-center justify-center">1</span>
                <span>Send your brief with the details and any reference image.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 shrink-0 rounded-full bg-[#17365D] text-white text-xs font-bold flex items-center justify-center">2</span>
                <span>We reply by email with questions and a quote for your project.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 shrink-0 rounded-full bg-[#17365D] text-white text-xs font-bold flex items-center justify-center">3</span>
                <span>Once you agree, the design is prepared and delivered as print-ready files.</span>
              </li>
            </ol>
            <p className="text-xs text-slate-600 border-t border-[#C7D4E5] pt-3">
              Prefer email? Write to{' '}
              <a className="font-semibold text-[#17365D] hover:underline" href={`mailto:${OWNER_EMAIL}`}>
                {OWNER_EMAIL}
              </a>
              .
            </p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200 text-sm text-slate-600 flex gap-3">
            <Mail className="w-5 h-5 text-[#17365D] shrink-0 mt-0.5" />
            <p>
              Looking for something ready-made instead? Browse editable CorelDRAW, Illustrator and Photoshop designs in
              the{' '}
              <button onClick={() => setCurrentView('marketplace')} className="font-semibold text-[#17365D] hover:underline">
                design marketplace
              </button>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
