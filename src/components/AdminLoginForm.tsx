import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail } from 'lucide-react';

export const AdminLoginForm: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await login(email.trim(), password);
    setBusy(false);
    if (!res.success) setError(res.error || 'Sign-in failed.');
  };

  return (
    <form onSubmit={submit} className="space-y-4 text-left">
      <div>
        <label htmlFor="admin-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
          Email
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-9 pr-3 py-3 text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17365D]/40 focus:border-[#17365D]"
          />
        </div>
      </div>
      <div>
        <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
          Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            id="admin-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-9 pr-3 py-3 text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17365D]/40 focus:border-[#17365D]"
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full py-3 bg-[#17365D] hover:bg-[#0B1F3A] disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
};
