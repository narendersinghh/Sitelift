import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRight,
  Globe,
  Copy,
  RotateCcw,
  Tag,
  ArrowUp,
  ArrowDown,
  Check,
  AlertCircle,
  Eye,
  Wand2,
  Code,
  Sliders,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Website, CategoryRule, MatchType } from '../types';
import { storage } from '../services/storage';

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
  icon: string;
  description: string;
}

export const CategoryRulesView: React.FC<CategoryRulesViewProps> = ({ website, onRefresh }) => {
  const [rules, setRules] = useState<CategoryRule[]>(() => storage.getCategoryRules(website.id));
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState<CategoryRule | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [targetType, setTargetType] = useState<'url' | 'keyword' | 'query'>('url');
  const [matchType, setMatchType] = useState<MatchType>('contains');
  const [pattern, setPattern] = useState('');
  const [category, setCategory] = useState('Blog');
  const [priority, setPriority] = useState(10);
  const [isActive, setIsActive] = useState(true);

  // Test simulator state
  const [testInput, setTestInput] = useState(`https://${website.domain}/blog/top-seo-frameworks`);
  const [testResult, setTestResult] = useState<{ matchedRule?: CategoryRule; category: string; trace: string[] } | null>(null);

  // Reclassification state
  const [isReclassifying, setIsReclassifying] = useState(false);
  const [reclassifySuccess, setReclassifySuccess] = useState(false);

  // Load all known URLs for this website to power live match count and suggestion scanner
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
      // Fallback sample URLs for simulation
      return [
        '/blog/async-communication-guide',
        '/blog/sprint-planning-template',
        '/features/collaboration',
        '/features/kanban',
        '/vs/trello',
        '/pricing',
        '/docs/api-getting-started',
        '/templates/roadmap-2026'
      ];
    }
    return Array.from(set);
  }, [website.id]);

  // Presets gallery for quick 1-click rule templates
  const presets: RulePreset[] = [
    {
      id: 'p-blog',
      name: 'Blog Articles & Insights',
      category: 'Blog',
      targetType: 'url',
      matchType: 'starts_with',
      pattern: '/blog',
      icon: '📝',
      description: 'Matches all articles and posts under /blog/'
    },
    {
      id: 'p-features',
      name: 'Product Features & Capabilities',
      category: 'Features',
      targetType: 'url',
      matchType: 'starts_with',
      pattern: '/features',
      icon: '🚀',
      description: 'Matches all product feature landing pages'
    },
    {
      id: 'p-pricing',
      name: 'Pricing & Subscription Plans',
      category: 'Pricing',
      targetType: 'url',
      matchType: 'contains',
      pattern: 'pricing',
      icon: '💰',
      description: 'Matches pricing tiers, enterprise quotes, & calculator'
    },
    {
      id: 'p-vs',
      name: 'Competitor Comparisons & Alternatives',
      category: 'Comparison',
      targetType: 'url',
      matchType: 'starts_with',
      pattern: '/vs',
      icon: '⚔️',
      description: 'Matches comparison landing pages like /vs/trello'
    },
    {
      id: 'p-docs',
      name: 'Documentation & Knowledge Base',
      category: 'Docs',
      targetType: 'url',
      matchType: 'starts_with',
      pattern: '/docs',
      icon: '📚',
      description: 'Matches developer documentation and user guides'
    },
    {
      id: 'p-solutions',
      name: 'Solutions & Use Cases',
      category: 'Solutions',
      targetType: 'url',
      matchType: 'starts_with',
      pattern: '/solutions',
      icon: '🎯',
      description: 'Matches industry-specific and team solutions'
    },
    {
      id: 'p-templates',
      name: 'Templates & Free Resources',
      category: 'Templates',
      targetType: 'url',
      matchType: 'starts_with',
      pattern: '/templates',
      icon: '📦',
      description: 'Matches downloadable templates and checklists'
    },
    {
      id: 'p-brand-kw',
      name: 'Brand Search Queries',
      category: 'Brand',
      targetType: 'keyword',
      matchType: 'contains',
      pattern: website.name.split(' ')[0].toLowerCase(),
      icon: '🏷️',
      description: `Matches keywords containing "${website.name.split(' ')[0]}"`
    }
  ];

  // Scan unclassified path prefixes
  const unclassifiedSuggestions = useMemo(() => {
    const pathPrefixes: Record<string, number> = {};

    allKnownUrls.forEach(url => {
      const parts = url.split('/').filter(Boolean);
      if (parts.length > 0) {
        const prefix = `/${parts[0]}`;
        pathPrefixes[prefix] = (pathPrefixes[prefix] || 0) + 1;
      }
    });

    // Check which ones don't match any existing rule
    return Object.entries(pathPrefixes)
      .filter(([prefix]) => {
        return !rules.some(r => r.pattern.toLowerCase().includes(prefix.toLowerCase()) && r.isActive !== false);
      })
      .map(([prefix, count]) => {
        const catName = prefix.replace('/', '').replace(/\b\w/g, c => c.toUpperCase());
        return {
          prefix,
          count,
          suggestedCategory: catName,
          suggestedName: `${catName} Pages`
        };
      });
  }, [allKnownUrls, rules]);

  // Real-time live match preview in rule editor
  const liveMatchedUrls = useMemo(() => {
    if (!pattern.trim()) return [];
    const pat = pattern.trim().toLowerCase();

    return allKnownUrls.filter(url => {
      const targetVal = url.toLowerCase();
      if (matchType === 'contains') return targetVal.includes(pat);
      if (matchType === 'starts_with') return targetVal.startsWith(pat);
      if (matchType === 'ends_with') return targetVal.endsWith(pat);
      if (matchType === 'regex') {
        try {
          return new RegExp(pattern, 'i').test(targetVal);
        } catch {
          return false;
        }
      }
      return false;
    });
  }, [pattern, matchType, allKnownUrls]);

  useEffect(() => {
    setRules(storage.getCategoryRules(website.id));
    setTestInput(`https://${website.domain}/blog/top-seo-frameworks`);
    setTestResult(null);
  }, [website.id]);

  const refreshList = () => {
    setRules(storage.getCategoryRules(website.id));
    onRefresh();
  };

  const handleStartEdit = (rule: CategoryRule) => {
    setEditingRule(rule);
    setName(rule.name);
    setTargetType(rule.targetType);
    setMatchType(rule.matchType);
    setPattern(rule.pattern);
    setCategory(rule.category);
    setPriority(rule.priority);
    setIsActive(rule.isActive !== false);
    setShowAddModal(true);
  };

  const handleStartAdd = () => {
    setEditingRule(null);
    setName('');
    setTargetType('url');
    setMatchType('starts_with');
    setPattern('/blog');
    setCategory('Blog');
    setPriority((rules.length + 1) * 10);
    setIsActive(true);
    setShowAddModal(true);
  };

  const handleApplyPreset = (p: RulePreset) => {
    setName(p.name);
    setCategory(p.category);
    setTargetType(p.targetType);
    setMatchType(p.matchType);
    setPattern(p.pattern);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pattern.trim() || !category.trim()) return;

    if (editingRule) {
      const updated: CategoryRule = {
        ...editingRule,
        websiteId: website.id,
        name: name.trim(),
        targetType,
        matchType,
        pattern: pattern.trim(),
        category: category.trim(),
        priority: Number(priority),
        isActive
      };
      storage.saveCategoryRule(updated);
    } else {
      const newRule: CategoryRule = {
        id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        websiteId: website.id,
        name: name.trim(),
        targetType,
        matchType,
        pattern: pattern.trim(),
        category: category.trim(),
        priority: Number(priority),
        isActive,
        createdAt: new Date().toISOString()
      };
      storage.saveCategoryRule(newRule);
    }

    setShowAddModal(false);
    setEditingRule(null);
    refreshList();
  };

  const handleDeleteRule = (id: string) => {
    storage.deleteCategoryRule(id);
    refreshList();
  };

  const handleToggleRuleActive = (rule: CategoryRule) => {
    const updated = { ...rule, isActive: rule.isActive === false ? true : false };
    storage.saveCategoryRule(updated);
    refreshList();
  };

  const handleMovePriority = (index: number, direction: 'up' | 'down') => {
    const sorted = [...rules].sort((a, b) => a.priority - b.priority);
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const currentRule = sorted[index];
    const swapRule = sorted[targetIdx];

    // Swap priorities
    const tempPriority = currentRule.priority;
    currentRule.priority = swapRule.priority;
    swapRule.priority = tempPriority;

    storage.saveCategoryRule(currentRule);
    storage.saveCategoryRule(swapRule);
    refreshList();
  };

  const handleAddSuggestion = (s: { prefix: string; suggestedCategory: string; suggestedName: string }) => {
    const newRule: CategoryRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      websiteId: website.id,
      name: s.suggestedName,
      targetType: 'url',
      matchType: 'starts_with',
      pattern: s.prefix,
      category: s.suggestedCategory,
      priority: (rules.length + 1) * 10,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    storage.saveCategoryRule(newRule);
    refreshList();
  };

  const handleRunReclassification = () => {
    setIsReclassifying(true);
    setTimeout(() => {
      // Refresh list & trigger global update
      refreshList();
      setIsReclassifying(false);
      setReclassifySuccess(true);
      setTimeout(() => setReclassifySuccess(false), 3000);
    }, 600);
  };

  const handleTestMatch = () => {
    const input = testInput.toLowerCase();
    const cleanPath = input.replace(/^https?:\/\/[^/]+/, '') || '/';
    const sorted = [...rules].filter(r => r.isActive !== false).sort((a, b) => a.priority - b.priority);

    const trace: string[] = [];

    for (const r of sorted) {
      const pat = r.pattern.toLowerCase();
      const targetVal = (r.pattern.startsWith('http') ? input : cleanPath).toLowerCase();
      let matched = false;

      if (r.matchType === 'contains' && targetVal.includes(pat)) matched = true;
      if (r.matchType === 'starts_with' && targetVal.startsWith(pat)) matched = true;
      if (r.matchType === 'ends_with' && targetVal.endsWith(pat)) matched = true;
      if (r.matchType === 'regex') {
        try {
          if (new RegExp(r.pattern, 'i').test(targetVal)) matched = true;
        } catch {
          // ignore
        }
      }

      if (matched) {
        trace.push(`Rule #${r.priority} [${r.name}] -> MATCHED ("${r.pattern}") -> Assigned Category: ${r.category}`);
        setTestResult({
          matchedRule: r,
          category: r.category,
          trace
        });
        return;
      } else {
        trace.push(`Rule #${r.priority} [${r.name}] -> No match with pattern "${r.pattern}"`);
      }
    }

    trace.push('Fallthrough -> Default Category: "General"');
    setTestResult({
      category: 'General',
      trace
    });
  };

  const sortedRules = useMemo(() => {
    return [...rules].sort((a, b) => a.priority - b.priority);
  }, [rules]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2.5">
                Category & Classification Rules
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {website.name}
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Create deterministic rules to segment pages, keywords, and pipeline optimizations into business categories.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRunReclassification}
            disabled={isReclassifying}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition flex items-center gap-2"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-indigo-400 ${isReclassifying ? 'animate-spin' : ''}`} />
            {isReclassifying ? 'Applying Rules...' : 'Re-Run Classification'}
          </button>

          <button
            onClick={handleStartAdd}
            className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/40 shadow-lg shadow-indigo-950/40 transition flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Classification Rule
          </button>
        </div>
      </div>

      {/* Reclassification Success Toast Alert */}
      {reclassifySuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>All page metrics, search console queries, and optimization pipeline buckets have been reclassified according to active rules.</span>
        </div>
      )}

      {/* Unclassified Path Suggestions (Smart Detection) */}
      {unclassifiedSuggestions.length > 0 && (
        <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
              <Wand2 className="w-4 h-4 text-indigo-400" />
              <span>Smart Pattern Scanner: Found {unclassifiedSuggestions.length} Unclassified Path {unclassifiedSuggestions.length === 1 ? 'Segment' : 'Segments'}</span>
            </div>
            <span className="text-[11px] text-slate-400">Click to quickly add as category rule</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {unclassifiedSuggestions.map(s => (
              <button
                key={s.prefix}
                onClick={() => handleAddSuggestion(s)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-900/30 hover:bg-indigo-800/40 border border-indigo-500/30 text-slate-200 transition flex items-center gap-2"
              >
                <Tag className="w-3 h-3 text-indigo-400" />
                <span className="font-mono">{s.prefix}</span>
                <span className="text-indigo-300">→ {s.suggestedCategory} ({s.count} pages)</span>
                <Plus className="w-3 h-3 text-indigo-400 ml-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rules Table & Priority Hierarchy */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="p-4 border-b border-slate-800/70 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Active Classification Rules ({rules.length})</h2>
            <span className="text-xs text-slate-400">• Priority 1 is evaluated first</span>
          </div>
          <span className="text-xs text-slate-400">
            Rules execute top-down in priority sequence
          </span>
        </div>

        {sortedRules.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Layers className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">No Category Rules Defined</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Add rules to categorize your URLs (e.g., Blog, Features, Pricing, Comparison) to see structured insights across the app.
            </p>
            <button
              onClick={handleStartAdd}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition"
            >
              Add First Rule
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {sortedRules.map((rule, index) => {
              const isFirst = index === 0;
              const isLast = index === sortedRules.length - 1;
              const isRuleActive = rule.isActive !== false;

              return (
                <div
                  key={rule.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    !isRuleActive ? 'opacity-50 bg-slate-950/40' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    {/* Priority & Reorder Controls */}
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => handleMovePriority(index, 'up')}
                        disabled={isFirst}
                        className={`p-1 rounded hover:bg-slate-800 transition ${isFirst ? 'opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-white'}`}
                        title="Increase Priority"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-bold text-indigo-400 font-mono px-1">
                        #{rule.priority}
                      </span>
                      <button
                        onClick={() => handleMovePriority(index, 'down')}
                        disabled={isLast}
                        className={`p-1 rounded hover:bg-slate-800 transition ${isLast ? 'opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-white'}`}
                        title="Decrease Priority"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Rule Info */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white truncate">
                          {rule.name}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          {rule.category}
                        </span>

                        <span className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50">
                          {rule.targetType}
                        </span>

                        {!isRuleActive && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            Disabled
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                        <span className="text-slate-500 text-[11px]">{rule.matchType}:</span>
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-300 text-[11px]">
                          {rule.pattern}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Toggle Active Button */}
                    <button
                      onClick={() => handleToggleRuleActive(rule)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                        isRuleActive
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/40'
                      }`}
                    >
                      {isRuleActive ? 'Disable' : 'Enable'}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleStartEdit(rule)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
                      title="Edit rule"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 border border-slate-800 transition"
                      title="Delete rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Live Rule Evaluation Tester */}
      <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Live Rule Evaluation Simulator for {website.name}
          </div>
          <span className="text-xs text-slate-400">Deterministic Pattern Trace</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={testInput}
            onChange={e => setTestInput(e.target.value)}
            placeholder={`e.g. https://${website.domain}/blog/product-update`}
            className="flex-1 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleTestMatch}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition shadow-md shadow-indigo-950/40 shrink-0"
          >
            Test URL Classification
          </button>
        </div>

        {testResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
              <span className="text-xs text-slate-400 font-medium">Resulting Category Bucket:</span>
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {testResult.category}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Evaluation Trace:</span>
              <div className="space-y-1 font-mono text-[11px]">
                {testResult.trace.map((step, idx) => (
                  <div
                    key={idx}
                    className={`px-2.5 py-1 rounded ${
                      step.includes('MATCHED')
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 font-semibold'
                        : 'text-slate-400 bg-slate-900/50'
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {editingRule ? `Edit Rule: ${editingRule.name}` : 'Create Classification Rule'}
                  </h3>
                  <p className="text-xs text-slate-400">Classify pages and search queries into high-level business buckets.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 transition p-1"
              >
                ✕
              </button>
            </div>

            {/* Presets Gallery (Only for new rules) */}
            {!editingRule && (
              <div className="space-y-2 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Quick-Start Templates:
                  </span>
                  <span className="text-[11px] text-slate-400">Click to autofill rule setup</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {presets.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 text-left transition space-y-0.5"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                        <span>{p.icon}</span>
                        <span className="truncate">{p.category}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{p.pattern}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Rule Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Blog Articles & Pillar Content"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Assigned Category Bucket <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Blog, Features, Pricing, Comparison"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Scope</label>
                  <select
                    value={targetType}
                    onChange={e => setTargetType(e.target.value as any)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="url">Page URL Path</option>
                    <option value="keyword">Tracked Keyword</option>
                    <option value="query">Search Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Match Operator</label>
                  <select
                    value={matchType}
                    onChange={e => setMatchType(e.target.value as any)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="starts_with">Starts With (e.g. /blog/)</option>
                    <option value="contains">Contains (e.g. pricing)</option>
                    <option value="ends_with">Ends With</option>
                    <option value="regex">Regular Expression (RegEx)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Evaluation Priority</label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={priority}
                    onChange={e => setPriority(Number(e.target.value))}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pattern / Match String <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={matchType === 'starts_with' ? '/blog/' : matchType === 'contains' ? 'pricing' : '^/(blog|articles)/.*'}
                  value={pattern}
                  onChange={e => setPattern(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 font-mono text-xs text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Live Match Preview inside Editor */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    Live Match Verification:
                  </span>
                  <span className={`font-medium ${liveMatchedUrls.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {liveMatchedUrls.length} {liveMatchedUrls.length === 1 ? 'URL matches' : 'URLs match'} on {website.domain}
                  </span>
                </div>

                {liveMatchedUrls.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {liveMatchedUrls.slice(0, 4).map(u => (
                      <span key={u} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[10px] text-slate-300">
                        {u}
                      </span>
                    ))}
                    {liveMatchedUrls.length > 4 && (
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-400">
                        +{liveMatchedUrls.length - 4} more
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Type a pattern above to see matching URLs on this property.
                  </p>
                )}
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
                  {editingRule ? 'Save Changes' : 'Create Category Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
