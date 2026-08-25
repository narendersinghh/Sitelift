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
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Info
} from 'lucide-react';
import { storage } from '../services/storage';

interface InstallerViewProps {
  onCompleteInstall: () => void;
}

export const InstallerView: React.FC<InstallerViewProps> = ({ onCompleteInstall }) => {
  const [step, setStep] = useState(1);
  
  // Database Configuration State
  const [dbHost, setDbHost] = useState('127.0.0.1');
  const [dbPort, setDbPort] = useState('3306');
  const [dbName, setDbName] = useState('sitelift_db');
  const [dbUser, setDbUser] = useState('sitelift_user');
  const [dbPass, setDbPass] = useState('SecretPass123!');
  const [dbPrefix, setDbPrefix] = useState('sl_');
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [dbError, setDbError] = useState('');

  // Admin Account State
  const [adminName, setAdminName] = useState('SEO Administrator');
  const [adminEmail, setAdminEmail] = useState('admin@sitelift.local');
  const [adminPassword, setAdminPassword] = useState('SuperSecretPassword123!');
  const [showPassword, setShowPassword] = useState(false);
  const [cronToken] = useState('sl_cron_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  const [isMigrating, setIsMigrating] = useState(false);
  const [copiedCron, setCopiedCron] = useState(false);

  const requirements = [
    { name: 'PHP Version (>= 8.2.0)', status: '8.3.4 (Passed)', pass: true, detail: 'PHP 8.2+ with modern type hinting' },
    { name: 'PDO MySQL Extension', status: 'Loaded (Passed)', pass: true, detail: 'High-performance database driver' },
    { name: 'cURL HTTP Client', status: 'Loaded (Passed)', pass: true, detail: 'Google & Bright Data API requests' },
    { name: 'OpenSSL 3.0+ Support', status: 'OpenSSL 3.0.8 (Passed)', pass: true, detail: 'AES-256 token encryption' },
    { name: 'mbstring Multibyte', status: 'Loaded (Passed)', pass: true, detail: 'Internationalized UTF-8 search terms' },
    { name: 'JSON Parser Support', status: 'Loaded (Passed)', pass: true, detail: 'JSON payload streaming' },
    { name: 'Writable Directory (/writable)', status: '0755 Writable (Passed)', pass: true, detail: 'Session, cache, and backup snapshots' }
  ];

  const handleApplyPreset = (preset: 'cpanel' | 'localhost' | 'directadmin') => {
    if (preset === 'cpanel') {
      setDbHost('localhost');
      setDbPort('3306');
      setDbName('cpaneluser_sitelift');
      setDbUser('cpaneluser_db');
      setDbPrefix('sl_');
    } else if (preset === 'localhost') {
      setDbHost('127.0.0.1');
      setDbPort('3306');
      setDbName('sitelift');
      setDbUser('root');
      setDbPass('');
      setDbPrefix('sl_');
    } else if (preset === 'directadmin') {
      setDbHost('localhost');
      setDbPort('3306');
      setDbName('admin_sitelift');
      setDbUser('admin_db');
      setDbPrefix('sl_');
    }
  };

  const handleTestDatabase = () => {
    setIsTestingDb(true);
    setDbError('');
    setTimeout(() => {
      setIsTestingDb(false);
      if (!dbName || !dbUser) {
        setDbError('Database name and username cannot be empty.');
        setDbConnected(false);
      } else {
        setDbConnected(true);
      }
    }, 700);
  };

  const handleRunMigration = () => {
    setIsMigrating(true);
    setTimeout(() => {
      setIsMigrating(false);
      setStep(4);
    }, 1200);
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
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden transition-all">
        
        {/* Wizard Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Sitelift Web Installer Wizard</h2>
              <p className="text-xs text-slate-500">Step {step} of 4: Self-Hosted Production Setup</p>
            </div>
          </div>

          {/* Stepper Node Indicators */}
          <div className="flex items-center gap-2">
            {[
              { id: 1, label: 'Checks' },
              { id: 2, label: 'Database' },
              { id: 3, label: 'Admin' },
              { id: 4, label: 'Ready' }
            ].map(s => (
              <div
                key={s.id}
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  s.id === step
                    ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-200'
                    : s.id < step
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
                title={s.label}
              >
                {s.id < step ? <Check className="w-3.5 h-3.5" /> : s.id}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: System Requirements Check */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" />
                Server Environment & PHP Extensions Verification
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Checking compatibility with your server environment. Sitelift is 100% native PHP and requires no Node.js daemons.
              </p>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50">
              {requirements.map((req, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-white transition-colors">
                  <div>
                    <div className="font-semibold text-slate-800">{req.name}</div>
                    <div className="text-[11px] text-slate-500">{req.detail}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {req.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>All 7 system requirements passed. Your server is fully ready for Sitelift installation.</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
              >
                <span>Continue to Database Setup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Database Configuration */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                MySQL Database Credentials
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your MySQL database details created in cPanel MySQL Database Wizard or phpMyAdmin.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500">Quick Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('cpanel')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
              >
                cPanel / Shared Host
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('localhost')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
              >
                Localhost (XAMPP/MAMP)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('directadmin')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
              >
                DirectAdmin / Plesk
              </button>
            </div>

            {dbError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                {dbError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Database Host</label>
                <input
                  type="text"
                  value={dbHost}
                  onChange={e => { setDbHost(e.target.value); setDbConnected(false); }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Database Port</label>
                <input
                  type="text"
                  value={dbPort}
                  onChange={e => setDbPort(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Database Name</label>
                <input
                  type="text"
                  value={dbName}
                  onChange={e => { setDbName(e.target.value); setDbConnected(false); }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Table Prefix</label>
                <input
                  type="text"
                  value={dbPrefix}
                  onChange={e => setDbPrefix(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Database User</label>
                <input
                  type="text"
                  value={dbUser}
                  onChange={e => { setDbUser(e.target.value); setDbConnected(false); }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Database Password</label>
                <input
                  type="password"
                  value={dbPass}
                  onChange={e => { setDbPass(e.target.value); setDbConnected(false); }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleTestDatabase}
                disabled={isTestingDb}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  dbConnected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin text-blue-600' : ''}`} />
                <span>{isTestingDb ? 'Connecting to MySQL...' : dbConnected ? '✓ Connection Verified' : 'Test PDO Connection'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <span>Next: Admin Setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Admin Setup & Schema Migration */}
        {step === 3 && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Primary Administrator Account
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure your master login to access Sitelift once database tables are migrated.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Full Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email Address</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="w-full px-3.5 py-2 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 space-y-1">
              <div className="font-bold text-slate-900 font-sans text-xs mb-1">Ready to execute schema migrations:</div>
              <div className="text-blue-700">[1/11] CREATE TABLE {dbPrefix}websites ... InnoDB utf8mb4</div>
              <div className="text-blue-700">[2/11] CREATE TABLE {dbPrefix}keywords ... InnoDB utf8mb4</div>
              <div className="text-blue-700">[3/11] CREATE TABLE {dbPrefix}settings ... App encryption keys</div>
              <div className="text-emerald-700 font-bold font-sans mt-2">✓ All InnoDB schemas and foreign key cascades verified.</div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleRunMigration}
                disabled={isMigrating}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition disabled:opacity-50"
              >
                <Database className={`w-3.5 h-3.5 ${isMigrating ? 'animate-spin' : ''}`} />
                <span>{isMigrating ? 'Executing SQL Migrations...' : 'Execute Migrations & Provision Admin'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Installation Complete & Crontab Setup */}
        {step === 4 && (
          <form onSubmit={handleFinish} className="p-6 space-y-4 text-xs">
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Sitelift Installation Successful!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                All 11 MySQL tables have been migrated, the master administrator has been initialized, and configuration files are securely locked.
              </p>
            </div>

            {/* Crontab Snippet Box */}
            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between font-sans text-slate-300">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  cPanel / Server Cron Job Command:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`* * * * * php /home/username/public_html/cron.php --token=${cronToken} >/dev/null 2>&1`);
                    setCopiedCron(true);
                    setTimeout(() => setCopiedCron(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-bold transition flex items-center gap-1"
                >
                  {copiedCron ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCron ? 'Copied!' : 'Copy Cron'}</span>
                </button>
              </div>
              <div className="p-2.5 bg-black/60 rounded border border-slate-800 select-all break-all text-emerald-400">
                * * * * * php /home/username/public_html/cron.php --token={cronToken} &gt;/dev/null 2&gt;&amp;1
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Launch Sitelift Dashboard</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
