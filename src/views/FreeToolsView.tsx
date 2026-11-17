import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Maximize2,
  FileArchive,
  ArrowRightLeft,
  FileText,
  Calculator,
  Share2,
  Sparkles,
  ArrowLeft,
  Wand2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ImageResizerTool } from '../components/tools/ImageResizerTool';
import { ImageCompressorTool } from '../components/tools/ImageCompressorTool';
import { FormatConverterTool } from '../components/tools/FormatConverterTool';
import { ImageToPdfTool } from '../components/tools/ImageToPdfTool';
import { PrintCalculatorTool } from '../components/tools/PrintCalculatorTool';
import { SocialSizeTool } from '../components/tools/SocialSizeTool';

export const FreeToolsView: React.FC = () => {
  const { activeToolId, setActiveToolId } = useApp();

  const tools = [
    {
      id: 'resizer',
      name: 'Image Resizer',
      description: 'Resize photos by pixels, inches, or centimeters with exact DPI math. 100% in-browser.',
      icon: Maximize2,
      badge: 'Client-Side',
      component: <ImageResizerTool />,
    },
    {
      id: 'compressor',
      name: 'Image Compressor',
      description: 'Reduce image file size by up to 80% with real-time preview and quality sliders.',
      icon: FileArchive,
      badge: 'Client-Side',
      component: <ImageCompressorTool />,
    },
    {
      id: 'jpg-to-png',
      name: 'JPG to PNG Converter',
      description: 'Convert standard JPG photos into transparent or high-fidelity PNG formats.',
      icon: ArrowRightLeft,
      badge: 'Client-Side',
      component: <FormatConverterTool initialMode="jpg-to-png" />,
    },
    {
      id: 'png-to-jpg',
      name: 'PNG to JPG Converter',
      description: 'Flatten PNG graphics and illustrations to lightweight JPG files with white matte.',
      icon: ArrowRightLeft,
      badge: 'Client-Side',
      component: <FormatConverterTool initialMode="png-to-jpg" />,
    },
    {
      id: 'image-to-pdf',
      name: 'Image to PDF Maker',
      description: 'Combine multiple image files into clean multi-page A4, A5, or US Letter PDFs.',
      icon: FileText,
      badge: 'Client-Side',
      component: <ImageToPdfTool />,
    },
    {
      id: 'print-calculator',
      name: 'Print Size Calculator',
      description: 'Calculate exact physical-to-pixel canvas requirements for 72 to 600 DPI print jobs.',
      icon: Calculator,
      badge: 'Utility',
      component: <PrintCalculatorTool />,
    },
    {
      id: 'social-generator',
      name: 'Social Media Size Generator',
      description: 'Preset cropper for Instagram, YouTube, Facebook, LinkedIn and WhatsApp graphics.',
      icon: Share2,
      badge: 'Client-Side',
      component: <SocialSizeTool />,
    },
  ];

  const futureAiTools = [
    { name: 'AI Poster Generator', description: 'Generate high-res layered marketing posters with prompt-guided typography.' },
    { name: 'AI Social Post Creator', description: 'Create multi-slide Instagram carousels and hooks tailored for your niche.' },
    { name: 'AI Background Generator', description: 'Studio product backdrops on travertine, wood, or luxury marble.' },
    { name: 'AI Ad Copy Assistant', description: 'High-conversion headline variations and discount promo hooks.' },
  ];

  const activeTool = tools.find((t) => t.id === activeToolId);

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[75vh]">
      {/* If a tool is active, show the runner with back button */}
      {activeTool ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveToolId(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to All Tools
            </button>
            <span className="text-xs text-slate-400">
              Tool: <strong className="text-slate-800">{activeTool.name}</strong>
            </span>
          </div>

          <div>{activeTool.component}</div>
        </div>
      ) : (
        /* Tools Listing Directory */
        <div className="space-y-12">
          {/* Header */}
          <div className="max-w-2xl">
            <h1 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">
              Free Design Tools
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Simple, powerful creative utilities for designers, businesses and creators. All processing executes securely inside your web browser. No registration required.
            </p>
          </div>

          {/* Core Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  className="bg-white rounded-xl border border-slate-200/90 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                        {tool.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100">
                    <button
                      onClick={() => setActiveToolId(tool.id)}
                      className="w-full py-2 px-3 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-[#0F172A] hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Use Tool</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Future AI Tools Section (Clearly labeled Coming Soon) */}
          <div className="pt-8 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-900 font-display">
                    Future AI Creative Tools
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Next-generation generative creative pipelines currently in active development.
                </p>
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg self-start">
                Roadmap Phase 4
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {futureAiTools.map((aiTool) => (
                <div
                  key={aiTool.name}
                  className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Coming Soon
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mb-1">{aiTool.name}</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">{aiTool.description}</p>
                  </div>
                  <button
                    disabled
                    className="mt-4 w-full py-1.5 text-[11px] font-medium text-slate-400 bg-slate-200/60 rounded cursor-not-allowed text-center"
                  >
                    In Engineering
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
