import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdminLoginForm } from './AdminLoginForm';
import { X, Shield } from 'lucide-react';

/** Owner sign-in dialog. There is no public registration: only the site owner can sign in. */
export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal } = useApp();
  const [, force] = useState(0);
  if (!isAuthModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F3A]/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      onKeyDown={(e) => e.key === 'Escape' && (closeAuthModal(), force((n) => n + 1))}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#17365D]" />
            <h2 id="auth-title" className="text-lg font-bold text-[#0B1F3A] font-display">
              Owner sign in
            </h2>
          </div>
          <button onClick={closeAuthModal} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
};
