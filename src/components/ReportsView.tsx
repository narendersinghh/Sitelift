import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Download,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Trash2,
  Eye,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Globe,
  Sliders
} from 'lucide-react';
import { Website, MonthlyReport } from '../types';
import { storage } from '../services/storage';
import { generateReportSnapshot } from '../services/reportGenerator';

interface ReportsViewProps {
  website: Website;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ website }) => {
  const [reports, setReports] = useState<MonthlyReport[]>(() => storage.getMonthlyReports(website.id));
  const [activeReport, setActiveReport] = useState<MonthlyReport | null>(reports[0] || null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Customization Form State
  const [targetMonth, setTargetMonth] = useState('2026-08');
  const [agencyName, setAgencyName] = useState('Apex Growth Studio');
  const [clientName, setClientName] = useState(`${website.name} Leadership`);
  const [brandColor, setBrandColor] = useState('#0d9488');
  const [customIntro, setCustomIntro] = useState(
    'Executive audit of search visibility, rankings, traffic shifts, and tactical SEO execution for the month.'
  );
  const [manualNotes, setManualNotes] = useState(
    'All metrics verified from Google Analytics 4, Search Console, and Bright Data SERP rank tracker.'
  );
  const [sections, setSections] = useState({
    executiveSummary: true,
    trafficOverview: true,
    organicSearch: true,
    topPages: true,
    growingPages: true,
    decliningPages: true,
    categoryPerformance: true,
    brandVsNonBrand: true,
    sourceBreakdown: true,
    keywordMovement: true,
    completedActivities: true,
    nextMonthPlan: true,
    recommendations: true
  });

  const refreshList = () => {
    const list = storage.getMonthlyReports(website.id);
    setReports(list);
    if (!activeReport && list.length > 0) {
      setActiveReport(list[0]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const rep = await generateReportSnapshot(website, targetMonth, {
        agencyName,
        clientName,
        brandColor,
        customIntro,
        manualNotes,
        sections
      });

      setIsGenerating(false);
      setShowGenerateModal(false);
      setReports(storage.getMonthlyReports(website.id));
      setActiveReport(rep);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setIsGenerating(false);
    }
  };

  const handleDeleteReport = (id: string) => {
    storage.deleteMonthlyReport(id);
    const updated = storage.getMonthlyReports(website.id);
    setReports(updated);
    if (activeReport?.id === id) {
      setActiveReport(updated[0] || null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportHtml = () => {
    if (!activeReport) return;
    const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${activeReport.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #1e293b; background: #fff; }
    h1 { color: ${activeReport.config.brandColor || '#0d9488'}; font-size: 24px; }
    .kpi-box { display: inline-block; padding: 15px 25px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-right: 15px; margin-bottom: 15px; }
    .kpi-val { font-size: 22px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 13px; }
    th { background: #f1f5f9; font-weight: 600; }
  </style>
</head>
<body>
  <h1>${activeReport.title}</h1>
  <p><strong>Client:</strong> ${activeReport.config.clientName || website.name} | <strong>Prepared by:</strong> ${activeReport.config.agencyName || 'Sitelift'}</p>
  <p>${activeReport.config.customIntro}</p>
  <hr>
  <h2>Executive Summary</h2>
  <div class="kpi-box"><div class="kpi-val">${activeReport.snapshotData.executiveSummary.totalSessions.toLocaleString()}</div><div>Total GA4 Sessions</div></div>
  <div class="kpi-box"><div class="kpi-val">${activeReport.snapshotData.executiveSummary.organicClicks.toLocaleString()}</div><div>GSC Organic Clicks</div></div>
  <div class="kpi-box"><div class="kpi-val">${activeReport.snapshotData.executiveSummary.topKeywordCount}</div><div>Top 3 Rankings</div></div>
  <div class="kpi-box"><div class="kpi-val">${activeReport.snapshotData.executiveSummary.completedTasksCount}</div><div>Tasks Completed</div></div>
  <p><strong>Highlight:</strong> ${activeReport.snapshotData.executiveSummary.keyHighlight}</p>
  
  <h2>Top Declining Pages (Intervention Required)</h2>
  <table>
    <thead><tr><th>Page Path</th><th>Traffic Loss</th><th>Current Traffic</th></tr></thead>
    <tbody>
      ${activeReport.snapshotData.decliningPages.map(p => `<tr><td>${p.path}</td><td>-${p.sessionLoss}</td><td>${p.currentSessions}</td></tr>`).join('')}
    </tbody>
  </table>

  <h2>Completed SEO Activities</h2>
  <ul>
    ${activeReport.snapshotData.completedActivities.map(a => `<li><strong>${a.title}</strong> (${a.type}) - Completed on ${a.completedDate}</li>`).join('')}
  </ul>

  <h2>Next Month Action Plan</h2>
  <ul>
    ${activeReport.snapshotData.nextMonthPlan.map(a => `<li><strong>${a.title}</strong> [Priority: ${a.priority}, Impact: ${a.impact}]</li>`).join('')}
  </ul>

  <footer style="margin-top: 50px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
    ${activeReport.config.footerText || 'Confidential Sitelift Monthly Report'}
  </footer>
</body>
</html>`;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sitelift-report-${activeReport.month}-${website.domain}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Monthly SEO Reports & Snapshots
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate client-ready monthly executive summaries, keyword movement matrices, and action plan snapshots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeReport && (
            <>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 backdrop-blur-md transition-all"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                <span>Print / PDF</span>
              </button>

              <button
                onClick={handleExportHtml}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 backdrop-blur-md transition-all"
                title="Export Standalone HTML Report"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export HTML</span>
              </button>
            </>
          )}

          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 backdrop-blur-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate New Report</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Sidebar of Reports + Interactive Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Report Archive Snapshots */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-md shadow-xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Archived Report Snapshots ({reports.length})
          </div>

          <div className="space-y-2">
            {reports.length === 0 ? (
              <div className="text-xs text-slate-500 p-4 text-center">No reports generated yet.</div>
            ) : (
              reports.map(rep => (
                <div
                  key={rep.id}
                  onClick={() => setActiveReport(rep)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all text-xs flex items-center justify-between gap-2 ${
                    activeReport?.id === rep.id
                      ? 'bg-indigo-600/20 border-indigo-500/40 shadow-lg text-white backdrop-blur-md'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <div className="space-y-0.5 truncate">
                    <div className="font-semibold text-slate-100 truncate">{rep.title}</div>
                    <div className="text-[10px] text-slate-400">
                      Month: <span className="font-medium text-indigo-400">{rep.month}</span> • {new Date(rep.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteReport(rep.id);
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors shrink-0"
                    title="Delete snapshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Full-Screen Report Viewer */}
        <div className="lg:col-span-3">
          {activeReport ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-8 backdrop-blur-md shadow-2xl print:bg-white print:text-black print:p-0 print:border-none">
              
              {/* Report Header */}
              <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    {activeReport.config.agencyName || 'Sitelift SEO Intelligence'}
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight mt-1">{activeReport.title}</h2>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>Target: <strong className="text-slate-200">{website.domain}</strong></span>
                    <span>•</span>
                    <span>Client: <strong className="text-slate-200">{activeReport.config.clientName}</strong></span>
                    <span>•</span>
                    <span>Generated: {new Date(activeReport.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-2 px-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs text-emerald-300 backdrop-blur-md">
                  Snapshot Locked <span className="text-emerald-400 font-bold ml-1">✓</span>
                </div>
              </div>

              {/* Custom Intro */}
              {activeReport.config.customIntro && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 leading-relaxed backdrop-blur-md">
                  {activeReport.config.customIntro}
                </div>
              )}

              {/* Executive Summary Cards */}
              {activeReport.config.sections.executiveSummary && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Executive Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
                      <div className="text-[11px] font-medium text-slate-400 uppercase">Total Sessions</div>
                      <div className="text-xl font-bold text-white mt-1">
                        {activeReport.snapshotData.executiveSummary.totalSessions.toLocaleString()}
                      </div>
                      <div className="text-xs text-emerald-400 font-medium mt-1">
                        +{activeReport.snapshotData.executiveSummary.sessionsGrowthMoM}% MoM
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
                      <div className="text-[11px] font-medium text-slate-400 uppercase">Organic Clicks</div>
                      <div className="text-xl font-bold text-white mt-1">
                        {activeReport.snapshotData.executiveSummary.organicClicks.toLocaleString()}
                      </div>
                      <div className="text-xs text-emerald-400 font-medium mt-1">
                        +{activeReport.snapshotData.executiveSummary.clicksGrowthMoM}% MoM
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
                      <div className="text-[11px] font-medium text-slate-400 uppercase">Top 3 Rankings</div>
                      <div className="text-xl font-bold text-indigo-400 mt-1">
                        {activeReport.snapshotData.executiveSummary.topKeywordCount}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">High Intent Terms</div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
                      <div className="text-[11px] font-medium text-slate-400 uppercase">Completed Tasks</div>
                      <div className="text-xl font-bold text-emerald-400 mt-1">
                        {activeReport.snapshotData.executiveSummary.completedTasksCount}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">SEO Sprints Done</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 backdrop-blur-md">
                    <strong>Monthly Highlight:</strong> {activeReport.snapshotData.executiveSummary.keyHighlight}
                  </div>
                </div>
              )}

              {/* Top Declining Pages Requiring Attention */}
              {activeReport.config.sections.decliningPages && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Declining Pages & Mitigation</h3>
                  <div className="border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-slate-400 font-medium">
                        <tr>
                          <th className="py-2.5 px-3">Page Path</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-right">Traffic Lost</th>
                          <th className="py-2.5 px-3 text-right">Current Traffic</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-transparent">
                        {activeReport.snapshotData.decliningPages.map((p, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 font-semibold text-slate-200">{p.path}</td>
                            <td className="py-2.5 px-3 text-slate-400">{p.category}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-rose-400">-{p.sessionLoss.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right text-slate-300">{p.currentSessions.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Keyword Summary & Movements */}
              {activeReport.config.sections.keywordMovement && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Keyword Rankings & Movement</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-xs space-y-2 backdrop-blur-md">
                      <div className="font-semibold text-slate-200">Tracked SERP Distribution</div>
                      <div className="text-slate-400">
                        Total tracked: <strong className="text-white">{activeReport.snapshotData.keywordSummary.trackedTotal}</strong> •
                        Top 3: <strong className="text-indigo-400">{activeReport.snapshotData.keywordSummary.top3Count}</strong> •
                        Top 10: <strong className="text-emerald-400">{activeReport.snapshotData.keywordSummary.top10Count}</strong>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-xs space-y-2 backdrop-blur-md">
                      <div className="font-semibold text-slate-200">Top Keyword Movements</div>
                      <div className="space-y-1">
                        {activeReport.snapshotData.keywordSummary.topMovements.map((m, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-300 truncate max-w-[200px]">{m.keyword}</span>
                            <span className={m.change > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              #{m.oldRank} &rarr; #{m.newRank} ({m.change > 0 ? `+${m.change}` : m.change})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Completed Activities & Next Month Plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeReport.config.sections.completedActivities && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">4. Activities Completed</h3>
                    <div className="space-y-2">
                      {activeReport.snapshotData.completedActivities.map((act, idx) => (
                        <div key={idx} className="p-3.5 bg-white/5 border border-emerald-500/20 rounded-xl text-xs backdrop-blur-md">
                          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{act.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Completed on {act.completedDate} • Impact: <strong className="text-slate-300 uppercase">{act.impact}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeReport.config.sections.nextMonthPlan && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">5. Next Month Planned Sprint</h3>
                    <div className="space-y-2">
                      {activeReport.snapshotData.nextMonthPlan.map((plan, idx) => (
                        <div key={idx} className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs backdrop-blur-md">
                          <div className="font-semibold text-slate-200">{plan.title}</div>
                          <div className="text-[10px] text-indigo-400 mt-1 font-medium">
                            Priority: {plan.priority} • Expected Impact: {plan.impact}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-white/10 text-center text-xs text-slate-500">
                {activeReport.config.footerText}
              </div>

            </div>
          ) : (
            <div className="p-12 bg-white/5 border border-white/10 rounded-2xl text-center text-xs text-slate-400 backdrop-blur-md">
              Select or generate a report snapshot.
            </div>
          )}
        </div>

      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#0f172a]/95 border border-white/15 backdrop-blur-2xl rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Generate Monthly Report Snapshot
            </h3>

            <form onSubmit={handleGenerate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Month</label>
                  <select
                    value={targetMonth}
                    onChange={e => setTargetMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-white/10 rounded-xl text-white focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="2026-08">August 2026</option>
                    <option value="2026-07">July 2026</option>
                    <option value="2026-06">June 2026</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Brand Accent Color</label>
                  <input
                    type="color"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    className="w-full h-9 bg-white/5 border border-white/10 rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Agency / Creator Name</label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={e => setAgencyName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white backdrop-blur-md"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Client / Stakeholder Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white backdrop-blur-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Custom Introduction</label>
                <textarea
                  value={customIntro}
                  onChange={e => setCustomIntro(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white backdrop-blur-md"
                />
              </div>

              {/* Section Checkboxes */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Include Sections in Snapshot</label>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  {Object.entries(sections).map(([k, val]) => (
                    <label key={k} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={e => setSections({ ...sections, [k]: e.target.checked })}
                        className="rounded bg-white/10 border-white/20 text-indigo-600 accent-indigo-500"
                      />
                      <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {isGenerating ? 'Compiling Snapshot...' : 'Generate Snapshot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
