import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Upload, MessageSquare, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export const CustomDesignView: React.FC = () => {
  const { addCustomRequest, setCurrentView } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designType, setDesignType] = useState('Logo');
  const [requiredSize, setRequiredSize] = useState('Standard Vector & Print Dimensions');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(new Date().toISOString().slice(0, 10));
  const [budget, setBudget] = useState('Rs. 5,000 (~$50)');
  const [referenceFile, setReferenceFile] = useState<string | null>(null);

  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = await addCustomRequest({
      name,
      email,
      phone,
      designType,
      requiredSize,
      description,
      deadline,
      budget,
      referenceFileName: referenceFile || undefined,
    });
    if (id) {
      setSubmissionError(false);
      setSubmittedRequestId(id);
    } else {
      setSubmissionError(true);
    }
  };

  const startingPrices = [
    { title: 'Social Media Post', pricePkr: 'Rs. 800', priceUsd: '~$8', time: '24-48 hrs' },
    { title: 'Business Card / Visiting Card', pricePkr: 'Rs. 1,000', priceUsd: '~$10', time: '1-2 days' },
    { title: 'CorelDraw Panaflex / Standee Banner', pricePkr: 'Rs. 1,800', priceUsd: '~$18', time: '24-48 hrs' },
    { title: 'Flyer / Leaflet', pricePkr: 'Rs. 1,500', priceUsd: '~$15', time: '2-3 days' },
    { title: 'Wedding / Nikkah Card (Corel CDR)', pricePkr: 'Rs. 2,500', priceUsd: '~$25', time: '2-3 days' },
    { title: 'Restaurant Food Menu', pricePkr: 'Rs. 2,000', priceUsd: '~$20', time: '2-4 days' },
    { title: 'Vector Logo Design', pricePkr: 'Rs. 3,000', priceUsd: '~$30', time: '3-5 days' },
    { title: 'Full Brand Identity', pricePkr: 'Rs. 10,000', priceUsd: '~$100', time: '5-7 days' },
  ];

  if (submittedRequestId) {
    return (
      <div className="py-16 px-4 max-w-2xl mx-auto text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
          Request Received
        </span>
        <h1 className="text-3xl font-bold text-slate-900 font-display">
          Thank You, {name}!
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          Your custom graphic design brief has been assigned tracking ID{' '}
          <strong className="text-slate-900 font-mono">#{submittedRequestId}</strong>. A design specialist will review your specs and contact you via email & WhatsApp within 4 business hours.
        </p>

        <div className="pt-6 flex justify-center gap-3">
          <button
            onClick={() => setSubmittedRequestId(null)}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
          >
            Submit Another Request
          </button>
          <button
            onClick={() => setCurrentView('marketplace')}
            className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
          >
            Explore Pre-Made Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Header */}
      <div className="max-w-3xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Custom Design Service
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight mt-1">
          Tell Us What You Need. We'll Design It.
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Need a tailor-made restaurant menu, high-converting product packaging, or a complete corporate identity? Our senior designers build bespoke print and digital assets tailored to your market.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left: Request Brief Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 font-display mb-4">
            Project Information
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {submissionError && (
              <div role="alert" className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-800 space-y-2">
                <p className="font-semibold">Online submission is temporarily unavailable.</p>
                <p>The preview website is not connected to its request-saving service yet. Your details are still here; use the email option below so you can send this brief without retyping it.</p>
                <a
                  className="inline-flex items-center rounded-lg bg-[#0F172A] px-4 py-2 text-white font-semibold hover:bg-slate-800"
                  href={`mailto:graphicsexpert65@gmail.com?subject=${encodeURIComponent(`Graphics Expert design request: ${designType}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nDesign category: ${designType}\nRequired size: ${requiredSize}\nDescription: ${description}\nDeadline: ${deadline}\nBudget: ${budget}\nReference file: ${referenceFile || 'Not attached'}\n`)}`}
                >
                  Email this design brief
                </a>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asad Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">WhatsApp / Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+92 300 0000000 / +1..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Design Category *</label>
                <select
                  value={designType}
                  onChange={(e) => setDesignType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="Logo">Logo Design</option>
                  <option value="Panaflex / Flex Banner (CorelDraw CDR)">Panaflex / Flex Banner (CorelDraw CDR)</option>
                  <option value="Wedding / Nikkah Card (CorelDraw CDR)">Wedding / Nikkah Card (CorelDraw CDR)</option>
                  <option value="Visiting Card (CorelDraw CDR / AI)">Visiting Card (CorelDraw CDR / AI)</option>
                  <option value="Flyer">Marketing Flyer / Leaflet</option>
                  <option value="Poster">Promotional Poster</option>
                  <option value="Menu">Restaurant / Cafe Menu</option>
                  <option value="Business Card">Business Card</option>
                  <option value="Social Media Post">Social Media Graphics</option>
                  <option value="Banner">Standee / Outdoor Banner</option>
                  <option value="Brand Identity">Full Brand Identity Kit</option>
                  <option value="Other">Other Custom Format</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Required Dimensions / Size</label>
              <input
                type="text"
                placeholder="e.g. A4 Bi-Fold, 8.5x11 inches, 1080x1080 Instagram, or Custom"
                value={requiredSize}
                onChange={(e) => setRequiredSize(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project Description & Requirements *</label>
              <textarea
                required
                rows={4}
                placeholder="Explain what your brand does, target audience, preferred color scheme, required text copy, and any inspirational references..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Desired Delivery Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Budget</label>
                <input
                  type="text"
                  placeholder="e.g. Rs. 4,000 or $40"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            {/* Reference File Mock Upload */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reference / Inspiration File</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  onChange={(e) => setReferenceFile(e.target.files?.[0]?.name || null)}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 hover:file:bg-slate-200"
                />
                {referenceFile && (
                  <span className="text-[11px] text-emerald-600 font-medium">
                    Attached: {referenceFile}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>Submit Design Request</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                No credit card required. You'll receive a detailed proposal & timeline before any commitment.
              </p>
            </div>
          </form>
        </div>

        {/* Right: Indicative Starting Pricing */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Indicative Starting Rates
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard guidelines. Final price depends on project requirements and revision depth.
              </p>
            </div>

            <div className="space-y-2.5">
              {startingPrices.map((item) => (
                <div
                  key={item.title}
                  className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Est. {item.time}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 font-mono">{item.pricePkr}</span>
                    <span className="text-[11px] text-slate-400 block font-mono">({item.priceUsd})</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-[11px] text-slate-700 space-y-1">
              <p><strong>Note on Custom Pricing:</strong> Prices listed above represent starting tier estimates. Complex multi-page menus or custom hand-drawn calligraphy will receive a bespoke quotation.</p>
              <p className="pt-1 border-t border-slate-200/60 text-slate-900 font-medium">✓ <strong>CorelDraw Press Files:</strong> All flex banners, wedding cards, and stationery are delivered with native editable .CDR files + converted curves (Ctrl+Q) ready for local offset & solvent printing.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
