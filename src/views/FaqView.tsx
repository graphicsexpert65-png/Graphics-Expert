import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const FaqView: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I get a design?',
      a: 'Free designs can be downloaded straight from the design page. Paid designs are listed with their price, but online payment is not available yet: send us an email with the design name and we will reply with payment details and deliver the files. Original files are kept in private storage and are never linked publicly.',
    },
    {
      q: 'What file formats do you provide?',
      a: 'It depends on the design. Files can include CorelDRAW (.CDR), Adobe Illustrator (.AI), EPS, Photoshop (.PSD/.PSB), PDF, PNG, JPG, SVG, TIFF or ZIP packages. Each design page lists exactly which files are included and which software versions they are made for.',
    },
    {
      q: 'Why do some designs only show a preview image?',
      a: 'Browsers cannot display native formats such as CDR, AI or PSD, so those designs are shown with a separate preview image. The preview is not the editable file: you receive the original files when you download or purchase the design.',
    },
    {
      q: 'Can I edit the designs without Adobe or CorelDRAW?',
      a: 'The design page shows the software each file is made for. Some formats can be opened in free tools such as Inkscape (vector files), GIMP or Photopea (PSD), although layers, effects and fonts may not be preserved exactly. For print work, we recommend the software listed on the design page.',
    },
    {
      q: 'Can I use designs commercially?',
      a: 'Each design shows its licence type (Personal, Commercial or Extended Commercial). Please read the License Information page for what each licence allows before using a design for a business or client project.',
    },
    {
      q: 'Do you offer custom design services?',
      a: 'Yes. Send a design brief from the Services page with your requirements and an optional reference image. We reply by email with questions and a quote before any work starts.',
    },
    {
      q: 'Can other designers sell their designs here?',
      a: 'Not at the moment. Graphics Expert is run by its owner, and all designs on the marketplace are uploaded by the owner. There is no public designer registration.',
    },
    {
      q: 'Are the free design tools really free?',
      a: 'Yes. The image resizer, compressor, format converter, image-to-PDF maker, print size calculator and social media size guide are free and need no account. They run inside your browser, so your images are not uploaded to our server.',
    },
    {
      q: 'What if a file does not work or is not as described?',
      a: 'Email us with the design name and what went wrong and we will look into it and help you get a working file.',
    },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#17365D]">
          Frequently Asked Questions
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight mt-1">
          Everything You Need to Know
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Clear answers about downloads, file formats, licences, custom work and the free tools.
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
