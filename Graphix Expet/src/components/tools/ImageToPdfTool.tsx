import React, { useState, useRef } from 'react';
import { Upload, Download, Trash2, ArrowUp, ArrowDown, FileText, CheckCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';

interface ImageItem {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export const ImageToPdfTool: React.FC = () => {
  const { addToast } = useApp();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'a5' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'p' | 'l'>('p');
  const [margin, setMargin] = useState<number>(10); // in mm
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const item: ImageItem = {
            id: 'img_' + Math.random().toString(36).substring(2, 9),
            name: file.name,
            dataUrl: src,
            width: img.width,
            height: img.height,
          };
          setImages((prev) => [...prev, item]);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });

    addToast('Images Queued', `${files.length} image(s) added to document sequence.`, 'success');
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    setImages((prev) => {
      const copy = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: pageSize,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const availWidth = pageWidth - margin * 2;
      const availHeight = pageHeight - margin * 2;

      images.forEach((item, index) => {
        if (index > 0) {
          doc.addPage(pageSize, orientation);
        }

        // Calculate aspect-fit dimensions
        const imgAspect = item.width / item.height;
        const boxAspect = availWidth / availHeight;

        let renderW = availWidth;
        let renderH = availHeight;

        if (imgAspect > boxAspect) {
          renderH = renderW / imgAspect;
        } else {
          renderW = renderH * imgAspect;
        }

        const posX = margin + (availWidth - renderW) / 2;
        const posY = margin + (availHeight - renderH) / 2;

        // Auto detect image format
        const formatStr = item.dataUrl.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(item.dataUrl, formatStr, posX, posY, renderW, renderH, undefined, 'FAST');
      });

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setIsGenerating(false);
      addToast('PDF Compiled!', `${images.length} pages ready for download.`, 'success');
    } catch (err) {
      setIsGenerating(false);
      addToast('Error', 'Failed to generate PDF document.', 'error');
    }
  };

  const handleDownload = () => {
    if (!pdfBlobUrl) return;
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = `graphics-expert-doc-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Client-Side Image to PDF Maker</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Assemble multiple photos into a crisp, standardized multi-page PDF with adjustable margins and page setups.
          </p>
        </div>
        <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 self-start md:self-auto font-medium">
          Instant Client-Side Compilation
        </div>
      </div>

      {/* Settings Grid */}
      <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Page Format
          </label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
          >
            <option value="a4">A4 (210 × 297 mm)</option>
            <option value="a5">A5 (148 × 210 mm)</option>
            <option value="letter">US Letter (8.5 × 11 in)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Page Orientation
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOrientation('p')}
              className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                orientation === 'p' ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              Portrait
            </button>
            <button
              onClick={() => setOrientation('l')}
              className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                orientation === 'l' ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              Landscape
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Page Margins
          </label>
          <select
            value={margin}
            onChange={(e) => setMargin(parseInt(e.target.value))}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
          >
            <option value="0">No Margins (0 mm)</option>
            <option value="5">Small Margins (5 mm)</option>
            <option value="12">Medium Margins (12 mm)</option>
            <option value="20">Large Margins (20 mm)</option>
          </select>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-6 text-center cursor-pointer transition-colors"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFilesUpload}
          multiple
          accept="image/*"
          className="hidden"
        />
        <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 mx-auto flex items-center justify-center text-slate-600 mb-2">
          <Upload className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-slate-800">
          Click or drop photos here to add pages (Multiple selection allowed)
        </p>
      </div>

      {/* Reorderable List */}
      {images.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Page Order ({images.length} page{images.length > 1 ? 's' : ''})
            </span>
            <button
              onClick={() => setImages([])}
              className="text-xs text-rose-600 hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {images.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <img
                    src={item.dataUrl}
                    alt={item.name}
                    className="w-12 h-10 object-cover rounded bg-slate-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {item.width} × {item.height} px
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveImage(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveImage(index, 'down')}
                    disabled={index === images.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeImage(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={generatePdf}
              disabled={isGenerating}
              className="flex-1 py-3 px-4 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>{isGenerating ? 'Compiling PDF...' : 'Compile PDF Document'}</span>
            </button>

            {pdfBlobUrl && (
              <button
                onClick={handleDownload}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Ready PDF</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
