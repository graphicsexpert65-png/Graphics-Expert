import React from 'react';
import { useApp } from '../context/AppContext';
import { FileCode2, Wrench, Palette } from 'lucide-react';

export const AboutView: React.FC = () => {
  const { setCurrentView } = useApp();

  const cards = [
    {
      icon: <FileCode2 className="w-5 h-5" />,
      title: 'Editable design files',
      text: 'Original CorelDRAW (.CDR), Illustrator (.AI/.EPS) and Photoshop (.PSD) files for cards, banners, menus and flyers. Every design page lists its file formats, resolution, colour mode and compatible software.',
      action: { label: 'Browse designs', view: 'marketplace' as const },
    },
    {
      icon: <Wrench className="w-5 h-5" />,
      title: 'Free browser tools',
      text: 'Image resizer, compressor, format converter, image-to-PDF and print size tools. They run in your browser, so your images are not uploaded to a server.',
      action: { label: 'Open the tools', view: 'tools' as const },
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: 'Custom design services',
      text: 'Logos, business cards, panaflex banners, social media designs, print and packaging artwork for local businesses and international clients.',
      action: { label: 'Send a design brief', view: 'custom-design' as const },
    },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#17365D]">About Graphics Expert</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A] font-display tracking-tight">
          Design files, free tools and custom graphic design
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Graphics Expert is a graphic design resource and services website run by its owner. Every design in the
          marketplace is uploaded by Graphics Expert, and every custom project is handled directly, without a middleman.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        {cards.map((card) => (
          <div key={card.title} className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3 flex flex-col">
            <span className="w-10 h-10 rounded-xl bg-[#EAF0F8] text-[#17365D] flex items-center justify-center">
              {card.icon}
            </span>
            <h2 className="font-bold text-[#0B1F3A] font-display">{card.title}</h2>
            <p className="text-slate-600 leading-relaxed flex-1">{card.text}</p>
            <button
              onClick={() => setCurrentView(card.action.view)}
              className="text-[#17365D] font-semibold hover:underline text-left"
            >
              {card.action.label} →
            </button>
          </div>
        ))}
      </div>

      <div className="p-6 bg-[#EAF0F8] rounded-2xl border border-[#C7D4E5] text-sm space-y-2">
        <h2 className="font-bold text-[#0B1F3A] text-base font-display">How purchases work</h2>
        <p className="text-slate-700 leading-relaxed">
          Free designs can be downloaded straight away. Online payment is not available yet, so paid designs are
          purchased by contacting us: we reply with payment details and deliver the original files.
        </p>
        <button onClick={() => setCurrentView('contact')} className="text-[#17365D] font-semibold hover:underline">
          Contact us →
        </button>
      </div>
    </div>
  );
};
