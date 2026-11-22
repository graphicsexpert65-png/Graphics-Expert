import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, RefreshCw, Lock, Unlock, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ImageResizerTool: React.FC = () => {
  const { addToast } = useApp();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState('image');
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [originalSize, setOriginalSize] = useState<number>(0);

  // Resize settings
  const [unit, setUnit] = useState<'pixels' | 'inches' | 'centimeters'>('pixels');
  const [dpi, setDpi] = useState<number>(300);
  const [lockAspect, setLockAspect] = useState(true);
  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [quality, setQuality] = useState<number>(90);

  // Unit dimensions state
  const [inputWidth, setInputWidth] = useState<number>(1200);
  const [inputHeight, setInputHeight] = useState<number>(800);

  // Calculated pixel output
  const [outputWidthPx, setOutputWidthPx] = useState<number>(1200);
  const [outputHeightPx, setOutputHeightPx] = useState<number>(800);
  const [estimatedSize, setEstimatedSize] = useState<string>('~');
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Convert unit input to pixels
  useEffect(() => {
    let pxW = inputWidth;
    let pxH = inputHeight;

    if (unit === 'inches') {
      pxW = Math.round(inputWidth * dpi);
      pxH = Math.round(inputHeight * dpi);
    } else if (unit === 'centimeters') {
      // 1 inch = 2.54 cm
      pxW = Math.round((inputWidth / 2.54) * dpi);
      pxH = Math.round((inputHeight / 2.54) * dpi);
    }

    setOutputWidthPx(Math.max(1, pxW));
    setOutputHeightPx(Math.max(1, pxH));
  }, [inputWidth, inputHeight, unit, dpi]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalSize(file.size);
    setFileName(file.name.substring(0, file.name.lastIndexOf('.')) || 'image');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setImageSrc(event.target?.result as string);

        // Initialize inputs based on unit
        if (unit === 'pixels') {
          setInputWidth(img.width);
          setInputHeight(img.height);
        } else if (unit === 'inches') {
          setInputWidth(Number((img.width / dpi).toFixed(2)));
          setInputHeight(Number((img.height / dpi).toFixed(2)));
        } else {
          setInputWidth(Number(((img.width / dpi) * 2.54).toFixed(2)));
          setInputHeight(Number(((img.height / dpi) * 2.54).toFixed(2)));
        }
        addToast('Image Loaded', `${img.width} × ${img.height} px ready for resize.`, 'success');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleWidthChange = (val: number) => {
    setInputWidth(val);
    if (lockAspect && originalWidth > 0 && originalHeight > 0) {
      const ratio = originalHeight / originalWidth;
      setInputHeight(Number((val * ratio).toFixed(2)));
    }
  };

  const handleHeightChange = (val: number) => {
    setInputHeight(val);
    if (lockAspect && originalWidth > 0 && originalHeight > 0) {
      const ratio = originalWidth / originalHeight;
      setInputWidth(Number((val * ratio).toFixed(2)));
    }
  };

  const handleUnitChange = (newUnit: 'pixels' | 'inches' | 'centimeters') => {
    if (newUnit === unit) return;
    setUnit(newUnit);

    if (newUnit === 'pixels') {
      setInputWidth(outputWidthPx);
      setInputHeight(outputHeightPx);
    } else if (newUnit === 'inches') {
      setInputWidth(Number((outputWidthPx / dpi).toFixed(2)));
      setInputHeight(Number((outputHeightPx / dpi).toFixed(2)));
    } else if (newUnit === 'centimeters') {
      setInputWidth(Number(((outputWidthPx / dpi) * 2.54).toFixed(2)));
      setInputHeight(Number(((outputHeightPx / dpi) * 2.54).toFixed(2)));
    }
  };

  const handleResizeAndDownload = () => {
    if (!imageSrc) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outputWidthPx;
      canvas.height = outputHeightPx;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, outputWidthPx, outputHeightPx);

      const mimeType = `image/${format}`;
      const dataUrl = canvas.toDataURL(mimeType, quality / 100);

      // Trigger download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${fileName}-resized-${outputWidthPx}x${outputHeightPx}.${format === 'jpeg' ? 'jpg' : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsProcessing(false);
      addToast('Download Complete', `Exported ${outputWidthPx} × ${outputHeightPx} px as ${format.toUpperCase()}`, 'success');
    };
    img.src = imageSrc;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Client-Side Image Resizer</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Resize photos by Pixels, Inches, or Centimeters at precise DPI with high-fidelity client-side processing.
          </p>
        </div>
        <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 self-start md:self-auto font-medium">
          100% Private (No Server Uploads)
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
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Click to upload an image</h3>
          <p className="text-xs text-slate-500">Supports JPG, PNG, WEBP, and GIF up to 25MB</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Preview Box */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="bg-slate-100 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center relative border border-slate-200">
              <img
                src={imageSrc}
                alt="Source preview"
                className="max-h-full max-w-full object-contain"
              />
              <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded font-mono">
                Original: {originalWidth} × {originalHeight} px ({formatBytes(originalSize)})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Change Image
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <span className="text-xs text-slate-500">
                Target: <strong className="text-slate-900 font-mono">{outputWidthPx} × {outputHeightPx} px</strong>
              </span>
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Units Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Measurement Unit
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['pixels', 'inches', 'centimeters'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => handleUnitChange(u)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors capitalize ${
                      unit === u
                        ? 'bg-[#0F172A] text-white border-[#0F172A]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* DPI Selector (Crucial when Inches / CM selected) */}
            {unit !== 'pixels' && (
              <div className="p-3 bg-[#EAF0F8] rounded-xl border border-[#C7D4E5]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#0B1F3A]">
                    Print Target DPI (Dots Per Inch)
                  </label>
                  <span className="text-xs font-mono font-bold text-[#0B1F3A]">{dpi} DPI</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[72, 96, 150, 300].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDpi(d)}
                      className={`py-1.5 text-xs font-medium rounded-md border ${
                        dpi === d
                          ? 'bg-[#17365D] text-white border-[#17365D]'
                          : 'bg-white text-[#0B1F3A] border-[#C7D4E5] hover:bg-[#EAF0F8]'
                      }`}
                    >
                      {d} {d === 300 ? 'Print' : d === 72 ? 'Screen' : ''}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#17365D] mt-2">
                  Formula: {inputWidth} {unit} × {dpi} DPI = <strong>{outputWidthPx} × {outputHeightPx} px</strong>
                </p>
              </div>
            )}

            {/* Dimensions Input with Aspect Ratio Lock */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Width ({unit})
                </label>
                <input
                  type="number"
                  min="1"
                  step={unit === 'pixels' ? '1' : '0.1'}
                  value={inputWidth}
                  onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Height ({unit})
                  </label>
                  <button
                    type="button"
                    onClick={() => setLockAspect(!lockAspect)}
                    className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1"
                    title={lockAspect ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                  >
                    {lockAspect ? <Lock className="w-3 h-3 text-emerald-600" /> : <Unlock className="w-3 h-3" />}
                    <span>{lockAspect ? 'Locked' : 'Free'}</span>
                  </button>
                </div>
                <input
                  type="number"
                  min="1"
                  step={unit === 'pixels' ? '1' : '0.1'}
                  value={inputHeight}
                  onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Format & Quality */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Output Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  <option value="jpeg">JPG (Standard)</option>
                  <option value="png">PNG (Lossless Transparency)</option>
                  <option value="webp">WEBP (Modern Compressed)</option>
                </select>
              </div>

              {format !== 'png' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Quality
                    </label>
                    <span className="text-xs font-mono text-slate-500">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="w-full accent-slate-900"
                  />
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleResizeAndDownload}
              disabled={isProcessing}
              className="w-full mt-4 py-3 px-4 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{isProcessing ? 'Processing in Browser...' : 'Resize & Download Image'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
