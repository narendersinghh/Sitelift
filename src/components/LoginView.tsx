import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react';
import { storage } from '../services/storage';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@sitelift.local');
  const [password, setPassword] = useState('password123');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter both email address and password.');
      return;
    }

    setIsSubmitting(true);

    // Calculate expiry: 24 hours from now if keepLoggedIn is false, otherwise null (persistent)
    const expiresAt = keepLoggedIn
      ? null
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const authUser = {
      id: 'usr-' + Math.random().toString(36).substr(2, 6),
      name: cleanEmail.includes('@') ? cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim() : 'Administrator',
      email: cleanEmail,
      role: 'admin' as const,
      loggedInAt: new Date().toISOString(),
      expiresAt,
      keepLoggedIn,
      csrfToken: 'csrf_' + Math.random().toString(36).substr(2, 12),
      createdAt: new Date().toISOString()
    };

    storage.saveAuthUser(authUser);

    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess();
    }, 200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f0f5fa] text-slate-900 relative">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-8 shadow-xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 mx-auto flex items-center justify-center font-bold text-white text-xl shadow-xs">
            S
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sitelift</h1>
          <p className="text-sm font-medium text-slate-500">Sign in to your private SEO Suite</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 text-center font-bold">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-sm">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 text-xs">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none text-sm font-medium"
                placeholder="admin@yourdomain.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 text-xs">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none text-sm font-medium font-mono"
                placeholder="••••••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Keep Logged In Checkbox (Checked by default) */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={e => setKeepLoggedIn(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                    keepLoggedIn
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  {keepLoggedIn && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
              <div className="text-xs">
                <span className="font-semibold text-slate-800">Keep logged in</span>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  {keepLoggedIn
                    ? 'Stay logged in on this browser until you sign out'
                    : 'Session expires automatically in 24 hours'}
                </p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Signing In...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Quick Pill */}
        <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl text-[11px] text-blue-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-blue-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Default Instance Credentials</span>
          </div>
          <div className="text-slate-600 flex items-center justify-between font-mono text-[10px]">
            <span>Email: <strong>admin@sitelift.local</strong></span>
            <span>Pass: <strong>password123</strong></span>
          </div>
        </div>

        {/* Self-Hosted Footer Note */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-1">
          <div className="text-slate-600 font-medium">Private Self-Hosted Instance</div>
          <div className="text-blue-700 font-bold">No external telemetry or SaaS tracking</div>
        </div>

      </div>
    </div>
  );
};
