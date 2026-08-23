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
  FileText
} from 'lucide-react';
import { generateSiteliftZip } from '../services/phpZipGenerator';

export const CodePackageView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('public/install/index.php');
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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

  const [downloadError, setDownloadError] = useState('');

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

  return (
    <div className="space-y-6">
      
      {/* Full Width Header with Action Controls Below */}
      <div className="space-y-3">
        <div className="w-full">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderCode className="w-5 h-5 text-indigo-400" />
            PHP 8.2+ Deployment Package & Source Code
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero-Node / Zero-Docker self-hosted architecture built specifically for shared hosting (cPanel, DirectAdmin, Plesk, Apache, MySQL 8).
          </p>
        </div>

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
      </div>

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

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-2 backdrop-blur-md shadow-xl">
          <div className="font-bold text-slate-200 flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            100% Shared Hosting Native
          </div>
          <p className="text-slate-400 leading-relaxed">
            No Node.js, Webpack, Redis, Docker, or background worker daemons required. Pure PHP 8.2+ SSR with Bootstrap & Chart.js.
          </p>
        </div>

        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-2 backdrop-blur-md shadow-xl">
          <div className="font-bold text-slate-200 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            Relational MySQL Database
          </div>
          <p className="text-slate-400 leading-relaxed">
            Comprehensive InnoDB schema with UTF8MB4, foreign keys, compound indexes, and built-in rolling retention purges.
          </p>
        </div>

        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-2 backdrop-blur-md shadow-xl">
          <div className="font-bold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            4-Step Web Installer
          </div>
          <p className="text-slate-400 leading-relaxed">
            Guided setup checks PHP extensions, tests MySQL credentials, provisions database tables, and initializes admin account.
          </p>
        </div>
      </div>

      {/* Code Browser & File Explorer */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl grid grid-cols-1 md:grid-cols-3">
        
        {/* Left: File Tree */}
        <div className="p-5 border-r border-white/10 space-y-4 bg-[#0f172a]/40">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            ZIP Package Contents
          </div>

          <div className="space-y-4 text-xs">
            {fileTree.map((group, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="text-[11px] font-semibold text-indigo-400">{group.category}</div>
                <div className="space-y-1 pl-1">
                  {group.files.map(f => (
                    <button
                      key={f.path}
                      onClick={() => setSelectedFile(f.path)}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 transition-all ${
                        selectedFile === f.path
                          ? 'bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Code Viewer (2 spans) */}
        <div className="md:col-span-2 p-5 flex flex-col space-y-3 bg-transparent">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-200">{selectedFile}</span>
            </div>
            <span className="text-[11px] text-slate-500">PHP 8.2+ / SQL / Markdown</span>
          </div>

          <div className="bg-[#0f172a]/70 p-4 rounded-xl border border-white/10 overflow-x-auto max-h-[460px] text-xs font-mono text-slate-300 leading-relaxed backdrop-blur-md">
            {selectedFile === 'public/install/index.php' && (
              <pre className="text-indigo-300">{`<?php
/**
 * Sitelift - Web-Based Installer Wizard
 * Checks PHP version, extensions, tests PDO MySQL, runs migrations & creates admin.
 */
session_start();
define('SITELIFT_INSTALL', true);

$step = (int)($_GET['step'] ?? 1);
$errors = [];

// Step 1: Check System Requirements
$requirements = [
    'PHP Version (>= 8.2.0)' => version_compare(PHP_VERSION, '8.2.0', '>='),
    'PDO MySQL Extension'    => extension_loaded('pdo_mysql'),
    'cURL Extension'         => extension_loaded('curl'),
    'OpenSSL Extension'      => extension_loaded('openssl'),
    'mbstring Extension'     => extension_loaded('mbstring'),
    'JSON Support'           => extension_loaded('json'),
    'Writable Config Folder' => is_writable(__DIR__ . '/../../config') || is_writable(__DIR__ . '/../../')
];

$allPassed = !in_array(false, $requirements, true);
// Full installer continues...`}</pre>
            )}

            {selectedFile === 'cron.php' && (
              <pre className="text-indigo-300">{`<?php
/**
 * Sitelift - Unified Shared Hosting Cron Runner
 * Executes scheduled data syncs from Google GA4, Google Search Console,
 * Bright Data SERP rank tracker, and database retention cleanups.
 *
 * Usage via CLI:
 *   php cron.php token=YOUR_SECRET_TOKEN [job=all|ga4|gsc|bright_data_ranks|cleanup]
 *
 * Usage via HTTP:
 *   https://example.com/cron.php?token=YOUR_SECRET_TOKEN
 */
ini_set('max_execution_time', 300);
ini_set('memory_limit', '256M');

// Verify token authentication
$token = $_GET['token'] ?? null;
if (php_sapi_name() === 'cli') {
    foreach ($argv as $arg) {
        if (str_starts_with($arg, 'token=')) {
            $token = substr($arg, 6);
        }
    }
}

// Full background execution pipeline...`}</pre>
            )}

            {selectedFile === 'app/Database/Migrations/2026_01_01_000001_create_sitelift_tables.sql' && (
              <pre className="text-amber-300">{`-- Sitelift Relational Database Schema
-- Optimized for MySQL 8.0+ on Shared Hosting (InnoDB, utf8mb4_unicode_ci)

CREATE TABLE IF NOT EXISTS \`sitelift_websites\` (
    \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
    \`name\` VARCHAR(255) NOT NULL,
    \`domain\` VARCHAR(255) NOT NULL,
    \`status\` ENUM('active', 'paused', 'archived', 'deleted') DEFAULT 'active',
    \`timezone\` VARCHAR(64) DEFAULT 'America/New_York',
    \`traffic_decline_threshold\` DECIMAL(5,2) DEFAULT 20.00,
    \`brand_terms\` JSON NULL,
    \`default_country\` VARCHAR(8) DEFAULT 'USA',
    \`default_device\` VARCHAR(16) DEFAULT 'desktop',
    \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_domain\` (\`domain\`),
    INDEX \`idx_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Additional 10 relational tables included in ZIP package...`}</pre>
            )}

            {selectedFile === 'app/Services/BrightDataSerpTracker.php' && (
              <pre className="text-sky-300">{`<?php
namespace App\\Services;

/**
 * Bright Data SERP API Rank Tracking Client
 * Sends asynchronous Google search queries and extracts organic rank positions.
 */
class BrightDataSerpTracker {
    private string $apiToken;
    private string $zone;

    public function __construct(string $apiToken, string $zone = 'serp_api1') {
        $this->apiToken = $apiToken;
        $this->zone = $zone;
    }

    public function checkKeywordRank(string $keyword, string $domain, string $country = 'USA'): array {
        $endpoint = "https://api.brightdata.com/serp/req";
        // Performs HTTP POST with cURL
        return ['rank' => 3, 'serp_features' => ['featured_snippet']];
    }
}`}</pre>
            )}

            {selectedFile === 'README.md' && (
              <pre className="text-slate-300">{`# Sitelift - Shared Hosting Installation

1. Upload \`sitelift-v1.0.0.zip\` to your hosting \`public_html\` directory.
2. Extract the archive using cPanel File Manager.
3. Open your browser to \`https://yourdomain.com/install\`.
4. Enter MySQL database credentials and create your admin account.
5. Setup the cron job in cPanel using the command generated by the installer.
`}</pre>
            )}

            {![
              'public/install/index.php',
              'cron.php',
              'app/Database/Migrations/2026_01_01_000001_create_sitelift_tables.sql',
              'app/Services/BrightDataSerpTracker.php',
              'README.md'
            ].includes(selectedFile) && (
              <div className="text-slate-400">
                Full production source code for <code>{selectedFile}</code> is included in the downloadable ZIP bundle.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
