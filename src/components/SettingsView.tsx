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
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'custom'>(existingAi.provider || 'gemini');
  const [aiApiKey, setAiApiKey] = useState(existingAi.apiKey || '');
  const [aiModel, setAiModel] = useState(existingAi.model || (existingAi.provider === 'gemini' ? 'gemini-2.5-flash' : existingAi.provider === 'openrouter' ? 'openai/gpt-4o-mini' : 'gpt-4o-mini'));
  const [aiEndpoint, setAiEndpoint] = useState(existingAi.customEndpoint || '');
  const [aiTemperature, setAiTemperature] = useState(existingAi.temperature || 0.7);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedAiSettings: AiSettings = {
      enabled: aiEnabled,
      provider: aiProvider,
      apiKey: aiApiKey.trim(),
      model: aiModel.trim() || (aiProvider === 'gemini' ? 'gemini-2.5-flash' : aiProvider === 'openrouter' ? 'openai/gpt-4o-mini' : 'gpt-4o-mini'),
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
  const [showClearDemoModal, setShowClearDemoModal] = useState(false);

  // Clear demo data only (keeps all app configuration, API keys, OAuth, and any user-added websites/projects)
  const confirmClearDemoData = () => {
    const result = storage.clearDemoData();
    setShowClearDemoModal(false);
    setSavedMessage(
      result.customWebsitesKept > 0
        ? `Demo data removed! Kept ${result.customWebsitesKept} user project(s) and all app configuration.`
        : 'Demo data removed! App is now in fresh state ready for your projects. All configurations were preserved.'
    );
    setTimeout(() => {
      setSavedMessage('');
      window.location.reload();
    }, 1500);
  };

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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Application & System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure Google OAuth credentials, Bright Data SERP scraper keys, AI generation models, cron tokens, and database retention policies.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{savedMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: AI Tool API Configuration (Strictly Task Planning & Report Summaries) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                AI Tool API Configuration (Task Planning & Executive Reports)
              </h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-slate-700 font-bold">{aiEnabled ? 'Enabled' : 'Disabled'}</span>
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={e => setAiEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
            </label>
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-700">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong className="text-slate-900">Strict Boundary:</strong> This AI tool is utilized <em>solely</em> for generating creative SEO task action items in the Monthly Activity Planner and synthesizing executive report narratives. All core traffic analytics, impressions, CTR, SERP positions, and diagnostics remain 100% fetched directly from GA4, GSC, and Rank tracking APIs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">AI Provider</label>
              <select
                value={aiProvider}
                onChange={e => {
                  const p = e.target.value as any;
                  setAiProvider(p);
                  if (p === 'gemini') setAiModel('gemini-2.5-flash');
                  else if (p === 'openrouter') setAiModel('openai/gpt-4o-mini');
                  else if (p === 'openai') setAiModel('gpt-4o-mini');
                  else if (p === 'anthropic') setAiModel('claude-3-5-sonnet');
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="gemini">Google Gemini API (Recommended)</option>
                <option value="openrouter">OpenRouter (Access 100+ Models with 1 Key)</option>
                <option value="openai">OpenAI (ChatGPT / GPT-4o)</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="custom">Custom / OpenAI-Compatible Proxy</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Model Identifier</label>
              <input
                type="text"
                value={aiModel}
                onChange={e => setAiModel(e.target.value)}
                placeholder={
                  aiProvider === 'openrouter'
                    ? 'e.g. openai/gpt-4o-mini, anthropic/claude-3.5-sonnet, google/gemini-2.5-flash'
                    : aiProvider === 'gemini'
                    ? 'gemini-2.5-flash or gemini-1.5-pro'
                    : 'gpt-4o-mini or claude-3-5-sonnet'
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                {aiProvider === 'openrouter' ? 'OpenRouter API Key (sk-or-v1-...)' : 'AI API Key / Access Token'}
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={aiApiKey}
                  onChange={e => setAiApiKey(e.target.value)}
                  placeholder={
                    aiProvider === 'openrouter'
                      ? 'sk-or-v1-...'
                      : aiProvider === 'gemini'
                      ? 'AIzaSy...'
                      : 'sk-...'
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {aiProvider === 'openrouter' && (
                <p className="text-[10px] text-slate-500 mt-1">
                  Get your unified API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">openrouter.ai/keys</a>. Supports GPT-4o, Claude 3.5, Gemini 2.5, DeepSeek, and Llama 3 models.
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Custom API Base URL (Optional)</label>
              <input
                type="text"
                value={aiEndpoint}
                onChange={e => setAiEndpoint(e.target.value)}
                placeholder={
                  aiProvider === 'openrouter'
                    ? 'https://openrouter.ai/api/v1/chat/completions (Default)'
                    : 'https://api.openai.com/v1/chat/completions'
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: General & Cron Execution Security */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            General & Cron Execution Security
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Application Name</label>
              <input
                type="text"
                value={appName}
                onChange={e => setAppName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Global System Timezone</label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
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
            <label className="block text-slate-700 font-bold text-xs mb-1">
              Secret Cron Execution Token (Protects HTTP / CLI Cron Runner)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cronSecretToken}
                onChange={e => setCronSecretToken(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={handleCopyCronToken}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs text-slate-700 font-bold flex items-center gap-1.5 transition-all shadow-xs"
                title="Copy token"
              >
                <Copy className="w-3.5 h-3.5 text-blue-600" />
                <span>{copiedToken ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleGenerateNewToken}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs text-blue-800 font-bold flex items-center gap-1.5 transition-all shadow-xs"
                title="Generate new random token"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Generate</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-500 mt-1.5 block">
              cPanel cron command: <code className="text-blue-700 font-mono font-bold">php /path/to/sitelift/cron.php token={cronSecretToken}</code>
            </span>
          </div>
        </div>

        {/* Section 3: External API Credentials */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600" />
            API & Keyword Tracking Credentials
          </div>

          {/* Google OAuth Explanation Card */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 text-xs text-slate-700">
            <div className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>How Google OAuth Connects Your Projects</span>
            </div>
            <p className="leading-relaxed text-xs text-slate-700">
              The <strong>Google OAuth Client ID & Secret</strong> are configured globally once. This authorizes Sitelift to securely communicate with the Google Search Console and Google Analytics (GA4) APIs. After saving these credentials, you can connect each individual website in your portfolio to its specific GSC property and GA4 measurement property with 1-click under the <strong>Connections</strong> tab.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Google OAuth Client ID</label>
              <input
                type="text"
                placeholder="123456789-abcdefg.apps.googleusercontent.com"
                value={googleClientId}
                onChange={e => setGoogleClientId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Google OAuth Client Secret</label>
              <input
                type="password"
                placeholder="GOCSPX-************************"
                value={googleClientSecret}
                onChange={e => setGoogleClientSecret(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Keyword Tracking API Token (Bright Data / SERP Provider)</label>
              <input
                type="password"
                placeholder="bdt_api_************************"
                value={brightDataApiToken}
                onChange={e => setBrightDataApiToken(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Keyword Tracking Zone Identifier</label>
              <input
                type="text"
                placeholder="serp_api1"
                value={brightDataZone}
                onChange={e => setBrightDataZone(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Data Retention Controls */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-600" />
            MySQL Storage & Data Retention Automation
          </div>
          <p className="text-xs text-slate-600">
            Keep shared hosting database footprint compact. The daily cron job purges granular records older than these limits while preserving monthly report snapshots.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-slate-600 mb-1 font-bold">Daily Page Metrics</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={dailyMetricsDays}
                  onChange={e => setDailyMetricsDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                />
                <span className="text-slate-500 font-medium">days</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-slate-600 mb-1 font-bold">GSC Search Queries</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={gscQueryDays}
                  onChange={e => setGscQueryDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                />
                <span className="text-slate-500 font-medium">days</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-slate-600 mb-1 font-bold">SERP Rank History</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={rankSnapshotDays}
                  onChange={e => setRankSnapshotDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                />
                <span className="text-slate-500 font-medium">days</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-slate-600 mb-1 font-bold">Sync & Cron Logs</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={syncLogsDays}
                  onChange={e => setSyncLogsDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                />
                <span className="text-slate-500 font-medium">days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save & Reset Actions */}
        <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowClearDemoModal(true)}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              title="Delete all initial demo/sample data to start fresh, while keeping your app settings, API keys, and custom added projects"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Delete Demo Data</span>
            </button>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-700 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
              title="Reset everything back to factory demo state"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Demo DB</span>
            </button>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            Save All Settings
          </button>
        </div>

      </form>

      {/* Clear Demo Data Confirmation Modal */}
      {showClearDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-amber-800">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Trash2 className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delete Demo Data & Start Fresh?
                </h3>
                <p className="text-[11px] text-amber-800 font-medium">
                  Preserves your settings, keys, and user-added websites.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <p className="font-semibold text-slate-800">This action will:</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Remove demo sample websites (<em>Acme Corp, BrewCraft, NorthStar</em>) and their mock metrics.</li>
                <li>Remove demo keyword snapshots, mock GSC logs, sample decline history, and sample activity tasks.</li>
                <li><strong className="text-emerald-700">KEEP all your application settings, API keys (OpenRouter, Gemini, Google OAuth, Bright Data), cron tokens, and user logins intact.</strong></li>
                <li><strong className="text-emerald-700">KEEP any custom websites and projects you have added.</strong></li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearDemoModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearDemoData}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Demo Data Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Database Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Reset All Data to Demo Defaults?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will restore the original demo websites, demo metrics, and reset custom configuration to factory demo state.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                Reset to Demo State
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
