import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Key,
  Database,
  CheckCircle2,
  Copy,
  Clock,
  Trash2,
  RefreshCw,
  Sliders,
  Sparkles,
  Bot,
  Eye,
  EyeOff,
  Cpu,
  Info
} from 'lucide-react';
import { AppSettings, AiSettings } from '../types';
import { storage } from '../services/storage';

interface SettingsViewProps {
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefresh }) => {
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [savedMessage, setSavedMessage] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Form State
  const [appName, setAppName] = useState(settings.appName);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [googleClientId, setGoogleClientId] = useState(settings.googleClientId || '');
  const [googleClientSecret, setGoogleClientSecret] = useState(settings.googleClientSecret || '');
  const [brightDataApiToken, setBrightDataApiToken] = useState(settings.brightDataApiToken || '');
  const [brightDataZone, setBrightDataZone] = useState(settings.brightDataZone || 'serp_api1');
  const [cronSecretToken, setCronSecretToken] = useState(settings.cronSecretToken);
  const [dailyMetricsDays, setDailyMetricsDays] = useState(settings.defaultRetentionDaysDailyMetrics || 365);
  const [gscQueryDays, setGscQueryDays] = useState(settings.defaultRetentionDaysGscQueries || 180);
  const [rankSnapshotDays, setRankSnapshotDays] = useState(settings.defaultRetentionDaysRankSnapshots || 730);
  const [syncLogsDays, setSyncLogsDays] = useState(settings.defaultRetentionDaysSyncLogs || 60);

  // AI Tool Settings State
  const existingAi = settings.aiSettings || {
    enabled: true,
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.5-flash',
    customEndpoint: '',
    temperature: 0.7
  };

  const [aiEnabled, setAiEnabled] = useState(existingAi.enabled ?? true);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'anthropic' | 'custom'>(existingAi.provider || 'gemini');
  const [aiApiKey, setAiApiKey] = useState(existingAi.apiKey || '');
  const [aiModel, setAiModel] = useState(existingAi.model || (existingAi.provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'));
  const [aiEndpoint, setAiEndpoint] = useState(existingAi.customEndpoint || '');
  const [aiTemperature, setAiTemperature] = useState(existingAi.temperature || 0.7);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedAiSettings: AiSettings = {
      enabled: aiEnabled,
      provider: aiProvider,
      apiKey: aiApiKey.trim(),
      model: aiModel.trim() || (aiProvider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'),
      customEndpoint: aiEndpoint.trim(),
      temperature: Number(aiTemperature)
    };

    const updated: AppSettings = {
      ...settings,
      appName,
      timezone,
      googleClientId,
      googleClientSecret,
      brightDataApiToken,
      brightDataZone,
      cronSecretToken,
      defaultRetentionDaysDailyMetrics: Number(dailyMetricsDays),
      defaultRetentionDaysGscQueries: Number(gscQueryDays),
      defaultRetentionDaysRankSnapshots: Number(rankSnapshotDays),
      defaultRetentionDaysSyncLogs: Number(syncLogsDays),
      aiSettings: updatedAiSettings
    };

    storage.saveSettings(updated);
    setSettings(updated);
    setSavedMessage('Settings and AI Tool configuration successfully saved.');
    setTimeout(() => setSavedMessage(''), 3500);
    onRefresh();
  };

  const handleCopyCronToken = () => {
    navigator.clipboard.writeText(cronSecretToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleGenerateNewToken = () => {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setCronSecretToken(randomHex);
  };

  const [showResetModal, setShowResetModal] = useState(false);

  const confirmReset = () => {
    storage.resetToDefaults();
    setShowResetModal(false);
    setSavedMessage('Database reset to fresh defaults.');
    setTimeout(() => {
      setSavedMessage('');
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          Application & System Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure Google OAuth credentials, Bright Data SERP scraper keys, AI generation models, cron tokens, and database retention policies.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 flex items-center gap-2 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: AI Tool API Configuration (Strictly Task Planning & Report Summaries) */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                AI Tool API Configuration (Task Planning & Executive Reports)
              </h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-slate-300 font-medium">{aiEnabled ? 'Enabled' : 'Disabled'}</span>
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={e => setAiEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white/10 border-white/20"
              />
            </label>
          </div>

          <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong className="text-white">Strict Boundary:</strong> This AI tool is utilized <em>solely</em> for generating creative SEO task action items in the Monthly Activity Planner and synthesizing executive report narratives. All core traffic analytics, impressions, CTR, SERP positions, and diagnostics remain 100% fetched directly from GA4, GSC, and Rank tracking APIs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">AI Provider</label>
              <select
                value={aiProvider}
                onChange={e => {
                  const p = e.target.value as any;
                  setAiProvider(p);
                  if (p === 'gemini') setAiModel('gemini-2.5-flash');
                  else if (p === 'openai') setAiModel('gpt-4o-mini');
                  else if (p === 'anthropic') setAiModel('claude-3-5-sonnet');
                }}
                className="w-full px-3.5 py-2 bg-[#0f172a] border border-white/10 rounded-xl text-white focus:border-indigo-400 focus:outline-none"
              >
                <option value="gemini">Google Gemini API (Recommended)</option>
                <option value="openai">OpenAI (ChatGPT / GPT-4o)</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="custom">Custom / OpenAI-Compatible Proxy</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Model Identifier</label>
              <input
                type="text"
                value={aiModel}
                onChange={e => setAiModel(e.target.value)}
                placeholder="e.g. gemini-2.5-flash or gpt-4o-mini"
                className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-400 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">AI API Key / Access Token</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={aiApiKey}
                  onChange={e => setAiApiKey(e.target.value)}
                  placeholder="AIzaSy... or sk-..."
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:border-indigo-400 focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Custom API Base URL (Optional)</label>
              <input
                type="text"
                value={aiEndpoint}
                onChange={e => setAiEndpoint(e.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
                className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: General & Cron Execution Security */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-xl">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            General & Cron Execution Security
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Application Name</label>
              <input
                type="text"
                value={appName}
                onChange={e => setAppName(e.target.value)}
                className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-400 focus:outline-none backdrop-blur-md"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Global System Timezone</label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#0f172a] border border-white/10 rounded-xl text-white focus:border-indigo-400 focus:outline-none"
              >
                <optgroup label="Universal">
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                </optgroup>
                <optgroup label="North & South America">
                  <option value="America/New_York">America/New_York (US Eastern - EST/EDT)</option>
                  <option value="America/Chicago">America/Chicago (US Central - CST/CDT)</option>
                  <option value="America/Denver">America/Denver (US Mountain - MST/MDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (US Pacific - PST/PDT)</option>
                  <option value="America/Anchorage">America/Anchorage (US Alaska)</option>
                  <option value="America/Honolulu">America/Honolulu (US Hawaii)</option>
                  <option value="America/Toronto">America/Toronto (Canada Eastern)</option>
                  <option value="America/Vancouver">America/Vancouver (Canada Pacific)</option>
                  <option value="America/Mexico_City">America/Mexico_City (Mexico)</option>
                  <option value="America/Sao_Paulo">America/Sao_Paulo (Brazil)</option>
                  <option value="America/Buenos_Aires">America/Buenos_Aires (Argentina)</option>
                  <option value="America/Bogota">America/Bogota (Colombia)</option>
                  <option value="America/Santiago">America/Santiago (Chile)</option>
                </optgroup>
                <optgroup label="Europe & Africa">
                  <option value="Europe/London">Europe/London (UK - GMT/BST)</option>
                  <option value="Europe/Dublin">Europe/Dublin (Ireland)</option>
                  <option value="Europe/Paris">Europe/Paris (France - CET/CEST)</option>
                  <option value="Europe/Berlin">Europe/Berlin (Germany - CET/CEST)</option>
                  <option value="Europe/Amsterdam">Europe/Amsterdam (Netherlands)</option>
                  <option value="Europe/Madrid">Europe/Madrid (Spain)</option>
                  <option value="Europe/Rome">Europe/Rome (Italy)</option>
                  <option value="Europe/Warsaw">Europe/Warsaw (Poland)</option>
                  <option value="Europe/Stockholm">Europe/Stockholm (Sweden)</option>
                  <option value="Europe/Zurich">Europe/Zurich (Switzerland)</option>
                  <option value="Europe/Athens">Europe/Athens (Greece - EET)</option>
                  <option value="Europe/Istanbul">Europe/Istanbul (Turkey)</option>
                  <option value="Europe/Moscow">Europe/Moscow (Russia MSK)</option>
                  <option value="Africa/Cairo">Africa/Cairo (Egypt)</option>
                  <option value="Africa/Johannesburg">Africa/Johannesburg (South Africa)</option>
                  <option value="Africa/Lagos">Africa/Lagos (Nigeria)</option>
                </optgroup>
                <optgroup label="Asia & Middle East">
                  <option value="Asia/Dubai">Asia/Dubai (UAE - GST)</option>
                  <option value="Asia/Riyadh">Asia/Riyadh (Saudi Arabia)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (India - IST)</option>
                  <option value="Asia/Karachi">Asia/Karachi (Pakistan)</option>
                  <option value="Asia/Dhaka">Asia/Dhaka (Bangladesh)</option>
                  <option value="Asia/Bangkok">Asia/Bangkok (Thailand / Indochina)</option>
                  <option value="Asia/Jakarta">Asia/Jakarta (Indonesia WIB)</option>
                  <option value="Asia/Singapore">Asia/Singapore (Singapore - SGT)</option>
                  <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (Malaysia)</option>
                  <option value="Asia/Hong_Kong">Asia/Hong_Kong (Hong Kong - HKT)</option>
                  <option value="Asia/Shanghai">Asia/Shanghai (China - CST)</option>
                  <option value="Asia/Taipei">Asia/Taipei (Taiwan)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (Japan - JST)</option>
                  <option value="Asia/Seoul">Asia/Seoul (South Korea - KST)</option>
                  <option value="Asia/Manila">Asia/Manila (Philippines)</option>
                </optgroup>
                <optgroup label="Australia & Oceania">
                  <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
                  <option value="Australia/Melbourne">Australia/Melbourne (AEST/AEDT)</option>
                  <option value="Australia/Brisbane">Australia/Brisbane (AEST)</option>
                  <option value="Australia/Adelaide">Australia/Adelaide (ACST/ACDT)</option>
                  <option value="Australia/Perth">Australia/Perth (AWST)</option>
                  <option value="Pacific/Auckland">Pacific/Auckland (New Zealand - NZST/NZDT)</option>
                  <option value="Pacific/Fiji">Pacific/Fiji</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Cron Secret Token */}
          <div className="pt-2">
            <label className="block text-slate-300 font-medium text-xs mb-1">
              Secret Cron Execution Token (Protects HTTP / CLI Cron Runner)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cronSecretToken}
                onChange={e => setCronSecretToken(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-mono backdrop-blur-md"
                required
              />
              <button
                type="button"
                onClick={handleCopyCronToken}
                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-200 flex items-center gap-1.5 backdrop-blur-md transition-all"
                title="Copy token"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>{copiedToken ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleGenerateNewToken}
                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-indigo-300 flex items-center gap-1.5 backdrop-blur-md transition-all"
                title="Generate new random token"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Generate</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-500 mt-1.5 block">
              cPanel cron command: <code className="text-indigo-400 font-mono">php /path/to/sitelift/cron.php token={cronSecretToken}</code>
            </span>
          </div>
        </div>

        {/* Section 3: External API Credentials */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-xl">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            API & Scraping Credentials
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Google OAuth Client ID</label>
              <input
                type="text"
                placeholder="123456789-abcdefg.apps.googleusercontent.com"
                value={googleClientId}
                onChange={e => setGoogleClientId(e.target.value)}
                className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono backdrop-blur-md"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Google OAuth Client Secret</label>
              <input
                type="password"
                placeholder="GOCSPX-************************"
                value={googleClientSecret}
                onChange={e => setGoogleClientSecret(e.target.value)}
                className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono backdrop-blur-md"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Bright Data API Token / Bearer Key</label>
              <input
                type="password"
                placeholder="bdt_api_************************"
                value={brightDataApiToken}
                onChange={e => setBrightDataApiToken(e.target.value)}
                className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono backdrop-blur-md"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Bright Data SERP Zone Identifier</label>
              <input
                type="text"
                placeholder="serp_api1"
                value={brightDataZone}
                onChange={e => setBrightDataZone(e.target.value)}
                className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono backdrop-blur-md"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Data Retention Controls */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-xl">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            MySQL Storage & Data Retention Automation
          </div>
          <p className="text-xs text-slate-400">
            Keep shared hosting database footprint compact. The daily cron job purges granular records older than these limits while preserving monthly report snapshots.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
              <label className="block text-slate-400 mb-1 font-medium">Daily Page Metrics</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={dailyMetricsDays}
                  onChange={e => setDailyMetricsDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#0f172a]/80 border border-white/10 rounded-lg text-white font-mono"
                />
                <span className="text-slate-500 font-medium">days</span>
              </div>
            </div>

            <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
              <label className="block text-slate-400 mb-1 font-medium">GSC Search Queries</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={gscQueryDays}
                  onChange={e => setGscQueryDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#0f172a]/80 border border-white/10 rounded-lg text-white font-mono"
                />
                <span className="text-slate-500 font-medium">days</span>
              </div>
            </div>

            <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
              <label className="block text-slate-400 mb-1 font-medium">SERP Rank History</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={rankSnapshotDays}
                  onChange={e => setRankSnapshotDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#0f172a]/80 border border-white/10 rounded-lg text-white font-mono"
                />
                <span className="text-slate-500 font-medium">days</span>
              </div>
            </div>

            <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
              <label className="block text-slate-400 mb-1 font-medium">Sync & Cron Logs</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={syncLogsDays}
                  onChange={e => setSyncLogsDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#0f172a]/80 border border-white/10 rounded-lg text-white font-mono"
                />
                <span className="text-slate-500 font-medium">days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save & Reset Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Demo DB</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 backdrop-blur-md transition-all"
          >
            Save All Settings
          </button>
        </div>

      </form>

      {/* Reset Database Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#0f172a]/95 border border-white/15 backdrop-blur-2xl rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Reset All Data to Defaults?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will restore all default metrics, decline history, tracked keywords, and activity logs. Any custom changes will be reset.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all"
              >
                Reset Database
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
