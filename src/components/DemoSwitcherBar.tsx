import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, LogIn, Upload } from 'lucide-react';

export const DemoSwitcherBar: React.FC = () => {
  const { currentUser, setCurrentView, openAuthModal } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="bg-[#0F172A] border-b border-slate-800 text-xs text-slate-300 py-2 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-wide text-amber-400">GRAPHICS EXPERT</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden md:inline text-slate-400">Professional Design Marketplace & Creative Tools</span>
        </div>
        {isAdmin ? (
          <button
            onClick={() => setCurrentView('admin-dashboard')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Admin Dashboard</span>
          </button>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Admin Sign In</span>
          </button>
        )}
      </div>
    </div>
  );
};
