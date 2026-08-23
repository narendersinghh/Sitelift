import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { storage } from '../services/storage';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@sitelift.local');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    storage.saveAuthUser({
      id: 'usr-1',
      name: 'Administrator',
      email,
      role: 'admin',
      createdAt: new Date().toISOString()
    });

    onLoginSuccess();
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
          <p className="text-sm font-medium text-slate-500">Your personal SEO Suite</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 text-center font-bold">
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
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none text-sm font-medium"
                placeholder="••••••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Self-Hosted Footer Note */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-1">
          <div className="text-slate-600 font-medium">Private Self-Hosted Instance</div>
          <div className="text-blue-700 font-bold">No external telemetry or SaaS tracking</div>
        </div>

      </div>
    </div>
  );
};
