import React, { useState } from 'react';
import {
  Activity as ActivityIcon,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Trash2,
  Edit2,
  Columns3,
  List,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  RotateCcw,
  Check,
  Search
} from 'lucide-react';
import { Website, Activity, ActivityStatus, ActivityType, EffortLevel, ImpactLevel } from '../types';
import { storage } from '../services/storage';
import { generateMonthlyActivities } from '../services/activityGenerator';

interface ActivitiesViewProps {
  website: Website;
}

type PresetKey =
  | 'this_month'
  | 'last_month'
  | 'next_month'
  | 'last_30_days'
  | 'last_60_days'
  | 'last_90_days'
  | 'this_quarter'
  | 'year_to_date'
  | 'all'
  | 'custom';

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({ website }) => {
  // Primary Date Range Filter State (Defaults to Current Month: August 2026)
  const [activePreset, setActivePreset] = useState<PresetKey>('this_month');
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-31');
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);

  // Temporary state for the Pop-up Calendar Modal
  const [tempPreset, setTempPreset] = useState<PresetKey>('this_month');
  const [tempStartDate, setTempStartDate] = useState<string>('2026-08-01');
  const [tempEndDate, setTempEndDate] = useState<string>('2026-08-31');
  
  // Calendar month navigator inside modal (0-indexed month, 7 = August)
  const [calendarViewYear, setCalendarViewYear] = useState<number>(2026);
  const [calendarViewMonth, setCalendarViewMonth] = useState<number>(7); // 7 = August
  const [rangeSelectionStep, setRangeSelectionStep] = useState<'start' | 'end'>('start');

  // Secondary Filters
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Activities Data
  const [activities, setActivities] = useState<Activity[]>(() => storage.getActivities(website.id));
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ActivityType>('content_refresh');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [effort, setEffort] = useState<EffortLevel>('medium');
  const [impact, setImpact] = useState<ImpactLevel>('high');
  const [assignedUser, setAssignedUser] = useState('SEO Strategist');
  const [dueDate, setDueDate] = useState('2026-08-28');
  const [relatedUrl, setRelatedUrl] = useState(`https://${website.domain}/`);
  const [relatedKeyword, setRelatedKeyword] = useState('');

  // Preset Auto-fill definitions based on 2026-08-23 current date
  const PRESETS: { key: PresetKey; label: string; start: string; end: string; desc: string }[] = [
    { key: 'this_month', label: 'This Month', start: '2026-08-01', end: '2026-08-31', desc: 'August 1 – 31, 2026' },
    { key: 'last_month', label: 'Last Month', start: '2026-07-01', end: '2026-07-31', desc: 'July 1 – 31, 2026' },
    { key: 'next_month', label: 'Next Month', start: '2026-09-01', end: '2026-09-30', desc: 'September 1 – 30, 2026' },
    { key: 'last_30_days', label: 'Last 30 Days', start: '2026-07-25', end: '2026-08-23', desc: 'Past 30 calendar days' },
    { key: 'last_60_days', label: 'Last 60 Days', start: '2026-06-25', end: '2026-08-23', desc: 'Past 60 calendar days' },
    { key: 'last_90_days', label: 'Last 90 Days', start: '2026-05-26', end: '2026-08-23', desc: 'Past 90 calendar days' },
    { key: 'this_quarter', label: 'This Quarter (Q3)', start: '2026-07-01', end: '2026-09-30', desc: 'Q3 2026 (Jul – Sep)' },
    { key: 'year_to_date', label: 'Year to Date', start: '2026-01-01', end: '2026-08-23', desc: 'Jan 1 – Aug 23, 2026' },
    { key: 'all', label: 'All Time (Full History)', start: '2020-01-01', end: '2030-12-31', desc: 'All past & future tasks' },
  ];

  const handleOpenCalendarModal = () => {
    setTempPreset(activePreset);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    
    // Set calendar month view according to start date
    if (startDate) {
      const parts = startDate.split('-');
      if (parts.length >= 2) {
        setCalendarViewYear(parseInt(parts[0], 10));
        setCalendarViewMonth(parseInt(parts[1], 10) - 1);
      }
    }
    setRangeSelectionStep('start');
    setShowCalendarModal(true);
  };

  const applyPresetSelection = (preset: typeof PRESETS[0]) => {
    setTempPreset(preset.key);
    setTempStartDate(preset.start);
    setTempEndDate(preset.end);
    if (preset.start) {
      const parts = preset.start.split('-');
      setCalendarViewYear(parseInt(parts[0], 10));
      setCalendarViewMonth(parseInt(parts[1], 10) - 1);
    }
  };

  const handleDateClickOnCalendar = (dateStr: string) => {
    if (rangeSelectionStep === 'start' || !tempStartDate || (tempStartDate && tempEndDate && tempStartDate !== tempEndDate)) {
      setTempStartDate(dateStr);
      setTempEndDate(dateStr);
      setTempPreset('custom');
      setRangeSelectionStep('end');
    } else {
      // Second click: set end date or swap if earlier
      if (dateStr >= tempStartDate) {
        setTempEndDate(dateStr);
      } else {
        setTempEndDate(tempStartDate);
        setTempStartDate(dateStr);
      }
      setTempPreset('custom');
      setRangeSelectionStep('start');
    }
  };

  const handleApplyCalendarRange = () => {
    setActivePreset(tempPreset);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setShowCalendarModal(false);
  };

  const handleResetToCurrentMonth = () => {
    const thisMonthPreset = PRESETS[0];
    setTempPreset(thisMonthPreset.key);
    setTempStartDate(thisMonthPreset.start);
    setTempEndDate(thisMonthPreset.end);
    setCalendarViewYear(2026);
    setCalendarViewMonth(7);
  };

  const handleEditClick = (act: Activity) => {
    setEditingActivityId(act.id);
    setTitle(act.title);
    setDescription(act.description);
    setType(act.type);
    setPriority(act.priority);
    setEffort(act.effort);
    setImpact(act.impact);
    setAssignedUser(act.assignedUser || '');
    setDueDate(act.dueDate || '');
    setRelatedUrl(act.relatedPageUrl || '');
    setRelatedKeyword(act.relatedKeyword || '');
    setShowAddModal(true);
  };

  const handleOpenAddModal = () => {
    setEditingActivityId(null);
    setTitle('');
    setDescription('');
    setType('content_refresh');
    setPriority('high');
    setEffort('medium');
    setImpact('high');
    setAssignedUser('SEO Strategist');
    setDueDate(startDate.slice(0, 7) + '-28');
    setRelatedUrl(`https://${website.domain}/`);
    setRelatedKeyword('');
    setShowAddModal(true);
  };

  const refreshList = () => {
    setActivities(storage.getActivities(website.id));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    const targetMonth = startDate ? startDate.slice(0, 7) : '2026-08';
    setTimeout(() => {
      generateMonthlyActivities(website.id, targetMonth);
      setIsGenerating(false);
      refreshList();
    }, 600);
  };

  const handleUpdateStatus = (id: string, newStatus: ActivityStatus) => {
    const act = activities.find(a => a.id === id);
    if (!act) return;

    const updated = {
      ...act,
      status: newStatus,
      completedDate: newStatus === 'completed' ? new Date().toISOString().slice(0, 10) : undefined
    };

    storage.saveActivity(updated);
    refreshList();
  };

  const handleDelete = (id: string) => {
    storage.deleteActivity(id);
    refreshList();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingActivityId) {
      const act = activities.find(a => a.id === editingActivityId);
      if (act) {
        const updated: Activity = {
          ...act,
          title: title.trim(),
          description: description.trim(),
          type,
          priority,
          effort,
          impact,
          relatedPageUrl: relatedUrl.trim() || undefined,
          relatedKeyword: relatedKeyword.trim() || undefined,
          assignedUser,
          dueDate
        };
        storage.saveActivity(updated);
      }
    } else {
      const newAct: Activity = {
        id: `act-custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        websiteId: website.id,
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        effort,
        impact,
        relatedPageUrl: relatedUrl.trim() || undefined,
        relatedKeyword: relatedKeyword.trim() || undefined,
        month: dueDate ? dueDate.slice(0, 7) : startDate.slice(0, 7),
        status: 'approved',
        assignedUser,
        dueDate,
        createdAt: new Date().toISOString()
      };
      storage.saveActivity(newAct);
    }

    setEditingActivityId(null);
    setTitle('');
    setDescription('');
    setShowAddModal(false);
    refreshList();
  };

  // Check if an activity falls inside a date range
  const isActivityInDateRange = (a: Activity, start: string, end: string, preset: PresetKey) => {
    if (preset === 'all') return true;

    // Direct day comparison if activity has a day date
    const targetDate = a.dueDate || a.plannedDate || a.completedDate || (a.createdAt ? a.createdAt.slice(0, 10) : null);
    if (targetDate) {
      return targetDate >= start && targetDate <= end;
    }

    // Month level comparison if activity only has a month string (YYYY-MM)
    if (a.month) {
      const monthStart = `${a.month}-01`;
      const monthEnd = `${a.month}-31`;
      return !(monthEnd < start || monthStart > end);
    }

    return true;
  };

  // Filter activities strictly by selected pop-up calendar date range and secondary filters
  const filteredActivities = activities.filter(a => {
    if (a.status === 'suggested') return false;

    // Date Range Filter
    if (!isActivityInDateRange(a, startDate, endDate, activePreset)) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;

    // Type filter
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchDesc = a.description.toLowerCase().includes(q);
      const matchUrl = a.relatedPageUrl?.toLowerCase().includes(q);
      const matchAssignee = a.assignedUser?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchUrl && !matchAssignee) return false;
    }

    return true;
  });

  // Calculate matching activities in modal preview
  const previewMatchCount = activities.filter(a => {
    if (a.status === 'suggested') return false;
    return isActivityInDateRange(a, tempStartDate, tempEndDate, tempPreset);
  }).length;

  const columns: { id: ActivityStatus; title: string; headerColor: string; laneBg: string }[] = [
    { id: 'approved', title: 'Approved & Planned', headerColor: 'text-blue-800 bg-blue-100/80 border-blue-200', laneBg: 'bg-blue-50/30 border-blue-200/60' },
    { id: 'in_progress', title: 'In Progress', headerColor: 'text-amber-800 bg-amber-100/80 border-amber-200', laneBg: 'bg-amber-50/30 border-amber-200/60' },
    { id: 'completed', title: 'Completed Tasks', headerColor: 'text-emerald-800 bg-emerald-100/80 border-emerald-200', laneBg: 'bg-emerald-50/30 border-emerald-200/60' }
  ];

  // Helper to format date nicely
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Calendar generation helpers
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getCalendarDays = (year: number, month: number) => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days: ({ day: number; dateStr: string; isCurrentMonth: boolean } | null)[] = [];

    // Prepend nulls for empty slots before 1st of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, isCurrentMonth: true });
    }

    return days;
  };

  const handlePrevMonth = () => {
    if (calendarViewMonth === 0) {
      setCalendarViewYear(prev => prev - 1);
      setCalendarViewMonth(11);
    } else {
      setCalendarViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarViewMonth === 11) {
      setCalendarViewYear(prev => prev + 1);
      setCalendarViewMonth(0);
    } else {
      setCalendarViewMonth(prev => prev + 1);
    }
  };

  const activePresetObj = PRESETS.find(p => p.key === activePreset);

  return (
    <div className="space-y-6">
      
      {/* Full Width Header with Controls Below */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="w-full">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-blue-600" />
            SEO Activity & Sprint Planner
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Prioritize content refreshes, technical fixes, CTR experiments, and internal linking sprints.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto-generate from Insights */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-xs"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-600 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating Tasks...' : 'Generate Monthly Plan'}</span>
            </button>

            {/* Add Manual Task */}
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === 'kanban' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              title="Kanban Board View"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === 'list' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              title="Compact List View"
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Pop-up Calendar Trigger & Multi-Colored Filters Strip */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        {/* Top Row: Calendar Pop-up Trigger + Activity Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold text-slate-700">Time Window:</span>
            
            {/* Pop-up Calendar Date Range Trigger Button */}
            <button
              onClick={handleOpenCalendarModal}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-300 rounded-xl text-xs font-bold text-blue-950 shadow-xs transition-all group"
              title="Click to open Pop-up Calendar Date Picker"
            >
              <div className="p-1 bg-blue-600 rounded-lg text-white group-hover:scale-105 transition-transform">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-mono text-blue-900 font-bold">
                  {activePreset === 'all'
                    ? 'All Time (Full History)'
                    : `${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)}`}
                </span>
                
                {activePresetObj && activePreset !== 'custom' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-200/80 text-blue-900 border border-blue-300/60">
                    {activePresetObj.label}
                  </span>
                )}
                {activePreset === 'custom' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-300">
                    Custom Range
                  </span>
                )}
              </div>

              <ChevronDown className="w-4 h-4 text-blue-700 ml-1 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>

          <div className="text-xs font-bold text-slate-500">
            Showing <span className="text-slate-900 font-extrabold">{filteredActivities.length}</span> activities
          </div>
        </div>

        {/* Multi-Colored Priority & Type Sub-Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Priority:</span>
            
            <button
              onClick={() => setPriorityFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                priorityFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
            >
              All
            </button>

            <button
              onClick={() => setPriorityFilter('critical')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                priorityFilter === 'critical'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-200'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-200'
              }`}
            >
              Critical
            </button>

            <button
              onClick={() => setPriorityFilter('high')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                priorityFilter === 'high'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs ring-2 ring-amber-200'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-200'
              }`}
            >
              High
            </button>

            <button
              onClick={() => setPriorityFilter('medium')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                priorityFilter === 'medium'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-200'
                  : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border-blue-200'
              }`}
            >
              Medium
            </button>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 ml-1">
              <span className="text-xs font-bold text-slate-700">Type:</span>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="content_refresh">Content Refresh</option>
                <option value="new_content">New Content</option>
                <option value="title_meta_improvement">Title & Meta</option>
                <option value="internal_linking">Internal Linking</option>
                <option value="ctr_optimization">CTR Optimization</option>
                <option value="technical_review">Technical Review</option>
                <option value="cannibalization_fix">Cannibalization Fix</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks, URLs, assignees..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none w-64 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* POP-UP CALENDAR MODAL WITH AUTO-FILL PRESETS */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Select Time Period & Date Range</span>
                  </h2>
                  <p className="text-xs text-slate-300">
                    Filter SEO activities scheduled, due, or completed within this timeframe.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowCalendarModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Split Layout (Auto-Fill Presets Column on Left + Interactive Calendar on Right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-y-auto">
              
              {/* Left Column: Quick Auto-Fill Presets */}
              <div className="md:col-span-5 p-4 sm:p-5 bg-slate-50/80 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Auto-Fill Presets</span>
                </div>

                <div className="space-y-1.5">
                  {PRESETS.map(preset => {
                    const isSelected = tempPreset === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => applyPresetSelection(preset)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-blue-50/60 hover:border-blue-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{preset.label}</span>
                            {preset.key === 'this_month' && (
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                              }`}>
                                Current
                              </span>
                            )}
                          </div>
                          <div className={`text-[10px] font-normal mt-0.5 ${
                            isSelected ? 'text-blue-100' : 'text-slate-500'
                          }`}>
                            {preset.desc}
                          </div>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Visual Calendar & Manual Inputs */}
              <div className="md:col-span-7 p-4 sm:p-5 space-y-4">
                
                {/* Visual Month Navigation Bar */}
                <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition shadow-2xs"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="text-sm font-extrabold text-slate-900">
                    {monthNames[calendarViewMonth]} {calendarViewYear}
                  </div>

                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition shadow-2xs"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Calendar Day Grid */}
                <div>
                  {/* Day of Week Headers */}
                  <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 mb-1">
                    <span>Su</span>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>

                  {/* Day Cells */}
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {getCalendarDays(calendarViewYear, calendarViewMonth).map((item, idx) => {
                      if (!item) {
                        return <div key={`empty-${idx}`} className="h-9" />;
                      }

                      const dateStr = item.dateStr;
                      const isStart = dateStr === tempStartDate;
                      const isEnd = dateStr === tempEndDate;
                      const inRange = tempStartDate && tempEndDate && dateStr >= tempStartDate && dateStr <= tempEndDate;
                      const isToday = dateStr === '2026-08-23';

                      let cellClass = 'bg-slate-50 text-slate-700 hover:bg-blue-100 hover:text-blue-900';
                      if (isStart || isEnd) {
                        cellClass = 'bg-blue-600 text-white font-bold shadow-xs';
                      } else if (inRange) {
                        cellClass = 'bg-blue-100 text-blue-900 font-semibold';
                      }

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => handleDateClickOnCalendar(dateStr)}
                          className={`h-9 rounded-lg flex items-center justify-center transition-all relative ${cellClass}`}
                        >
                          <span>{item.day}</span>
                          {isToday && !isStart && !isEnd && (
                            <span className="w-1 h-1 rounded-full bg-blue-600 absolute bottom-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Manual Start Date & End Date Inputs */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>Custom Date Inputs</span>
                    <span className="text-[10px] text-slate-500 font-normal">Click days on calendar or type below</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={tempStartDate}
                        onChange={e => {
                          setTempStartDate(e.target.value);
                          setTempPreset('custom');
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">End Date</label>
                      <input
                        type="date"
                        value={tempEndDate}
                        onChange={e => {
                          setTempEndDate(e.target.value);
                          setTempPreset('custom');
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer: Live Preview Summary + Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700">Preview:</span>
                <span className="font-mono text-blue-900 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {tempPreset === 'all'
                    ? 'All Time'
                    : `${formatDateDisplay(tempStartDate)} → ${formatDateDisplay(tempEndDate)}`}
                </span>
                <span className="text-slate-500 font-medium">
                  ({previewMatchCount} {previewMatchCount === 1 ? 'activity' : 'activities'} match)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToCurrentMonth}
                  className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl text-xs font-bold transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to This Month</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="px-3.5 py-2 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleApplyCalendarRange}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Date Range</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Kanban Board View - Exactly 3 columns taking equal 1/3rd width each */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full items-start">
          {columns.map(col => {
            const colActivities = filteredActivities.filter(a => a.status === col.id);
            return (
              <div
                key={col.id}
                className={`w-full min-w-0 p-4 border rounded-2xl flex flex-col space-y-3.5 shadow-xs transition-all ${col.laneBg}`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${col.headerColor}`}>
                    {col.title}
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-bold shadow-xs">
                    {colActivities.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 min-h-[300px]">
                  {colActivities.length === 0 ? (
                    <div className="h-28 flex items-center justify-center border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs font-medium">
                      No tasks in this lane for selected timeframe
                    </div>
                  ) : (
                    colActivities.map(act => (
                      <div
                        key={act.id}
                        className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs space-y-2.5 transition-all text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                            act.priority === 'critical'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : act.priority === 'high'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {act.priority}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditClick(act)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                              title="Edit task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(act.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 leading-snug">{act.title}</h4>
                          <p className="text-slate-600 mt-1 text-[11px] line-clamp-3 leading-relaxed">{act.description}</p>
                        </div>

                        {act.relatedPageUrl && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 p-1.5 rounded-lg font-mono truncate">
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{act.relatedPageUrl}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{act.assignedUser || 'SEO Team'}</span>
                          </div>

                          <div className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{act.dueDate || act.month}</span>
                          </div>
                        </div>

                        {/* Status Mover Quick Buttons */}
                        <div className="flex items-center justify-end gap-1 pt-1">
                          {act.status === 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(act.id, 'in_progress')}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1 transition"
                            >
                              <span>Start Task</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                          {act.status === 'in_progress' && (
                            <button
                              onClick={() => handleUpdateStatus(act.id, 'completed')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 transition"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Mark Complete</span>
                            </button>
                          )}
                          {act.status === 'completed' && (
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Task Details</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3">Priority</th>
                <th className="py-3.5 px-3">Effort / Impact</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Assignee & Due Date</th>
                <th className="py-3.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.map(act => (
                <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{act.title}</div>
                    <div className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">{act.description}</div>
                    {act.relatedPageUrl && (
                      <div className="text-[10px] text-blue-600 font-mono mt-0.5">{act.relatedPageUrl}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold capitalize">
                      {act.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                      act.priority === 'critical'
                        ? 'bg-rose-100 text-rose-800'
                        : act.priority === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {act.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">
                    <div>Effort: <span className="font-semibold text-slate-800 capitalize">{act.effort}</span></div>
                    <div>Impact: <span className="font-semibold text-slate-800 capitalize">{act.impact}</span></div>
                  </td>
                  <td className="py-3.5 px-3">
                    <select
                      value={act.status}
                      onChange={e => handleUpdateStatus(act.id, e.target.value as any)}
                      className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                        act.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : act.status === 'in_progress'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      <option value="approved">Approved</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="ignored">Ignored</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700">
                    <div className="font-semibold">{act.assignedUser || 'Unassigned'}</div>
                    <div className="text-[10px] text-slate-500">{act.dueDate || 'No due date'}</div>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleEditClick(act)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(act.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-blue-600" />
              {editingActivityId ? 'Edit SEO Activity' : 'Create New SEO Activity'}
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Refresh pillar blog post with 2026 framework"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description & Strategic Intent</label>
                <textarea
                  placeholder="Explain steps, subtopics to add, and targeted search terms..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Activity Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                  >
                    <option value="content_refresh">Content Refresh</option>
                    <option value="new_content">New Content Creation</option>
                    <option value="title_meta_improvement">Title / Meta Tag Improvement</option>
                    <option value="ctr_optimization">CTR Optimization</option>
                    <option value="internal_linking">Internal Linking Sprint</option>
                    <option value="technical_review">Technical CWV Review</option>
                    <option value="cannibalization_fix">Cannibalization Fix</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estimated Effort</label>
                  <select
                    value={effort}
                    onChange={e => setEffort(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                  >
                    <option value="low">Low (1-2 hours)</option>
                    <option value="medium">Medium (Half day)</option>
                    <option value="high">High (Full day+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Expected Impact</label>
                  <select
                    value={impact}
                    onChange={e => setImpact(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                  >
                    <option value="critical">Critical Growth</option>
                    <option value="high">High Impact</option>
                    <option value="medium">Medium Impact</option>
                    <option value="low">Low Impact</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Person</label>
                  <input
                    type="text"
                    value={assignedUser}
                    onChange={e => setAssignedUser(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-all"
                >
                  {editingActivityId ? 'Save Changes' : 'Create Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
