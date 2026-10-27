'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatPhone } from '@/lib/utils';
import {
  Phone,
  Plus,
  Bot,
  CheckCircle2,
  Trash2,
  Radio,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function PhoneNumbersPage() {
  const [numbers, setNumbers] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [numData, agentData] = await Promise.all([
        api.get<any[]>('/phone-numbers'),
        api.get<any[]>('/agents'),
      ]);
      setNumbers(numData || []);
      setAgents(agentData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAssignAgent(numberId: string, agentId: string) {
    try {
      await api.patch(`/phone-numbers/${numberId}/assign`, {
        agentId: agentId === 'none' ? null : agentId,
      });
      loadData();
    } catch (e: any) {
      alert(e.message || 'Assignment failed');
    }
  }

  async function handleProvisionNumber() {
    setIsProvisioning(true);
    try {
      await api.post('/phone-numbers/provision', {
        friendlyName: 'NYC Secondary Inbound Line',
      });
      loadData();
    } catch (e: any) {
      alert(e.message || 'Provisioning failed');
    } finally {
      setIsProvisioning(false);
    }
  }

  async function handleReleaseNumber(id: string) {
    if (!confirm('Are you sure you want to release this phone number? Inbound calls will disconnect.')) return;
    try {
      await api.delete(`/phone-numbers/${id}`);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Release failed');
    }
  }

  if (isLoading) {
    return <div className="p-8 text-xs text-ink-muted">Loading Phone Numbers...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Phone Numbers & Inbound Routing</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Manage your carrier phone numbers and assign published AI agents to handle incoming voice calls.
          </p>
        </div>

        <button
          type="button"
          onClick={handleProvisionNumber}
          disabled={isProvisioning}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium rounded bg-forest text-white hover:bg-forest-hover transition-colors shadow-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{isProvisioning ? 'Provisioning...' : 'Provision Number'}</span>
        </button>
      </div>

      {/* Numbers Table */}
      <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs divide-y divide-border">
          <thead className="bg-canvas text-ink-muted font-medium">
            <tr>
              <th className="px-5 py-3 font-mono">TELEPHONE NUMBER</th>
              <th className="px-5 py-3">FRIENDLY LABEL</th>
              <th className="px-5 py-3">CARRIER</th>
              <th className="px-5 py-3">ASSIGNED AI AGENT</th>
              <th className="px-5 py-3">STATUS</th>
              <th className="px-5 py-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {numbers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-muted">
                  No telephone numbers provisioned yet.
                </td>
              </tr>
            ) : (
              numbers.map((item) => (
                <tr key={item.id} className="hover:bg-canvas/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-semibold text-ink">
                    {formatPhone(item.number)}
                  </td>
                  <td className="px-5 py-3.5 text-ink font-medium">
                    {item.friendlyName || 'Main Inbound'}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-ink-muted">
                    {item.provider}
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={item.activeAgentId || 'none'}
                      onChange={(e) => handleAssignAgent(item.id, e.target.value)}
                      className="px-2.5 py-1 text-xs rounded border border-border bg-canvas text-ink focus:border-forest"
                    >
                      <option value="none">-- Unassigned --</option>
                      {agents.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} ({ag.status})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-forest-subtle text-forest">
                      <span className="w-1.5 h-1.5 rounded-full bg-forest mr-1.5" />
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleReleaseNumber(item.id)}
                      className="p-1 rounded text-ink-muted hover:text-danger hover:bg-danger-subtle transition-colors"
                      title="Release Number"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
