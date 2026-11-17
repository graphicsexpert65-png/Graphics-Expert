import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Mail, User, Globe, ArrowRight, Shield } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openAuthModal,
    login,
    register,
    switchRole,
    setCurrentView,
    addToast,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('Pakistan');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (authModalTab === 'forgot') {
      setForgotSubmitted(true);
      addToast('Reset Link Sent', `Password reset instructions sent to ${email}`, 'info');
      return;
    }

    setIsSubmitting(true);
    if (authModalTab === 'signup') {
      const res = await register({ name, email, password, country });
      if (!res.success) setErrorMsg(res.error || 'Could not create account.');
    } else {
      const res = await login(email, password);
      if (!res.success) setErrorMsg(res.error || 'Invalid credentials.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display">
              {authModalTab === 'login' && 'Sign in to Graphics Expert'}
              {authModalTab === 'signup' && 'Create your Graphics Expert account'}
              {authModalTab === 'forgot' && 'Reset your password'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {authModalTab === 'login' && 'Access your purchased designs, secure downloads & wishlist.'}
              {authModalTab === 'signup' && 'Register to purchase & securely download editable design files.'}
              {authModalTab === 'forgot' && 'Enter your email to receive recovery instructions.'}
            </p>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Quick Access Bar */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-100 text-xs flex items-center justify-between gap-2">
          <span className="text-slate-500">Preview Access:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={async () => {
                await switchRole('customer');
                closeAuthModal();
              }}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 font-medium"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={async () => {
                await switchRole('admin');
                closeAuthModal();
                setCurrentView('admin-dashboard');
              }}
              className="px-2.5 py-1 bg-amber-50 border border-amber-300 rounded text-amber-900 hover:bg-amber-100 font-semibold flex items-center gap-1"
            >
              <Shield className="w-3 h-3" />
              Owner Admin
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {authModalTab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Bilal Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {authModalTab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                {authModalTab === 'login' && (
                  <button
                    type="button"
                    onClick={() => openAuthModal('forgot')}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

          {authModalTab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Country
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Pakistan, United States, UAE"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

          {forgotSubmitted && authModalTab === 'forgot' ? (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs">
              Check your inbox for a reset link. Return to sign in below.
            </div>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
            >
              <span>
                {isSubmitting
                  ? 'Authenticating...'
                  : authModalTab === 'login'
                  ? 'Sign In'
                  : authModalTab === 'signup'
                  ? 'Create Account'
                  : 'Send Recovery Email'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Footer switches */}
          <div className="pt-2 text-center text-xs text-slate-500">
            {authModalTab === 'login' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('signup')}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Sign up free
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
