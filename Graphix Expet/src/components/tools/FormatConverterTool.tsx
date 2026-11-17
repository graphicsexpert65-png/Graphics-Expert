import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FormatConverterTool: React.FC<{ initialMode?: 'jpg-to-png' | 'png-to-jpg' }> = ({ initialMode = 'jpg-to-png' }) => {
  const { addToast } = useApp();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState('graphic');
  const [targetFormat, setTargetFormat] = useState<'png' | 'jpeg' | 'webp'>(
    initialMode === 'jpg-to-png' ? 'png' : 'jpeg'
  );
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name.substring(0, file.name.lastIndexOf('.')) || 'converted-image');

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setImageSrc(src);
      performConversion(src, targetFormat);
    };
    reader.readAsDataURL(file);
  };

  const performConversion = (src: string, format: 'png' | 'jpeg' | 'webp') => {
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      if (format === 'jpeg') {
        // Fill white background for transparent images converted to JPG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);
      const mime = `image/${format}`;
      const url = canvas.toDataURL(mime, 0.95);
      setConvertedUrl(url);
      setIsProcessing(false);
      addToast('Converted', `Ready to download as ${format.toUpperCase()}`, 'success');
    };
    img.src = src;
  };

  const handleFormatChange = (fmt: 'png' | 'jpeg' | 'webp') => {
    setTargetFormat(fmt);
    if (imageSrc) {
      performConversion(imageSrc, fmt);
    }
  };

  const handleDownload = () => {
    if (!convertedUrl) return;
    const link = document.createElement('a');
    link.href = convertedUrl;
    link.download = `${fileName}-converted.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Client-Side Format Converter</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Convert JPG, PNG, and WEBP formats instantaneously with local hardware acceleration.
          </p>
        </div>
        <div className="text-xs text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200 self-start md:self-auto font-medium">
          Supports Transparent Alpha Channels
        </div>
      </div>

      {!imageSrc ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="my-8 border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-12 text-center cursor-pointer transition-colors"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 mx-auto flex items-center justify-center text-slate-600 mb-3">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Upload graphic to convert</h3>
          <p className="text-xs text-slate-500">Select any image file from your device</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Convert to:</span>
              <div className="flex gap-2">
                {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleFormatChange(fmt)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      targetFormat === fmt
                        ? 'bg-[#0F172A] text-white border-[#0F172A]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {fmt === 'jpeg' ? 'JPG' : fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Upload Different File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="aspect-[16/9] max-h-80 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
            {convertedUrl && (
              <img
                src={convertedUrl}
                alt="Converted Preview"
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>

          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="w-full py-3 px-4 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download as {targetFormat === 'jpeg' ? 'JPG' : targetFormat.toUpperCase()}</span>
          </button>
        </div>
      )}
    </div>
  );
};
