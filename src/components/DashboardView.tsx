import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Search,
  KeyRound,
  AlertTriangle,
  Radio,
  ChevronRight,
  Globe,
  Plus,
  BarChart3,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Website, DecliningPageItem } from '../types';
import { storage } from '../services/storage';
import { computeDecliningPages } from '../services/decliningPagesEngine';
import { getEffectiveTimezone } from '../data/geoConstants';

interface DashboardViewProps {
  website: Website;
  websites?: Website[];
  onSelectWebsite?: (id: string) => void;
  onNavigateToDeclining: () => void;
  onNavigateToKeywords: () => void;
  onNavigateToActivities: () => void;
  onNavigateToReports: () => void;
  onNavigateToInsights: () => void;
  onNavigateToWebsites?: () => void;
  onOpenPageDetail: (item: DecliningPageItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  website,
  websites = [],
  onSelectWebsite,
  onNavigateToDeclining,
  onNavigateToKeywords,
  onNavigateToActivities,
  onNavigateToReports,
  onNavigateToInsights,
  onNavigateToWebsites,
  onOpenPageDetail
}) => {
  const globalSettings = storage.getGlobalSettings();
  const allWebsites = websites.length > 0 ? websites : storage.getWebsites();
  const gaConnections = storage.getGaConnections();
  const gscConnections = storage.getGscConnections();

  const pageMetrics = storage.getPageMetrics(website.id);
  const gscMetrics = storage.getGscMetrics(website.id);
  const keywords = storage.getKeywords(website.id);
  const gaConn = gaConnections[website.id];
  const gscConn = gscConnections[website.id];

  const { items: decliningPages, summary: declineSummary } = computeDecliningPages(website.id, { period: '28d' });

  // Calculate totals for active website
  const totalSessions = pageMetrics.reduce((s, m) => s + m.sessions, 0) || 128450;
  const totalClicks = gscMetrics.reduce((s, g) => s + g.clicks, 0) || 79400;
  const totalImpressions = gscMetrics.reduce((s, g) => s + g.impressions, 0) || 1290000;
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '6.2';

  const top3Keywords = keywords.filter(k => k.currentRank && k.currentRank <= 3);
  const top10Keywords = keywords.filter(k => k.currentRank && k.currentRank <= 10);
  const rankGains = keywords.filter(k => k.currentRank && k.previousRank && k.currentRank < k.previousRank);
  const rankDrops = keywords.filter(k => k.currentRank && k.previousRank && k.currentRank > k.previousRank);

  // Compute summary metrics across all projects for the portfolio overview
  const allProjectsSummary = allWebsites.map(site => {
    const sitePageMetrics = storage.getPageMetrics(site.id);
    const siteGscMetrics = storage.getGscMetrics(site.id);
    const siteKeywords = storage.getKeywords(site.id);
    const siteDecline = computeDecliningPages(site.id, { period: '28d' });

    const siteSessions = sitePageMetrics.reduce((s, m) => s + m.sessions, 0) || (site.id === 'site-acme' ? 128450 : 34200);
    const siteClicks = siteGscMetrics.reduce((s, g) => s + g.clicks, 0) || (site.id === 'site-acme' ? 79400 : 18500);
    const siteTop3 = siteKeywords.filter(k => k.currentRank && k.currentRank <= 3).length;
    const siteTop10 = siteKeywords.filter(k => k.currentRank && k.currentRank <= 10).length;

    const effTz = getEffectiveTimezone(site.timezone, globalSettings.timezone);

    return {
      site,
      sessions: siteSessions,
      clicks: siteClicks,
      totalKeywords: siteKeywords.length,
      top3: siteTop3,
      top10: siteTop10,
      decliningCount: siteDecline.summary.totalDecliningPages,
      trafficLoss: siteDecline.summary.totalTrafficLoss,
      effectiveTimezone: effTz,
      gaStatus: gaConnections[site.id]?.status || 'disconnected',
      gscStatus: gscConnections[site.id]?.status || 'disconnected'
    };
  });

  return (
    <div className="space-y-8">
      
      {/* Portfolio Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Projects Overview & Performance Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized monitoring for all tracked domains, organic search visibility, and traffic anomalies.
          </p>
        </div>

        {onNavigateToWebsites && (
          <button
            onClick={onNavigateToWebsites}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 backdrop-blur-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manage Projects</span>
          </button>
        )}
      </div>

      {/* Projects List Card Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl space-y-0">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            All Tracked Projects ({allWebsites.length})
          </div>
          <span className="text-[11px] text-slate-400">
            Click any project to switch active view
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-slate-400 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Project & Domain</th>
                <th className="py-3 px-3">Timezone</th>
                <th className="py-3 px-3">Sync Status</th>
                <th className="py-3 px-3 text-right">28d Sessions</th>
                <th className="py-3 px-3 text-right">GSC Clicks</th>
                <th className="py-3 px-3 text-center">Tracked Keywords</th>
                <th className="py-3 px-3 text-center">Declining Pages</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent">
              {allProjectsSummary.map(item => {
                const isCurrent = item.site.id === website.id;

                return (
                  <tr
                    key={item.site.id}
                    className={`transition-colors ${
                      isCurrent ? 'bg-indigo-500/10 hover:bg-indigo-500/15' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isCurrent ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/10 text-slate-300'
                        }`}>
                          {item.site.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{item.site.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-indigo-500/30 text-indigo-200 rounded font-semibold border border-indigo-500/40">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{item.site.domain}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[11px] text-slate-300 font-mono">{item.effectiveTimezone}</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                          item.gaStatus === 'connected'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-white/5 text-slate-400 border-white/10'
                        }`}>
                          <Radio className="w-2.5 h-2.5" /> GA4
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                          item.gscStatus === 'connected'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-white/5 text-slate-400 border-white/10'
                        }`}>
                          <Radio className="w-2.5 h-2.5" /> GSC
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-200 font-semibold">
                      {item.sessions.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-indigo-300 font-semibold">
                      {item.clicks.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      <span className="text-white font-semibold">{item.totalKeywords}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({item.top3} Top 3)</span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {item.decliningCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-bold">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {item.decliningCount} losing
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-medium">0 losing</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isCurrent ? (
                        <span className="text-[11px] text-indigo-400 font-semibold">Active</span>
                      ) : (
                        <button
                          onClick={() => onSelectWebsite && onSelectWebsite(item.site.id)}
                          className="px-3 py-1 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-all"
                        >
                          Select
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Project Highlight Header */}
      <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg shadow-inner">
            {website.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">{website.name} — Quick Stats</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {website.status}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{website.domain}</span>
              <span className="text-slate-600">•</span>
              <span>Effective Timezone: {getEffectiveTimezone(website.timezone, globalSettings.timezone)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onNavigateToKeywords}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-200 font-medium transition-colors"
          >
            Keywords ({keywords.length})
          </button>
          <button
            onClick={onNavigateToDeclining}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-rose-300 font-medium transition-colors"
          >
            Declining Pages ({declineSummary.totalDecliningPages})
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* GA4 Sessions */}
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Sessions (28d)</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">{totalSessions.toLocaleString()}</div>
          <div className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+5.4% vs prior period</span>
          </div>
        </div>

        {/* Organic Clicks */}
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Organic Clicks (GSC)</span>
            <Search className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">{totalClicks.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>CTR: <strong className="text-slate-200">{avgCtr}%</strong></span>
            <span className="text-slate-600">•</span>
            <span>Imp: <strong className="text-slate-200">{(totalImpressions / 1000000).toFixed(2)}M</strong></span>
          </div>
        </div>

        {/* Tracked Keywords in Top 3 / Top 10 */}
        <div
          onClick={onNavigateToKeywords}
          className="p-5 bg-white/5 border border-white/10 hover:border-indigo-500/40 rounded-2xl backdrop-blur-md cursor-pointer transition-all hover:bg-white/[0.07]"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Keyword Rankings</span>
            <KeyRound className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-white">{top3Keywords.length}</span>
            <span className="text-xs text-indigo-400 font-medium">in Top 3</span>
            <span className="text-xs text-slate-400">({top10Keywords.length} in Top 10)</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span className="text-emerald-400 font-medium">+{rankGains.length} gains</span>
            <span className="text-slate-600">•</span>
            <span className="text-rose-400 font-medium">-{rankDrops.length} drops</span>
          </div>
        </div>

        {/* Declining Pages Alert Box */}
        <div
          onClick={onNavigateToDeclining}
          className="p-5 bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 rounded-2xl backdrop-blur-md cursor-pointer transition-all hover:bg-rose-500/[0.15]"
        >
          <div className="flex items-center justify-between text-rose-300 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Declining Pages
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 text-[10px] font-bold border border-rose-500/30">
              {declineSummary.criticalCount} Critical
            </span>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{declineSummary.totalDecliningPages} pages losing</div>
          <div className="text-xs text-rose-300/90 mt-1 font-medium">
            -{declineSummary.totalTrafficLoss.toLocaleString()} sessions lost in last 28d
          </div>
        </div>

      </div>

      {/* Priority Declining Pages Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              Priority Declining Pages for {website.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by traffic loss and comparative search decline</p>
          </div>
          <button
            onClick={onNavigateToDeclining}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Open Declining Pages Analysis</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-slate-400 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Page Path & Category</th>
                <th className="py-3 px-4 text-right">Traffic Loss</th>
                <th className="py-3 px-4 text-right">Drop %</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent">
              {decliningPages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                    No declining pages detected for the current comparative period.
                  </td>
                </tr>
              ) : (
                decliningPages.slice(0, 5).map((dp, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100">{dp.cleanPath}</div>
                      <div className="text-[11px] text-slate-400">{dp.suggestedAction}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">
                      -{dp.absoluteLoss.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-300 font-medium">
                      {dp.dropPercentage}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        dp.priorityLevel === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {dp.priorityLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onOpenPageDetail(dp)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-[11px] transition-all shadow-sm"
                      >
                        Inspect Page
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
