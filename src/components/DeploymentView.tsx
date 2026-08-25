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
  User,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Layers,
  History,
  RotateCcw,
  AlertTriangle,
  ArrowUpCircle,
  GitBranch,
  Check,
  X,
  Lock,
  Cpu,
  Clock,
  HardDriveDownload,
  Info,
  ShieldAlert,
  Sliders,
  CheckCircle,
  FileText,
  Search
} from 'lucide-react';
import { generateSiteliftZip, downloadSiteliftZip } from '../services/phpZipGenerator';
import { storage } from '../services/storage';
import { AppVersionState, ReleaseSnapshot, GitHubReleaseInfo } from '../types';

interface DeploymentViewProps {
  initialTab?: 'updates' | 'package' | 'installer' | 'cli';
}

export const DeploymentView: React.FC<DeploymentViewProps> = ({ initialTab = 'updates' }) => {
  const [activeTab, setActiveTab] = useState<'updates' | 'package' | 'installer' | 'cli'>(initialTab);

  // Version Management State
  const [versionState, setVersionState] = useState<AppVersionState>(() => storage.getVersionState());
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateCheckMessage, setUpdateCheckMessage] = useState<string | null>(null);

  // Safe Update Modal State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStep, setUpdateStep] = useState(1);
  const [updateLogs, setUpdateLogs] = useState<string[]>([]);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Rollback Modal State
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [selectedRollbackSnapshot, setSelectedRollbackSnapshot] = useState<ReleaseSnapshot | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Manual Snapshot Modal State
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotNotes, setSnapshotNotes] = useState('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);

  // Package & ZIP State
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedFilePath, setCopiedFilePath] = useState<string | null>(null);
  const [packageSearch, setPackageSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
  const [isMigrating, setIsMigrating] = useState(false);
  const [installerComplete, setInstallerComplete] = useState(false);

  const fileTree = [
    {
      id: 'updater',
      category: 'Safe Auto-Updater & Version Control',
      badge: 'Updater',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Zero-downtime atomic release updater with automatic snapshot backup & SHA-256 validation',
      files: [
        { path: 'update.php', label: 'Atomic GitHub Safe Updater & Rollback Engine (CLI/HTTP)', size: '12.4 KB', type: 'PHP' },
        { path: 'app/Services/ReleaseUpdater.php', label: 'Release Verification & Migration Runner', size: '8.2 KB', type: 'PHP' }
      ]
    },
    {
      id: 'installer',
      category: 'Web Installer Wizard',
      badge: 'Installer',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'Step-by-step browser wizard for PDO database verification & initial admin provisioning',
      files: [
        { path: 'public/install/index.php', label: 'Web Installer Wizard (PHP)', size: '14.1 KB', type: 'PHP' },
        { path: 'public/install/installer.css', label: 'Installer Bootstrap Theme', size: '6.8 KB', type: 'CSS' }
      ]
    },
    {
      id: 'migrations',
      category: 'Database Schema & Migrations',
      badge: 'MySQL',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'InnoDB database schema with compound indexes for fast SERP rank analytics',
      files: [
        { path: 'app/Database/Migrations/2026_01_01_000001_create_sitelift_tables.sql', label: 'MySQL Schema Migration (InnoDB)', size: '9.5 KB', type: 'SQL' },
        { path: 'app/Database/Migrations/2026_01_01_000002_add_cwv_fields.sql', label: 'Core Web Vitals & Rank Indexes', size: '3.1 KB', type: 'SQL' }
      ]
    },
    {
      id: 'cron',
      category: 'Cron Automation & Background Engine',
      badge: 'Automation',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Headless background runner for automated daily syncs & SERP rank crawlers',
      files: [
        { path: 'cron.php', label: 'Shared Hosting Cron Runner (Midnight Sync & SERP Tracker)', size: '7.9 KB', type: 'PHP' }
      ]
    },
    {
      id: 'services',
      category: 'PHP Business Logic & Scrapers',
      badge: 'Services',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: 'High-throughput SERP scraping algorithms & declining traffic calculation engine',
      files: [
        { path: 'app/Services/BrightDataSerpTracker.php', label: 'Bright Data SERP Scraper Service', size: '11.6 KB', type: 'PHP' },
        { path: 'app/Services/DecliningPagesEngine.php', label: 'Declining Pages Calculation Engine', size: '8.4 KB', type: 'PHP' }
      ]
    },
    {
      id: 'config',
      category: 'Web Server Configuration & Setup Guides',
      badge: 'Config',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      description: 'Apache rewrite rules, OAuth 2.0 configuration guide, and shared hosting documentation',
      files: [
        { path: '.htaccess', label: 'Apache .htaccess Security Rules', size: '1.2 KB', type: 'CONF' },
        { path: 'README.md', label: 'Shared Hosting Deployment Guide', size: '5.6 KB', type: 'MD' },
        { path: 'UPDATE_GUIDE.md', label: 'Safe Zero-Downtime Update Guide', size: '4.8 KB', type: 'MD' },
        { path: 'GOOGLE_OAUTH_SETUP.md', label: 'Google Cloud OAuth 2.0 Guide', size: '6.2 KB', type: 'MD' }
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
    { name: 'Writable Configuration Directory (/storage, /config)', status: '0755 Writable (Passed)', pass: true },
    { name: 'ZipArchive Extension (For Updates & Backups)', status: 'Loaded (Passed)', pass: true }
  ];

  const refreshVersionData = () => {
    setVersionState(storage.getVersionState());
  };

  // Check GitHub for Updates
  const handleCheckForUpdates = () => {
    setIsCheckingUpdates(true);
    setUpdateCheckMessage(null);

    setTimeout(() => {
      setIsCheckingUpdates(false);
      const state = storage.getVersionState();
      
      // If no release was set, simulate a new release available or confirm latest
      if (!state.latestAvailableRelease && state.currentVersion === 'v1.2.0') {
        const mockNewRelease: GitHubReleaseInfo = {
          tag_name: 'v1.3.0',
          name: 'Sitelift v1.3.0: Core Web Vitals Deep Inspector & Real-time SERP Crawler Turbo',
          published_at: '2026-08-22T18:45:00Z',
          body: '### What\'s New in v1.3.0\n- **Live Googlebot Simulator**: Instant CWV field inspection with Mobile & Desktop simulation.\n- **Atomic GitHub Auto-Updater**: Zero-downtime updates with automatic snapshot backups and 1-click rollback.\n- **Bright Data SERP Scraper V2**: High-concurrency query pipeline with zero IP rate limits.\n- **Enhanced Index Status Diagnostic**: Direct indexing request ping for discovered URLs.\n- **Security & Fixes**: Upgraded PDO MySQL connection pooling and hardened session tokens.',
          html_url: `https://github.com/${state.githubRepo}/releases/tag/v1.3.0`,
          prerelease: false,
          zipball_url: `https://api.github.com/repos/${state.githubRepo}/zipball/v1.3.0`,
          tarball_url: `https://api.github.com/repos/${state.githubRepo}/tarball/v1.3.0`,
          assets: [
            {
              name: 'sitelift-v1.3.0-production.zip',
              browser_download_url: `https://github.com/${state.githubRepo}/releases/download/v1.3.0/sitelift-v1.3.0-production.zip`,
              size: 4194304
            }
          ]
        };
        state.latestAvailableRelease = mockNewRelease;
        state.lastCheckedAt = new Date().toISOString();
        storage.saveVersionState(state);
        setVersionState(state);
        setUpdateCheckMessage('A new release is available on GitHub: v1.3.0');
      } else if (state.latestAvailableRelease) {
        setUpdateCheckMessage(`New release ${state.latestAvailableRelease.tag_name} is ready to install!`);
      } else {
        state.lastCheckedAt = new Date().toISOString();
        storage.saveVersionState(state);
        setVersionState(state);
        setUpdateCheckMessage(`You are running the latest version (${state.currentVersion}).`);
      }
    }, 800);
  };

  // Safe Update Process Handler
  const handleStartSafeUpdate = () => {
    if (!versionState.latestAvailableRelease) return;
    setShowUpdateModal(true);
    setIsUpdating(true);
    setUpdateStep(1);
    setUpdateLogs([]);
    setUpdateSuccess(false);

    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setUpdateLogs([...logs]);
    };

    // Step 1: Pre-flight check
    addLog('Initiating Safe Atomic Update to ' + versionState.latestAvailableRelease.tag_name + '...');
    addLog('Running pre-flight checks: Verifying PHP 8.2+, ZipArchive, MySQL connection...');
    
    setTimeout(() => {
      setUpdateStep(2);
      addLog('✓ Pre-flight passed: All directories writable (/app, /config, /storage).');
      addLog(`Creating automated pre-update safety snapshot: snap-${versionState.currentVersion}-pre-update...`);
      addLog('Backing up database tables and configuration files into /storage/backups...');

      setTimeout(() => {
        setUpdateStep(3);
        addLog('✓ Snapshot successfully archived to storage (3.9 MB).');
        addLog(`Downloading release asset sitelift-${versionState.latestAvailableRelease?.tag_name}.zip from GitHub...`);
        addLog('Verifying SHA-256 cryptographic checksum against release manifest...');

        setTimeout(() => {
          setUpdateStep(4);
          addLog('✓ Checksum verified (e71b30c9df84...).');
          addLog('Extracting files atomically to temporary staging directory...');
          addLog('Preserving user configurations: .env, config.php, OAuth tokens, and storage caches...');
          addLog('Replacing application core files in public_html...');

          setTimeout(() => {
            setUpdateStep(5);
            addLog('✓ Core files safely updated.');
            addLog('Checking for pending database schema migrations...');
            addLog('Executing migration: 2026_01_01_000002_add_cwv_fields.sql on sitelift_db...');

            setTimeout(() => {
              setUpdateStep(6);
              addLog('✓ Database migration completed without errors.');
              addLog('Clearing OPcache, template cache, and internal route registry...');
              addLog('Running health check ping: HTTP 200 OK received.');
              addLog(`🎉 Upgrade complete! Sitelift is now running ${versionState.latestAvailableRelease?.tag_name}.`);

              // Persist update in storage
              if (versionState.latestAvailableRelease) {
                storage.applyUpdateToRelease(versionState.latestAvailableRelease);
                refreshVersionData();
              }
              setIsUpdating(false);
              setUpdateSuccess(true);
            }, 700);
          }, 700);
        }, 700);
      }, 700);
    }, 700);
  };

  // Safe Rollback Process Handler
  const handleOpenRollbackModal = (snapshot: ReleaseSnapshot) => {
    setSelectedRollbackSnapshot(snapshot);
    setShowRollbackModal(true);
  };

  const handleConfirmRollback = () => {
    if (!selectedRollbackSnapshot) return;
    setIsRollingBack(true);

    setTimeout(() => {
      storage.rollbackToSnapshot(selectedRollbackSnapshot.id);
      refreshVersionData();
      setIsRollingBack(false);
      setShowRollbackModal(false);
      setSelectedRollbackSnapshot(null);
    }, 1000);
  };

  // Create Manual Snapshot Handler
  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSnapshot(true);
    setTimeout(() => {
      storage.createBackupSnapshot(snapshotNotes || `Manual backup snapshot before server changes`, 'manual_snapshot');
      refreshVersionData();
      setIsCreatingSnapshot(false);
      setShowSnapshotModal(false);
      setSnapshotNotes('');
    }, 700);
  };

  // ZIP Download Handler
  const handleDownload = async () => {
    setIsZipping(true);
    setDownloadError('');
    try {
      await downloadSiteliftZip(`sitelift-${versionState.currentVersion}-production.zip`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
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
      
      {/* Top Banner & Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-xs">
              <FolderCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Deployment, Updates & Installation</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {versionState.currentVersion}
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Production deployment package, zero-downtime GitHub updates, instant rollback snapshots, and self-hosted installer.
              </p>
            </div>
          </div>

          {/* Action Buttons Below Description */}
          <div className="flex items-center gap-2.5 flex-wrap mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={handleCheckForUpdates}
              disabled={isCheckingUpdates}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 transition-all shadow-xs disabled:opacity-50"
              title="Check GitHub repository for new tagged releases"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
              <span>{isCheckingUpdates ? 'Checking GitHub...' : 'Check for Updates'}</span>
            </button>

            <button
              onClick={() => setShowSnapshotModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-xl text-xs font-bold text-purple-900 transition-all shadow-xs"
              title="Create a safety restore point before making code modifications"
            >
              <History className="w-3.5 h-3.5 text-purple-600" />
              <span>Create Backup Snapshot</span>
            </button>
          </div>
        </div>

        {/* Zero Data Loss Guarantee Banner */}
        <div className="flex items-start gap-2.5 text-xs text-emerald-900 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <strong className="text-emerald-950 font-bold">100% Data Preservation Guarantee:</strong> Updating to newer versions or reverting snapshots replaces application script files only. All your website properties, keyword tracking data, Google Search Console / GA4 integrations, historical rank logs, and database tables are <strong>completely safe and never wiped out</strong>.
          </div>
        </div>

        {/* Update Check Notification Toast if triggered */}
        {updateCheckMessage && (
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs font-semibold text-blue-900 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{updateCheckMessage}</span>
            </div>
            <button
              onClick={() => setUpdateCheckMessage(null)}
              className="text-blue-700 hover:text-blue-900 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Multi-Colored Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-2 rounded-2xl shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('updates')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'updates'
              ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-200'
              : 'text-slate-700 hover:bg-blue-50 hover:text-blue-900'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4 text-blue-300" />
          <span>Updates & GitHub Release Manager</span>
          {versionState.latestAvailableRelease && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ring-2 ring-white" title="New update available" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('package')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'package'
              ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-200'
              : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900'
          }`}
        >
          <FolderCode className="w-4 h-4 text-emerald-300" />
          <span>PHP Deployment Package & ZIP</span>
        </button>

        <button
          onClick={() => setActiveTab('installer')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'installer'
              ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-200'
              : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-300" />
          <span>Web Installer Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('cli')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'cli'
              ? 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-400'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4 text-slate-300" />
          <span>CLI Updater & Crontab</span>
        </button>
      </div>

      {/* TAB 1: UPDATES & GITHUB RELEASES */}
      {activeTab === 'updates' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Top Status Banner: Either New Release Available OR Up-To-Date */}
          {versionState.latestAvailableRelease ? (
            /* NEW RELEASE AVAILABLE BOX */
            <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-500 rounded-xl text-white shadow-xs mt-0.5">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
                        New Release Available on GitHub
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 font-mono">
                        {versionState.latestAvailableRelease.tag_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        (Current: <strong className="text-slate-800">{versionState.currentVersion}</strong>)
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {versionState.latestAvailableRelease.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Tagged on GitHub repo <code>{versionState.githubRepo}</code> • Published on {new Date(versionState.latestAvailableRelease.published_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Safe Update Trigger Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={versionState.latestAvailableRelease.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition shadow-xs"
                  >
                    <span>Release Notes</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={handleStartSafeUpdate}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>Safely Update to {versionState.latestAvailableRelease.tag_name}</span>
                  </button>
                </div>
              </div>

              {/* Release Changelog Box */}
              <div className="p-4 bg-white/90 border border-amber-200 rounded-xl text-xs text-slate-800 space-y-2">
                <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-amber-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  <span>Changelog & Release Details</span>
                </div>
                <div className="whitespace-pre-line text-slate-700 leading-relaxed text-[11px] font-sans">
                  {versionState.latestAvailableRelease.body}
                </div>
              </div>

              {/* Safe Update Guarantee Pill */}
              <div className="flex items-center gap-2 text-[11px] text-amber-900 bg-amber-100/60 p-2.5 rounded-xl border border-amber-200/80">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Zero-Downtime Guarantee:</strong> Updating automatically creates a restore snapshot of your current codebase ({versionState.currentVersion}) and database state before replacing core files. Your <code>.env</code> and custom configuration will never be overwritten.
                </span>
              </div>
            </div>
          ) : (
            /* UP TO DATE BOX */
            <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Sitelift is Up to Date
                    </h3>
                    <span className="px-2 py-0.2 rounded-full text-xs font-mono font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
                      {versionState.currentVersion}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Current Commit: <code className="font-mono">{versionState.currentCommit}</code> • Connected to GitHub <code>{versionState.githubRepo}</code> • Last checked: {new Date(versionState.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCheckForUpdates}
                disabled={isCheckingUpdates}
                className="px-4 py-2 bg-white hover:bg-emerald-100/50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                <span>Check GitHub Again</span>
              </button>
            </div>
          )}

          {/* Version History & Revert / Rollback Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-0">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-purple-600" />
                  <span>Version History & Rollback Snapshots</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revert to any previous version or snapshot with 1 click. Database schemas and files will be safely restored.
                </p>
              </div>

              <button
                onClick={() => setShowSnapshotModal(true)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <History className="w-3.5 h-3.5 text-purple-600" />
                <span>Take Snapshot Now</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Version & Build</th>
                    <th className="py-3 px-3">Type & Status</th>
                    <th className="py-3 px-3">Created Date</th>
                    <th className="py-3 px-3">Description / Changelog</th>
                    <th className="py-3 px-3">Archive Size</th>
                    <th className="py-3 px-4 text-right">Rollback / Revert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {versionState.snapshots.map(snapshot => (
                    <tr
                      key={snapshot.id}
                      className={`transition-colors ${
                        snapshot.isCurrent
                          ? 'bg-blue-50/40 font-medium'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Version & Build */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-900 text-xs">
                            {snapshot.version}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {snapshot.commitHash}
                          </span>
                        </div>
                      </td>

                      {/* Type & Status */}
                      <td className="py-3.5 px-3">
                        {snapshot.isCurrent ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active Version</span>
                          </span>
                        ) : snapshot.type === 'auto_backup' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 w-fit block">
                            Auto Pre-Update Backup
                          </span>
                        ) : snapshot.type === 'manual_snapshot' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 w-fit block">
                            Manual Snapshot
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 w-fit block">
                            Release Archive
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-3 text-slate-600 font-mono text-[11px]">
                        {new Date(snapshot.createdAt).toLocaleDateString()} {new Date(snapshot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-3 text-slate-700 text-xs max-w-xs">
                        <p className="line-clamp-2 leading-relaxed">{snapshot.notes}</p>
                      </td>

                      {/* Archive Size */}
                      <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px]">
                        {snapshot.archiveSize}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        {snapshot.isCurrent ? (
                          <span className="text-[11px] text-slate-400 italic">Currently Running</span>
                        ) : (
                          <button
                            onClick={() => handleOpenRollbackModal(snapshot)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 ml-auto"
                            title={`Rollback to ${snapshot.version}`}
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                            <span>Revert to {snapshot.version}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GitHub Webhook & Auto-Deployment Settings Card */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <span>GitHub Repository & Release Channel Settings</span>
              </div>
              <span className="text-xs text-slate-500">Live Sync Ready</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GitHub Repository Target</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={versionState.githubRepo}
                    onChange={e => {
                      const updated = { ...versionState, githubRepo: e.target.value };
                      setVersionState(updated);
                      storage.saveVersionState(updated);
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                  <a
                    href={`https://github.com/${versionState.githubRepo}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                    title="Open on GitHub"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Release Channel</label>
                <select
                  value={versionState.releaseChannel}
                  onChange={e => {
                    const updated = { ...versionState, releaseChannel: e.target.value as 'stable' | 'beta' };
                    setVersionState(updated);
                    storage.saveVersionState(updated);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="stable">Stable (Production Releases Only - Recommended)</option>
                  <option value="beta">Beta / Release Candidates (Early Feature Previews)</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PHP DEPLOYMENT PACKAGE & ZIP */}
      {activeTab === 'package' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Prominent Production Package Download Card */}
          <div className="p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border-2 border-blue-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                  Turnkey Package
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  sitelift-{versionState.currentVersion}-production.zip
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Self-Hosted Production Deployment ZIP
              </h3>
              <p className="text-xs text-slate-600 max-w-xl">
                Ready to unzip directly into cPanel <code>public_html</code> or VPS web root. Includes web installer, MySQL migrations, zero-downtime auto-updater, and Apache rewrite rules.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownload}
                disabled={isZipping}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${isZipping ? 'animate-bounce' : ''}`} />
                <span>{isZipping ? 'Generating Production ZIP...' : `Download ${versionState.currentVersion} ZIP Package`}</span>
              </button>
            </div>
          </div>

          {downloadSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-3 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>Download Initiated!</strong> Your browser has started downloading <code>sitelift-{versionState.currentVersion}-production.zip</code>. Upload and unzip to your web host's <code>public_html</code>, then open <code>/install</code> in your browser.
              </div>
            </div>
          )}

          {downloadError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-3 shadow-xs animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <strong>Download Error:</strong> {downloadError}
              </div>
            </div>
          )}

          {/* Architecture Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Server className="w-4 h-4 text-blue-600" />
                <span>Zero Node / Zero Docker</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Runs on standard PHP 8.2+ with Apache/Nginx. Requires no Node daemon, no Docker containers, and no root SSH access.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Standard MySQL 8 / MariaDB</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Uses standard PDO MySQL connection with automated index creation and migration scripts included in the zip.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Terminal className="w-4 h-4 text-purple-600" />
                <span>Standard cPanel Crontab</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                A single <code>cron.php</code> file invoked every 15 minutes handles daily GA4/GSC syncs, SERP scraping, and health audits.
              </p>
            </div>
          </div>

          {/* Source Code File Explorer - Fully Responsive & Searchable */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
            {/* Header with Title & Live Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <span>Generated Package Structure (Included in ZIP)</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Production files ready for instant deployment on shared hosting or VPS.
                </p>
              </div>

              {/* Search Bar & Stats */}
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={packageSearch}
                    onChange={e => setPackageSearch(e.target.value)}
                    placeholder="Search package files..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  />
                  {packageSearch && (
                    <button
                      onClick={() => setPackageSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="hidden md:inline-flex px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  12 Files
                </span>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Modules (12)
              </button>
              {fileTree.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.badge} ({cat.files.length})
                </button>
              ))}
            </div>

            {/* Responsive Categories Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
              {fileTree
                .filter(cat => selectedCategory === 'all' || cat.id === selectedCategory)
                .map(cat => {
                  const matchingFiles = cat.files.filter(f =>
                    !packageSearch.trim() ||
                    f.path.toLowerCase().includes(packageSearch.toLowerCase()) ||
                    f.label.toLowerCase().includes(packageSearch.toLowerCase())
                  );

                  if (matchingFiles.length === 0) return null;

                  return (
                    <div
                      key={cat.id}
                      className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        {/* Category Title & Badge */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider border shrink-0 ${cat.badgeColor}`}>
                              {cat.badge}
                            </span>
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {cat.category}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 shrink-0">
                            {matchingFiles.length} {matchingFiles.length === 1 ? 'file' : 'files'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-3 leading-snug">
                          {cat.description}
                        </p>

                        {/* File Cards List */}
                        <div className="space-y-2">
                          {matchingFiles.map((file, fIdx) => (
                            <div
                              key={fIdx}
                              className="p-2.5 bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 hover:shadow-xs transition-all space-y-1.5"
                            >
                              {/* Top row: Type Tag + Path + Size & Copy */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                                    file.type === 'PHP'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : file.type === 'SQL'
                                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                      : file.type === 'CSS'
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : file.type === 'CONF'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {file.type}
                                  </span>
                                  <span className="font-mono text-slate-900 text-xs font-bold truncate break-all" title={file.path}>
                                    {file.path}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                    {file.size}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(file.path);
                                      setCopiedFilePath(file.path);
                                      setTimeout(() => setCopiedFilePath(null), 1800);
                                    }}
                                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition"
                                    title="Copy file path"
                                  >
                                    {copiedFilePath === file.path ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Description */}
                              <div className="text-[11px] text-slate-600 leading-snug pl-0.5">
                                {file.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Crontab Instruction Card */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-600" />
              <span>Shared Hosting Crontab Command</span>
            </div>
            <p className="text-xs text-slate-600">
              Add this cron job in your cPanel / DirectAdmin Cron Jobs manager to run background synchronizations:
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-mono text-xs text-blue-900 font-semibold">
              <span className="truncate mr-2">*/15 * * * * /usr/bin/php /home/username/public_html/cron.php --token=d3b07384d113edec49eaa6238ad5ff00 &gt; /dev/null 2&gt;&amp;1</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('*/15 * * * * /usr/bin/php /home/username/public_html/cron.php --token=d3b07384d113edec49eaa6238ad5ff00 > /dev/null 2>&1');
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-[10px] font-sans font-bold transition-colors shrink-0 shadow-xs"
              >
                {copiedCode ? 'Copied!' : 'Copy Crontab'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: WEB INSTALLER SIMULATOR */}
      {activeTab === 'installer' && (
        <div className="flex items-center justify-center p-2 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden">
            
            {/* Wizard Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
                  S
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Sitelift Web Installer Wizard</h2>
                  <p className="text-xs text-slate-500">Step {step} of 4: Self-Hosted Production Setup</p>
                </div>
              </div>

              {/* Step Progress Indicators */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map(s => (
                  <div
                    key={s}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      s === step
                        ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-200'
                        : s < step
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
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
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    PHP Environment & Extension Checks
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Validating that your server satisfies all requirements for self-hosted execution.
                  </p>
                </div>

                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                  {requirements.map((req, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <span className="text-slate-800 font-medium">{req.name}</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all"
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
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    MySQL 8 / MariaDB Database Credentials
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter your database credentials or select a quick hosting preset.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500">Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDbHost('localhost');
                      setDbPort('3306');
                      setDbName('cpaneluser_sitelift');
                      setDbUser('cpaneluser_db');
                      setDbPrefix('sl_');
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
                  >
                    cPanel / Shared Host
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDbHost('127.0.0.1');
                      setDbPort('3306');
                      setDbName('sitelift');
                      setDbUser('root');
                      setDbPass('');
                      setDbPrefix('sl_');
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
                  >
                    Localhost (XAMPP)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Database Host</label>
                    <input
                      type="text"
                      value={dbHost}
                      onChange={e => { setDbHost(e.target.value); setDbConnected(false); }}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Database Port</label>
                    <input
                      type="text"
                      value={dbPort}
                      onChange={e => setDbPort(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Database Name</label>
                    <input
                      type="text"
                      value={dbName}
                      onChange={e => { setDbName(e.target.value); setDbConnected(false); }}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Table Prefix</label>
                    <input
                      type="text"
                      value={dbPrefix}
                      onChange={e => setDbPrefix(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Database User</label>
                    <input
                      type="text"
                      value={dbUser}
                      onChange={e => { setDbUser(e.target.value); setDbConnected(false); }}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Database Password</label>
                    <input
                      type="password"
                      value={dbPass}
                      onChange={e => { setDbPass(e.target.value); setDbConnected(false); }}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleTestDatabase}
                    disabled={isTestingDb}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      dbConnected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
                    <span>{isTestingDb ? 'Testing Connection...' : dbConnected ? '✓ Connection Verified' : 'Test PDO Connection'}</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all"
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
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Create Master SEO Administrator Account
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set up your primary login credentials for dashboard administration.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin Full Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Admin Password</label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Back
                  </button>

                  <button
                    onClick={handleRunMigration}
                    disabled={isMigrating}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all"
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
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 shadow-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">Sitelift Installation Successful!</h3>
                  <p className="text-xs text-slate-600">
                    Database tables created, default admin account registered, and encryption tokens initialized.
                  </p>
                </div>

                <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-1.5 text-xs font-mono">
                  <div className="text-slate-400 font-sans text-xs">cPanel / Server Cron Job:</div>
                  <div className="text-emerald-400 text-[11px] select-all break-all">
                    * * * * * php /home/username/public_html/cron.php --token=sl_cron_9f8e7d6c5b4a &gt;/dev/null 2&gt;&amp;1
                  </div>
                </div>

                {installerComplete && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 text-center font-bold">
                    Admin session initialized successfully!
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleFinishInstaller}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all"
                  >
                    Complete Setup & Verify Admin Session
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* TAB 4: CLI UPDATER & CRONTAB */}
      {activeTab === 'cli' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-600" />
                <span>Command Line Updater & Automated Webhooks</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Execute safe atomic updates directly via SSH or configure GitHub Actions to deploy releases automatically.
              </p>
            </div>

            {/* CLI Commands Box */}
            <div className="space-y-3">
              <div className="p-4 bg-slate-900 rounded-xl text-slate-200 font-mono text-xs space-y-2.5 shadow-inner">
                <div className="text-slate-400 text-[11px]"># 1. Check for new GitHub release:</div>
                <div className="text-emerald-400">php update.php --check</div>

                <div className="text-slate-400 text-[11px] pt-1"># 2. Safely perform atomic update with automatic snapshot creation:</div>
                <div className="text-emerald-400">php update.php --apply</div>

                <div className="text-slate-400 text-[11px] pt-1"># 3. Instant rollback to any previous version:</div>
                <div className="text-emerald-400">php update.php --rollback=v1.1.4</div>

                <div className="text-slate-400 text-[11px] pt-1"># 4. List all available backup restore snapshots:</div>
                <div className="text-emerald-400">php update.php --list-snapshots</div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('php update.php --check\nphp update.php --apply\nphp update.php --rollback=v1.1.4');
                    setCopiedCli(true);
                    setTimeout(() => setCopiedCli(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>{copiedCli ? 'Copied to Clipboard!' : 'Copy CLI Commands'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* GitHub Actions Webhook Instruction */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-purple-600" />
              <span>GitHub Actions Auto-Update Webhook Trigger</span>
            </div>
            <p className="text-xs text-slate-600">
              When a new release tag is pushed to your GitHub repository, you can configure GitHub Actions to trigger an encrypted HTTP webhook on your server:
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-purple-950 font-semibold break-all">
              POST https://yourdomain.com/update.php?webhook_secret=sec_a89f28014e39bc71&amp;action=safe_update
            </div>
          </div>
        </div>
      )}

      {/* SAFE UPDATE PROGRESS MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden space-y-0 animate-in zoom-in-95 duration-150">
            
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 rounded-xl text-white">
                  <ArrowUpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {updateSuccess ? 'Update Successfully Completed' : 'Executing Safe Atomic Update'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Upgrading from {versionState.currentVersion} → {versionState.latestAvailableRelease?.tag_name || 'Latest'}
                  </p>
                </div>
              </div>

              {!isUpdating && (
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-5 space-y-4">
              
              {/* Stepper Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Step {updateStep} of 6</span>
                  <span>{updateSuccess ? '100% Completed' : `${Math.round((updateStep / 6) * 100)}%`}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      updateSuccess ? 'bg-emerald-500 w-full' : 'bg-amber-500'
                    }`}
                    style={{ width: updateSuccess ? '100%' : `${(updateStep / 6) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step Checklist */}
              <div className="space-y-1.5 text-xs">
                {[
                  { step: 1, label: 'Pre-flight system & writable directory check' },
                  { step: 2, label: `Created safety rollback snapshot (snap-${versionState.currentVersion}-pre-update)` },
                  { step: 3, label: 'Downloaded GitHub release asset & verified SHA-256' },
                  { step: 4, label: 'Atomic core file extraction (preserved .env & configs)' },
                  { step: 5, label: 'Database schema migration executed' },
                  { step: 6, label: 'Cache cleared & health ping verified (200 OK)' }
                ].map(item => (
                  <div
                    key={item.step}
                    className={`p-2 rounded-lg flex items-center justify-between transition-colors ${
                      updateStep > item.step || updateSuccess
                        ? 'bg-emerald-50 text-emerald-900 font-semibold'
                        : updateStep === item.step
                        ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                        : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    <span>{item.label}</span>
                    {updateStep > item.step || updateSuccess ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : updateStep === item.step ? (
                      <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">Pending</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Console Output Log Terminal */}
              <div className="p-3 bg-slate-900 text-slate-300 font-mono text-[11px] rounded-xl h-32 overflow-y-auto space-y-1 custom-scrollbar">
                {updateLogs.map((log, idx) => (
                  <div key={idx} className={log.includes('✓') ? 'text-emerald-400' : log.includes('🎉') ? 'text-amber-300 font-bold' : ''}>
                    {log}
                  </div>
                ))}
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                disabled={isUpdating}
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
              >
                {updateSuccess ? 'Close & Continue' : 'Cancel Update'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ROLLBACK CONFIRMATION MODAL */}
      {showRollbackModal && selectedRollbackSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 rounded-xl text-rose-700 shrink-0">
                <RotateCcw className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Revert Codebase to {selectedRollbackSnapshot.version}?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Snapshot ID: <code className="font-mono">{selectedRollbackSnapshot.id}</code> (Commit: {selectedRollbackSnapshot.commitHash})
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
                <span>Safe Rollback Guarantee:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-rose-800 text-[11px] leading-relaxed">
                <li>A pre-rollback safety snapshot of your current active version ({versionState.currentVersion}) will be saved automatically.</li>
                <li>Application files will be restored to the state of {selectedRollbackSnapshot.version}.</li>
                <li>Your database configurations and user sessions will remain intact.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={isRollingBack}
                onClick={() => setShowRollbackModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>

              <button
                disabled={isRollingBack}
                onClick={handleConfirmRollback}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRollingBack ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Restoring {selectedRollbackSnapshot.version}...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm Rollback to {selectedRollbackSnapshot.version}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MANUAL SNAPSHOT MODAL */}
      {showSnapshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-600 rounded-xl text-white">
                  <History className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Create Backup Snapshot Point
                </h3>
              </div>
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Active Version</label>
                <input
                  type="text"
                  disabled
                  value={`${versionState.currentVersion} (Commit: ${versionState.currentCommit})`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-mono text-slate-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Snapshot Notes / Description</label>
                <textarea
                  placeholder="e.g. Pre-customization backup before editing PHP scrapers or running test migrations..."
                  value={snapshotNotes}
                  onChange={e => setSnapshotNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSnapshotModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSnapshot}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  {isCreatingSnapshot ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Snapshot...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Snapshot</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
