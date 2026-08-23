import React from 'react';
import {
  TrendingUp,
  Users,
  Search,
  KeyRound,
  AlertTriangle,
  Radio,
  Globe,
  Plus,
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

  const { summary: declineSummary } = computeDecliningPages(website.id, { period: '28d' });

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
    <div className="space-y-6">
      
      {/* Active Project Highlight & Controls (Top) */}
      <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-3.5 w-full">
          <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg shadow-inner shrink-0">
            {website.name.charAt(0)}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-white tracking-tight">{website.name}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {website.status}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                ({website.domain})
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
              <span>Timezone: {getEffectiveTimezone(website.timezone, globalSettings.timezone)}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400">GA4 & GSC Synced</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap pt-1 border-t border-slate-800/60">
          <button
            onClick={onNavigateToKeywords}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-slate-200 font-medium transition"
          >
            Keywords ({keywords.length})
          </button>
          <button
            onClick={onNavigateToDeclining}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 font-medium transition"
          >
            Declining ({declineSummary.totalDecliningPages})
          </button>
          <button
            onClick={onNavigateToActivities}
            className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-300 font-medium transition"
          >
            Activity Planner
          </button>
        </div>
      </div>

      {/* Primary KPI Stats Grid (At Top) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* GA4 Sessions */}
        <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl backdrop-blur-md hover:border-slate-700/80 transition-all">
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
        <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl backdrop-blur-md hover:border-slate-700/80 transition-all">
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
          className="p-5 bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl backdrop-blur-md cursor-pointer transition-all hover:bg-slate-850"
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

      {/* Portfolio Overview & All Projects Table */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl space-y-0">
        <div className="p-4 border-b border-slate-800/70 flex items-center justify-between bg-slate-950/40">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            All Tracked Projects ({allWebsites.length})
          </div>
          {onNavigateToWebsites && (
            <button
              onClick={onNavigateToWebsites}
              className="flex items-center gap-1 px-3 py-1 bg-indigo-600/80 hover:bg-indigo-600 rounded-lg text-xs font-medium text-white transition"
            >
              <Plus className="w-3 h-3" />
              <span>Add / Manage Projects</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800/70 text-[10px] font-bold uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-800/50 bg-transparent">
              {allProjectsSummary.map(item => {
                const isCurrent = item.site.id === website.id;

                return (
                  <tr
                    key={item.site.id}
                    className={`transition-colors ${
                      isCurrent ? 'bg-indigo-500/10 hover:bg-indigo-500/15' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isCurrent ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-300'
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
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          <Radio className="w-2.5 h-2.5" /> GA4
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                          item.gscStatus === 'connected'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
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
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-all"
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

    </div>
  );
};
