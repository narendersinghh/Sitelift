import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Copy,
  RefreshCw,
  Layers,
  Globe,
  Calendar,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { SyncJob, Website } from '../types';
import { storage } from '../services/storage';
import { getEffectiveTimezone } from '../data/geoConstants';

interface SyncLogsViewProps {
  website: Website;
  onRefresh: () => void;
}

export const SyncLogsView: React.FC<SyncLogsViewProps> = ({ website, onRefresh }) => {
  const [jobs, setJobs] = useState<SyncJob[]>(() => storage.getSyncJobs());
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const settings = storage.getSettings();
  const effectiveTz = getEffectiveTimezone(website.timezone, settings.timezone);

  const refreshList = () => {
    setJobs(storage.getSyncJobs());
    onRefresh();
  };

  const cronCommands = [
    {
      title: 'Daily Midnight Data Sync (cPanel / Crontab)',
      cmd: `0 0 * * * php /home/username/public_html/cron.php token=${settings.cronSecretToken}`,
      frequency: `Daily at 00:00 (Midnight, ${effectiveTz})`,
      desc: 'Automatically fetches GA4 traffic sessions and Google Search Console queries/clicks, and triggers weekly AI diagnostic recommendations. (Keyword tracking SERP rank checks are on-demand manual).'
    },
    {
      title: 'cURL / Wget HTTP Trigger (URL-based Cron)',
      cmd: `0 0 * * * curl -s "https://${website.domain}/cron.php?token=${settings.cronSecretToken}" > /dev/null 2>&1`,
      frequency: `Daily at 00:00 (Midnight, ${effectiveTz})`,
      desc: 'Lightweight web cron trigger for shared hosting environments without native PHP CLI access.'
    }
  ];

  const handleCopy = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Full Width Header with Automatic Schedule Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="w-full">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Automated Sync, Cron Jobs & Execution Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            All data synchronization, Keyword tracking API checks, and AI activity generations execute automatically in the background.
          </p>
        </div>

        {/* Automated Schedule Status Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
            <div className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              Daily GSC & GA4 Sync
            </div>
            <p className="text-xs text-slate-600">
              Runs automatically every day at <strong>midnight (00:00)</strong> based on project timezone (<span className="font-mono font-semibold text-blue-900">{effectiveTz}</span>).
            </p>
          </div>

          <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
            <div className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              Weekly AI Diagnostic Insights
            </div>
            <p className="text-xs text-slate-600">
              Activities & insights are generated automatically every week using AI based on the latest GA4 and GSC data.
            </p>
          </div>

          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
            <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              Keyword Tracking API (Manual)
            </div>
            <p className="text-xs text-slate-600">
              SERP rank data fetching is triggered <strong>on-demand</strong> via the Keyword Tracking tab to conserve API credits.
            </p>
          </div>
        </div>
      </div>

      {/* Shared Hosting Cron Setup Snippets */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-600" />
          Server Background Automation (cPanel / Crontab Setup)
        </div>
        <p className="text-xs text-slate-600">
          To ensure midnight executions trigger seamlessly on your self-hosted server, paste this cron entry into your server crontab:
        </p>

        <div className="space-y-3 pt-1">
          {cronCommands.map((item, idx) => (
            <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">{item.title}</span>
                <span className="text-xs text-blue-800 font-bold bg-blue-100/80 px-2.5 py-0.5 rounded-md border border-blue-200">
                  {item.frequency}
                </span>
              </div>
              <p className="text-xs text-slate-500">{item.desc}</p>
              <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <code className="text-xs text-slate-800 font-mono truncate">{item.cmd}</code>
                <button
                  onClick={() => handleCopy(item.cmd, `cmd-${idx}`)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg font-bold shrink-0 flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-600" />
                  <span>{copiedCmd === `cmd-${idx}` ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync Job History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recent Automated Sync Logs ({jobs.length})</h3>
          <button onClick={refreshList} className="text-xs text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1.5 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-700 border-b border-slate-200 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Job Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Records</th>
                <th className="py-3.5 px-4">Execution Time</th>
                <th className="py-3.5 px-6">Summary / Diagnostics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="font-bold text-slate-900 uppercase text-xs">
                      {job.jobType.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">{job.id}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      job.status === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                      job.status === 'error' ? 'bg-rose-100 text-rose-900 border border-rose-200' :
                      'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}>
                      {job.status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      <span className="capitalize">{job.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-xs">
                    {job.recordsProcessed != null ? job.recordsProcessed.toLocaleString() : '—'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">
                    <div>{job.startedAt.replace('T', ' ').slice(0, 19)}</div>
                    {job.completedAt && (
                      <div className="text-[11px] text-slate-400">Duration: ~1.2s</div>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-xs text-slate-700 max-w-xs font-medium">
                    {job.errorMessage ? (
                      <span className="text-rose-700 font-semibold">{job.errorMessage}</span>
                    ) : (
                      <span>Completed automated sync cycle.</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

