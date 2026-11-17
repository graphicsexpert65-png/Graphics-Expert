import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const FaqView: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do digital downloads work?',
      a: 'Immediately after purchase confirmation, your account is provisioned with a secure digital download token. You can click "Download Files" on the confirmation screen or access them at any time from your Customer Dashboard. Direct file storage URLs are never exposed publicly.',
    },
    {
      q: 'What file formats do you provide?',
      a: 'Templates include native CorelDraw vector (.CDR), layered Adobe Photoshop (.PSD), vector Adobe Illustrator (.AI), vector Encapsulated PostScript (.EPS), press-ready PDF (.PDF), transparent PNGs, high-resolution JPGs, and Canva one-click editable links where indicated on the product page.',
    },
    {
      q: 'Do you support CorelDraw (.CDR) format templates?',
      a: 'Yes! We offer a dedicated collection of native CorelDraw (.CDR) templates compatible with CorelDraw X7 through 2024. These include commercial panaflex roll-up standees, outdoor shop boards, Pakistani & South Asian wedding invitation cards (Shadi & Nikkah cards), offset visiting cards, and Islamic event flex banners. All CDR files feature clean vector layers, color-separated spot UV / gold foil plates, and text that can easily be converted to curves (Ctrl+Q) for printing presses.',
    },
    {
      q: 'Can I edit the templates without Adobe software?',
      a: 'Yes. Many templates include direct Canva template access. For PSD and AI files, you can also use free browser-based editors such as Photopea or open-source software like Inkscape and GIMP.',
    },
    {
      q: 'Can I use designs commercially for my business or clients?',
      a: 'Yes. Products purchased under the Standard Commercial License permit you to use the design for your own commercial business promotion or for a single client project. For resale merchandise or physical products sold to end users in volume, an Extended Commercial License is required.',
    },
    {
      q: 'Do you offer custom design services?',
      a: 'Yes. You can submit a brief via our "Custom Design" page. We specialize in restaurant menus, flyers, brand identity, and corporate stationery with quick turnaround times starting from Rs. 1,500.',
    },
    {
      q: 'How do independent designers sell templates on Graphics Expert?',
      a: 'Designers can register for a contributor account, upload their original 300 DPI templates with preview mockups, and submit them for review. Once verified for technical compliance, templates go live on the marketplace.',
    },
    {
      q: 'Are the free online design tools really free?',
      a: 'Yes. All 8 core creative tools (Image Resizer, Compressor, Format Converters, Image to PDF Maker, Print Size Calculator, and Social Media Resizer) are 100% free with no account or credit card required. All processing runs locally inside your browser.',
    },
    {
      q: 'Can I get a refund if a template does not work?',
      a: 'Because digital goods are delivered immediately with source assets, refunds are granted if a file is technically corrupt or demonstrably different from the product description and our support team is unable to resolve the issue within 48 hours.',
    },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Frequently Asked Questions
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight mt-1">
          Everything You Need to Know
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Clear answers regarding file formats, commercial rights, refunds, and tools.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200/90 overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <span>{faq.q}</span>
              {openIndex === idx ? (
                <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
              )}
            </button>
            {openIndex === idx && (
              <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
