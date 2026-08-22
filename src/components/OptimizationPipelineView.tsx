import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity as ActivityIcon,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
  BarChart3,
  Flame,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { Website, ActivityType, ActivityStatus, DecliningPageItem } from '../types';
import {
  computeOptimizationPipeline,
  convertPipelineItemToDecliningPageItem,
  PipelineFilterOptions
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
  const [expandedUrlId, setExpandedUrlId] = useState<string | null>(null);

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
      setTaskTitle(`Next optimization sprint for ${prefillUrl.replace(/^https?:\/\/[^/]+/, '')}`);
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
      description: `Planned optimization for ${targetUrlInput}`,
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
      'Clicks Lift %',
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
      `${i.metrics.clicksChangePct}%`,
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
    if (c.includes('blog') || c.includes('article')) return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    if (c.includes('feature') || c.includes('product')) return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    if (c.includes('price') || c.includes('plan')) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    if (c.includes('compare') || c.includes('vs')) return 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30';
    if (c.includes('doc') || c.includes('guide')) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
  };

  const formatActivityTypeLabel = (type: ActivityType) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2.5">
                Optimization Pipeline
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {summary.totalUrls} Pages Tracked
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Track pages optimized via the Activity Planner, record multi-activity lifecycle dates, and evaluate before-and-after performance impact.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onNavigateToCategoryRules && (
            <button
              onClick={onNavigateToCategoryRules}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition flex items-center gap-2"
            >
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              Category Rules
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition flex items-center gap-2"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/40 shadow-lg shadow-emerald-950/40 transition flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Plan New Optimization
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Tracked URLs */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/70 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Optimized URLs</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{summary.totalUrls}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-indigo-400 font-medium">{summary.totalActivitiesTracked} total activities</span>
            <span>recorded</span>
          </div>
        </div>

        {/* Metric 2: Win Rate */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/70 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Positive Win Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{summary.winRatePct}%</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-300 font-medium">{summary.positiveWinsCount} positive wins</span>
            <span>confirmed post-deploy</span>
          </div>
        </div>

        {/* Metric 3: Post-Optimization Traffic Lift */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/70 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Post-Optimization Lift</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            +{summary.netSessionsGained.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span>Monthly organic sessions gained</span>
          </div>
        </div>

        {/* Metric 4: In Progress */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/70 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>In-Flight Optimizations</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{summary.inProgressCount}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-sky-400 font-medium">Active work</span>
            <span>under current execution</span>
          </div>
        </div>
      </div>

      {/* Category Buckets Pills (Category & Classification Rules Integration) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
          <Tag className="w-3.5 h-3.5 text-indigo-400" />
          Category Buckets:
        </span>

        <button
          onClick={() => setSelectedBucket('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap shrink-0 border ${
            selectedBucket === 'all'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950/50'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/70 hover:bg-slate-700/80'
          }`}
        >
          All Buckets ({summary.totalUrls})
        </button>

        {allBuckets.map(b => (
          <button
            key={b.category}
            onClick={() => setSelectedBucket(b.category)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap shrink-0 border ${
              selectedBucket === b.category
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950/50'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/70 hover:bg-slate-700/80'
            }`}
          >
            {b.category} ({b.count})
          </button>
        ))}
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by URL path, keyword, or activity name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/70 border border-slate-700/70 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Outcome Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedOutcome}
              onChange={e => setSelectedOutcome(e.target.value)}
              className="bg-slate-800/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Outcomes</option>
              <option value="positive_win">Positive Wins (+Traffic)</option>
              <option value="measuring">Measuring / In Progress</option>
              <option value="negative_regression">Needs Iteration</option>
            </select>
          </div>

          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={e => setSelectedStage(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Stages</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="planned">Planned</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-slate-800/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="traffic_gain">Sort: Highest Traffic Lift</option>
            <option value="rank_gain">Sort: Best Rank Improvement</option>
            <option value="date_recent">Sort: Most Recent Activity</option>
            <option value="activities_count">Sort: Most Activities Done</option>
          </select>
        </div>
      </div>

      {/* Main Pipeline Items List */}
      {items.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/30 rounded-2xl border border-slate-800/60">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <ActivityIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No pages found in Optimization Pipeline</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
            {searchQuery || selectedBucket !== 'all' || selectedOutcome !== 'all'
              ? 'No pages match the current filter criteria. Try resetting filters.'
              : 'Add your first URL optimization activity to start tracking lifecycle dates and verifying post-optimization traffic results.'}
          </p>
          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Plan First Optimization
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => {
            const isExpanded = expandedUrlId === item.id;
            const isPositive = item.outcome === 'positive_win';
            const isMeasuring = item.outcome === 'measuring';
            const isNegative = item.outcome === 'negative_regression';

            return (
              <div
                key={item.id}
                className="bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden hover:border-slate-700/80 transition-all duration-200"
              >
                {/* Header Row */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/50">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium border ${getBucketColor(item.category)}`}>
                        {item.category}
                      </span>

                      {/* Stage Badge */}
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1.5">
                        <ActivityIcon className="w-3 h-3 text-indigo-400" />
                        {item.stage === 'completed'
                          ? `Completed (${item.completedActivitiesCount} done)`
                          : item.stage === 'in_progress'
                          ? `In Progress (${item.inProgressActivitiesCount} active)`
                          : 'Planned & Queued'}
                      </span>

                      {/* Outcome Badge */}
                      {isPositive && (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Positive Win (+{item.metrics.sessionsChangePct}%)
                        </span>
                      )}
                      {isMeasuring && (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.stage === 'in_progress' ? 'Executing Sprint' : 'Measuring Impact'}
                        </span>
                      )}
                      {isNegative && (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Needs Iteration ({item.metrics.sessionsChangePct}%)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-white font-mono tracking-tight truncate">
                        {item.cleanPath}
                      </h2>
                      <a
                        href={item.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-slate-200 transition p-1 hover:bg-slate-800 rounded-md"
                        title="Open live URL in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {item.primaryKeyword && (
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span>Target Query:</span>
                        <span className="text-indigo-300 font-medium bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {item.primaryKeyword}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Actions right side */}
                  <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                    {/* Research and Plan Button */}
                    <button
                      onClick={() => onOpenPageDetail(convertPipelineItemToDecliningPageItem(item, website.id))}
                      className="px-3.5 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/40 transition shadow-sm flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Research & Plan
                    </button>

                    {/* Plan Another Activity on this URL */}
                    <button
                      onClick={() => handleOpenAddModal(item.pageUrl)}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Activity
                    </button>

                    {/* Expand Details Toggle */}
                    <button
                      onClick={() => setExpandedUrlId(isExpanded ? null : item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800 transition"
                      title={isExpanded ? 'Collapse activity history' : 'Expand full activity record'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Metrics Comparison Grid (Before vs After Optimization) */}
                <div className="p-5 bg-slate-950/30 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-800/40">
                  {/* Metric 1: Sessions Impact */}
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-400">Organic Sessions</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-slate-400 line-through">
                        {item.metrics.baselineSessions.toLocaleString()}
                      </span>
                      <span className="text-base font-bold text-white">
                        {item.metrics.currentSessions.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {item.metrics.sessionsChange >= 0 ? (
                        <span className="text-emerald-400 font-medium flex items-center">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +{item.metrics.sessionsChange.toLocaleString()} (+{item.metrics.sessionsChangePct}%)
                        </span>
                      ) : (
                        <span className="text-rose-400 font-medium flex items-center">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          {item.metrics.sessionsChange.toLocaleString()} ({item.metrics.sessionsChangePct}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metric 2: Search Clicks Impact */}
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-400">Search Clicks</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-slate-400 line-through">
                        {item.metrics.baselineClicks.toLocaleString()}
                      </span>
                      <span className="text-base font-bold text-white">
                        {item.metrics.currentClicks.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {item.metrics.clicksChange >= 0 ? (
                        <span className="text-emerald-400 font-medium flex items-center">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +{item.metrics.clicksChange.toLocaleString()} (+{item.metrics.clicksChangePct}%)
                        </span>
                      ) : (
                        <span className="text-rose-400 font-medium flex items-center">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          {item.metrics.clicksChange.toLocaleString()} ({item.metrics.clicksChangePct}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metric 3: Avg SERP Position */}
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-400">Avg SERP Position</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-slate-400 line-through">
                        #{item.metrics.baselinePosition}
                      </span>
                      <span className="text-base font-bold text-white">
                        #{item.metrics.currentPosition}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {item.metrics.positionChange <= 0 ? (
                        <span className="text-emerald-400 font-medium flex items-center">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +{Math.abs(item.metrics.positionChange)} Pos Lift
                        </span>
                      ) : (
                        <span className="text-rose-400 font-medium flex items-center">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          -{item.metrics.positionChange} Pos Drop
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metric 4: Click-Through Rate */}
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-400">Avg Search CTR</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-slate-400 line-through">
                        {item.metrics.baselineCtr}%
                      </span>
                      <span className="text-base font-bold text-white">
                        {item.metrics.currentCtr}%
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {item.metrics.currentCtr >= item.metrics.baselineCtr ? (
                        <span className="text-emerald-400">Improved CTR</span>
                      ) : (
                        <span className="text-amber-400">Baseline CTR</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Multi-Activity Dates Record & Timeline */}
                <div className="p-5 bg-slate-900/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      Activity History & Lifecycle Dates ({item.timeline.length} {item.timeline.length === 1 ? 'Optimization' : 'Optimizations'})
                    </div>

                    <span className="text-xs text-slate-400">
                      First Planned: <strong className="text-slate-200">{item.firstPlannedDate}</strong>
                      {item.lastCompletedDate && (
                        <span> • Last Completed: <strong className="text-emerald-300">{item.lastCompletedDate}</strong></span>
                      )}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {item.timeline.map((act, index) => {
                      const isActCompleted = act.status === 'completed';
                      const isActInProgress = act.status === 'in_progress';
                      const isActPlanned = act.status === 'approved' || act.status === 'suggested';

                      return (
                        <div
                          key={act.id}
                          className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isActCompleted
                              ? 'bg-emerald-950/20 border-emerald-500/30'
                              : isActInProgress
                              ? 'bg-sky-950/20 border-sky-500/30'
                              : 'bg-slate-800/40 border-slate-700/50'
                          }`}
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-slate-400">
                                #{index + 1}
                              </span>

                              {/* Status Badge */}
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  isActCompleted
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : isActInProgress
                                    ? 'bg-sky-500/20 text-sky-300'
                                    : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {isActCompleted ? 'Completed' : isActInProgress ? 'In Progress' : 'Planned'}
                              </span>

                              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/50">
                                {formatActivityTypeLabel(act.type)}
                              </span>

                              {act.assignedUser && (
                                <span className="text-xs text-slate-400">
                                  Assignee: <strong className="text-slate-300">{act.assignedUser}</strong>
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-medium text-white truncate">
                              {act.title}
                            </p>

                            {act.notes && (
                              <p className="text-xs text-slate-400 italic">
                                Note: {act.notes}
                              </p>
                            )}
                          </div>

                          {/* Dates Record */}
                          <div className="flex items-center gap-3 text-xs shrink-0 flex-wrap bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
                            <div className="space-y-0.5">
                              <div className="text-slate-400 text-xs">Planned</div>
                              <div className="font-semibold text-slate-200">{act.plannedDate || '—'}</div>
                            </div>

                            <div className="w-px h-6 bg-slate-800" />

                            <div className="space-y-0.5">
                              <div className="text-slate-400 text-xs">In Progress</div>
                              <div className={`font-semibold ${act.startedDate ? 'text-sky-300' : 'text-slate-400'}`}>
                                {act.startedDate || '—'}
                              </div>
                            </div>

                            <div className="w-px h-6 bg-slate-800" />

                            <div className="space-y-0.5">
                              <div className="text-slate-400 text-xs">Completed</div>
                              <div className={`font-semibold ${act.completedDate ? 'text-emerald-300' : 'text-slate-400'}`}>
                                {act.completedDate || '—'}
                              </div>
                            </div>
                          </div>

                          {/* Quick Status Toggle */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {act.status !== 'completed' && (
                              <button
                                onClick={() => handleQuickStatusChange(act.activityId, 'completed')}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-600/40 transition"
                                title="Mark activity completed"
                              >
                                Mark Done
                              </button>
                            )}
                            {act.status === 'approved' && (
                              <button
                                onClick={() => handleQuickStatusChange(act.activityId, 'in_progress')}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg text-sky-300 bg-sky-950/40 hover:bg-sky-900/40 border border-sky-600/40 transition"
                                title="Start activity"
                              >
                                Start
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan New Optimization Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Plan New Page Optimization</h3>
                  <p className="text-xs text-slate-400">Add an optimization activity to track in the pipeline.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 transition p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Page URL <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={`https://${website.domain}/blog/your-target-slug`}
                  value={targetUrlInput}
                  onChange={e => setTargetUrlInput(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Optimization Activity Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Content Refresh & Schema Expansion"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Optimization Type</label>
                  <select
                    value={taskType}
                    onChange={e => setTaskType(e.target.value as any)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="content_refresh">Content Refresh</option>
                    <option value="title_meta_improvement">Title & Meta Tags</option>
                    <option value="internal_linking">Internal Linking Sprint</option>
                    <option value="ctr_optimization">CTR Experiment</option>
                    <option value="technical_review">Technical & Schema Audit</option>
                    <option value="conversion_optimization">Conversion / UX Boost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="critical">Critical (Immediate)</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Planned Date</label>
                  <input
                    type="date"
                    value={taskPlannedDate}
                    onChange={e => setTaskPlannedDate(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={taskAssignee}
                    onChange={e => setTaskAssignee(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Execution Notes & Objectives</label>
                <textarea
                  rows={2}
                  placeholder="Specific queries to target, sections to rewrite, or links to build..."
                  value={taskNotes}
                  onChange={e => setTaskNotes(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-lg shadow-indigo-950/40"
                >
                  Add to Optimization Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
