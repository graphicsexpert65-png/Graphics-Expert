import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white text-slate-900 border border-slate-200/90 rounded-xl shadow-lg p-3 flex items-start gap-3 transition-all animate-in slide-in-from-bottom-2 duration-200"
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          {toast.type === 'info' && (
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-slate-900">{toast.title}</h4>
            {toast.message && (
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{toast.message}</p>
            )}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
