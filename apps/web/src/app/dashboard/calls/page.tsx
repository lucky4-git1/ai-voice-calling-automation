'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, formatDuration, formatPhone } from '@/lib/utils';
import {
  History,
  Search,
  Filter,
  Download,
  PhoneCall,
  Volume2,
  Play,
  Pause,
  Wrench,
  Bot,
  User,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function CallHistoryPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    loadCalls();
  }, [search, directionFilter, statusFilter]);

  async function loadCalls() {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (directionFilter) params.append('direction', directionFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get<any>(`/calls?${params.toString()}`);
      setCalls(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOpenDetail(callId: string) {
    try {
      const detail = await api.get<any>(`/calls/${callId}`);
      setSelectedCall(detail);
      setIsPlayingAudio(false);
    } catch (e: any) {
      alert(e.message || 'Failed to load call detail');
    }
  }

  const handleExportCsv = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/calls/export/csv`, '_blank');
  };

  if (isLoading) {
    return <div className="p-8 text-xs text-ink-muted">Loading Call History...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Title & CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Call History & Transcripts</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Audit-grade call recordings, dual-track transcripts, structured summaries, and tool traces.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium rounded bg-surface border border-border text-ink hover:bg-canvas transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Calls (CSV)</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 flex items-center space-x-2 bg-surface p-2.5 rounded-lg border border-border">
          <Search className="w-4 h-4 text-ink-muted shrink-0" />
          <input
            type="text"
            placeholder="Search by caller, recipient, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent border-none focus:outline-none text-ink placeholder:text-ink-muted"
          />
        </div>

        <select
          value={directionFilter}
          onChange={(e) => setDirectionFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-border bg-surface text-ink"
        >
          <option value="">All Directions</option>
          <option value="INBOUND">Inbound Only</option>
          <option value="OUTBOUND">Outbound Only</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-border bg-surface text-ink"
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="TRANSFERRED">Transferred</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Calls Table */}
      <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs divide-y divide-border">
          <thead className="bg-canvas text-ink-muted font-medium">
            <tr>
              <th className="px-5 py-3">CALL DETAILS</th>
              <th className="px-5 py-3">AGENT & SUMMARY</th>
              <th className="px-5 py-3">DURATION</th>
              <th className="px-5 py-3">SENTIMENT</th>
              <th className="px-5 py-3">STATUS</th>
              <th className="px-5 py-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {calls.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-muted">
                  No call records match the current filters.
                </td>
              </tr>
            ) : (
              calls.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => handleOpenDetail(c.id)}
                  className="hover:bg-canvas/50 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[9px] ${
                          c.direction === 'INBOUND'
                            ? 'bg-forest-subtle text-forest'
                            : 'bg-canvas border border-border text-ink'
                        }`}
                      >
                        {c.direction === 'INBOUND' ? 'IN' : 'OUT'}
                      </span>
                      <div>
                        <div className="font-semibold text-ink">
                          {c.contact?.name || formatPhone(c.fromNumber)}
                        </div>
                        <div className="text-[10px] text-ink-muted font-mono">
                          To: {formatPhone(c.toNumber)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 max-w-[260px]">
                    <div className="font-medium text-ink">{c.agent?.name || 'Receptionist'}</div>
                    <div className="text-[11px] text-ink-muted truncate">
                      {c.summary?.customerIntent || 'Consultation triage'}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-ink">
                    {formatDuration(c.durationSeconds)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        c.sentiment === 'POSITIVE'
                          ? 'bg-forest-subtle text-forest font-medium'
                          : c.sentiment === 'NEGATIVE'
                          ? 'bg-danger-subtle text-danger font-medium'
                          : 'bg-canvas text-ink-muted border border-border'
                      }`}
                    >
                      {c.sentiment || 'NEUTRAL'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] font-mono uppercase font-medium text-ink">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="text-xs text-forest hover:underline font-medium">
                      Inspect &rarr;
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Call Detail Drawer / Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg border border-border shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-xs font-mono uppercase text-ink-muted">
                  Call Record Detail • {selectedCall.id}
                </div>
                <h2 className="text-base font-bold text-ink">
                  {selectedCall.agent?.name} &harr; {selectedCall.contact?.name || formatPhone(selectedCall.fromNumber)}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-xs text-ink-muted hover:text-ink font-medium"
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Audio player preview */}
              <div className="p-3 bg-canvas rounded-lg border border-border flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center shadow-sm"
                  >
                    {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div>
                    <div className="font-semibold text-ink">Telephony Audio Recording</div>
                    <div className="text-[11px] text-ink-muted">
                      {formatDuration(selectedCall.durationSeconds)} • 24kHz Opus Carrier Stream
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {[40, 65, 30, 85, 95, 45, 60, 35, 75, 50, 90, 40].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full ${
                        isPlayingAudio ? 'bg-forest animate-pulse' : 'bg-border'
                      }`}
                      style={{ height: `${h * 0.3}px` }}
                    />
                  ))}
                </div>
              </div>

              {/* AI Summary Box */}
              {selectedCall.summary && (
                <div className="p-4 bg-surface rounded-lg border border-border space-y-2">
                  <div className="flex items-center space-x-1.5 text-forest font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Call Summary & Extracted Fields</span>
                  </div>
                  <p className="text-ink leading-relaxed">
                    {selectedCall.summary.overview}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-[11px]">
                    <div>
                      <span className="text-ink-muted">Customer Intent:</span>{' '}
                      <span className="font-medium text-ink">{selectedCall.summary.customerIntent}</span>
                    </div>
                    <div>
                      <span className="text-ink-muted">Sentiment Score:</span>{' '}
                      <span className="font-mono text-forest font-bold">
                        {selectedCall.summary.sentimentScore}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tool Execution Timeline */}
              {selectedCall.toolExecutions?.length > 0 && (
                <div>
                  <h3 className="font-mono uppercase text-ink-muted text-[10px] mb-2 tracking-wider">
                    Executed Business Tools ({selectedCall.toolExecutions.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedCall.toolExecutions.map((te: any) => (
                      <div key={te.id} className="p-3 bg-canvas rounded border border-border font-mono text-[11px]">
                        <div className="flex items-center justify-between text-forest font-semibold mb-1">
                          <span className="flex items-center space-x-1">
                            <Wrench className="w-3 h-3" />
                            <span>{te.toolName}</span>
                          </span>
                          <span className="text-[10px] text-ink-muted">{te.durationMs}ms</span>
                        </div>
                        <div className="text-ink-muted text-[10px]">
                          Output: {JSON.stringify(te.outputPayload)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dual-track Transcript */}
              <div>
                <h3 className="font-mono uppercase text-ink-muted text-[10px] mb-2 tracking-wider">
                  Timestamped Transcript Segments
                </h3>
                <div className="space-y-3">
                  {selectedCall.segments?.map((seg: any) => (
                    <div
                      key={seg.id}
                      className={`p-3 rounded border text-xs leading-relaxed ${
                        seg.role === 'assistant'
                          ? 'bg-canvas border-border text-ink'
                          : 'bg-surface border-border text-ink font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase text-ink-muted mb-1">
                        <span className="font-semibold text-ink">
                          {seg.role === 'assistant' ? selectedCall.agent?.name : 'Customer'}
                        </span>
                        <span>{Math.round(seg.timestampOffsetMs / 1000)}s</span>
                      </div>
                      {seg.content}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
