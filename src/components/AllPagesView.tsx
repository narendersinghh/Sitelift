import React, { useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  EyeOff,
  TrendingDown,
  TrendingUp,
  BarChart3,
  ExternalLink,
  Filter,
  Calendar,
  Layers,
  ArrowUpDown,
  Plus,
  Clock,
  Sparkles,
  Zap,
  X,
  Check
} from 'lucide-react';
import { Website, SubmittedPageItem, Activity, ActivityType } from '../types';
import { storage } from '../services/storage';

interface AllPagesViewProps {
  website: Website;
  onOpenActivityPlanner?: () => void;
}

export const AllPagesView: React.FC<AllPagesViewProps> = ({
  website,
  onOpenActivityPlanner
}) => {
  const [activeTab, setActiveTab] = useState<
    'all' | 'indexed' | 'not_indexed' | 'zero_traffic' | 'zero_impressions' | 'top_performers'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'clicks' | 'sessions' | 'impressions' | 'position' | 'crawled'>('clicks');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;
  
  // Research & Plan Modal State
  const [selectedPageForModal, setSelectedPageForModal] = useState<SubmittedPageItem | null>(null);
  const [planTaskTitle, setPlanTaskTitle] = useState('');
  const [planTaskPriority, setPlanTaskPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('high');
  const [planTaskType, setPlanTaskType] = useState('on_page');
  const [taskAddedToast, setTaskAddedToast] = useState(false);

  // Fetch submitted pages from storage
  const submittedPages = storage.getSubmittedPages(website.id);

  // Filter based on active tab and search filters
  const filteredPages = submittedPages.filter(page => {
    // Tab filter
    if (activeTab === 'indexed' && page.indexStatus !== 'indexed') return false;
    if (activeTab === 'not_indexed' && page.indexStatus === 'indexed') return false;
    if (activeTab === 'zero_traffic' && !page.isZeroTraffic) return false;
    if (activeTab === 'zero_impressions' && !page.isZeroImpressions) return false;
    if (activeTab === 'top_performers' && !page.isTopPerformer) return false;

    // Category filter
    if (selectedCategory !== 'all' && page.category !== selectedCategory) return false;

    // Status filter
    if (selectedStatus !== 'all' && page.indexStatus !== selectedStatus) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchUrl = page.cleanPath.toLowerCase().includes(q) || page.pageUrl.toLowerCase().includes(q);
      const matchTitle = page.title.toLowerCase().includes(q);
      const matchQuery = page.topQueries.some(tq => tq.query.toLowerCase().includes(q));
      if (!matchUrl && !matchTitle && !matchQuery) return false;
    }

    return true;
  });

  // Sort
  filteredPages.sort((a, b) => {
    let valA = 0;
    let valB = 0;

    if (sortBy === 'clicks') {
      valA = a.totalClicks;
      valB = b.totalClicks;
    } else if (sortBy === 'sessions') {
      valA = a.totalSessions;
      valB = b.totalSessions;
    } else if (sortBy === 'impressions') {
      valA = a.totalImpressions;
      valB = b.totalImpressions;
    } else if (sortBy === 'position') {
      valA = a.avgPosition || 999;
      valB = b.avgPosition || 999;
      // for position, lower is better by default in asc
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    } else if (sortBy === 'crawled') {
      valA = new Date(a.lastCrawledAt).getTime();
      valB = new Date(b.lastCrawledAt).getTime();
    }

    return sortDirection === 'asc' ? valA - valB : valB - valA;
  });

  // KPI Metrics
  const totalCount = submittedPages.length;
  const indexedCount = submittedPages.filter(p => p.indexStatus === 'indexed').length;
  const notIndexedCount = submittedPages.filter(p => p.indexStatus !== 'indexed').length;
  const zeroTrafficCount = submittedPages.filter(p => p.isZeroTraffic).length;
  const zeroImpCount = submittedPages.filter(p => p.isZeroImpressions).length;
  const indexCoveragePct = totalCount > 0 ? Number(((indexedCount / totalCount) * 100).toFixed(1)) : 100;

  const categories = Array.from(new Set(submittedPages.map(p => p.category))).filter(Boolean);

  const totalPages = Math.ceil(filteredPages.length / PAGE_SIZE) || 1;
  const paginatedPages = filteredPages.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getStatusBadge = (status: SubmittedPageItem['indexStatus'], label: string) => {
    switch (status) {
      case 'indexed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {label}
          </span>
        );
      case 'crawled_not_indexed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            {label}
          </span>
        );
      case 'discovered_not_indexed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            {label}
          </span>
        );
      case 'excluded_noindex':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <EyeOff className="w-3 h-3 text-purple-600" />
            {label}
          </span>
        );
      case 'not_found_404':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            {label}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
            {label}
          </span>
        );
    }
  };

  const handleCreateActivityTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPageForModal || !planTaskTitle.trim()) return;

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      websiteId: website.id,
      title: planTaskTitle.trim(),
      description: `Target URL: ${selectedPageForModal.cleanPath}\nStatus: ${selectedPageForModal.indexStatusLabel}\nPriority: ${planTaskPriority}\nCategory: ${selectedPageForModal.category}`,
      type: planTaskType as ActivityType,
      priority: planTaskPriority,
      status: 'approved',
      effort: 'medium',
      impact: selectedPageForModal.isZeroTraffic ? 'high' : 'medium',
      assignedUser: 'SEO Specialist',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      month: new Date().toISOString().slice(0, 7),
      relatedPageUrl: selectedPageForModal.pageUrl,
      relatedKeyword: selectedPageForModal.topQueries[0]?.query || '',
      createdAt: new Date().toISOString()
    };

    storage.saveActivity(newActivity);
    setTaskAddedToast(true);
    setPlanTaskTitle('');
    setTimeout(() => {
      setTaskAddedToast(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="w-full">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Submitted Pages & Index Coverage
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete inventory of all URLs submitted via XML sitemaps and discovered by Google Search Console.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap pt-2 border-t border-slate-100">
          <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{indexCoveragePct}% Index Coverage ({indexedCount}/{totalCount} URLs Indexed)</span>
          </div>
          {onOpenActivityPlanner && (
            <button
              onClick={onOpenActivityPlanner}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-xs transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Activity Planner</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeTab === 'all'
              ? 'bg-blue-100/70 border-blue-400 ring-2 ring-blue-400'
              : 'bg-blue-50/60 border-blue-200 hover:bg-blue-100/50'
          }`}
        >
          <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">Total URLs</div>
          <div className="text-2xl font-extrabold text-blue-950 mt-1">{totalCount}</div>
          <div className="text-xs text-blue-700/80 mt-0.5 font-medium">In GSC & Sitemaps</div>
        </div>

        <div
          onClick={() => setActiveTab('indexed')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeTab === 'indexed'
              ? 'bg-emerald-100/80 border-emerald-500 ring-2 ring-emerald-400'
              : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/50'
          }`}
        >
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Indexed & Live</div>
          <div className="text-2xl font-extrabold text-emerald-900 mt-1">{indexedCount}</div>
          <div className="text-xs text-emerald-700 font-semibold mt-0.5">{indexCoveragePct}% coverage</div>
        </div>

        <div
          onClick={() => setActiveTab('not_indexed')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeTab === 'not_indexed'
              ? 'bg-amber-100/80 border-amber-500 ring-2 ring-amber-400'
              : 'bg-amber-50/60 border-amber-200 hover:bg-amber-100/50'
          }`}
        >
          <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Not Indexed</div>
          <div className="text-2xl font-extrabold text-amber-900 mt-1">{notIndexedCount}</div>
          <div className="text-xs text-amber-700 font-semibold mt-0.5">Excluded / Crawled</div>
        </div>

        <div
          onClick={() => setActiveTab('zero_traffic')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeTab === 'zero_traffic'
              ? 'bg-rose-100/80 border-rose-500 ring-2 ring-rose-400'
              : 'bg-rose-50/60 border-rose-200 hover:bg-rose-100/50'
          }`}
        >
          <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">Zero Traffic</div>
          <div className="text-2xl font-extrabold text-rose-900 mt-1">{zeroTrafficCount}</div>
          <div className="text-xs text-rose-700 font-semibold mt-0.5">0 Sessions</div>
        </div>

        <div
          onClick={() => setActiveTab('zero_impressions')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeTab === 'zero_impressions'
              ? 'bg-purple-100/80 border-purple-500 ring-2 ring-purple-400'
              : 'bg-purple-50/60 border-purple-200 hover:bg-purple-100/50'
          }`}
        >
          <div className="text-xs font-bold text-purple-800 uppercase tracking-wider">Zero Impressions</div>
          <div className="text-2xl font-extrabold text-purple-900 mt-1">{zeroImpCount}</div>
          <div className="text-xs text-purple-700 font-semibold mt-0.5">Invisible in Search</div>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="space-y-3">
        {/* Navigation Multi-Colored Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
          {[
            { id: 'all', label: 'All Submitted URLs', count: totalCount, activeClass: 'bg-slate-900 text-white shadow-xs', inactiveClass: 'bg-slate-50 text-slate-700 hover:bg-slate-100' },
            { id: 'indexed', label: 'Indexed Pages', count: indexedCount, activeClass: 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-200', inactiveClass: 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200' },
            { id: 'not_indexed', label: 'Not Indexed', count: notIndexedCount, activeClass: 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-200', inactiveClass: 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200' },
            { id: 'zero_traffic', label: 'Zero Traffic', count: zeroTrafficCount, activeClass: 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-200', inactiveClass: 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200' },
            { id: 'zero_impressions', label: 'Zero Impressions', count: zeroImpCount, activeClass: 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-200', inactiveClass: 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200' },
            { id: 'top_performers', label: 'Top Performers', count: submittedPages.filter(p => p.isTopPerformer).length, activeClass: 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-200', inactiveClass: 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? tab.activeClass
                  : tab.inactiveClass
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-black/5 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Selectors Toolbar */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search submitted URL path, title, or ranking query..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Index Statuses</option>
            <option value="indexed">Indexed & Live</option>
            <option value="crawled_not_indexed">Crawled – currently not indexed</option>
            <option value="discovered_not_indexed">Discovered – currently not indexed</option>
            <option value="excluded_noindex">Excluded by 'noindex' tag</option>
            <option value="duplicate_no_canonical">Duplicate without canonical</option>
            <option value="not_found_404">Not found (404 Error)</option>
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="clicks">Sort: GSC Clicks</option>
              <option value="sessions">Sort: GA4 Sessions</option>
              <option value="impressions">Sort: Impressions</option>
              <option value="position">Sort: Avg Position</option>
              <option value="crawled">Sort: Last Crawled</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Submitted URL & Category</th>
                <th className="px-4 py-3">GSC Index Status</th>
                <th className="px-4 py-3">Last Crawled</th>
                <th className="px-4 py-3 text-right">GSC Impressions</th>
                <th className="px-4 py-3 text-right">GSC Clicks</th>
                <th className="px-4 py-3 text-right">CTR</th>
                <th className="px-4 py-3 text-right">Avg Position</th>
                <th className="px-4 py-3 text-right">GA4 Sessions</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans bg-white">
              {paginatedPages.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold text-slate-800">No Submitted URLs Found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try adjusting the search query or active filter tab above.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedPages.map(page => (
                  <tr key={page.id} className="hover:bg-slate-50/80 transition-colors group">
                    
                    {/* URL Path & Title */}
                    <td className="px-4 py-3 min-w-[240px]">
                      <div className="font-bold text-slate-900 truncate max-w-xs flex items-center gap-1.5">
                        <span className="truncate">{page.cleanPath}</span>
                        <a
                          href={page.pageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded border border-indigo-100">{page.category}</span>
                        {page.topQueries[0] && (
                          <span className="text-[10px] text-slate-500 truncate max-w-[150px] font-mono">
                            ↳ {page.topQueries[0].query}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Index Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(page.indexStatus, page.indexStatusLabel)}
                    </td>

                    {/* Last Crawled */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                      {page.lastCrawledAt}
                    </td>

                    {/* Impressions */}
                    <td className="px-4 py-3 text-right font-mono text-slate-700 font-medium">
                      {page.totalImpressions > 0 ? (
                        page.totalImpressions.toLocaleString()
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </td>

                    {/* Clicks */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {page.totalClicks > 0 ? (
                        page.totalClicks.toLocaleString()
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </td>

                    {/* CTR */}
                    <td className="px-4 py-3 text-right font-mono text-slate-700 font-medium">
                      {page.ctr > 0 ? `${page.ctr}%` : <span className="text-slate-400">0.0%</span>}
                    </td>

                    {/* Avg Position */}
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {page.avgPosition > 0 ? (
                        <span className={page.avgPosition <= 10 ? 'text-emerald-700' : 'text-slate-700'}>
                          #{page.avgPosition}
                        </span>
                      ) : (
                        <span className="text-slate-400">–</span>
                      )}
                    </td>

                    {/* GA4 Sessions */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-blue-700">
                      {page.totalSessions > 0 ? page.totalSessions.toLocaleString() : <span className="text-slate-400">0</span>}
                    </td>

                    {/* Action Button: Research & Plan */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedPageForModal(page)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold rounded-xl text-xs border border-blue-200 hover:border-blue-600 flex items-center gap-1.5 transition-all mx-auto shadow-xs"
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
        {filteredPages.length > PAGE_SIZE && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500">
              Showing <span className="font-bold text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-bold text-slate-800">
                {Math.min(currentPage * PAGE_SIZE, filteredPages.length)}
              </span>{' '}
              of <span className="font-bold text-slate-800">{filteredPages.length}</span> submitted URLs
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

      {/* Research & Plan Detail Modal for Submitted Pages */}
      {selectedPageForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 truncate max-w-lg">{selectedPageForModal.cleanPath}</h3>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-semibold border border-slate-300">
                      {selectedPageForModal.category}
                    </span>
                    {getStatusBadge(selectedPageForModal.indexStatus, selectedPageForModal.indexStatusLabel)}
                  </div>
                  <a
                    href={selectedPageForModal.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5 font-mono"
                  >
                    <span>{selectedPageForModal.pageUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <button
                onClick={() => setSelectedPageForModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">GA4 Organic Sessions</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{selectedPageForModal.totalSessions.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Recorded user visits</div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">GSC Total Clicks</div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">{selectedPageForModal.totalClicks.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">CTR: {selectedPageForModal.ctr}%</div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">GSC Impressions</div>
                  <div className="text-2xl font-bold text-blue-700 mt-1">{selectedPageForModal.totalImpressions.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Search visibility</div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Average Position</div>
                  <div className="text-2xl font-bold text-amber-700 mt-1">
                    {selectedPageForModal.avgPosition > 0 ? `#${selectedPageForModal.avgPosition}` : '–'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Rank in Google SERPs</div>
                </div>
              </div>

              {/* Index & Technical Crawl Status */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-600" />
                  Indexation & Technical Diagnostics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-slate-500 block text-[10px] font-semibold">Googlebot Last Crawl</span>
                    <span className="font-mono text-slate-900 font-bold">{selectedPageForModal.lastCrawledAt}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-slate-500 block text-[10px] font-semibold">Mobile Usability</span>
                    <span className="text-emerald-700 font-bold capitalize">{selectedPageForModal.mobileUsability}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-slate-500 block text-[10px] font-semibold">Core Web Vitals</span>
                    <span className="text-emerald-700 font-bold capitalize">{selectedPageForModal.coreWebVitals}</span>
                  </div>
                </div>
                {selectedPageForModal.diagnosisNote && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-medium mt-2">
                    <span className="font-bold">Diagnostic Observation: </span>
                    {selectedPageForModal.diagnosisNote}
                  </div>
                )}
              </div>

              {/* Ranking Search Queries */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Discovered Ranking Queries ({selectedPageForModal.topQueries.length})</span>
                  <span className="text-[10px] text-slate-500 font-normal">Source: Google Search Console</span>
                </h4>
                {selectedPageForModal.topQueries.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    No query ranking data recorded for this URL yet.
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Search Query</th>
                          <th className="px-4 py-2.5 text-right">Impressions</th>
                          <th className="px-4 py-2.5 text-right">Clicks</th>
                          <th className="px-4 py-2.5 text-right">CTR</th>
                          <th className="px-4 py-2.5 text-right">Avg Position</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPageForModal.topQueries.map((q, qIdx) => (
                          <tr key={qIdx} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-bold text-slate-900 font-mono flex items-center gap-2">
                              <span>{q.query}</span>
                              {q.isBranded && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-bold border border-amber-200">
                                  Brand
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-700">{q.impressions.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-emerald-700 font-bold">{q.clicks.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-700">{q.ctr}%</td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-700 font-semibold">#{q.position}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Add Activity Task Form */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Add Optimization Task to Activity Planner
                    </h4>
                  </div>
                  {taskAddedToast && (
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Added to Activity Planner!
                    </span>
                  )}
                </div>

                <form onSubmit={handleCreateActivityTask} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder={`e.g. Optimize title tag & internal links for ${selectedPageForModal.cleanPath}`}
                      value={planTaskTitle}
                      onChange={e => setPlanTaskTitle(e.target.value)}
                      className="sm:col-span-2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none shadow-xs"
                    />

                    <div className="flex items-center gap-2">
                      <select
                        value={planTaskPriority}
                        onChange={e => setPlanTaskPriority(e.target.value as any)}
                        className="w-1/2 px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-xs"
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High Priority</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low Priority</option>
                      </select>

                      <button
                        type="submit"
                        disabled={!planTaskTitle.trim()}
                        className="w-1/2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Task</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-600">
                URL Status: <strong className="text-slate-900">{selectedPageForModal.indexStatusLabel}</strong>
              </span>
              <button
                onClick={() => setSelectedPageForModal(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
