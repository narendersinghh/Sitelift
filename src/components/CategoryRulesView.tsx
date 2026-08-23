import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Search,
  Sparkles,
  Tag,
  ArrowUp,
  ArrowDown,
  Check,
  Eye,
  Sliders,
  ExternalLink,
  Code,
  X,
  RotateCcw,
  HelpCircle,
  FolderTree,
  ListOrdered,
  FileCode2,
  CheckCircle
} from 'lucide-react';
import { Website, CategoryRule, MatchType } from '../types';
import { storage } from '../services/storage';
import { evaluateRuleMatch } from '../services/decliningPagesEngine';

interface CategoryRulesViewProps {
  website: Website;
  onRefresh: () => void;
}

interface RulePreset {
  id: string;
  name: string;
  category: string;
  targetType: 'url' | 'keyword' | 'query';
  matchType: MatchType;
  pattern: string;
  description: string;
}

export const CategoryRulesView: React.FC<CategoryRulesViewProps> = ({ website, onRefresh }) => {
  const [rules, setRules] = useState<CategoryRule[]>(() => storage.getCategoryRules(website.id));
  const [viewMode, setViewMode] = useState<'grouped' | 'priority'>('grouped');
  const [filterType, setFilterType] = useState<'all' | 'url' | 'keyword' | 'query'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState<CategoryRule | null>(null);

  // Form State
  const [ruleName, setRuleName] = useState('');
  const [targetType, setTargetType] = useState<'url' | 'keyword' | 'query'>('url');
  const [matchType, setMatchType] = useState<MatchType>('starts_with');
  const [pattern, setPattern] = useState('');
  const [categoryName, setCategoryName] = useState('Blog');
  const [priority, setPriority] = useState(10);
  const [isActive, setIsActive] = useState(true);

  // Test Simulator State
  const [testInput, setTestInput] = useState(`/blog/seo-best-practices`);
  const [testResult, setTestResult] = useState<{ matchedRule?: CategoryRule; category: string; trace: string[] } | null>(null);
  const [isReclassifying, setIsReclassifying] = useState(false);
  const [reclassifyToast, setReclassifyToast] = useState(false);

  // Extract all existing categories for quick selection
  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    rules.forEach(r => {
      if (r.category) set.add(r.category);
    });
    // Add defaults if empty
    ['Blog', 'Blog > Engineering', 'Blog > Marketing', 'Features', 'Pricing', 'Docs', 'Comparisons', 'Brand Keywords', 'Commercial Keywords'].forEach(c => set.add(c));
    return Array.from(set);
  }, [rules]);

  // Load all known URLs and Keywords for testing
  const allKnownUrls = useMemo(() => {
    const pageMetrics = storage.getPageMetrics(website.id);
    const gscMetrics = storage.getGscMetrics(website.id);
    const set = new Set<string>();

    pageMetrics.forEach(m => {
      if (m.cleanPath) set.add(m.cleanPath);
      else if (m.pagePath) set.add(m.pagePath);
    });
    gscMetrics.forEach(g => {
      if (g.cleanPath) set.add(g.cleanPath);
    });

    if (set.size === 0) {
      return [
        '/blog/async-communication-guide',
        '/blog/tutorials/getting-started',
        '/blog/engineering/scaling-postgres',
        '/features/collaboration',
        '/features/kanban-board',
        '/vs/trello',
        '/pricing',
        '/docs/api-v2',
        '/templates/project-plan-2026'
      ];
    }
    return Array.from(set);
  }, [website.id]);

  const allKnownKeywords = useMemo(() => {
    return storage.getKeywords(website.id).map(k => k.keyword);
  }, [website.id]);

  // Presets gallery for quick 1-click rule templates
  const presets: RulePreset[] = [
    {
      id: 'p-blog-root',
      name: 'Blog Main Articles',
      category: 'Blog',
      targetType: 'url',
      matchType: 'starts_with',
      pattern: '/blog',
      description: 'Matches all articles under /blog/'
    },
    {
      id: 'p-blog-tech',
      name: 'Blog Engineering / Tech Sub-category',
      category: 'Blog > Engineering',
      targetType: 'url',
      matchType: 'glob',
      pattern: '/blog/engineering/*',
      description: 'Categorizes technical deep dives into Blog > Engineering'
    },
    {
      id: 'p-features',
      name: 'Product Features & Capabilities',
      category: 'Features',
      targetType: 'url',
      matchType: 'starts_with',
      pattern: '/features',
      description: 'Matches all product feature landing pages'
    },
    {
      id: 'p-pricing',
      name: 'Pricing & Subscription Tiers',
      category: 'Pricing',
      targetType: 'url',
      matchType: 'contains',
      pattern: 'pricing',
      description: 'Matches /pricing, /plans, and calculator pages'
    },
    {
      id: 'p-vs',
      name: 'Competitor Comparisons & Alternatives',
      category: 'Comparisons',
      targetType: 'url',
      matchType: 'starts_with',
      pattern: '/vs',
      description: 'Matches comparison landing pages like /vs/trello'
    },
    {
      id: 'p-brand-kw',
      name: 'Brand Search Queries',
      category: 'Brand Keywords',
      targetType: 'keyword',
      matchType: 'contains',
      pattern: website.name.split(' ')[0].toLowerCase(),
      description: `Matches keywords containing "${website.name.split(' ')[0]}"`
    }
  ];

  // Helper to open Add Rule modal pre-filled for a specific category
  const handleOpenAddForCategory = (catName: string, defaultTarget: 'url' | 'keyword' | 'query' = 'url') => {
    setEditingRule(null);
    setCategoryName(catName);
    setTargetType(defaultTarget);
    setRuleName(`Rule for ${catName}`);
    setMatchType(defaultTarget === 'url' ? 'starts_with' : 'contains');
    setPattern(defaultTarget === 'url' ? `/${catName.toLowerCase().replace(/[^a-z0-9]/g, '-')}/` : '');
    
    // Auto calculate next priority
    const highestPriority = rules.length > 0 ? Math.max(...rules.map(r => r.priority)) : 0;
    setPriority(highestPriority + 10);
    setIsActive(true);
    setShowAddModal(true);
  };

  const handleOpenEdit = (rule: CategoryRule) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setCategoryName(rule.category);
    setTargetType(rule.targetType || 'url');
    setMatchType(rule.matchType);
    setPattern(rule.pattern);
    setPriority(rule.priority);
    setIsActive(rule.isActive !== false);
    setShowAddModal(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !categoryName.trim() || !pattern.trim()) return;

    const newRule: CategoryRule = {
      id: editingRule ? editingRule.id : `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      websiteId: website.id,
      name: ruleName.trim(),
      category: categoryName.trim(),
      targetType,
      matchType,
      pattern: pattern.trim(),
      priority: Number(priority) || 10,
      isActive,
      createdAt: editingRule ? editingRule.createdAt : new Date().toISOString()
    };

    storage.saveCategoryRule(newRule);
    const updated = storage.getCategoryRules(website.id);
    setRules(updated);
    setShowAddModal(false);
    setEditingRule(null);
    onRefresh();
  };

  const handleDeleteRule = (ruleId: string) => {
    storage.deleteCategoryRule(ruleId);
    const updated = storage.getCategoryRules(website.id);
    setRules(updated);
    onRefresh();
  };

  const handleToggleActive = (rule: CategoryRule) => {
    const updated: CategoryRule = {
      ...rule,
      isActive: !(rule.isActive !== false)
    };
    storage.saveCategoryRule(updated);
    setRules(storage.getCategoryRules(website.id));
    onRefresh();
  };

  const handlePriorityShift = (rule: CategoryRule, direction: 'up' | 'down') => {
    const sorted = [...rules].sort((a, b) => a.priority - b.priority);
    const idx = sorted.findIndex(r => r.id === rule.id);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) {
      const prev = sorted[idx - 1];
      const tempP = rule.priority;
      rule.priority = Math.max(1, prev.priority - 1);
      if (rule.priority === prev.priority) {
        prev.priority = rule.priority + 1;
      }
      storage.saveCategoryRule(rule);
      storage.saveCategoryRule(prev);
    } else if (direction === 'down' && idx < sorted.length - 1) {
      const next = sorted[idx + 1];
      rule.priority = next.priority + 1;
      storage.saveCategoryRule(rule);
    }

    setRules(storage.getCategoryRules(website.id));
    onRefresh();
  };

  const handleApplyPreset = (preset: RulePreset) => {
    const highestPriority = rules.length > 0 ? Math.max(...rules.map(r => r.priority)) : 0;
    const newRule: CategoryRule = {
      id: `rule-preset-${Date.now()}`,
      websiteId: website.id,
      name: preset.name,
      category: preset.category,
      targetType: preset.targetType,
      matchType: preset.matchType,
      pattern: preset.pattern,
      priority: highestPriority + 10,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    storage.saveCategoryRule(newRule);
    setRules(storage.getCategoryRules(website.id));
    onRefresh();
  };

  // Run Test Simulator
  const handleRunSimulator = () => {
    if (!testInput.trim()) return;
    const sorted = [...rules]
      .filter(r => r.isActive !== false)
      .sort((a, b) => a.priority - b.priority);

    const trace: string[] = [];
    let matchedRule: CategoryRule | undefined;
    let finalCat = 'General (Default fallback)';

    for (const r of sorted) {
      const isMatch = evaluateRuleMatch(testInput, r.pattern, r.matchType);
      if (isMatch) {
        trace.push(`[MATCH] Rule #${r.priority} "${r.name}" matched (${r.matchType}: "${r.pattern}") -> Assigned "${r.category}"`);
        matchedRule = r;
        finalCat = r.category;
        break;
      } else {
        trace.push(`[SKIP] Rule #${r.priority} "${r.name}" did not match.`);
      }
    }

    setTestResult({
      matchedRule,
      category: finalCat,
      trace
    });
  };

  // Compute live match count for any rule against known URLs/keywords
  const getRuleMatchCount = (rule: CategoryRule) => {
    const list = rule.targetType === 'url' ? allKnownUrls : allKnownKeywords;
    return list.filter(item => evaluateRuleMatch(item, rule.pattern, rule.matchType)).length;
  };

  // Re-classify all data across the platform
  const handleReclassifyAll = () => {
    setIsReclassifying(true);
    setTimeout(() => {
      setIsReclassifying(false);
      setReclassifyToast(true);
      onRefresh();
      setTimeout(() => setReclassifyToast(false), 3000);
    }, 400);
  };

  // Filtered rules
  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      if (filterType !== 'all' && (r.targetType || 'url') !== filterType) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.pattern.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rules, filterType, searchFilter]);

  // Group rules by Category for the "Grouped" view
  const categoryGroups = useMemo(() => {
    const map = new Map<string, { category: string; targetType: string; rules: CategoryRule[] }>();

    filteredRules.forEach(r => {
      const cat = r.category || 'General';
      if (!map.has(cat)) {
        map.set(cat, {
          category: cat,
          targetType: r.targetType || 'url',
          rules: []
        });
      }
      map.get(cat)!.rules.push(r);
    });

    // Sort rules inside each category by priority
    map.forEach(group => {
      group.rules.sort((a, b) => a.priority - b.priority);
    });

    return Array.from(map.values());
  }, [filteredRules]);

  const formatMatchTypeLabel = (type: MatchType) => {
    switch (type) {
      case 'starts_with':
        return 'Prefix (Starts With)';
      case 'contains':
        return 'Contains Text';
      case 'ends_with':
        return 'Suffix (Ends With)';
      case 'exact':
        return 'Exact Match';
      case 'glob':
        return 'Wildcard Glob (*)';
      case 'regex':
        return 'Regular Expression (RegEx)';
      case 'query_param':
        return 'URL Query Parameter';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="space-y-1 w-full">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Tag className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
              Category & Classification Rules
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {rules.length} Active Rules
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl">
            Classify pages and search queries into categories & sub-categories using multi-rule expressions with priority-based sequence execution.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap pt-1 border-t border-slate-800/60">
          <button
            onClick={handleReclassifyAll}
            disabled={isReclassifying}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
            title="Re-run all rules against all project URLs and keywords"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-indigo-400 ${isReclassifying ? 'animate-spin' : ''}`} />
            {isReclassifying ? 'Evaluating Rules...' : 'Re-classify Data'}
          </button>

          <button
            onClick={() => handleOpenAddForCategory('Blog')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/40 shadow-lg shadow-indigo-950/40 transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Rule
          </button>
        </div>

        {reclassifyToast && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Rules re-evaluated! All URLs, keywords, and pipeline buckets have been updated.</span>
          </div>
        )}
      </div>

      {/* Control Bar: View Toggle, Filters, Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === 'grouped'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              Group by Category
            </button>
            <button
              onClick={() => setViewMode('priority')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === 'priority'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              Priority Order Table
            </button>
          </div>

          {/* Target Type Filter */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Targets (URLs & Keywords)</option>
            <option value="url">URL Rules Only</option>
            <option value="keyword">Keyword Rules Only</option>
            <option value="query">Search Query Rules Only</option>
          </select>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by rule name, category, or pattern..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="w-full bg-slate-800/70 border border-slate-700/70 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Main Rules Content View */}
      {viewMode === 'grouped' ? (
        /* GROUPED BY CATEGORY VIEW */
        <div className="space-y-4">
          {categoryGroups.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800/60">
              <Tag className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <div className="text-sm font-semibold text-white">No Category Rules Found</div>
              <p className="text-xs max-w-sm mx-auto mt-1 mb-4">
                Add rules to organize your website URLs and keywords into clear classification buckets.
              </p>
              <button
                onClick={() => handleOpenAddForCategory('Blog')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Rule
              </button>
            </div>
          ) : (
            categoryGroups.map(group => (
              <div
                key={group.category}
                className="bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden shadow-lg"
              >
                {/* Category Group Header */}
                <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold text-xs">
                      {group.category.includes('>') ? 'Sub-Category' : 'Category'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{group.category}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {group.rules.length} {group.rules.length === 1 ? 'Rule' : 'Rules'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Target Scope: <span className="text-indigo-300 font-medium">{group.targetType.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Add Rule specifically to THIS category */}
                  <button
                    onClick={() => handleOpenAddForCategory(group.category, group.targetType as any)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Add Rule to {group.category}</span>
                  </button>
                </div>

                {/* Rules in this category */}
                <div className="divide-y divide-slate-800/50">
                  {group.rules.map(rule => {
                    const matchCount = getRuleMatchCount(rule);
                    const isRuleActive = rule.isActive !== false;

                    return (
                      <div
                        key={rule.id}
                        className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                          isRuleActive ? 'hover:bg-slate-850/50' : 'bg-slate-950/40 opacity-60'
                        }`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Priority #{rule.priority}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {rule.name}
                            </span>
                            <span className="px-2 py-0.2 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {formatMatchTypeLabel(rule.matchType)}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Expression:</span>
                              <code className="px-2 py-0.5 bg-slate-950 rounded text-indigo-300 font-mono text-[11px] border border-slate-800">
                                {rule.pattern}
                              </code>
                            </div>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium">
                              {matchCount} {rule.targetType === 'url' ? 'URLs' : 'Keywords'} matched
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          {/* Priority Shift */}
                          <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                            <button
                              onClick={() => handlePriorityShift(rule, 'up')}
                              className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                              title="Increase priority (evaluate earlier)"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handlePriorityShift(rule, 'down')}
                              className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                              title="Decrease priority (evaluate later)"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Active Toggle */}
                          <button
                            onClick={() => handleToggleActive(rule)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                              isRuleActive
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                            }`}
                          >
                            {isRuleActive ? 'Active' : 'Paused'}
                          </button>

                          <button
                            onClick={() => handleOpenEdit(rule)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg transition"
                            title="Edit rule expression"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 rounded-lg transition"
                            title="Delete rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* PRIORITY ORDER FLAT TABLE */
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800/80 text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Priority</th>
                  <th className="py-3 px-3">Rule Name</th>
                  <th className="py-3 px-3">Assigned Category</th>
                  <th className="py-3 px-3">Scope</th>
                  <th className="py-3 px-3">Match Operator</th>
                  <th className="py-3 px-3">Pattern / Expression</th>
                  <th className="py-3 px-3 text-center">Matches</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 bg-transparent">
                {[...filteredRules]
                  .sort((a, b) => a.priority - b.priority)
                  .map(rule => {
                    const matchCount = getRuleMatchCount(rule);
                    const isRuleActive = rule.isActive !== false;

                    return (
                      <tr
                        key={rule.id}
                        className={`hover:bg-slate-850/60 transition-colors ${
                          !isRuleActive ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-mono font-bold text-indigo-300">
                          #{rule.priority}
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">
                          {rule.name}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {rule.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 uppercase text-[10px] font-bold text-slate-300">
                          {rule.targetType || 'url'}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {formatMatchTypeLabel(rule.matchType)}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-indigo-300">
                          {rule.pattern}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-emerald-400">
                          {matchCount}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handlePriorityShift(rule, 'up')}
                              className="p-1 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handlePriorityShift(rule, 'down')}
                              className="p-1 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(rule)}
                              className="p-1 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="p-1 text-rose-400 hover:text-rose-300 bg-slate-800 border border-slate-700 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preset Starters Gallery */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Quick-Starter Rule Presets
          </div>
          <span className="text-[11px] text-slate-400">Click any preset to add instantly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {presets.map(p => (
            <div
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className="p-3.5 bg-slate-950/40 hover:bg-slate-850 border border-slate-800/80 hover:border-indigo-500/40 rounded-xl cursor-pointer transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition">
                  {p.name}
                </span>
                <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-1">{p.description}</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {p.category}
                </span>
                <code className="text-[10px] text-slate-400 font-mono">{p.pattern}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Match Simulator */}
      <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80 space-y-3">
        <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Eye className="w-4 h-4 text-emerald-400" />
          Rule Evaluation Simulator
        </div>
        <p className="text-xs text-slate-400">
          Enter any URL path or keyword string to see exactly which rule fires in the priority chain.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={testInput}
            onChange={e => setTestInput(e.target.value)}
            placeholder="e.g. /blog/tutorials/scaling-postgres or best task manager"
            className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleRunSimulator}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
          >
            Simulate Match
          </button>
        </div>

        {testResult && (
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Resolved Category:</span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {testResult.category}
              </span>
            </div>
            {testResult.trace.length > 0 && (
              <div className="text-[11px] font-mono text-slate-400 space-y-0.5 pt-1 border-t border-slate-800/60">
                {testResult.trace.map((step, idx) => (
                  <div key={idx} className={step.includes('[MATCH]') ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                    {step}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD / EDIT RULE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingRule ? 'Edit Classification Rule' : 'Create Classification Rule'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Map URLs or keywords into categories and sub-categories.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4">
              {/* Category Name & Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Category or Sub-Category Name <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Blog, Blog > Engineering, Pricing, Features..."
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                    className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    onChange={e => {
                      if (e.target.value) setCategoryName(e.target.value);
                    }}
                    value=""
                    className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="">Existing...</option>
                    {existingCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rule Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Rule Name / Label <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technical tutorials & deep dives"
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Target Type & Match Operator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Scope
                  </label>
                  <select
                    value={targetType}
                    onChange={e => setTargetType(e.target.value as any)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="url">URL Path (Pages)</option>
                    <option value="keyword">Tracked Keyword</option>
                    <option value="query">Search Console Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Match Expression Type
                  </label>
                  <select
                    value={matchType}
                    onChange={e => setMatchType(e.target.value as any)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="starts_with">Starts with prefix (e.g. /blog/)</option>
                    <option value="contains">Contains text anywhere</option>
                    <option value="exact">Exact match</option>
                    <option value="glob">Wildcard Glob (e.g. /blog/*/guide)</option>
                    <option value="ends_with">Ends with suffix (e.g. .html)</option>
                    <option value="regex">Regular Expression (RegEx)</option>
                    <option value="query_param">URL Query Parameter</option>
                  </select>
                </div>
              </div>

              {/* Expression / Pattern */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pattern / Expression Value <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    matchType === 'starts_with' ? '/blog/' :
                    matchType === 'glob' ? '/blog/tutorials/*' :
                    matchType === 'exact' ? '/pricing' :
                    matchType === 'regex' ? '^/(blog|articles)/.*' :
                    matchType === 'query_param' ? 'utm_medium=blog' :
                    'pricing'
                  }
                  value={pattern}
                  onChange={e => setPattern(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Evaluation Priority (Lower = Evaluated First)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={priority}
                    onChange={e => setPriority(Number(e.target.value))}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="ruleActiveCheck"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="ruleActiveCheck" className="text-xs text-slate-300 cursor-pointer">
                    Enable this rule immediately
                  </label>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-md shadow-indigo-950/40"
                >
                  {editingRule ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
