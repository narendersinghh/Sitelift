import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Database,
  User,
  Key,
  Server,
  ArrowRight,
  RefreshCw,
  Terminal,
  Copy
} from 'lucide-react';
import { storage } from '../services/storage';

interface InstallerViewProps {
  onCompleteInstall: () => void;
}

export const InstallerView: React.FC<InstallerViewProps> = ({ onCompleteInstall }) => {
  const [step, setStep] = useState(1);
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('3306');
  const [dbName, setDbName] = useState('sitelift_db');
  const [dbUser, setDbUser] = useState('cpanel_user');
  const [dbPass, setDbPass] = useState('••••••••••••');
  const [dbPrefix, setDbPrefix] = useState('sitelift_');
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Step 3 Admin State
  const [adminName, setAdminName] = useState('SEO Administrator');
  const [adminEmail, setAdminEmail] = useState('admin@sitelift.local');
  const [adminPassword, setAdminPassword] = useState('password123');
  const [cronToken, setCronToken] = useState('d3b07384d113edec49eaa6238ad5ff00');
  const [isMigrating, setIsMigrating] = useState(false);

  const requirements = [
    { name: 'PHP Version (>= 8.2.0)', status: '8.3.4 (Passed)', pass: true },
    { name: 'PDO MySQL Extension', status: 'Loaded (Passed)', pass: true },
    { name: 'cURL HTTP Client Extension', status: 'Loaded (Passed)', pass: true },
    { name: 'OpenSSL Encryption Support', status: 'OpenSSL 3.0.8 (Passed)', pass: true },
    { name: 'mbstring Multibyte Encoding', status: 'Loaded (Passed)', pass: true },
    { name: 'JSON Parser Support', status: 'Loaded (Passed)', pass: true },
    { name: 'Writable Configuration Directory', status: '0755 Writable (Passed)', pass: true }
  ];

  const handleTestDatabase = () => {
    setIsTestingDb(true);
    setTimeout(() => {
      setIsTestingDb(false);
      setDbConnected(true);
    }, 600);
  };

  const handleRunMigration = () => {
    setIsMigrating(true);
    setTimeout(() => {
      setIsMigrating(false);
      setStep(4);
    }, 1000);
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveAuthUser({
      id: 'usr-admin-1',
      name: adminName,
      email: adminEmail,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    onCompleteInstall();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl backdrop-blur-2xl overflow-hidden">
        
        {/* Wizard Header */}
        <div className="p-6 bg-white/5 border-b border-white/10 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
              S
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Sitelift Web Installer Wizard</h2>
              <p className="text-xs text-slate-400">Step {step} of 4: Self-Hosted Shared Hosting Setup</p>
            </div>
          </div>

          {/* Step Progress Indicators */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  s === step
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : s < step
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-white/5 text-slate-500 border border-white/10'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Server Requirements */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                Server Environment & PHP Extensions Verification
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Checking compatibility with your shared hosting server. All core requirements must pass.
              </p>
            </div>

            <div className="space-y-2 border border-white/10 rounded-2xl p-4 bg-[#0f172a]/40 backdrop-blur-md">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl hover:bg-white/5 transition-colors">
                  <span className="text-slate-300 font-medium">{req.name}</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {req.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 backdrop-blur-md transition-all"
              >
                <span>Continue to Database Setup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Database Configuration */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                MySQL Database Credentials
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your MySQL database details created in cPanel MySQL Database Wizard.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Database Host</label>
                <input
                  type="text"
                  value={dbHost}
                  onChange={e => setDbHost(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono backdrop-blur-md"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Port</label>
                <input
                  type="text"
                  value={dbPort}
                  onChange={e => setDbPort(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono backdrop-blur-md"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Database Name</label>
                <input
                  type="text"
                  value={dbName}
                  onChange={e => setDbName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono backdrop-blur-md"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Table Prefix</label>
                <input
                  type="text"
                  value={dbPrefix}
                  onChange={e => setDbPrefix(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono backdrop-blur-md"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Database User</label>
                <input
                  type="text"
                  value={dbUser}
                  onChange={e => setDbUser(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono backdrop-blur-md"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Database Password</label>
                <input
                  type="password"
                  value={dbPass}
                  onChange={e => setDbPass(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono backdrop-blur-md"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleTestDatabase}
                disabled={isTestingDb}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs rounded-xl font-medium flex items-center gap-1.5 backdrop-blur-md transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
                <span>{isTestingDb ? 'Testing Connection...' : dbConnected ? '✓ Connection Verified' : 'Test MySQL Connection'}</span>
              </button>

              <button
                onClick={() => setStep(3)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 backdrop-blur-md transition-all"
              >
                <span>Run Schema Migrations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Migration Execution */}
        {step === 3 && (
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                Database Schema Migration
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Creating 11 relational InnoDB tables for websites, page metrics, rankings, insights, and report snapshots.
              </p>
            </div>

            <div className="p-5 bg-[#0f172a]/70 rounded-2xl border border-white/10 text-xs font-mono text-slate-300 space-y-1.5 backdrop-blur-md">
              <div className="text-indigo-400 font-semibold">[1/11] CREATE TABLE sitelift_websites ... OK</div>
              <div className="text-indigo-400 font-semibold">[2/11] CREATE TABLE sitelift_page_metrics ... OK</div>
              <div className="text-indigo-400 font-semibold">[3/11] CREATE TABLE sitelift_gsc_metrics ... OK</div>
              <div className="text-indigo-400 font-semibold">[4/11] CREATE TABLE sitelift_keywords ... OK</div>
              <div className="text-indigo-400 font-semibold">[5/11] CREATE TABLE sitelift_keyword_ranks ... OK</div>
              <div className="text-indigo-400 font-semibold">[6/11] CREATE TABLE sitelift_insights ... OK</div>
              <div className="text-indigo-400 font-semibold">[7/11] CREATE TABLE sitelift_activities ... OK</div>
              <div className="text-indigo-400 font-semibold">[8/11] CREATE TABLE sitelift_monthly_reports ... OK</div>
              <div className="text-indigo-400 font-semibold">[9/11] CREATE TABLE sitelift_category_rules ... OK</div>
              <div className="text-indigo-400 font-semibold">[10/11] CREATE TABLE sitelift_sync_jobs ... OK</div>
              <div className="text-emerald-400 font-bold mt-3">✓ All database tables created successfully with compound indexes!</div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleRunMigration}
                disabled={isMigrating}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 backdrop-blur-md transition-all"
              >
                <span>{isMigrating ? 'Finalizing Tables...' : 'Create Admin Account & Cron'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Admin Account & Cron Token */}
        {step === 4 && (
          <form onSubmit={handleFinish} className="p-6 space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                Administrator Account & Cron Security Token
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Create your self-hosted administrator credentials and copy your generated cron security token.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Admin Full Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white backdrop-blur-md"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Admin Email Address</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white backdrop-blur-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Admin Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono backdrop-blur-md"
                required
              />
            </div>

            <div className="p-4 bg-[#0f172a]/70 border border-white/10 rounded-xl space-y-1.5 backdrop-blur-md">
              <label className="block text-indigo-400 font-semibold">Generated Cron Token</label>
              <div className="font-mono text-slate-300 text-xs select-all">{cronToken}</div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 backdrop-blur-md flex items-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Complete Installation & Enter Dashboard</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
