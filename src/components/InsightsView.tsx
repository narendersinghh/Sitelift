import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Target,
  Layers,
  Activity as ActivityIcon,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Website, Insight, InsightSeverity, InsightType } from '../types';
import { storage } from '../services/storage';
import { runInsightEngine } from '../services/insightEngine';

interface InsightsViewProps {
  website: Website;
  onNavigateToActivities: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ website, onNavigateToActivities }) => {
  const [insights, setInsights] = useState<Insight[]>(() => storage.getInsights(website.id));
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [convertedId, setConvertedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  const refreshList = () => {
    setInsights(storage.getInsights(website.id));
  };

  const handleRunEngine = () => {
    setIsScanning(true);
    setTimeout(() => {
      runInsightEngine(website.id);
      setIsScanning(false);
      refreshList();
    }, 600);
  };

  const handleConvertToActivity = (insight: Insight) => {
    const act = {
      id: `act-ins-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      websiteId: website.id,
      title: `Intervene: ${insight.title}`,
      description: insight.description,
      type: insight.type === 'ranking_drop'
        ? ('title_meta_improvement' as const)
        : insight.type === 'ctr_opportunity'
        ? ('ctr_optimization' as const)
        : ('content_refresh' as const),
      priority: insight.severity === 'critical' ? ('critical' as const) : ('high' as const),
      effort: 'medium' as const,
      impact: insight.severity === 'critical' ? ('critical' as const) : ('high' as const),
      relatedPageUrl: insight.relatedPageUrl,
      relatedKeyword: insight.relatedKeyword,
      month: new Date().toISOString().slice(0, 7),
      status: 'approved' as const,
      assignedUser: 'SEO Strategist',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      sourceInsightId: insight.id,
      createdAt: new Date().toISOString()
    };

    storage.saveActivity(act);
    storage.saveInsight({ ...insight, status: 'converted_to_activity' });
    setConvertedId(insight.id);
    setTimeout(() => {
      setConvertedId(null);
      refreshList();
    }, 1200);
  };

  const filteredInsights = insights.filter(i => {
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && i.type !== typeFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredInsights.length / PAGE_SIZE) || 1;
  const paginatedInsights = filteredInsights.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getSeverityPill = (sev: InsightSeverity) => {
    switch (sev) {
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

  const getTypeIcon = (type: InsightType) => {
    switch (type) {
      case 'traffic_decline':
        return <TrendingDown className="w-4 h-4 text-rose-600" />;
      case 'ranking_drop':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'ctr_opportunity':
        return <Target className="w-4 h-4 text-blue-600" />;
      case 'keyword_win':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Full Width Header with Automation & Manual Rank Tracking Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="w-full">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Diagnostic Insights & Optimization Recommendations
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Diagnostic interventions derived from Google Analytics 4, Search Console, and SERP Rank positions.
          </p>
        </div>

        {/* Informational Guidance Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1 text-xs">
            <div className="font-bold text-purple-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Automated Weekly AI Generation (GA4 & GSC)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Diagnostic insights and activity suggestions based on <strong>GA4 traffic</strong> and <strong>Google Search Console clicks/impressions</strong> generate automatically every week via the background AI engine.
            </p>
          </div>

          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 text-xs">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Manual Rank Tracking Insights</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Activities related to <strong>Keyword SERP rankings</strong> are generated only on-demand when you run a rank check or click <em>Re-Evaluate Insights</em> below, since keyword SERP data fetching is strictly manual.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap pt-2 border-t border-slate-100">
          <button
            onClick={handleRunEngine}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Evaluating Diagnostic Rules...' : 'Re-Evaluate Insights On-Demand'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Colored Filters Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Severity:</span>
          
          {/* All */}
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              severityFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            All Severities
          </button>

          {/* Critical - Red / Rose */}
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              severityFilter === 'critical'
                ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-200'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-200'
            }`}
          >
            Critical
          </button>

          {/* High - Amber / Orange */}
          <button
            onClick={() => setSeverityFilter('high')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              severityFilter === 'high'
                ? 'bg-amber-600 text-white border-amber-700 shadow-xs ring-2 ring-amber-200'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-200'
            }`}
          >
            High
          </button>

          {/* Medium - Blue / Sky */}
          <button
            onClick={() => setSeverityFilter('medium')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              severityFilter === 'medium'
                ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-200'
                : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border-blue-200'
            }`}
          >
            Medium
          </button>

          {/* Info - Purple / Indigo */}
          <button
            onClick={() => setSeverityFilter('info')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              severityFilter === 'info'
                ? 'bg-purple-600 text-white border-purple-700 shadow-xs ring-2 ring-purple-200'
                : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border-purple-200'
            }`}
          >
            Info
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Type:</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="all">All Types</option>
            <option value="traffic_decline">Traffic Decline</option>
            <option value="ranking_drop">Ranking Drop</option>
            <option value="ctr_opportunity">CTR Opportunity</option>
            <option value="keyword_win">Keyword Win</option>
            <option value="content_decay">Content Decay</option>
          </select>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {paginatedInsights.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-500 shadow-xs">
            No insights found matching the selected filter.
          </div>
        ) : (
          paginatedInsights.map(ins => (
            <div
              key={ins.id}
              className="p-5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl transition-all space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0 mt-0.5 shadow-xs">
                    {getTypeIcon(ins.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider border ${getSeverityPill(ins.severity)}`}>
                        {ins.severity}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 capitalize">
                        {ins.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(ins.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{ins.title}</h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{ins.description}</p>
                  </div>
                </div>

                {/* Convert to Activity Button */}
                <div className="shrink-0">
                  {ins.status === 'converted_to_activity' || convertedId === ins.id ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Task Planned
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConvertToActivity(ins)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold border border-blue-200 hover:border-blue-600 shadow-xs transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Convert to SEO Task</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Related Resources Footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                {ins.relatedPageUrl && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium">Page:</span>
                    <a
                      href={ins.relatedPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-mono font-medium transition-colors"
                    >
                      <span>{ins.relatedPageUrl.replace(/^https?:\/\/[^/]+/, '') || '/'}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}

                {ins.relatedKeyword && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium">Related Keyword:</span>
                    <strong className="text-slate-900 font-mono font-bold">"{ins.relatedKeyword}"</strong>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {filteredInsights.length > PAGE_SIZE && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Showing <span className="font-bold text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
            <span className="font-bold text-slate-800">
              {Math.min(currentPage * PAGE_SIZE, filteredInsights.length)}
            </span>{' '}
            of <span className="font-bold text-slate-800">{filteredInsights.length}</span> diagnostic insights
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none border border-slate-300 rounded-xl text-slate-700 font-semibold transition-all shadow-xs"
            >
              Previous
            </button>

            <span className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-blue-700 font-mono font-bold shadow-xs">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none border border-slate-300 rounded-xl text-slate-700 font-semibold transition-all shadow-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
