import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, User, Palette, Upload } from 'lucide-react';

export const DemoSwitcherBar: React.FC = () => {
  const { currentUser, switchRole, setCurrentView } = useApp();

  return (
    <div className="bg-[#0F172A] border-b border-slate-800 text-xs text-slate-300 py-1.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-400">GRAPHICS EXPERT</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden md:inline text-slate-400">
            Persistent disk storage & server-verified downloads active (Demo Checkout Mode)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 mr-1 hidden md:inline">Access:</span>

          <button
            onClick={async () => {
              await switchRole('admin');
              setCurrentView('admin-dashboard');
            }}
            className={`px-2.5 py-0.5 rounded transition-colors flex items-center gap-1 whitespace-nowrap ${
              currentUser?.role === 'admin'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-700 font-medium'
            }`}
            title="Admin Owner: graphicsexpert65@gmail.com"
          >
            <Shield className="w-3 h-3" />
            <span>Admin Studio</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setCurrentView('admin-dashboard')}
              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 whitespace-nowrap"
            >
              <Upload className="w-3 h-3" />
              <span className="hidden sm:inline">Upload Design</span>
            </button>
          )}

          <button
            onClick={() => switchRole('customer')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 whitespace-nowrap ${
              currentUser?.role === 'customer'
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <User className="w-3 h-3" />
            <span>Customer</span>
          </button>

          <button
            onClick={async () => {
              await switchRole('designer');
              setCurrentView('designer-dashboard');
            }}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 whitespace-nowrap ${
              currentUser?.role === 'designer'
                ? 'bg-indigo-600 text-white font-medium'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Palette className="w-3 h-3" />
            <span>Designer</span>
          </button>

          <button
            onClick={() => switchRole('guest')}
            className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
              !currentUser ? 'bg-slate-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            Guest
          </button>
        </div>
      </div>
    </div>
  );
};
