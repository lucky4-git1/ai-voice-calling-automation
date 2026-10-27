'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  XCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Users,
} from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [agentId, setAgentId] = useState('');
  const [callerId, setCallerId] = useState('+15558901234');
  const [concurrency, setConcurrency] = useState(4);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [campData, agData, conData] = await Promise.all([
        api.get<any[]>('/campaigns'),
        api.get<any[]>('/agents'),
        api.get<any[]>('/contacts'),
      ]);
      setCampaigns(campData || []);
      setAgents(agData || []);
      setContacts(conData || []);
      if (agData && agData.length > 0 && !agentId) setAgentId(agData[0].id);
      if (conData) {
        setSelectedContacts(conData.filter((c: any) => !c.isDncSuppressed).map((c: any) => c.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartCampaign(id: string) {
    try {
      await api.post(`/campaigns/${id}/start`);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Start failed');
    }
  }

  async function handlePauseCampaign(id: string) {
    try {
      await api.post(`/campaigns/${id}/pause`);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Pause failed');
    }
  }

  async function handleCancelCampaign(id: string) {
    if (!confirm('Are you sure you want to cancel this campaign?')) return;
    try {
      await api.post(`/campaigns/${id}/cancel`);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Cancel failed');
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (selectedContacts.length === 0) {
      alert('Select at least one contact');
      return;
    }

    try {
      await api.post('/campaigns', {
        name,
        agentId,
        callerIdNumber: callerId,
        contactIds: selectedContacts,
        concurrencyLimit: concurrency,
        callingWindowStart: '09:00',
        callingWindowEnd: '18:00',
      });
      setIsCreateOpen(false);
      setName('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Create campaign failed');
    }
  }

  if (isLoading) {
    return <div className="p-8 text-xs text-ink-muted">Loading Outbound Campaigns...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Outbound Voice Campaigns</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Automated batch outreach with concurrency bounds, calling window enforcement, and DNC scrubbing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium rounded bg-forest text-white hover:bg-forest-hover transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs divide-y divide-border">
          <thead className="bg-canvas text-ink-muted font-medium">
            <tr>
              <th className="px-5 py-3">CAMPAIGN NAME</th>
              <th className="px-5 py-3">VOICE AGENT</th>
              <th className="px-5 py-3">PACING & WINDOW</th>
              <th className="px-5 py-3">PROGRESS</th>
              <th className="px-5 py-3">STATUS</th>
              <th className="px-5 py-3 text-right">CONTROLS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-muted">
                  No outbound campaigns created yet.
                </td>
              </tr>
            ) : (
              campaigns.map((camp) => {
                const total = camp.totalRecipients || 1;
                const progressPct = Math.round(((camp.successfulCalls + camp.failedCalls) / total) * 100);

                return (
                  <tr key={camp.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-ink">{camp.name}</div>
                      <div className="text-[11px] text-ink-muted">
                        Caller ID: {camp.callerIdNumber}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-ink">
                      {camp.agent?.name || 'Assigned Agent'}
                    </td>
                    <td className="px-5 py-3.5 text-ink-muted">
                      <div>Max {camp.concurrencyLimit} concurrent calls</div>
                      <div className="text-[10px] font-mono text-forest">
                        {camp.windowStart} - {camp.windowEnd} ({camp.timezoneEnforcement})
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-[11px] font-mono text-ink mb-1">
                        {camp.successfulCalls} answered / {camp.totalRecipients} total ({progressPct}%)
                      </div>
                      <div className="w-28 h-1.5 bg-canvas rounded-full overflow-hidden border border-border">
                        <div
                          className="h-full bg-forest transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                          camp.status === 'RUNNING'
                            ? 'bg-forest-subtle text-forest'
                            : camp.status === 'PAUSED'
                            ? 'bg-warning-subtle text-warning'
                            : 'bg-canvas border border-border text-ink'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      {camp.status === 'RUNNING' ? (
                        <button
                          type="button"
                          onClick={() => handlePauseCampaign(camp.id)}
                          className="p-1.5 rounded border border-border text-ink hover:bg-canvas"
                          title="Pause Campaign"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartCampaign(camp.id)}
                          className="p-1.5 rounded bg-forest text-white hover:bg-forest-hover"
                          title="Start Campaign"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCancelCampaign(camp.id)}
                        className="p-1.5 rounded border border-border text-ink-muted hover:text-danger hover:bg-danger-subtle"
                        title="Cancel Campaign"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Campaign Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg border border-border shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-ink">Schedule New Outbound Campaign</h2>

            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-ink mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Executive Demo Outreach"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-canvas focus:border-forest"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Assigned AI Voice Agent</label>
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-canvas text-xs"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Approved Caller ID</label>
                <input
                  type="text"
                  value={callerId}
                  onChange={(e) => setCallerId(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-canvas font-mono"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-ink mb-1">
                  <span>Concurrency Limit (Concurrent Channels)</span>
                  <span className="font-mono text-forest">{concurrency} channels</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={concurrency}
                  onChange={(e) => setConcurrency(parseInt(e.target.value, 10))}
                  className="w-full accent-forest"
                />
              </div>

              <div className="p-3 bg-canvas rounded border border-border text-[11px] text-ink-muted space-y-1">
                <div className="font-semibold text-ink flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest" />
                  <span>DNC Scrubbing Active</span>
                </div>
                <div>Contacts on the suppression list are automatically omitted.</div>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-2 rounded border border-border text-ink hover:bg-canvas"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-forest text-white hover:bg-forest-hover"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
