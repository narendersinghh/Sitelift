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
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'medium':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-white/10 text-slate-300 border-white/10';
    }
  };

  const getTypeIcon = (type: InsightType) => {
    switch (type) {
      case 'traffic_decline':
        return <TrendingDown className="w-4 h-4 text-rose-400" />;
      case 'ranking_drop':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'ctr_opportunity':
        return <Target className="w-4 h-4 text-indigo-400" />;
      case 'keyword_win':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Full Width Header with Action Controls Below */}
      <div className="space-y-3">
        <div className="w-full">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Rule-Based Insight Generator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic, explainable diagnostic insights derived directly from GA4, Search Console, and Bright Data data.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1">
          <button
            onClick={handleRunEngine}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 backdrop-blur-md transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Evaluating Rules...' : 'Re-Evaluate Insights'}</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Severity:</span>
          {['all', 'critical', 'high', 'medium', 'info'].map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                severityFilter === s
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 backdrop-blur-md'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Type:</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#0f172a] border border-white/10 rounded-xl text-xs text-white focus:border-indigo-400 focus:outline-none transition-colors"
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
          <div className="p-12 bg-white/5 border border-white/10 rounded-2xl text-center text-xs text-slate-400 backdrop-blur-md">
            No insights found matching the selected filter.
          </div>
        ) : (
          paginatedInsights.map(ins => (
            <div
              key={ins.id}
              className="p-5 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl backdrop-blur-md transition-all space-y-3 shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5 backdrop-blur-md">
                    {getTypeIcon(ins.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider border ${getSeverityPill(ins.severity)}`}>
                        {ins.severity}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 capitalize">
                        {ins.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ins.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 mt-1">{ins.title}</h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{ins.description}</p>
                  </div>
                </div>

                {/* Convert to Activity Button */}
                <div className="shrink-0">
                  {ins.status === 'converted_to_activity' || convertedId === ins.id ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-2 rounded-xl backdrop-blur-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Task Planned
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConvertToActivity(ins)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 backdrop-blur-md transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Convert to SEO Task</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Related Resources Footer */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                {ins.relatedPageUrl && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Page:</span>
                    <a
                      href={ins.relatedPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:underline flex items-center gap-1 transition-colors"
                    >
                      <span>{ins.relatedPageUrl.replace(/^https?:\/\/[^/]+/, '') || '/'}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}

                {ins.relatedKeyword && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Related Keyword:</span>
                    <strong className="text-slate-200">"{ins.relatedKeyword}"</strong>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {filteredInsights.length > PAGE_SIZE && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            Showing <span className="font-semibold text-slate-200">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
            <span className="font-semibold text-slate-200">
              {Math.min(currentPage * PAGE_SIZE, filteredInsights.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-200">{filteredInsights.length}</span> diagnostic insights
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none border border-white/10 rounded-xl text-slate-300 font-medium transition-all"
            >
              Previous
            </button>

            <span className="px-3 py-1 bg-white/10 rounded-lg text-indigo-300 font-mono font-semibold">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none border border-white/10 rounded-xl text-slate-300 font-medium transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
