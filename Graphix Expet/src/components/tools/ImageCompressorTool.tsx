import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, FileArchive, Check, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ImageCompressorTool: React.FC = () => {
  const { addToast } = useApp();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState('photo');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressedDataUrl, setCompressedDataUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(65);
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalSize(file.size);
    setFileName(file.name.substring(0, file.name.lastIndexOf('.')) || 'compressed-photo');

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setImageSrc(src);
      compressImage(src, quality, format);
      addToast('Image Loaded', 'Adjust compression slider to preview reduction.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (src: string, qualityValue: number, outputFormat: string) => {
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

      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL(outputFormat, qualityValue / 100);
      setCompressedDataUrl(dataUrl);

      // Estimate compressed size from Base64
      const stringLength = dataUrl.length - dataUrl.indexOf(',') - 1;
      const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383687; // Base64 byte estimate
      setCompressedSize(Math.round(sizeInBytes));
      setIsProcessing(false);
    };
    img.src = src;
  };

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality);
    if (imageSrc) {
      compressImage(imageSrc, newQuality, format);
    }
  };

  const handleFormatChange = (newFormat: 'image/jpeg' | 'image/webp') => {
    setFormat(newFormat);
    if (imageSrc) {
      compressImage(imageSrc, quality, newFormat);
    }
  };

  const handleDownload = () => {
    if (!compressedDataUrl) return;
    const link = document.createElement('a');
    link.href = compressedDataUrl;
    link.download = `${fileName}-compressed.${format === 'image/jpeg' ? 'jpg' : 'webp'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded', 'Compressed image saved to your device.', 'success');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const savedPercentage = originalSize > 0
    ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Client-Side Image Compressor</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Reduce image payload by up to 80% without losing visual clarity. Instant in-browser compression.
          </p>
        </div>
        <div className="text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 self-start md:self-auto font-medium">
          Zero Data Uploaded to Cloud
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
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Click to upload image for compression</h3>
          <p className="text-xs text-slate-500">Supports JPG, PNG, WEBP files up to 25MB</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Original Size</span>
              <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {formatBytes(originalSize)}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <span className="text-xs font-semibold text-emerald-700 block mb-1">Compressed Size</span>
              <p className="text-lg font-bold text-emerald-950 font-mono tabular-nums">
                {formatBytes(compressedSize)}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
              <span className="text-xs font-semibold text-blue-700 block mb-1">Total Savings</span>
              <p className="text-lg font-bold text-blue-950 font-mono tabular-nums">
                -{savedPercentage}% Reduction
              </p>
            </div>
          </div>

          {/* Compression Slider Controls */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-800">
                  Target Compression Quality
                </label>
                <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {quality}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                value={quality}
                onChange={(e) => handleQualityChange(parseInt(e.target.value))}
                className="w-full accent-slate-900 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Smallest File (10%)</span>
                <span>Balanced (65%)</span>
                <span>Maximum Quality (95%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">Output Format:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFormatChange('image/jpeg')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium border transition-colors ${
                      format === 'image/jpeg'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    JPG
                  </button>
                  <button
                    onClick={() => handleFormatChange('image/webp')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium border transition-colors ${
                      format === 'image/webp'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    WEBP (Modern)
                  </button>
                </div>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Upload New Image
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Side-by-side Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-600">Original View</span>
              <div className="aspect-[4/3] rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
                <img src={imageSrc} alt="Original" className="max-h-full max-w-full object-contain" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-600">Compressed Output Preview</span>
              <div className="aspect-[4/3] rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
                {compressedDataUrl && (
                  <img src={compressedDataUrl} alt="Compressed" className="max-h-full max-w-full object-contain" />
                )}
              </div>
            </div>
          </div>

          {/* Download Action */}
          <button
            onClick={handleDownload}
            disabled={isProcessing || !compressedDataUrl}
            className="w-full py-3 px-4 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Compressed Image ({formatBytes(compressedSize)})</span>
          </button>
        </div>
      )}
    </div>
  );
};
