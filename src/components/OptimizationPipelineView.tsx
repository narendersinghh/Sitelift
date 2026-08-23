import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Activity as ActivityIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Plus,
  Tag,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Calendar,
  User,
  Sparkles,
  CheckCircle,
  BarChart3,
  Layers,
  X
} from 'lucide-react';
import {
  Website,
  ActivityType,
  ActivityStatus,
  DecliningPageItem,
  OptimizationPipelineItem
} from '../types';
import {
  computeOptimizationPipeline,
  convertPipelineItemToDecliningPageItem
} from '../services/optimizationPipelineEngine';
import { storage } from '../services/storage';

interface OptimizationPipelineViewProps {
  website: Website;
  onOpenPageDetail: (item: DecliningPageItem) => void;
  onNavigateToCategoryRules?: () => void;
  onNavigateToActivities?: () => void;
}

export const OptimizationPipelineView: React.FC<OptimizationPipelineViewProps> = ({
  website,
  onOpenPageDetail,
  onNavigateToCategoryRules,
  onNavigateToActivities
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('all');
  const [selectedOutcome, setSelectedOutcome] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [sortBy, setSortBy] = useState<'traffic_gain' | 'date_recent' | 'activities_count' | 'rank_gain'>('traffic_gain');

  // Selected item for the Details / History Popup Modal
  const [selectedDetailItem, setSelectedDetailItem] = useState<OptimizationPipelineItem | null>(null);

  // New Activity Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetUrlInput, setTargetUrlInput] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<ActivityType>('content_refresh');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [taskAssignee, setTaskAssignee] = useState('SEO Specialist');
  const [taskDueDate, setTaskDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [taskPlannedDate, setTaskPlannedDate] = useState(new Date().toISOString().slice(0, 10));
  const [taskNotes, setTaskNotes] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Compute pipeline data
  const pipelineData = useMemo(() => {
    return computeOptimizationPipeline(website.id, {
      bucketFilter: selectedBucket,
      outcomeFilter: selectedOutcome,
      stageFilter: selectedStage,
      searchQuery,
      sortBy
    });
  }, [website.id, selectedBucket, selectedOutcome, selectedStage, searchQuery, sortBy, refreshTrigger]);

  const { items, allBuckets, summary } = pipelineData;

  const handleOpenAddModal = (prefillUrl?: string) => {
    if (prefillUrl) {
      setTargetUrlInput(prefillUrl);
      setTaskTitle(`Content & SEO refresh for ${prefillUrl.replace(/^https?:\/\/[^/]+/, '')}`);
    } else {
      setTargetUrlInput(`https://${website.domain}/blog/`);
      setTaskTitle('');
    }
    setShowAddModal(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrlInput.trim() || !taskTitle.trim()) return;

    const newActivity = {
      id: `act-pipe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      websiteId: website.id,
      title: taskTitle.trim(),
      description: `Optimization sprint for ${targetUrlInput}`,
      type: taskType,
      priority: taskPriority,
      effort: 'medium' as const,
      impact: taskPriority === 'critical' ? ('critical' as const) : ('high' as const),
      relatedPageUrl: targetUrlInput.trim(),
      month: taskPlannedDate.slice(0, 7),
      status: 'approved' as const,
      assignedUser: taskAssignee,
      dueDate: taskDueDate,
      plannedDate: taskPlannedDate,
      notes: taskNotes,
      createdAt: new Date().toISOString()
    };

    storage.saveActivity(newActivity);
    setShowAddModal(false);
    setTaskTitle('');
    setTaskNotes('');
    setRefreshTrigger(prev => prev + 1);

    // Update popup detail if it was open
    if (selectedDetailItem && selectedDetailItem.pageUrl === targetUrlInput.trim()) {
      const updated = computeOptimizationPipeline(website.id);
      const matched = updated.items.find(i => i.pageUrl === targetUrlInput.trim());
      if (matched) setSelectedDetailItem(matched);
    }
  };

  const handleQuickStatusChange = (activityId: string, newStatus: ActivityStatus) => {
    const allActivities = storage.getActivities(website.id);
    const target = allActivities.find(a => a.id === activityId);
    if (!target) return;

    target.status = newStatus;
    const nowStr = new Date().toISOString().slice(0, 10);
    if (newStatus === 'in_progress' && !target.startedDate) {
      target.startedDate = nowStr;
    }
    if (newStatus === 'completed') {
      target.completedDate = nowStr;
    }
    storage.saveActivity(target);
    setRefreshTrigger(prev => prev + 1);

    if (selectedDetailItem) {
      setTimeout(() => {
        const updated = computeOptimizationPipeline(website.id);
        const matched = updated.items.find(i => i.id === selectedDetailItem.id);
        if (matched) setSelectedDetailItem(matched);
      }, 50);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'URL',
      'Category Bucket',
      'Stage',
      'Outcome',
      'Activities Count',
      'Baseline Sessions',
      'Current Sessions',
      'Sessions Lift',
      'Sessions Lift %',
      'Baseline Clicks',
      'Current Clicks',
      'Baseline Rank',
      'Current Rank',
      'First Planned Date',
      'Last Activity Date'
    ];

    const rows = items.map(i => [
      `"${i.pageUrl}"`,
      `"${i.category}"`,
      `"${i.stage}"`,
      `"${i.outcome}"`,
      i.activitiesCount,
      i.metrics.baselineSessions,
      i.metrics.currentSessions,
      i.metrics.sessionsChange,
      `${i.metrics.sessionsChangePct}%`,
      i.metrics.baselineClicks,
      i.metrics.currentClicks,
      i.metrics.baselinePosition,
      i.metrics.currentPosition,
      i.firstPlannedDate,
      i.lastActivityDate
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `optimization-pipeline-${website.domain}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBucketColor = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('blog') || c.includes('article')) return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    if (c.includes('feature') || c.includes('product')) return 'bg-blue-50 text-blue-800 border-blue-200';
    if (c.includes('price') || c.includes('plan')) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (c.includes('compare') || c.includes('vs')) return 'bg-purple-50 text-purple-800 border-purple-200';
    if (c.includes('doc') || c.includes('guide')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Title, Description, and Action Buttons Directly Underneath */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              Optimization Pipeline
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {summary.totalUrls} Tracked Pages
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl">
            Track pages undergoing optimization sprints, record multi-activity milestone dates, and verify before-and-after traffic lift.
          </p>
        </div>

        {/* Buttons cleanly positioned under Title & Description */}
        <div className="flex items-center gap-2.5 flex-wrap pt-2 border-t border-slate-100">
          {onNavigateToCategoryRules && (
            <button
              onClick={onNavigateToCategoryRules}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition flex items-center gap-1.5 shadow-xs"
            >
              <Tag className="w-3.5 h-3.5 text-purple-600" />
              Category Rules
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Plan New Optimization
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Optimized URLs</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-950">{summary.totalUrls}</div>
          <div className="text-xs text-blue-700/80 mt-1 font-medium">
            <span className="text-blue-900 font-bold">{summary.totalActivitiesTracked} activities</span> tracked
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Win Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-900">{summary.winRatePct}%</div>
          <div className="text-xs text-emerald-700 mt-1 font-semibold">
            <span className="text-emerald-900 font-bold">{summary.positiveWinsCount} positive wins</span> verified
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 shadow-xs">
          <div className="flex items-center justify-between text-purple-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Traffic Lift</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-900">
            +{summary.netSessionsGained.toLocaleString()}
          </div>
          <div className="text-xs text-purple-700/80 mt-1 font-medium">
            Organic monthly sessions gained
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 shadow-xs">
          <div className="flex items-center justify-between text-cyan-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>In-Flight Work</span>
            <Clock className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-950">{summary.inProgressCount}</div>
          <div className="text-xs text-cyan-700/80 mt-1 font-medium">
            <span className="text-cyan-900 font-bold">Active sprints</span> in progress
          </div>
        </div>
      </div>

      {/* Category Filter Pills & Search/Select Bar */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Multi-Colored Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            Category:
          </span>

          <button
            onClick={() => setSelectedBucket('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 border ${
              selectedBucket === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            All Categories ({summary.totalUrls})
          </button>

          {allBuckets.map((b, idx) => {
            const colors = [
              { active: 'bg-blue-600 text-white border-blue-700 shadow-xs', inactive: 'bg-blue-50 text-blue-900 hover:bg-blue-100 border-blue-200' },
              { active: 'bg-purple-600 text-white border-purple-700 shadow-xs', inactive: 'bg-purple-50 text-purple-900 hover:bg-purple-100 border-purple-200' },
              { active: 'bg-emerald-600 text-white border-emerald-700 shadow-xs', inactive: 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-200' },
              { active: 'bg-amber-600 text-white border-amber-700 shadow-xs', inactive: 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-200' },
              { active: 'bg-teal-600 text-white border-teal-700 shadow-xs', inactive: 'bg-teal-50 text-teal-900 hover:bg-teal-100 border-teal-200' },
            ];
            const c = colors[idx % colors.length];

            return (
              <button
                key={b.category}
                onClick={() => setSelectedBucket(b.category)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 border ${
                  selectedBucket === b.category ? c.active : c.inactive
                }`}
              >
                {b.category} ({b.count})
              </button>
            );
          })}
        </div>

        {/* Multi-Colored Outcome Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-700">Outcome:</span>

          <button
            onClick={() => setSelectedOutcome('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
              selectedOutcome === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            All Outcomes
          </button>

          <button
            onClick={() => setSelectedOutcome('positive_win')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
              selectedOutcome === 'positive_win'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-200'
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-200'
            }`}
          >
            ✓ Positive Wins ({summary.positiveWinsCount})
          </button>

          <button
            onClick={() => setSelectedOutcome('measuring')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
              selectedOutcome === 'measuring'
                ? 'bg-cyan-600 text-white border-cyan-700 shadow-xs ring-2 ring-cyan-200'
                : 'bg-cyan-50 text-cyan-900 hover:bg-cyan-100 border-cyan-200'
            }`}
          >
            ⏱ In-Flight Measuring ({summary.inProgressCount})
          </button>

          <button
            onClick={() => setSelectedOutcome('negative_regression')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
              selectedOutcome === 'negative_regression'
                ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-200'
                : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border-rose-200'
            }`}
          >
            ⚠ Needs Iteration ({summary.needsIterationCount})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search URLs, queries, or activities..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedOutcome}
              onChange={e => setSelectedOutcome(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Outcomes</option>
              <option value="positive_win">Positive Wins (+Traffic)</option>
              <option value="measuring">Measuring / In Progress</option>
              <option value="negative_regression">Needs Iteration</option>
            </select>

            <select
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Stages</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="planned">Planned</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="traffic_gain">Sort: Traffic Lift</option>
              <option value="rank_gain">Sort: Rank Lift</option>
              <option value="date_recent">Sort: Recent Activity</option>
              <option value="activities_count">Sort: Activities Count</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clean 1-Row URL Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Optimized Pages & Outcome Verification ({items.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Click 'Details' or 'Research & Plan' to open detailed diagnosis & history
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Layers className="w-8 h-8 mx-auto text-slate-300" />
            <div className="text-sm font-semibold text-slate-800">No pages match current filters</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Plan an optimization sprint on any URL or adjust your search filter criteria.
            </p>
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Plan New Optimization
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Page Path & Category</th>
                  <th className="py-3 px-3">Stage</th>
                  <th className="py-3 px-3">Outcome</th>
                  <th className="py-3 px-3 text-right">Traffic Lift (Sessions)</th>
                  <th className="py-3 px-3 text-center">Rank Impact</th>
                  <th className="py-3 px-3">Lifecycle / Sprint</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map(item => {
                  const isPositive = item.outcome === 'positive_win';
                  const isMeasuring = item.outcome === 'measuring';
                  const isNegative = item.outcome === 'negative_regression';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      {/* URL Path & Category */}
                      <td className="py-3.5 px-4 max-w-[280px]">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getBucketColor(item.category)}`}>
                            {item.category}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-900 truncate" title={item.cleanPath}>
                            {item.cleanPath}
                          </span>
                          <a
                            href={item.pageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-blue-600 transition shrink-0 opacity-0 group-hover:opacity-100"
                            title="Open live URL"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        {item.primaryKeyword && (
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1">
                            <span className="text-slate-400">Query:</span>
                            <span className="text-blue-700 font-semibold truncate">{item.primaryKeyword}</span>
                          </div>
                        )}
                      </td>

                      {/* Stage */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <ActivityIcon className="w-2.5 h-2.5 text-blue-600" />
                          {item.stage === 'completed'
                            ? 'Completed'
                            : item.stage === 'in_progress'
                            ? 'In Progress'
                            : 'Planned'}
                        </span>
                      </td>

                      {/* Outcome */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isPositive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <TrendingUp className="w-3 h-3" />
                            Positive Win (+{item.metrics.sessionsChangePct}%)
                          </span>
                        )}
                        {isMeasuring && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Measuring
                          </span>
                        )}
                        {isNegative && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            Needs Iteration
                          </span>
                        )}
                      </td>

                      {/* Traffic Lift */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {item.metrics.currentSessions.toLocaleString()}
                          <span className="text-[11px] text-slate-400 line-through ml-1.5 font-normal">
                            {item.metrics.baselineSessions.toLocaleString()}
                          </span>
                        </div>
                        <div className={`text-[11px] font-bold ${
                          item.metrics.sessionsChange >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {item.metrics.sessionsChange >= 0 ? '+' : ''}
                          {item.metrics.sessionsChange.toLocaleString()} ({item.metrics.sessionsChangePct >= 0 ? '+' : ''}{item.metrics.sessionsChangePct}%)
                        </div>
                      </td>

                      {/* Rank Impact */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="font-mono text-xs">
                          <span className="text-slate-900 font-bold">#{item.metrics.currentPosition}</span>
                          <span className="text-slate-400 text-[10px] ml-1">
                            (was #{item.metrics.baselinePosition})
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold">
                          {item.metrics.baselinePosition > item.metrics.currentPosition
                            ? `+${item.metrics.baselinePosition - item.metrics.currentPosition} spots`
                            : item.metrics.baselinePosition === item.metrics.currentPosition
                            ? 'Rank stable'
                            : `${item.metrics.baselinePosition - item.metrics.currentPosition} spots`}
                        </div>
                      </td>

                      {/* Lifecycle / Sprint */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="text-slate-800 font-bold text-xs">
                          {item.activitiesCount} {item.activitiesCount === 1 ? 'activity' : 'activities'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Last: {item.lastActivityDate || item.firstPlannedDate}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenPageDetail(convertPipelineItemToDecliningPageItem(item, website.id))}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1"
                            title="Open Deep Diagnosis & Research Planner"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Research</span>
                          </button>

                          <button
                            onClick={() => setSelectedDetailItem(item)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition"
                            title="View Milestones & Activity History Popup"
                          >
                            Details
                          </button>

                          <button
                            onClick={() => handleOpenAddModal(item.pageUrl)}
                            className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition"
                            title="Add another optimization activity"
                          >
                            <Plus className="w-3.5 h-3.5" />
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

      {/* POPUP 1: URL Detail & Milestones Popup Modal */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar text-slate-800">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getBucketColor(selectedDetailItem.category)}`}>
                    {selectedDetailItem.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedDetailItem.stage.toUpperCase()}
                  </span>
                  {selectedDetailItem.outcome === 'positive_win' && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Positive Win (+{selectedDetailItem.metrics.sessionsChangePct}%)
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 font-mono flex items-center gap-2 pt-1">
                  {selectedDetailItem.cleanPath}
                  <a
                    href={selectedDetailItem.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-blue-600"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </h3>
              </div>

              <button
                onClick={() => setSelectedDetailItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Before vs After Impact Grid */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Performance Verification (Baseline vs Post-Optimization)
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-500 font-medium">Organic Sessions</div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">
                    {selectedDetailItem.metrics.currentSessions.toLocaleString()}
                  </div>
                  <div className={`text-[11px] font-bold mt-0.5 ${
                    selectedDetailItem.metrics.sessionsChange >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {selectedDetailItem.metrics.sessionsChange >= 0 ? '+' : ''}
                    {selectedDetailItem.metrics.sessionsChange.toLocaleString()} ({selectedDetailItem.metrics.sessionsChangePct}%)
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-500 font-medium">Search Clicks</div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">
                    {selectedDetailItem.metrics.currentClicks.toLocaleString()}
                  </div>
                  <div className={`text-[11px] font-bold mt-0.5 ${
                    selectedDetailItem.metrics.clicksChange >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {selectedDetailItem.metrics.clicksChange >= 0 ? '+' : ''}
                    {selectedDetailItem.metrics.clicksChange.toLocaleString()} ({selectedDetailItem.metrics.clicksChangePct}%)
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-500 font-medium">Avg SERP Position</div>
                  <div className="text-base font-extrabold text-slate-900 mt-1 font-mono">
                    #{selectedDetailItem.metrics.currentPosition}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                    Baseline: #{selectedDetailItem.metrics.baselinePosition}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-500 font-medium">CTR</div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">
                    {selectedDetailItem.metrics.currentCtr}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Baseline: {selectedDetailItem.metrics.baselineCtr}%
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline of Multi-Activity Lifecycle Dates */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Optimization Sprints & Milestone Dates ({selectedDetailItem.timeline.length})
                </div>
                <button
                  onClick={() => {
                    handleOpenAddModal(selectedDetailItem.pageUrl);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Next Sprint
                </button>
              </div>

              <div className="space-y-2.5">
                {selectedDetailItem.timeline.map(event => (
                  <div
                    key={event.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          {event.title}
                        </span>
                        <span className="px-2 py-0.2 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          {event.type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {event.assignedUser || 'SEO Team'}
                        </span>
                        <span>•</span>
                        <span>Planned: <strong className="text-slate-800 font-mono">{event.plannedDate}</strong></span>
                        {event.completedDate && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">Completed: <strong className="font-mono">{event.completedDate}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Changer */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <select
                        value={event.status}
                        onChange={e => handleQuickStatusChange(event.activityId, e.target.value as any)}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                      >
                        <option value="suggested">Suggested</option>
                        <option value="approved">Approved / Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  const decliningItem = convertPipelineItemToDecliningPageItem(selectedDetailItem, website.id);
                  setSelectedDetailItem(null);
                  onOpenPageDetail(decliningItem);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Launch Deep Research & Diagnostic Planner
              </button>

              <button
                onClick={() => setSelectedDetailItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: Plan New Optimization Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Plan Optimization Sprint</h3>
                  <p className="text-[11px] text-slate-500">Queue a new SEO initiative for this URL.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Page URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={`https://${website.domain}/blog/your-guide`}
                  value={targetUrlInput}
                  onChange={e => setTargetUrlInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Activity Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Refresh 2026 stats, expand FAQs & update schema"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sprint Type</label>
                  <select
                    value={taskType}
                    onChange={e => setTaskType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="content_refresh">Content Refresh</option>
                    <option value="title_meta_optimization">Title / Meta Tag Optimization</option>
                    <option value="internal_linking">Internal Linking Expansion</option>
                    <option value="schema_markup">Schema Markup</option>
                    <option value="technical_fix">Technical / CWV Fix</option>
                    <option value="featured_snippet">Featured Snippet Optimization</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Planned Sprint Date</label>
                  <input
                    type="date"
                    value={taskPlannedDate}
                    onChange={e => setTaskPlannedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={taskAssignee}
                    onChange={e => setTaskAssignee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Execution Notes</label>
                <textarea
                  rows={2}
                  value={taskNotes}
                  onChange={e => setTaskNotes(e.target.value)}
                  placeholder="Add target queries, competitor references, or specific checklist items..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
                >
                  Save & Queue Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
