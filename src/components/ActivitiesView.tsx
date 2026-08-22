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
  ChevronRight
} from 'lucide-react';
import { Website, Activity, ActivityStatus, ActivityType, EffortLevel, ImpactLevel } from '../types';
import { storage } from '../services/storage';
import { generateMonthlyActivities } from '../services/activityGenerator';

interface ActivitiesViewProps {
  website: Website;
}

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({ website }) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activities, setActivities] = useState<Activity[]>(() => storage.getActivities(website.id));
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ActivityType>('content_refresh');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [effort, setEffort] = useState<EffortLevel>('medium');
  const [impact, setImpact] = useState<ImpactLevel>('high');
  const [assignedUser, setAssignedUser] = useState('SEO Strategist');
  const [dueDate, setDueDate] = useState(`${selectedMonth}-28`);
  const [relatedUrl, setRelatedUrl] = useState(`https://${website.domain}/`);
  const [relatedKeyword, setRelatedKeyword] = useState('');

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
    setDueDate(`${selectedMonth}-28`);
    setRelatedUrl(`https://${website.domain}/`);
    setRelatedKeyword('');
    setShowAddModal(true);
  };

  const refreshList = () => {
    setActivities(storage.getActivities(website.id));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      generateMonthlyActivities(website.id, selectedMonth);
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
        month: selectedMonth,
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

  const monthActivities = activities.filter(a => a.month === selectedMonth && a.status !== 'suggested');

  const columns: { id: ActivityStatus; title: string; color: string }[] = [
    { id: 'approved', title: 'Approved & Planned', color: 'border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md' },
    { id: 'in_progress', title: 'In Progress', color: 'border-amber-500/20 bg-amber-500/5 backdrop-blur-md' },
    { id: 'completed', title: 'Completed', color: 'border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-indigo-400" />
            Monthly SEO Activity Planner
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Prioritize content refreshes, technical fixes, CTR experiments, and internal linking sprints for each month.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-[#0f172a] border border-white/10 rounded-xl text-xs font-semibold text-white focus:border-indigo-400 focus:outline-none transition-colors"
          >
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="2026-06">June 2026</option>
          </select>

          {/* Auto-generate from Insights */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 backdrop-blur-md transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-indigo-400 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating...' : 'Auto-Generate Tasks'}</span>
          </button>

          {/* Add Manual Task */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 backdrop-blur-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>

          {/* View Toggle */}
          <div className="border-l border-white/10 pl-2 ml-1 flex items-center gap-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
              title="Kanban Board View"
            >
              <Columns3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
              title="Compact List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board View - Exactly 3 columns taking equal 1/3rd width each */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full items-start">
          {columns.map(col => {
            const colActivities = monthActivities.filter(a => a.status === col.id);
            return (
              <div
                key={col.id}
                className={`w-full min-w-0 p-4 border rounded-2xl flex flex-col space-y-3.5 shadow-xl transition-all ${col.color}`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    {col.title}
                  </h3>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-slate-200 font-semibold backdrop-blur-md">
                    {colActivities.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 min-h-[300px]">
                  {colActivities.length === 0 ? (
                    <div className="h-28 flex items-center justify-center border border-dashed border-white/10 rounded-xl text-slate-500 text-xs">
                      No tasks in this lane
                    </div>
                  ) : (
                    colActivities.map(act => (
                      <div
                        key={act.id}
                        className="p-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl shadow-lg backdrop-blur-md space-y-2.5 transition-all text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                            act.priority === 'critical'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : act.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-white/5 text-slate-300 border border-white/10'
                          }`}>
                            {act.priority}
                          </span>

                          <span className="text-[10px] text-slate-400 font-medium capitalize">
                            {act.type.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="font-semibold text-slate-100 leading-snug">{act.title}</div>
                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{act.description}</p>

                        {act.relatedPageUrl && (
                          <div className="text-[10px] text-indigo-400 truncate font-medium">
                            URL: {act.relatedPageUrl.replace(/^https?:\/\/[^/]+/, '') || '/'}
                          </div>
                        )}

                        <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{act.dueDate || 'No date'}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {col.id === 'approved' && (
                              <button
                                onClick={() => handleUpdateStatus(act.id, 'in_progress')}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium shadow-sm transition-all"
                              >
                                Start &rarr;
                              </button>
                            )}
                            {col.id === 'in_progress' && (
                              <button
                                onClick={() => handleUpdateStatus(act.id, 'completed')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-sm transition-all"
                              >
                                Complete ✓
                              </button>
                            )}
                            <button
                              onClick={() => handleEditClick(act)}
                              className="p-1 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-white/5 transition-colors"
                              title="Edit task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(act.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-slate-400 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Task Title & Details</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3 text-center">Priority</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-3">Assignee / Due</th>
                <th className="py-3.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent">
              {monthActivities.map(act => (
                <tr key={act.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 max-w-md">
                    <div className="font-semibold text-slate-100">{act.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{act.description}</div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300 capitalize">{act.type.replace(/_/g, ' ')}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                      act.priority === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-white/5 text-slate-300 border border-white/10'
                    }`}>
                      {act.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <select
                      value={act.status}
                      onChange={e => handleUpdateStatus(act.id, e.target.value as ActivityStatus)}
                      className="px-2.5 py-1 bg-[#0f172a] border border-white/10 rounded-lg text-xs text-slate-200 capitalize"
                    >
                      <option value="approved">Approved</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="ignored">Ignored</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300">
                    <div>{act.assignedUser || 'Unassigned'}</div>
                    <div className="text-[10px] text-slate-500">{act.dueDate || 'No due date'}</div>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleEditClick(act)}
                        className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(act.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#0f172a]/95 border border-white/15 backdrop-blur-2xl rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-indigo-400" />
              {editingActivityId ? 'Edit SEO Activity' : 'Create New SEO Activity'}
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Refresh pillar blog post with 2026 framework"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-400 focus:outline-none backdrop-blur-md"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description & Strategic Intent</label>
                <textarea
                  placeholder="Explain steps, subtopics to add, and targeted search terms..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-400 focus:outline-none backdrop-blur-md"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Activity Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-white/10 rounded-xl text-white"
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
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-white/10 rounded-xl text-white"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Estimated Effort</label>
                  <select
                    value={effort}
                    onChange={e => setEffort(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-white/10 rounded-xl text-white"
                  >
                    <option value="low">Low (1-2 hours)</option>
                    <option value="medium">Medium (Half day)</option>
                    <option value="high">High (Full day+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Expected Impact</label>
                  <select
                    value={impact}
                    onChange={e => setImpact(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-white/10 rounded-xl text-white"
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
                  <label className="block text-slate-300 font-medium mb-1">Assigned Person</label>
                  <input
                    type="text"
                    value={assignedUser}
                    onChange={e => setAssignedUser(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white backdrop-blur-md"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-white/10 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/30 transition-all"
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
