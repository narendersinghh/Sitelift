import React, { useState } from 'react';
import {
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Copy,
  RefreshCw,
  Layers,
  Globe
} from 'lucide-react';
import { SyncJob, Website } from '../types';
import { storage } from '../services/storage';
import { runCronBatch } from '../services/cronEngine';

interface SyncLogsViewProps {
  website: Website;
  onRefresh: () => void;
}

export const SyncLogsView: React.FC<SyncLogsViewProps> = ({ website, onRefresh }) => {
  const [jobs, setJobs] = useState<SyncJob[]>(() => storage.getSyncJobs());
  const [isRunning, setIsRunning] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const settings = storage.getSettings();

  const refreshList = () => {
    setJobs(storage.getSyncJobs());
    onRefresh();
  };

  const handleRunBatch = () => {
    setIsRunning(true);
    setTimeout(() => {
      runCronBatch();
      setIsRunning(false);
      refreshList();
    }, 1200);
  };

  const cronCommands = [
    {
      title: 'Shared Hosting cPanel Cron (Standard CLI)',
      cmd: `php /home/username/public_html/cron.php token=${settings.cronSecretToken}`,
      frequency: 'Every hour or once per day at midnight (0 0 * * *)'
    },
    {
      title: 'cURL / Wget HTTP Trigger (URL-based Cron)',
      cmd: `curl -s "https://${website.domain}/cron.php?token=${settings.cronSecretToken}" > /dev/null 2>&1`,
      frequency: 'Every day at 02:00 AM (0 2 * * *)'
    },
    {
      title: 'Bright Data SERP Weekly Rank Check Only',
      cmd: `php /home/username/public_html/cron.php job=bright_data_ranks token=${settings.cronSecretToken}`,
      frequency: 'Every Monday morning at 04:00 AM (0 4 * * 1)'
    }
  ];

  const handleCopy = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Cron Jobs, Data Sync & Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Execution logs for Google Analytics 4, Search Console, Bright Data SERP rank checks, and automated data retention purges.
          </p>
        </div>

        <button
          onClick={handleRunBatch}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 backdrop-blur-md transition-all disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Running Cron Pipeline...' : 'Trigger Full Cron Pipeline'}</span>
        </button>
      </div>

      {/* Shared Hosting Cron Setup Snippets */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-xl">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          Shared Hosting Cron Setup (cPanel / Crontab)
        </div>
        <p className="text-xs text-slate-400">
          Paste these command strings directly into your cPanel Cron Manager, Plesk Scheduled Tasks, or standard crontab:
        </p>

        <div className="space-y-2.5 pt-1">
          {cronCommands.map((item, idx) => (
            <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 backdrop-blur-md">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{item.title}</span>
                <span className="text-[11px] text-indigo-400 font-medium">{item.frequency}</span>
              </div>
              <div className="flex items-center justify-between gap-2 bg-[#0f172a]/60 p-2.5 rounded-xl border border-white/10">
                <code className="text-xs text-slate-300 font-mono truncate">{item.cmd}</code>
                <button
                  onClick={() => handleCopy(item.cmd, `cmd-${idx}`)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/15 text-slate-200 text-[11px] rounded-lg font-medium shrink-0 flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3 h-3 text-indigo-400" />
                  <span>{copiedCmd === `cmd-${idx}` ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync Job History Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recent Sync Executions ({jobs.length})</h3>
          <button onClick={refreshList} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-slate-300 border-b border-white/10 font-medium">
              <tr>
                <th className="py-3 px-6">Job Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Records</th>
                <th className="py-3 px-4">Execution Time</th>
                <th className="py-3 px-6">Summary / Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="font-semibold text-slate-100 uppercase text-[11px]">
                      {job.jobType.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{job.id}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      job.status === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : job.status === 'running'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {job.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-slate-200 font-medium">
                    {job.recordsProcessed.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-slate-400">
                    <div className="text-slate-200 font-medium">{new Date(job.startedAt).toLocaleTimeString()}</div>
                    <div className="text-[10px] text-slate-500">{new Date(job.startedAt).toLocaleDateString()}</div>
                  </td>

                  <td className="py-3.5 px-6 text-slate-300">
                    {job.errorMessage ? (
                      <span className="text-rose-400 font-medium">{job.errorMessage}</span>
                    ) : (
                      <span className="text-slate-400">Completed with HTTP 200 OK. Schema updated.</span>
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
