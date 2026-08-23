import React, { useState } from 'react';
import {
  TrendingDown,
  Filter,
  Search,
  ArrowUpDown,
  BarChart3,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  Calendar,
  ChevronDown,
  X,
  Check,
  ArrowRight
} from 'lucide-react';
import { Website, DecliningPageItem } from '../types';
import { computeDecliningPages, DecliningPagesFilterOptions } from '../services/decliningPagesEngine';

interface DecliningPagesViewProps {
  website: Website;
  onOpenPageDetail: (item: DecliningPageItem) => void;
}

export const DecliningPagesView: React.FC<DecliningPagesViewProps> = ({
  website,
  onOpenPageDetail
}) => {
  const [period, setPeriod] = useState<DecliningPagesFilterOptions['period']>('28d');
  const [startDate, setStartDate] = useState('2026-07-24');
  const [endDate, setEndDate] = useState('2026-08-20');
  const [comparisonMode, setComparisonMode] = useState<'previous_period' | 'previous_month' | 'yoy' | 'custom'>('previous_period');
  const [compStartDate, setCompStartDate] = useState('2026-06-26');
  const [compEndDate, setCompEndDate] = useState('2026-07-23');
  
  // Date modal toggle & temporary modal state
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempPeriod, setTempPeriod] = useState<DecliningPagesFilterOptions['period']>(period);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [tempCompMode, setTempCompMode] = useState(comparisonMode);
  const [tempCompStart, setTempCompStart] = useState(compStartDate);
  const [tempCompEnd, setTempCompEnd] = useState(compEndDate);

  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [pageCategory, setPageCategory] = useState('all');
  const [brandedFilter, setBrandedFilter] = useState<'all' | 'branded' | 'non_branded'>('all');
  const [channelGroup, setChannelGroup] = useState('all');
  const [device, setDevice] = useState('all');
  const [urlContains, setUrlContains] = useState('');
  const [minPrevSessions, setMinPrevSessions] = useState(50);
  const [minSessionLoss, setMinSessionLoss] = useState(20);
  const [minDropPct, setMinDropPct] = useState(website.trafficDeclineThreshold || 20);
  const [sortBy, setSortBy] = useState<DecliningPagesFilterOptions['sortBy']>('priority_score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  const { items: allDecliningPages, summary } = computeDecliningPages(website.id, {
    period,
    customStartDate: period === 'custom' ? startDate : undefined,
    customEndDate: period === 'custom' ? endDate : undefined,
    comparisonMode,
    comparisonStartDate: comparisonMode === 'custom' ? compStartDate : undefined,
    comparisonEndDate: comparisonMode === 'custom' ? compEndDate : undefined,
    pageCategory,
    brandedFilter,
    channelGroup,
    device,
    urlContains,
    minPrevSessions,
    minSessionLoss,
    minDropPct,
    sortBy,
    sortDirection
  });

  const decliningPages = allDecliningPages.filter(p => {
    if (priorityFilter !== 'all' && p.priorityLevel !== priorityFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(decliningPages.length / PAGE_SIZE) || 1;
  const paginatedPages = decliningPages.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleOpenDateModal = () => {
    setTempPeriod(period);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setTempCompMode(comparisonMode);
    setTempCompStart(compStartDate);
    setTempCompEnd(compEndDate);
    setShowDateModal(true);
  };

  const handleApplyDateModal = () => {
    setPeriod(tempPeriod);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setComparisonMode(tempCompMode);
    setCompStartDate(tempCompStart);
    setCompEndDate(tempCompEnd);
    setShowDateModal(false);
  };

  const handlePresetSelect = (presetId: DecliningPagesFilterOptions['period']) => {
    setTempPeriod(presetId);
    if (presetId === '7d') {
      setTempStartDate('2026-08-14');
      setTempEndDate('2026-08-20');
      setTempCompStart('2026-08-07');
      setTempCompEnd('2026-08-13');
    } else if (presetId === '14d') {
      setTempStartDate('2026-08-07');
      setTempEndDate('2026-08-20');
      setTempCompStart('2026-07-24');
      setTempCompEnd('2026-08-06');
    } else if (presetId === '28d') {
      setTempStartDate('2026-07-24');
      setTempEndDate('2026-08-20');
      setTempCompStart('2026-06-26');
      setTempCompEnd('2026-07-23');
    } else if (presetId === 'last_month') {
      setTempStartDate('2026-07-01');
      setTempEndDate('2026-07-31');
      setTempCompStart('2026-06-01');
      setTempCompEnd('2026-06-30');
      setTempCompMode('previous_month');
    }
  };

  const getPriorityBadge = (level: string, score: number) => {
    switch (level) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="w-full space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Declining Pages Analysis
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl">
            Detect URLs suffering organic traffic decay across GA4 and Google Search Console between custom comparison periods.
          </p>
        </div>

        {/* Date Comparison Period Trigger Button (Opens Modal/Popup) */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
          <button
            onClick={handleOpenDateModal}
            className="flex items-center gap-2.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-blue-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs transition-all group"
            title="Change Comparison Date Range"
          >
            <Calendar className="w-4 h-4 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-800">{startDate} – {endDate}</span>
              <span className="text-slate-500 font-sans font-bold text-[10px] uppercase bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">vs</span>
              <span className="text-blue-700 font-bold">{compStartDate} – {compEndDate}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          </button>
        </div>
      </div>

      {/* Date Filter & Comparison Modal / Popup */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Date Range & Comparison Period</h3>
                  <p className="text-[11px] text-slate-500">Select the primary evaluation period and baseline comparison window</p>
                </div>
              </div>
              <button
                onClick={() => setShowDateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Quick Evaluation Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: '7d', label: 'Last 7 Days' },
                  { id: '14d', label: 'Last 14 Days' },
                  { id: '28d', label: 'Last 28 Days' },
                  { id: 'last_month', label: 'Last Month vs Prev' }
                ].map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset.id as any)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                      tempPeriod === preset.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Date Range Inputs */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>1. Primary (Current) Date Range</span>
                <span className="text-[10px] text-blue-600 font-semibold">Active Traffic Window</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={e => {
                      setTempStartDate(e.target.value);
                      setTempPeriod('custom');
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={e => {
                      setTempEndDate(e.target.value);
                      setTempPeriod('custom');
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Comparison Date Range Selector */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>2. Compare Against Baseline</span>
                <span className="text-[10px] text-blue-600 font-semibold">Benchmarking Window</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'previous_period', label: 'Previous Period' },
                  { id: 'previous_month', label: 'Previous Month' },
                  { id: 'yoy', label: 'Same Period Last Year (YoY)' },
                  { id: 'custom', label: 'Custom Comparison' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTempCompMode(mode.id as any)}
                    className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border text-center transition-all ${
                      tempCompMode === mode.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Custom Comparison Range Pickers */}
              {tempCompMode === 'custom' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Baseline Start Date</label>
                    <input
                      type="date"
                      value={tempCompStart}
                      onChange={e => setTempCompStart(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Baseline End Date</label>
                    <input
                      type="date"
                      value={tempCompEnd}
                      onChange={e => setTempCompEnd(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div className="text-[11px] text-slate-500">
                Data computed strictly across the selected comparative range.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyDateModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Date Range</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Strip with Multi-Color Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl shadow-xs">
          <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">Declining URLs Found</div>
          <div className="text-2xl font-extrabold text-blue-950 mt-1">{summary.totalDecliningPages}</div>
          <div className="text-xs text-rose-700 mt-0.5 font-bold">{summary.criticalCount} marked Critical</div>
        </div>

        <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl shadow-xs">
          <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">Total Traffic Lost</div>
          <div className="text-2xl font-extrabold text-rose-900 mt-1">-{summary.totalTrafficLoss.toLocaleString()}</div>
          <div className="text-xs text-rose-700 mt-0.5 font-semibold">Sessions lost vs baseline</div>
        </div>

        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl shadow-xs">
          <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Average Drop Rate</div>
          <div className="text-2xl font-extrabold text-amber-900 mt-1">-{summary.avgDropPercentage}%</div>
          <div className="text-xs text-amber-700 mt-0.5 font-semibold">Sensitivity: &gt;{minDropPct}%</div>
        </div>

        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl shadow-xs">
          <div className="text-xs font-bold text-purple-800 uppercase tracking-wider">Priority Distribution</div>
          <div className="text-xs font-bold text-slate-800 mt-2 flex items-center gap-2">
            <span className="text-rose-800 font-bold bg-rose-100 px-1.5 py-0.5 rounded">{summary.criticalCount} Crit</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded">{summary.highCount} High</span>
            <span className="text-slate-300">•</span>
            <span className="text-blue-800 font-bold bg-blue-100 px-1.5 py-0.5 rounded">{summary.mediumCount} Med</span>
          </div>
          <div className="text-xs text-purple-700/80 mt-1 font-medium">Ranked by Priority Score (0–100)</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        {/* Multi-Colored Priority Filter Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Urgency:</span>

            <button
              onClick={() => setPriorityFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                priorityFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
            >
              All Priorities ({allDecliningPages.length})
            </button>

            <button
              onClick={() => setPriorityFilter('critical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                priorityFilter === 'critical'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-200'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-200'
              }`}
            >
              Critical Drop ({summary.criticalCount})
            </button>

            <button
              onClick={() => setPriorityFilter('high')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                priorityFilter === 'high'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs ring-2 ring-amber-200'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-200'
              }`}
            >
              High Drop ({summary.highCount})
            </button>

            <button
              onClick={() => setPriorityFilter('medium')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                priorityFilter === 'medium'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-200'
                  : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border-blue-200'
              }`}
            >
              Medium Drop ({summary.mediumCount})
            </button>
          </div>

          <div className="text-xs font-bold text-slate-500">
            Showing <span className="text-slate-900">{decliningPages.length}</span> declining URLs
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* URL Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search declining URL path or slug..."
              value={urlContains}
              onChange={e => setUrlContains(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={pageCategory}
              onChange={e => setPageCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All URL Categories</option>
              <option value="Features">Features</option>
              <option value="Blog">Blog & Guides</option>
              <option value="Comparisons">Product Comparisons</option>
              <option value="Pricing">Pricing</option>
              <option value="Landing Pages">Landing Pages</option>
            </select>

            {/* Branded / Non-Branded Segment */}
            <select
              value={brandedFilter}
              onChange={e => setBrandedFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Brand & Generic Queries</option>
              <option value="branded">Branded Clicks Only</option>
              <option value="non_branded">Non-Branded Clicks Only</option>
            </select>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-xl border transition-colors ${
                showAdvancedFilters
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Toggle Advanced Sensitivity Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs animate-in fade-in duration-150">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Min Previous Sessions</label>
              <input
                type="number"
                value={minPrevSessions}
                onChange={e => setMinPrevSessions(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Min Session Loss</label>
              <input
                type="number"
                value={minSessionLoss}
                onChange={e => setMinSessionLoss(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Min % Decline Threshold</label>
              <input
                type="number"
                value={minDropPct}
                onChange={e => setMinDropPct(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Sort By Metric</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
              >
                <option value="priority_score">Priority Score (Highest First)</option>
                <option value="absolute_loss">Absolute Session Loss</option>
                <option value="drop_pct">Drop Percentage (%)</option>
                <option value="current_sessions">Current Sessions</option>
                <option value="previous_sessions">Previous Sessions</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Declining Pages Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600 tracking-wider">
              <tr>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Declining Page URL</th>
                <th className="px-4 py-3 text-right">Previous Sessions</th>
                <th className="px-4 py-3 text-right">Current Sessions</th>
                <th className="px-4 py-3 text-right">Session Loss</th>
                <th className="px-4 py-3 text-right">Decline %</th>
                <th className="px-4 py-3 text-right">GSC Clicks Lost</th>
                <th className="px-4 py-3 text-right">CTR Shift</th>
                <th className="px-4 py-3 text-right">Avg Position</th>
                <th className="px-4 py-3 text-center">Action Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans bg-white">
              {paginatedPages.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">No Declining Pages Found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      No URLs exceeded the &gt;{minDropPct}% traffic drop threshold for the selected comparative date range.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedPages.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    
                    {/* Priority Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPriorityBadge(item.priorityLevel, item.priorityScore)}`}>
                        {item.priorityLevel}
                        <span className="text-[9px] opacity-75 font-mono">({item.priorityScore})</span>
                      </span>
                    </td>

                    {/* Page Path & Category */}
                    <td className="px-4 py-3 min-w-[240px]">
                      <div className="font-bold text-slate-900 truncate max-w-xs flex items-center gap-1.5">
                        <span className="truncate">{item.cleanPath}</span>
                        <a
                          href={item.pageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 font-medium">
                          {item.pageCategory}
                        </span>
                        {item.topLosingQueries[0] && (
                          <span className="text-[10px] text-blue-700 truncate max-w-[160px] font-mono font-medium">
                            ↳ {item.topLosingQueries[0].query}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Previous Sessions */}
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {item.previousSessions.toLocaleString()}
                    </td>

                    {/* Current Sessions */}
                    <td className="px-4 py-3 text-right font-mono text-slate-900 font-bold">
                      {item.currentSessions.toLocaleString()}
                    </td>

                    {/* Session Loss */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                      -{item.absoluteLoss.toLocaleString()}
                    </td>

                    {/* Decline Percentage */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
                        -{item.dropPercentage}%
                      </span>
                    </td>

                    {/* Clicks Lost (GSC) */}
                    <td className="px-4 py-3 text-right font-mono text-amber-800 font-semibold">
                      {item.clickChange < 0 ? item.clickChange : `-${item.previousClicks - item.currentClicks}`}
                    </td>

                    {/* CTR Shift */}
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      <span className={item.currentCtr < item.previousCtr ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                        {item.currentCtr}%
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        (was {item.previousCtr}%)
                      </span>
                    </td>

                    {/* Position Change */}
                    <td className="px-4 py-3 text-right font-mono text-slate-700 whitespace-nowrap">
                      <span className={item.currentAvgPosition > item.previousAvgPosition ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                        #{item.currentAvgPosition}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        (was #{item.previousAvgPosition})
                      </span>
                    </td>

                    {/* Action Plan Button */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => onOpenPageDetail(item)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-all mx-auto"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Research & Plan</span>
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {decliningPages.length > PAGE_SIZE && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50">
            <div className="text-slate-600">
              Showing <span className="font-bold text-slate-900">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-bold text-slate-900">
                {Math.min(currentPage * PAGE_SIZE, decliningPages.length)}
              </span>{' '}
              of <span className="font-bold text-slate-900">{decliningPages.length}</span> declining URLs
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none border border-slate-300 rounded-xl text-slate-700 font-semibold transition-all"
              >
                Previous
              </button>

              <span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-mono font-bold">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none border border-slate-300 rounded-xl text-slate-700 font-semibold transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
