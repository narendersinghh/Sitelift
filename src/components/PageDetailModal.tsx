import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  TrendingDown,
  Activity as ActivityIcon,
  PlusCircle,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Search,
  Award,
  ShieldAlert,
  ArrowRight,
  SplitSquareVertical
} from 'lucide-react';
import { DecliningPageItem, ActivityType, Website } from '../types';
import { storage } from '../services/storage';

interface PageDetailModalProps {
  item: DecliningPageItem | null;
  website: Website;
  onClose: () => void;
  onActivityCreated: () => void;
}

export const PageDetailModal: React.FC<PageDetailModalProps> = ({
  item,
  website,
  onClose,
  onActivityCreated
}) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'branded' | 'non_branded' | 'action_plan'>('comparison');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState(
    item ? `Refresh & modernize ${item.cleanPath} to recover -${item.absoluteLoss} sessions` : ''
  );
  const [taskType, setTaskType] = useState<ActivityType>('content_refresh');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [taskAssigned, setTaskAssigned] = useState('Content & SEO Team');
  const [taskDueDate, setTaskDueDate] = useState('2026-09-01');
  const [taskNotes, setTaskNotes] = useState(
    item ? `Focus on degraded search queries: ${item.topLosingQueries.map(q => q.query).slice(0, 3).join(', ')}.` : ''
  );
  const [isSaved, setIsSaved] = useState(false);

  if (!item) return null;

  const research = item.research;

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const newAct = {
      id: `act-p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      websiteId: website.id,
      title: taskTitle,
      description: `Targeting root-cause traffic decline on ${item.cleanPath}. Action: ${item.suggestedAction}`,
      type: taskType,
      priority: taskPriority,
      effort: 'medium' as const,
      impact: item.priorityLevel === 'critical' ? ('critical' as const) : ('high' as const),
      relatedPageUrl: item.pageUrl,
      relatedKeyword: item.topLosingQueries[0]?.query,
      month: new Date().toISOString().slice(0, 7),
      status: 'approved' as const,
      assignedUser: taskAssigned,
      dueDate: taskDueDate,
      notes: taskNotes,
      createdAt: new Date().toISOString()
    };

    storage.saveActivity(newAct);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setShowTaskForm(false);
      onActivityCreated();
    }, 1000);
  };

  const handleQuickAddPlanItem = (planItem: { title: string; category: string; action: string }) => {
    const newAct = {
      id: `act-plan-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      websiteId: website.id,
      title: `${planItem.title} on ${item.cleanPath}`,
      description: planItem.action,
      type: (planItem.category === 'CTR Optimization' ? 'ctr_optimization' : 'content_refresh') as ActivityType,
      priority: 'high' as const,
      effort: 'medium' as const,
      impact: 'high' as const,
      relatedPageUrl: item.pageUrl,
      relatedKeyword: item.topLosingQueries[0]?.query,
      month: new Date().toISOString().slice(0, 7),
      status: 'approved' as const,
      assignedUser: 'SEO Growth Lead',
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      notes: `Root cause: ${research?.primaryFactorLabel || 'Traffic decline'}`,
      createdAt: new Date().toISOString()
    };

    storage.saveActivity(newAct);
    onActivityCreated();
  };

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'high':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const brandedQueries = item.topLosingQueries.filter(q => (q as any).isBranded);
  const nonBrandedQueries = item.topLosingQueries.filter(q => !(q as any).isBranded);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 truncate max-w-lg">{item.cleanPath}</h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                  {item.pageCategory}
                </span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full border uppercase font-bold ${getPriorityColor(item.priorityLevel)}`}>
                  {item.priorityLevel} (Score {item.priorityScore})
                </span>
              </div>
              <a
                href={item.pageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5 font-mono"
              >
                <span>{item.pageUrl}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'comparison'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Brand vs Non-Brand Comparison</span>
          </button>

          <button
            onClick={() => setActiveTab('branded')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'branded'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Branded Metrics Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('non_branded')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'non_branded'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-amber-600" />
            <span>Non-Branded Metrics Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('action_plan')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'action_plan'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Remediation Roadmap</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-[#f0f5fa]">
          
          {/* TAB 1: SIDE BY SIDE COMPARISON */}
          {activeTab === 'comparison' && research && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Overall Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total GA4 Sessions</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{item.currentSessions.toLocaleString()}</div>
                  <div className="text-xs text-rose-600 font-bold mt-0.5">
                    -{item.absoluteLoss.toLocaleString()} ({item.dropPercentage}%)
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total GSC Clicks</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{item.currentClicks.toLocaleString()}</div>
                  <div className={`text-xs font-bold mt-0.5 ${item.clickChange < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {item.clickChange >= 0 ? '+' : ''}{item.clickChange.toLocaleString()} clicks
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall CTR</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{item.currentCtr}%</div>
                  <div className="text-xs text-slate-500 mt-0.5">Prev: {item.previousCtr}%</div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg SERP Position</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{item.currentAvgPosition ? `#${item.currentAvgPosition}` : '—'}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Prev: {item.previousAvgPosition ? `#${item.previousAvgPosition}` : '—'}</div>
                </div>
              </div>

              {/* Comprehensive Metric Comparison Matrix */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <SplitSquareVertical className="w-4 h-4 text-blue-600" />
                    Granular Metric Comparison: Branded vs Non-Branded
                  </h4>
                  <span className="text-[11px] text-slate-500">All data directly computed from Google Search Console</span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Performance Metric</th>
                      <th className="py-3.5 px-4 text-center bg-blue-50/70 text-blue-800">Branded Queries</th>
                      <th className="py-3.5 px-4 text-center bg-purple-50/70 text-purple-800">Non-Branded Queries</th>
                      <th className="py-3.5 px-4 text-right">Variance / Insight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {/* Clicks Row */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">Organic Clicks</td>
                      <td className="py-3.5 px-4 text-center bg-blue-50/40">
                        <div className="font-bold text-slate-900 font-mono">{research.brandClicks.toLocaleString()}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Prev: {research.prevBrandClicks.toLocaleString()}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center bg-purple-50/40">
                        <div className="font-bold text-slate-900 font-mono">{research.nonBrandClicks.toLocaleString()}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Prev: {research.prevNonBrandClicks.toLocaleString()}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          research.nonBrandLoss > research.brandLoss
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {research.nonBrandLoss > research.brandLoss ? 'Non-Brand Loss Dominant' : 'Brand Loss Dominant'}
                        </span>
                      </td>
                    </tr>

                    {/* Lost Clicks Row */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">Lost Clicks</td>
                      <td className="py-3.5 px-4 text-center bg-blue-50/40 font-mono font-bold text-amber-600">
                        -{research.brandLoss} (-{research.brandLossPct}%)
                      </td>
                      <td className="py-3.5 px-4 text-center bg-purple-50/40 font-mono font-bold text-rose-600">
                        -{research.nonBrandLoss} (-{research.nonBrandLossPct}%)
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 text-[11px]">
                        Total {research.brandLoss + research.nonBrandLoss} lost clicks
                      </td>
                    </tr>

                    {/* Impressions Row */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">Search Impressions</td>
                      <td className="py-3.5 px-4 text-center bg-blue-50/40">
                        <div className="font-bold text-slate-900 font-mono">{research.brandImpressions.toLocaleString()}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Prev: {research.prevBrandImpressions.toLocaleString()}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center bg-purple-50/40">
                        <div className="font-bold text-slate-900 font-mono">{research.nonBrandImpressions.toLocaleString()}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Prev: {research.prevNonBrandImpressions.toLocaleString()}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 font-mono text-[11px]">
                        Imp Loss: -{research.nonBrandImpLoss} (NB) vs -{research.brandImpLoss} (B)
                      </td>
                    </tr>

                    {/* CTR Row */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">Click-Through Rate (CTR)</td>
                      <td className="py-3.5 px-4 text-center bg-blue-50/40">
                        <div className="font-bold text-slate-900 font-mono">{research.brandCtr}%</div>
                        <div className="text-[11px] text-slate-500 font-mono">Prev: {research.prevBrandCtr}%</div>
                      </td>
                      <td className="py-3.5 px-4 text-center bg-purple-50/40">
                        <div className="font-bold text-slate-900 font-mono">{research.nonBrandCtr}%</div>
                        <div className="text-[11px] text-slate-500 font-mono">Prev: {research.prevNonBrandCtr}%</div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 text-[11px]">
                        {research.nonBrandCtr < research.prevNonBrandCtr ? 'Non-brand CTR dropped' : 'Non-brand CTR stable'}
                      </td>
                    </tr>

                    {/* Avg Position Row */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">Average SERP Position</td>
                      <td className="py-3.5 px-4 text-center bg-blue-50/40">
                        <div className="font-bold text-slate-900 font-mono">#{research.brandAvgPosition}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Prev: #{research.prevBrandAvgPosition}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center bg-purple-50/40">
                        <div className="font-bold text-slate-900 font-mono">#{research.nonBrandAvgPosition}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Prev: #{research.prevNonBrandAvgPosition}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 text-[11px]">
                        {research.nonBrandAvgPosition > research.prevNonBrandAvgPosition ? 'Ranking slippage detected' : 'Positions preserved'}
                      </td>
                    </tr>

                    {/* Distinct Queries Count */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">Ranking Queries Count</td>
                      <td className="py-3.5 px-4 text-center bg-blue-50/40 font-mono font-bold text-slate-800">
                        {research.brandQueriesCount} branded queries
                      </td>
                      <td className="py-3.5 px-4 text-center bg-purple-50/40 font-mono font-bold text-slate-800">
                        {research.nonBrandQueriesCount} non-branded queries
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 text-[11px]">
                        {(research.nonBrandQueriesCount / (research.brandQueriesCount + research.nonBrandQueriesCount || 1) * 100).toFixed(0)}% non-brand query share
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Quick Actions to Drill Down */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('branded')}
                  className="p-4 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition-all group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      View Branded Queries & Metrics
                    </span>
                    <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Inspect brand navigation patterns, entity click volumes, and exact brand query drops.
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('non_branded')}
                  className="p-4 bg-white hover:bg-purple-50/50 border border-slate-200 hover:border-purple-300 rounded-2xl text-left transition-all group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-amber-600" />
                      View Non-Branded Queries & Metrics
                    </span>
                    <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Inspect generic commercial search terms, competitor displacements, and keyword ranking decay.
                  </p>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: BRANDED METRICS BREAKDOWN */}
          {activeTab === 'branded' && research && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Branded KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Branded Clicks</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{research.brandClicks.toLocaleString()}</div>
                  <div className="text-xs text-amber-600 font-bold mt-0.5">
                    -{research.brandLoss} ({research.brandLossPct}% drop)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Prev: {research.prevBrandClicks.toLocaleString()} clicks</div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Branded Impressions</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{research.brandImpressions.toLocaleString()}</div>
                  <div className="text-xs text-slate-700 font-medium mt-0.5">
                    Prev: {research.prevBrandImpressions.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Loss: -{research.brandImpLoss.toLocaleString()} ({research.brandImpLossPct}%)</div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Branded CTR</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{research.brandCtr}%</div>
                  <div className="text-xs text-slate-500 mt-0.5">Prev: {research.prevBrandCtr}%</div>
                  <div className="text-[10px] text-slate-500 mt-1">Brand navigation CTR</div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Branded Avg Position</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">#{research.brandAvgPosition}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Prev: #{research.prevBrandAvgPosition}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{research.brandQueriesCount} active queries</div>
                </div>
              </div>

              {/* Branded Losing Queries Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Branded Search Queries Performance & Decline
                  </h4>
                  <span className="text-[11px] text-slate-500">{brandedQueries.length} branded queries tracked</span>
                </div>

                {brandedQueries.length === 0 ? (
                  <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500 shadow-xs">
                    No individual branded queries suffered significant drop over this period.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Branded Query</th>
                          <th className="py-3 px-3 text-right">Previous Clicks</th>
                          <th className="py-3 px-3 text-right">Current Clicks</th>
                          <th className="py-3 px-3 text-right">Click Loss</th>
                          <th className="py-3 px-3 text-right">Prev Pos</th>
                          <th className="py-3 px-3 text-right">Cur Pos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {brandedQueries.map((q, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-blue-700">{q.query}</td>
                            <td className="py-3 px-3 text-right text-slate-500 font-mono">{q.previousClicks}</td>
                            <td className="py-3 px-3 text-right text-slate-900 font-mono font-bold">{q.currentClicks}</td>
                            <td className="py-3 px-3 text-right">
                              <span className="font-bold text-amber-600 font-mono">-{q.clickLoss}</span>
                            </td>
                            <td className="py-3 px-3 text-right text-slate-500 font-mono">#{q.previousPosition}</td>
                            <td className="py-3 px-3 text-right font-bold text-blue-600 font-mono">#{q.currentPosition}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: NON-BRANDED METRICS BREAKDOWN */}
          {activeTab === 'non_branded' && research && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Non-Branded KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Non-Brand Clicks</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{research.nonBrandClicks.toLocaleString()}</div>
                  <div className="text-xs text-rose-600 font-bold mt-0.5">
                    -{research.nonBrandLoss} ({research.nonBrandLossPct}% drop)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Prev: {research.prevNonBrandClicks.toLocaleString()} clicks</div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Non-Brand Impressions</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{research.nonBrandImpressions.toLocaleString()}</div>
                  <div className="text-xs text-slate-700 font-medium mt-0.5">
                    Prev: {research.prevNonBrandImpressions.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Loss: -{research.nonBrandImpLoss.toLocaleString()} ({research.nonBrandImpLossPct}%)</div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Non-Brand CTR</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{research.nonBrandCtr}%</div>
                  <div className="text-xs text-slate-500 mt-0.5">Prev: {research.prevNonBrandCtr}%</div>
                  <div className="text-[10px] text-slate-500 mt-1">Generic search CTR</div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Non-Brand Avg Position</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">#{research.nonBrandAvgPosition}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Prev: #{research.prevNonBrandAvgPosition}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{research.nonBrandQueriesCount} active queries</div>
                </div>
              </div>

              {/* Non-Branded Losing Queries Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Search className="w-4 h-4 text-purple-600" />
                    Non-Branded Search Queries Performance & SERP Displacement
                  </h4>
                  <span className="text-[11px] text-slate-500">{nonBrandedQueries.length} generic queries tracked</span>
                </div>

                {nonBrandedQueries.length === 0 ? (
                  <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500 shadow-xs">
                    No individual non-branded queries suffered significant drop over this period.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Non-Branded Query</th>
                          <th className="py-3 px-3 text-right">Previous Clicks</th>
                          <th className="py-3 px-3 text-right">Current Clicks</th>
                          <th className="py-3 px-3 text-right">Click Loss</th>
                          <th className="py-3 px-3 text-right">Prev Pos</th>
                          <th className="py-3 px-3 text-right">Cur Pos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {nonBrandedQueries.map((q, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{q.query}</td>
                            <td className="py-3 px-3 text-right text-slate-500 font-mono">{q.previousClicks}</td>
                            <td className="py-3 px-3 text-right text-slate-900 font-mono font-bold">{q.currentClicks}</td>
                            <td className="py-3 px-3 text-right">
                              <span className="font-bold text-rose-600 font-mono">-{q.clickLoss}</span>
                            </td>
                            <td className="py-3 px-3 text-right text-slate-500 font-mono">#{q.previousPosition}</td>
                            <td className="py-3 px-3 text-right font-bold text-amber-600 font-mono">#{q.currentPosition}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: REMEDIATION ROADMAP */}
          {activeTab === 'action_plan' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Primary Diagnostic Factor Banner */}
              {research && (
                <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Root-Cause Diagnosis: {research.primaryFactorLabel}
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                      Deterministic Confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {research.factorExplanation}
                  </p>
                </div>
              )}

              {/* SERP Features & Layout Shift Displacements */}
              {research && research.serpFeatureShifts.length > 0 && (
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Detected SERP Feature Displacements & Competition
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {research.serpFeatureShifts.map((shift, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{shift}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Plan Checklist */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Recommended Remediation Checklist
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Targeted interventions generated by the root-cause diagnostics engine.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create Custom Task</span>
                  </button>
                </div>

                {research?.actionPlan && (
                  <div className="space-y-3">
                    {research.actionPlan.map((plan, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white border border-slate-200 hover:border-blue-300 rounded-2xl flex items-start justify-between gap-4 transition-all shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{plan.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                              {plan.category}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                              plan.priority === 'critical'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {plan.priority} Priority
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{plan.action}</p>
                        </div>

                        <button
                          onClick={() => handleQuickAddPlanItem(plan)}
                          className="shrink-0 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-transparent text-blue-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Schedule Task</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Task Creation Form Drawer */}
              {showTaskForm && (
                <form onSubmit={handleCreateActivity} className="p-5 bg-white border border-blue-300 rounded-2xl space-y-3 shadow-xl animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ActivityIcon className="w-4 h-4 text-blue-600" />
                      Plan Activity for Current Month
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowTaskForm(false)}
                      className="text-xs text-slate-400 hover:text-slate-700 font-bold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Task Title</label>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={e => setTaskTitle(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Activity Type</label>
                      <select
                        value={taskType}
                        onChange={e => setTaskType(e.target.value as ActivityType)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="content_refresh">Content Refresh</option>
                        <option value="title_meta_improvement">Title & Meta Improvement</option>
                        <option value="ctr_optimization">CTR Optimization</option>
                        <option value="internal_linking">Internal Linking Sprint</option>
                        <option value="technical_review">Technical CWV Review</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                      <select
                        value={taskPriority}
                        onChange={e => setTaskPriority(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={e => setTaskDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Implementation Notes</label>
                    <textarea
                      value={taskNotes}
                      onChange={e => setTaskNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSaved}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      {isSaved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>Saved to Activity Board!</span>
                        </>
                      ) : (
                        <span>Save Task to Monthly Plan</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Path: <span className="font-mono text-slate-800 font-bold">{item.cleanPath}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Close Diagnosis
          </button>
        </div>

      </div>
    </div>
  );
};
