import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, Smartphone, Instagram, Youtube, Facebook, Linkedin } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Preset {
  id: string;
  name: string;
  platform: string;
  width: number;
  height: number;
  aspect: string;
}

const PRESETS: Preset[] = [
  { id: 'ig-post', name: 'Instagram Square Post', platform: 'Instagram', width: 1080, height: 1080, aspect: '1:1' },
  { id: 'ig-story', name: 'Instagram Story / Reel', platform: 'Instagram', width: 1080, height: 1920, aspect: '9:16' },
  { id: 'fb-post', name: 'Facebook Feed Post', platform: 'Facebook', width: 1200, height: 630, aspect: '1.91:1' },
  { id: 'fb-story', name: 'Facebook Story', platform: 'Facebook', width: 1080, height: 1920, aspect: '9:16' },
  { id: 'yt-thumb', name: 'YouTube Video Thumbnail', platform: 'YouTube', width: 1280, height: 720, aspect: '16:9' },
  { id: 'yt-banner', name: 'YouTube Channel Header', platform: 'YouTube', width: 2560, height: 1440, aspect: '16:9' },
  { id: 'li-post', name: 'LinkedIn Feed Graphic', platform: 'LinkedIn', width: 1200, height: 627, aspect: '1.91:1' },
  { id: 'wa-status', name: 'WhatsApp Status', platform: 'WhatsApp', width: 1080, height: 1920, aspect: '9:16' },
];

export const SocialSizeTool: React.FC = () => {
  const { addToast } = useApp();
  const [selectedPreset, setSelectedPreset] = useState<Preset>(PRESETS[0]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState('social-graphic');
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name.substring(0, file.name.lastIndexOf('.')) || 'social-graphic');

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setImageSrc(src);
      renderSocialImage(src, selectedPreset, fitMode);
    };
    reader.readAsDataURL(file);
  };

  const renderSocialImage = (src: string, preset: Preset, mode: 'cover' | 'contain') => {
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = preset.width;
      canvas.height = preset.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Background fill for contain mode or transparent padding
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, preset.width, preset.height);

      const targetAspect = preset.width / preset.height;
      const imgAspect = img.width / img.height;

      let drawW = preset.width;
      let drawH = preset.height;
      let drawX = 0;
      let drawY = 0;

      if (mode === 'cover') {
        if (imgAspect > targetAspect) {
          drawW = preset.height * imgAspect;
          drawX = (preset.width - drawW) / 2;
        } else {
          drawH = preset.width / imgAspect;
          drawY = (preset.height - drawH) / 2;
        }
      } else {
        // Contain
        if (imgAspect > targetAspect) {
          drawH = preset.width / imgAspect;
          drawY = (preset.height - drawH) / 2;
        } else {
          drawW = preset.height * imgAspect;
          drawX = (preset.width - drawW) / 2;
        }
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      const outputData = canvas.toDataURL('image/png', 0.95);
      setPreviewUrl(outputData);
      setIsProcessing(false);
    };
    img.src = src;
  };

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset);
    if (imageSrc) {
      renderSocialImage(imageSrc, preset, fitMode);
    }
  };

  const handleFitModeChange = (mode: 'cover' | 'contain') => {
    setFitMode(mode);
    if (imageSrc) {
      renderSocialImage(imageSrc, selectedPreset, mode);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `${fileName}-${selectedPreset.id}-${selectedPreset.width}x${selectedPreset.height}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded', `Saved ${selectedPreset.name} (${selectedPreset.width} × ${selectedPreset.height} px)`, 'success');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Social Media Size Generator</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Resize and fit photos to verified dimension presets for Instagram, YouTube, Facebook, LinkedIn and WhatsApp.
          </p>
        </div>
        <div className="text-xs text-[#17365D] bg-[#EAF0F8] px-3 py-1 rounded-lg border border-[#C7D4E5] self-start md:self-auto font-medium">
          Instant Crop & Canvas Export
        </div>
      </div>

      {/* Preset Buttons Grid */}
      <div className="my-6">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Select Target Social Media Preset
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetSelect(p)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedPreset.id === p.id
                  ? 'border-[#17365D] bg-[#EAF0F8]/60 ring-1 ring-[#17365D] text-[#17365D]'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-xs font-semibold truncate">{p.name}</div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                {p.width} × {p.height} ({p.aspect})
              </div>
            </button>
          ))}
        </div>
      </div>

      {!imageSrc ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="my-6 border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-12 text-center cursor-pointer transition-colors"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 mx-auto flex items-center justify-center text-slate-600 mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Upload artwork to fit preset</h3>
          <p className="text-xs text-slate-500">Supports JPG, PNG, WEBP</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Fit Strategy:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFitModeChange('cover')}
                  className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                    fitMode === 'cover'
                      ? 'bg-slate-900 text-white border-slate-900 font-medium'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Fill Canvas (Crop overflow)
                </button>
                <button
                  onClick={() => handleFitModeChange('contain')}
                  className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                    fitMode === 'contain'
                      ? 'bg-slate-900 text-white border-slate-900 font-medium'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Fit Entire Image (Add matte)
                </button>
              </div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Swap Image
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Preview Frame */}
          <div className="aspect-video max-h-96 rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden p-4 border border-slate-800">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Social Preview"
                className="max-h-full max-w-full object-contain shadow-2xl rounded"
              />
            )}
          </div>

          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="w-full py-3 px-4 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download for {selectedPreset.platform} ({selectedPreset.width} × {selectedPreset.height} px)</span>
          </button>
        </div>
      )}
    </div>
  );
};
