import React, { useState } from 'react';
import {
  FolderCode,
  Download,
  FileCode,
  CheckCircle2,
  Server,
  Database,
  Terminal,
  ShieldCheck,
  Copy,
  ExternalLink,
  ChevronRight,
  FileText,
  User,
  Key,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Layers
} from 'lucide-react';
import { generateSiteliftZip } from '../services/phpZipGenerator';
import { storage } from '../services/storage';

interface DeploymentViewProps {
  initialTab?: 'package' | 'installer';
}

export const DeploymentView: React.FC<DeploymentViewProps> = ({ initialTab = 'package' }) => {
  const [activeTab, setActiveTab] = useState<'package' | 'installer'>(initialTab);

  // Package & ZIP State
  const [selectedFile, setSelectedFile] = useState<string>('public/install/index.php');
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Web Installer State
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
  const [installerComplete, setInstallerComplete] = useState(false);

  const fileTree = [
    {
      category: 'Web Installer Wizard',
      files: [
        { path: 'public/install/index.php', label: 'Web Installer Wizard (PHP)' },
        { path: 'public/install/installer.css', label: 'Installer Bootstrap Dark Theme' }
      ]
    },
    {
      category: 'Database Schema & Migrations',
      files: [
        { path: 'app/Database/Migrations/2026_01_01_000001_create_sitelift_tables.sql', label: 'MySQL Schema Migration (InnoDB)' }
      ]
    },
    {
      category: 'Cron Automation & Background Engine',
      files: [
        { path: 'cron.php', label: 'Shared Hosting Cron Runner (CLI & HTTP)' }
      ]
    },
    {
      category: 'PHP Business Logic & Scrapers',
      files: [
        { path: 'app/Services/BrightDataSerpTracker.php', label: 'Bright Data SERP Scraper Service' },
        { path: 'app/Services/DecliningPagesEngine.php', label: 'Declining Pages Calculation Engine' }
      ]
    },
    {
      category: 'Web Server Configuration & Setup Guides',
      files: [
        { path: '.htaccess', label: 'Apache .htaccess Security Rules' },
        { path: 'README.md', label: 'Shared Hosting Deployment Guide' },
        { path: 'GOOGLE_OAUTH_SETUP.md', label: 'Google Cloud OAuth 2.0 Guide' },
        { path: 'BRIGHTDATA_SETUP.md', label: 'Bright Data SERP Integration Guide' }
      ]
    }
  ];

  const requirements = [
    { name: 'PHP Version (>= 8.2.0)', status: '8.3.4 (Passed)', pass: true },
    { name: 'PDO MySQL Extension', status: 'Loaded (Passed)', pass: true },
    { name: 'cURL HTTP Client Extension', status: 'Loaded (Passed)', pass: true },
    { name: 'OpenSSL Encryption Support', status: 'OpenSSL 3.0.8 (Passed)', pass: true },
    { name: 'mbstring Multibyte Encoding', status: 'Loaded (Passed)', pass: true },
    { name: 'JSON Parser Support', status: 'Loaded (Passed)', pass: true },
    { name: 'Writable Configuration Directory', status: '0755 Writable (Passed)', pass: true }
  ];

  const handleDownload = async () => {
    setIsZipping(true);
    setDownloadError('');
    try {
      await generateSiteliftZip();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (e) {
      console.error(e);
      setDownloadError('Failed to generate ZIP package. Please try again.');
      setTimeout(() => setDownloadError(''), 4000);
    } finally {
      setIsZipping(false);
    }
  };

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

  const handleFinishInstaller = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveAuthUser({
      id: 'usr-admin-1',
      name: adminName,
      email: adminEmail,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    setInstallerComplete(true);
    setTimeout(() => setInstallerComplete(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Full Width Header with Action Controls Below */}
      <div className="space-y-3">
        <div className="w-full">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderCode className="w-5 h-5 text-indigo-400" />
            Deployment & Self-Hosted Web Installer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pure PHP 8.2+ and MySQL 8 self-hosted architecture built specifically for shared hosting (cPanel, Plesk, Apache, LiteSpeed).
          </p>
        </div>

        {activeTab === 'package' && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={handleDownload}
              disabled={isZipping}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-600/30 backdrop-blur-md transition-all disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isZipping ? 'animate-bounce' : ''}`} />
              <span>{isZipping ? 'Generating sitelift-v1.0.0.zip...' : 'Download Sitelift ZIP (v1.0.0)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('package')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'package'
              ? 'border-indigo-500 text-indigo-300 bg-white/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderCode className="w-4 h-4" />
          <span>PHP Deployment Package & ZIP Archive</span>
        </button>

        <button
          onClick={() => setActiveTab('installer')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'installer'
              ? 'border-indigo-500 text-indigo-300 bg-white/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Interactive Web Installer Simulator</span>
        </button>
      </div>

      {/* Tab 1: Package & ZIP */}
      {activeTab === 'package' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {downloadSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 flex items-center gap-3 backdrop-blur-md animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong>Download Complete!</strong> You have downloaded <code>sitelift-v1.0.0.zip</code>. Upload and unzip to your shared hosting <code>public_html</code>, then navigate to <code>/install</code> in your browser.
              </div>
            </div>
          )}

          {downloadError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 flex items-center gap-3 backdrop-blur-md animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <strong>Download Error:</strong> {downloadError}
              </div>
            </div>
          )}

          {/* Architecture Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Server className="w-4 h-4 text-indigo-400" />
                <span>Zero Node / Zero Docker</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Runs on standard PHP 8.2+ with Apache/Nginx. Requires no Node daemon, no Docker containers, and no root SSH access.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Standard MySQL 8 / MariaDB</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Uses standard PDO MySQL connection with automated index creation and migration scripts included in the zip.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Standard cPanel Crontab</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                A single <code>cron.php</code> file invoked every 15 minutes handles daily GA4/GSC syncs, SERP scraping, and health audits.
              </p>
            </div>
          </div>

          {/* Source Code File Explorer */}
          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                Generated Package Structure (Included in ZIP)
              </div>
              <span className="text-[11px] text-slate-400 font-mono">11 Core Files Generated</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fileTree.map((cat, idx) => (
                <div key={idx} className="p-4 bg-slate-900/60 border border-white/10 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-indigo-300">{cat.category}</div>
                  <div className="space-y-1">
                    {cat.files.map((file, fIdx) => (
                      <div
                        key={fIdx}
                        className="p-2 bg-white/5 rounded-lg text-xs flex items-center justify-between border border-white/5 hover:border-indigo-500/30 transition-all"
                      >
                        <span className="font-mono text-slate-200 text-[11px]">{file.path}</span>
                        <span className="text-[10px] text-slate-400">{file.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Crontab Instruction Card */}
          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3 backdrop-blur-md">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Shared Hosting Crontab Command
            </div>
            <p className="text-xs text-slate-300">
              Add this cron job in your cPanel / DirectAdmin Cron Jobs manager to run background synchronizations:
            </p>
            <div className="p-3 bg-[#080d1e] rounded-xl border border-white/10 flex items-center justify-between font-mono text-xs text-indigo-300">
              <span>*/15 * * * * /usr/bin/php /home/username/public_html/cron.php --token=d3b07384d113edec49eaa6238ad5ff00 &gt; /dev/null 2&gt;&amp;1</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('*/15 * * * * /usr/bin/php /home/username/public_html/cron.php --token=d3b07384d113edec49eaa6238ad5ff00 > /dev/null 2>&1');
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-slate-200 rounded-lg text-[10px] font-sans font-medium transition-colors shrink-0"
              >
                {copiedCode ? 'Copied!' : 'Copy Crontab'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Web Installer Wizard */}
      {activeTab === 'installer' && (
        <div className="flex items-center justify-center p-2 animate-in fade-in duration-150">
          <div className="bg-[#0b1329] border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
            
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
                        : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    {s < step ? '✓' : s}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: System Requirements */}
            {step === 1 && (
              <div className="p-6 space-y-4">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  PHP Environment & Extension Checks
                </div>
                <div className="divide-y divide-white/5 rounded-xl border border-white/10 overflow-hidden bg-white/5">
                  {requirements.map((req, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-medium">{req.name}</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <span>Next: Database Setup</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Database Connection */}
            {step === 2 && (
              <div className="p-6 space-y-4">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  MySQL 8 / MariaDB Database Credentials
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Database Host</label>
                    <input
                      type="text"
                      value={dbHost}
                      onChange={e => setDbHost(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-indigo-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Database Port</label>
                    <input
                      type="text"
                      value={dbPort}
                      onChange={e => setDbPort(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-indigo-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Database Name</label>
                    <input
                      type="text"
                      value={dbName}
                      onChange={e => setDbName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-indigo-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Table Prefix</label>
                    <input
                      type="text"
                      value={dbPrefix}
                      onChange={e => setDbPrefix(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-indigo-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Database User</label>
                    <input
                      type="text"
                      value={dbUser}
                      onChange={e => setDbUser(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-indigo-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Database Password</label>
                    <input
                      type="password"
                      value={dbPass}
                      onChange={e => setDbPass(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-indigo-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleTestDatabase}
                    disabled={isTestingDb}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-indigo-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
                    <span>{dbConnected ? 'Database Connected!' : 'Test PDO Connection'}</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-xl transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                    >
                      <span>Next: Admin Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Admin Account */}
            {step === 3 && (
              <div className="p-6 space-y-4">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Create Master SEO Administrator Account
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Admin Full Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Admin Email</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-indigo-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Admin Password</label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-indigo-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-xl transition-colors"
                  >
                    Back
                  </button>

                  <button
                    onClick={handleRunMigration}
                    disabled={isMigrating}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <Database className={`w-3.5 h-3.5 ${isMigrating ? 'animate-spin' : ''}`} />
                    <span>{isMigrating ? 'Running SQL Migrations...' : 'Execute Database Migrations'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Installation Complete */}
            {step === 4 && (
              <div className="p-6 space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-bold text-white">Sitelift Installation Successful!</h3>
                  <p className="text-xs text-slate-300">
                    Database tables created, default admin account registered, and encryption tokens initialized.
                  </p>
                </div>

                <div className="p-4 bg-slate-900/60 border border-white/10 rounded-xl space-y-2 text-xs">
                  <div className="font-semibold text-slate-200">Security Requirement:</div>
                  <p className="text-slate-400 text-[11px]">
                    Delete or restrict permissions on <code>/public/install</code> directory on your server to prevent reinstallation.
                  </p>
                </div>

                {installerComplete && (
                  <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 text-center font-medium">
                    Admin session initialized successfully!
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleFinishInstaller}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    Complete Setup & Verify Admin Session
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
