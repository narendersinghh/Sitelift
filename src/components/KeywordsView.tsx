import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Plus,
  FileSpreadsheet,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  Play,
  CheckCircle2,
  Trash2,
  Edit2,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  HelpCircle,
  BarChart3,
  Smartphone,
  Monitor,
  Globe
} from 'lucide-react';
import { Website, Keyword, KeywordPriority, KeywordIntent, KeywordStatus } from '../types';
import { storage } from '../services/storage';
import { KeywordResearchModal } from './KeywordResearchModal';
import { ALL_COUNTRIES, ALL_TIMEZONES } from '../data/geoConstants';

interface KeywordsViewProps {
  website: Website;
  onRefresh: () => void;
}

export const KeywordsView: React.FC<KeywordsViewProps> = ({ website, onRefresh }) => {
  const [keywords, setKeywords] = useState<Keyword[]>(() => storage.getKeywords(website.id));
  const [selectedKeywordForResearch, setSelectedKeywordForResearch] = useState<Keyword | null>(null);

  useEffect(() => {
    setKeywords(storage.getKeywords(website.id));
  }, [website.id]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [intentFilter, setIntentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [brandFilter, setBrandFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [rankTrendFilter, setRankTrendFilter] = useState<'all' | 'improved' | 'declined' | 'stable'>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showGscImportModal, setShowGscImportModal] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingProgress, setTrackingProgress] = useState(0);

  // Add Single Keyword Form State - Mobile & India by default!
  const [newKeyword, setNewKeyword] = useState('');
  const [newTargetUrl, setNewTargetUrl] = useState(`https://${website.domain}/`);
  const [newPriority, setNewPriority] = useState<KeywordPriority>('medium');
  const [newCategory, setNewCategory] = useState('Commercial');
  const [newIntent, setNewIntent] = useState<KeywordIntent>('commercial');
  const [newTags, setNewTags] = useState('');
  const [newDevice, setNewDevice] = useState<'desktop' | 'mobile'>('mobile');
  const [newCountry, setNewCountry] = useState('IN');

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [csvDefaultCountry, setCsvDefaultCountry] = useState('IN');
  const [csvDefaultDevice, setCsvDefaultDevice] = useState<'desktop' | 'mobile'>('mobile');

  // GSC Metrics for Import
  const gscMetrics = storage.getGscMetrics(website.id);
  const topGscQueries = Array.from(new Set(gscMetrics.map(g => g.query))).slice(0, 15);

  const refreshList = () => {
    setKeywords(storage.getKeywords(website.id));
    onRefresh();
  };

  // Filtered List
  const filteredKeywords = keywords.filter(kw => {
    if (statusFilter !== 'all' && kw.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && kw.category !== categoryFilter) return false;
    if (intentFilter !== 'all' && kw.intent !== intentFilter) return false;
    if (deviceFilter !== 'all' && (kw.device || 'mobile') !== deviceFilter) return false;
    if (countryFilter !== 'all' && (kw.country || 'IN') !== countryFilter) return false;
    if (brandFilter === 'branded' && !kw.isBranded) return false;
    if (brandFilter === 'non_branded' && kw.isBranded) return false;
    
    // Rank Movement / Trend Filter
    if (rankTrendFilter === 'improved') {
      if (!kw.currentRank || !kw.previousRank || kw.currentRank >= kw.previousRank) return false;
    } else if (rankTrendFilter === 'declined') {
      if (!kw.currentRank || !kw.previousRank || kw.currentRank <= kw.previousRank) return false;
    } else if (rankTrendFilter === 'stable') {
      // Stable means rank is tracked and hasn't changed or has 0 delta
      if (!kw.currentRank) return false;
      if (kw.previousRank != null && kw.currentRank !== kw.previousRank) return false;
    }

    if (searchQuery && !kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Calculate Metrics
  const activeKeywords = keywords.filter(k => k.status === 'active');
  const top3 = activeKeywords.filter(k => k.currentRank && k.currentRank <= 3).length;
  const top10 = activeKeywords.filter(k => k.currentRank && k.currentRank <= 10).length;
  const rankGains = activeKeywords.filter(k => k.currentRank && k.previousRank && k.currentRank < k.previousRank).length;
  const rankDrops = activeKeywords.filter(k => k.currentRank && k.previousRank && k.currentRank > k.previousRank).length;
  const rankStable = activeKeywords.filter(k => k.currentRank && (k.previousRank == null || k.currentRank === k.previousRank)).length;

  // Single Add Handler
  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    const isBranded = website.brandTerms.some(b => newKeyword.toLowerCase().includes(b.toLowerCase()));

    const kw: Keyword = {
      id: `kw-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      websiteId: website.id,
      keyword: newKeyword.trim(),
      targetUrl: newTargetUrl.trim(),
      priority: newPriority,
      category: newCategory,
      intent: newIntent,
      tags: newTags ? newTags.split(',').map(t => t.trim()) : [],
      country: newCountry,
      language: 'en',
      device: newDevice,
      status: 'active',
      isBranded,
      currentRank: null,
      previousRank: null,
      bestRank: null,
      lastTrackedAt: null,
      createdAt: new Date().toISOString()
    };

    storage.saveKeyword(kw);
    setNewKeyword('');
    setShowAddModal(false);
    refreshList();
  };

  // CSV Import Handler
  const handleCsvImport = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = csvText.split('\n').filter(l => l.trim().length > 0);

    lines.forEach(line => {
      const parts = line.split(',').map(p => p.trim());
      if (!parts[0]) return;

      const kwText = parts[0];
      const targetUrl = parts[1] || `https://${website.domain}/`;
      const cat = parts[2] || 'Commercial';
      const isBranded = website.brandTerms.some(b => kwText.toLowerCase().includes(b.toLowerCase()));

      const kw: Keyword = {
        id: `kw-csv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        websiteId: website.id,
        keyword: kwText,
        targetUrl,
        priority: 'medium',
        category: cat,
        intent: 'informational',
        tags: ['csv-import'],
        country: csvDefaultCountry || 'IN',
        language: 'en',
        device: csvDefaultDevice || 'mobile',
        status: 'active',
        isBranded,
        currentRank: Math.floor(Math.random() * 25) + 3,
        previousRank: null,
        bestRank: null,
        lastTrackedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      storage.saveKeyword(kw);
    });

    setCsvText('');
    setShowCsvModal(false);
    refreshList();
  };

  // Quick import from GSC query
  const handleImportGscQuery = (query: string) => {
    const isBranded = website.brandTerms.some(b => query.toLowerCase().includes(b.toLowerCase()));
    const kw: Keyword = {
      id: `kw-gsc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      websiteId: website.id,
      keyword: query,
      targetUrl: `https://${website.domain}/`,
      priority: 'high',
      category: isBranded ? 'Brand' : 'Commercial',
      intent: isBranded ? 'navigational' : 'commercial',
      tags: ['gsc-import'],
      country: 'IN', // Default India
      language: 'en',
      device: 'mobile', // Default Mobile
      status: 'active',
      isBranded,
      currentRank: Math.floor(Math.random() * 15) + 2,
      previousRank: null,
      bestRank: null,
      lastTrackedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    storage.saveKeyword(kw);
    refreshList();
  };

  // Run Bright Data Rank Check Simulation based on keyword country & device
  const handleRunRankCheck = () => {
    setIsTracking(true);
    setTrackingProgress(10);

    setTimeout(() => setTrackingProgress(50), 600);
    setTimeout(() => {
      setTrackingProgress(100);
      const todayStr = new Date().toISOString().slice(0, 10);
      
      // Fluctuate ranks for active keywords and save date-wise snapshots
      const currentList = storage.getKeywords(website.id);
      currentList.forEach(k => {
        if (k.status === 'active') {
          const oldRank = k.currentRank || 14;
          const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
          const newRank = Math.max(1, Math.min(80, oldRank + delta));
          const rankChange = oldRank - newRank;

          storage.saveKeyword({
            ...k,
            previousRank: oldRank,
            currentRank: newRank,
            bestRank: k.bestRank ? Math.min(k.bestRank, newRank) : newRank,
            lastTrackedAt: new Date().toISOString()
          });

          storage.saveRankSnapshot({
            id: `snap-${k.id}-${Date.now()}`,
            keywordId: k.id,
            websiteId: website.id,
            snapshotDate: todayStr,
            keyword: k.keyword,
            rank: newRank,
            previousRank: oldRank,
            rankChange,
            rankedUrl: k.targetUrl,
            country: k.country || 'IN',
            language: k.language || 'en',
            device: k.device || 'mobile',
            serpFeatures: k.serpFeatures
          });
        }
      });

      setIsTracking(false);
      refreshList();
    }, 1400);
  };

  const handleDeleteKeyword = (id: string) => {
    storage.deleteKeyword(id);
    refreshList();
  };

  const getCountryName = (code?: string) => {
    if (!code) return 'India (IN)';
    const found = ALL_COUNTRIES.find(c => c.code.toLowerCase() === code.toLowerCase());
    return found ? `${found.name} (${found.code})` : code;
  };

  return (
    <div className="space-y-6">
      
      {/* Full Width Header with Action Controls Below */}
      <div className="space-y-3">
        <div className="w-full">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-600" />
            Keyword Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track organic SERP ranks with keyword-specific country geo-targets and device simulation (Mobile / Desktop).
          </p>
        </div>

        {/* Action Buttons Row directly below Description */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <button
            onClick={handleRunRankCheck}
            disabled={isTracking || keywords.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            title="Execute on-demand SERP check"
          >
            <Play className={`w-3.5 h-3.5 ${isTracking ? 'animate-spin' : ''}`} />
            <span>{isTracking ? `Checking SERP (${trackingProgress}%)...` : 'Run SERP Check'}</span>
          </button>

          <button
            onClick={() => setShowGscImportModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Import GSC</span>
          </button>

          <button
            onClick={() => setShowCsvModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Import</span>
          </button>

          <button
            onClick={() => {
              setNewKeyword('');
              setNewCountry('IN');
              setNewDevice('mobile');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Keyword</span>
          </button>
        </div>
      </div>

      {/* Multi-Color Metric Cards (Clickable to Filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setRankTrendFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            rankTrendFilter === 'all'
              ? 'bg-blue-100/70 border-blue-400 ring-2 ring-blue-400'
              : 'bg-blue-50/60 border-blue-200 hover:bg-blue-100/50'
          }`}
        >
          <div className="text-xs text-blue-800 font-bold uppercase tracking-wider">Total Tracked</div>
          <div className="text-2xl font-extrabold text-blue-950 mt-1">{activeKeywords.length}</div>
          <div className="text-xs text-blue-700/80 mt-0.5 font-medium">All active keywords</div>
        </div>

        <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl shadow-xs">
          <div className="text-xs text-purple-800 font-bold uppercase tracking-wider">Top 3 & Top 10</div>
          <div className="text-2xl font-extrabold text-purple-950 mt-1">
            {top3} <span className="text-xs text-purple-600 font-medium">/ {top10}</span>
          </div>
          <div className="text-xs text-purple-700/80 mt-0.5 font-medium">Top SERP tiers</div>
        </div>

        <div
          onClick={() => setRankTrendFilter(rankTrendFilter === 'improved' ? 'all' : 'improved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            rankTrendFilter === 'improved'
              ? 'bg-emerald-100/80 border-emerald-500 ring-2 ring-emerald-400'
              : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/50'
          }`}
        >
          <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Improved (↑)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold">Gains</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-900 mt-1">+{rankGains}</div>
          <div className="text-xs text-emerald-700 mt-0.5 font-semibold">Gained higher rank</div>
        </div>

        <div
          onClick={() => setRankTrendFilter(rankTrendFilter === 'declined' ? 'all' : 'declined')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            rankTrendFilter === 'declined'
              ? 'bg-rose-100/80 border-rose-500 ring-2 ring-rose-400'
              : 'bg-rose-50/60 border-rose-200 hover:bg-rose-100/50'
          }`}
        >
          <div className="text-xs text-rose-800 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Declined (↓)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold">Drops</span>
          </div>
          <div className="text-2xl font-extrabold text-rose-900 mt-1">-{rankDrops}</div>
          <div className="text-xs text-rose-700 mt-0.5 font-semibold">Dropped in SERP</div>
        </div>

        <div
          onClick={() => setRankTrendFilter(rankTrendFilter === 'stable' ? 'all' : 'stable')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            rankTrendFilter === 'stable'
              ? 'bg-cyan-100/80 border-cyan-500 ring-2 ring-cyan-400'
              : 'bg-cyan-50/60 border-cyan-200 hover:bg-cyan-100/50'
          }`}
        >
          <div className="text-xs text-cyan-800 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Stable (=)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-200 text-cyan-900 font-bold">Neutral</span>
          </div>
          <div className="text-2xl font-extrabold text-cyan-950 mt-1">{rankStable}</div>
          <div className="text-xs text-cyan-700 mt-0.5 font-semibold">Position unchanged</div>
        </div>
      </div>

      {/* Filters Bar with Rank Movement Filter */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        {/* Multi-Colored Rank Movement Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Rank Trend:</span>

            <button
              onClick={() => setRankTrendFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                rankTrendFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
            >
              All Keywords ({activeKeywords.length})
            </button>

            <button
              onClick={() => setRankTrendFilter('improved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                rankTrendFilter === 'improved'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-200'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
              }`}
            >
              ↑ Improved Gains ({rankGains})
            </button>

            <button
              onClick={() => setRankTrendFilter('declined')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                rankTrendFilter === 'declined'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-200'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-200'
              }`}
            >
              ↓ Declined Drops ({rankDrops})
            </button>

            <button
              onClick={() => setRankTrendFilter('stable')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                rankTrendFilter === 'stable'
                  ? 'bg-cyan-600 text-white border-cyan-700 shadow-xs ring-2 ring-cyan-200'
                  : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border-cyan-200'
              }`}
            >
              = Stable Positions ({rankStable})
            </button>
          </div>

          <div className="text-xs font-bold text-slate-500">
            Showing <span className="text-slate-900">{filteredKeywords.length}</span> results
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tracked keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <select
              value={rankTrendFilter}
              onChange={e => setRankTrendFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Movements</option>
              <option value="improved">Improved (↑ Gains)</option>
              <option value="declined">Declined (↓ Drops)</option>
              <option value="stable">Stable (= No Change)</option>
            </select>
          </div>

          <div>
            <select
              value={deviceFilter}
              onChange={e => setDeviceFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 font-medium"
            >
              <option value="all">All Devices</option>
              <option value="mobile">Mobile</option>
              <option value="desktop">Desktop</option>
            </select>
          </div>

          <div>
            <select
              value={countryFilter}
              onChange={e => setCountryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 font-medium"
            >
              <option value="all">All Countries</option>
              <option value="IN">India (IN)</option>
              <option value="US">United States (US)</option>
              <option value="GB">United Kingdom (GB)</option>
              <option value="CA">Canada (CA)</option>
              <option value="AU">Australia (AU)</option>
              <option value="DE">Germany (DE)</option>
              <option value="FR">France (FR)</option>
              <option value="SG">Singapore (SG)</option>
              <option value="AE">UAE (AE)</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 font-medium"
            >
              <option value="all">All Categories</option>
              <option value="Commercial">Commercial</option>
              <option value="Informational">Informational</option>
              <option value="Comparison">Comparison</option>
              <option value="Brand">Brand</option>
            </select>
          </div>

          <div>
            <select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 font-medium"
            >
              <option value="all">All Intent</option>
              <option value="non_branded">Non-Brand</option>
              <option value="branded">Brand Phrases</option>
            </select>
          </div>

        </div>
      </div>

      {/* Keywords Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredKeywords.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <KeyRound className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <div className="text-sm font-semibold text-slate-800">No Keywords Match Filters</div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add keywords manually, import from GSC queries, or upload a CSV file to monitor mobile/desktop SERP ranks.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Keyword & Target URL</th>
                  <th className="py-3 px-3">Device & Geo</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Rank</th>
                  <th className="py-3 px-3 text-center">Change</th>
                  <th className="py-3 px-3 text-center">Best</th>
                  <th className="py-3 px-3">SERP Features</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredKeywords.map(kw => {
                  const rankChange = kw.previousRank && kw.currentRank ? kw.previousRank - kw.currentRank : 0;
                  const isGain = rankChange > 0;
                  const isLoss = rankChange < 0;

                  return (
                    <tr key={kw.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{kw.keyword}</span>
                          {kw.isBranded && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 font-bold">
                              Brand
                            </span>
                          )}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize font-semibold ${
                            kw.priority === 'critical' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                            kw.priority === 'high' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {kw.priority}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5 font-mono">
                          {kw.targetUrl.replace(/^https?:\/\/[^/]+/, '') || '/'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {kw.device === 'mobile' || !kw.device ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold" title="Mobile Crawler">
                              <Smartphone className="w-3 h-3 text-blue-600" />
                              <span>Mobile</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-semibold" title="Desktop Crawler">
                              <Monitor className="w-3 h-3 text-sky-600" />
                              <span>Desktop</span>
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-bold uppercase" title={getCountryName(kw.country)}>
                            {kw.country || 'IN'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[11px] font-medium text-slate-700 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">{kw.category}</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {kw.currentRank ? (
                          <span className={`font-extrabold text-sm ${
                            kw.currentRank <= 3 ? 'text-emerald-700' : kw.currentRank <= 10 ? 'text-purple-700' : 'text-slate-800'
                          }`}>
                            #{kw.currentRank}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">Unranked</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {rankChange !== 0 ? (
                          <span className={`inline-flex items-center gap-0.5 font-bold text-xs ${
                            isGain ? 'text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded' : 'text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded'
                          }`}>
                            {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {isGain ? `+${rankChange}` : rankChange}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center text-slate-600 font-mono font-semibold">
                        {kw.bestRank ? `#${kw.bestRank}` : '—'}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {kw.serpFeatures && kw.serpFeatures.length > 0 ? (
                            kw.serpFeatures.map((f, i) => (
                              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                                {f.replace('_', ' ')}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400">Standard organic</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedKeywordForResearch(kw)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-xs"
                            title="Open in-depth rank drop and SERP research"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Research & Plan</span>
                          </button>
                          <button
                            onClick={() => handleDeleteKeyword(kw.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Delete keyword"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Keyword Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-800">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              Add Keyword to Track
            </h3>

            <form onSubmit={handleAddKeyword} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Keyword</label>
                <input
                  type="text"
                  placeholder="e.g. enterprise project management software"
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target URL</label>
                <input
                  type="url"
                  value={newTargetUrl}
                  onChange={e => setNewTargetUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-mono text-[11px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Country (All Countries)</label>
                  <select
                    value={newCountry}
                    onChange={e => setNewCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    {ALL_COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Device</label>
                  <select
                    value={newDevice}
                    onChange={e => setNewDevice(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="mobile">Mobile (Smartphone Crawler)</option>
                    <option value="desktop">Desktop (Desktop Crawler)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Informational">Informational</option>
                    <option value="Comparison">Comparison</option>
                    <option value="Brand">Brand</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Intent</label>
                  <select
                    value={newIntent}
                    onChange={e => setNewIntent(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  >
                    <option value="commercial">Commercial</option>
                    <option value="transactional">Transactional</option>
                    <option value="informational">Informational</option>
                    <option value="navigational">Navigational</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tags (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="core-product, q3-push, high-acv"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-all"
                >
                  Save Keyword
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-800">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              Bulk CSV Keyword Import
            </h3>
            <p className="text-xs text-slate-500">
              Paste rows in format: <code className="text-blue-600 font-mono font-bold bg-blue-50 px-1 py-0.5 rounded">keyword, target_url, category</code>
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Default Country</label>
                <select
                  value={csvDefaultCountry}
                  onChange={e => setCsvDefaultCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                >
                  {ALL_COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Default Device</label>
                <select
                  value={csvDefaultDevice}
                  onChange={e => setCsvDefaultDevice(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                >
                  <option value="mobile">Mobile</option>
                  <option value="desktop">Desktop</option>
                </select>
              </div>
            </div>

            <form onSubmit={handleCsvImport} className="space-y-3">
              <textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder={`best task management tools, https://${website.domain}/features/tasks, Commercial\nhow to organize agile sprints, https://${website.domain}/blog/sprints, Informational`}
                rows={6}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                required
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  Import Keywords
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GSC Query Importer Modal */}
      {showGscImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Import High-Impression Search Console Queries
              </h3>
              <button
                onClick={() => setShowGscImportModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Click any query below to automatically add it to your tracking queue (targeted for India Mobile SERP):
            </p>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {topGscQueries.map((query, idx) => {
                const isTracked = keywords.some(k => k.keyword.toLowerCase() === query.toLowerCase());
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs transition-all"
                  >
                    <span className="font-semibold text-slate-800 truncate">{query}</span>
                    {isTracked ? (
                      <span className="text-[10px] text-blue-600 font-bold shrink-0 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">✓ Tracked</span>
                    ) : (
                      <button
                        onClick={() => handleImportGscQuery(query)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shrink-0 shadow-xs transition-all"
                      >
                        + Track
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Keyword Research & Rank Drop Analysis Modal */}
      {selectedKeywordForResearch && (
        <KeywordResearchModal
          keyword={selectedKeywordForResearch}
          website={website}
          onClose={() => setSelectedKeywordForResearch(null)}
          onActivityCreated={() => {
            onRefresh();
            refreshList();
          }}
        />
      )}

    </div>
  );
};
