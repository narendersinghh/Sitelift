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
      name: 'SEO Administrator',
      email,
      role: 'admin',
      createdAt: new Date().toISOString()
    });

    onLoginSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Ambient background glows for Frosted Glass */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="bg-white/5 border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl backdrop-blur-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 mx-auto flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-600/30">
            S
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Sitelift</h1>
          <p className="text-xs text-slate-400">Self-Hosted SEO Monitoring & Activity Planning</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 text-center backdrop-blur-md">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none backdrop-blur-md"
                placeholder="admin@yourdomain.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none backdrop-blur-md"
                placeholder="••••••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 backdrop-blur-md transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Shared Hosting Self-Hosted Footer Note */}
        <div className="pt-4 border-t border-white/10 text-center text-[11px] text-slate-500 space-y-1">
          <div>Self-Hosted Instance • PHP 8.2+ & MySQL 8</div>
          <div className="text-indigo-400 font-medium">No external telemetry or SaaS tracking</div>
        </div>

      </div>
    </div>
  );
};
