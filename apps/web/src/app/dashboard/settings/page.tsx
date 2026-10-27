'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Settings,
  Users,
  ShieldCheck,
  Key,
  Plus,
  Trash2,
  CheckCircle,
  Building,
  Lock,
} from 'lucide-react';

export default function SettingsPage() {
  const { activeOrg } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [orgDetails, setOrgDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('OPERATOR');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // API Key state
  const [apiKeys, setApiKeys] = useState<any[]>([
    { id: 'key_live_01', name: 'Primary Webhook Ingest Key', keyPrefix: 'ca_live_9812', createdAt: new Date() },
  ]);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const [membersData, orgData] = await Promise.all([
        api.get<any[]>('/organizations/current/members'),
        api.get<any>('/organizations/current'),
      ]);
      setMembers(membersData || []);
      setOrgDetails(orgData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleInviteMember(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/organizations/current/members/invite', {
        email: inviteEmail,
        role: inviteRole,
      });
      setIsInviteOpen(false);
      setInviteEmail('');
      loadSettings();
    } catch (e: any) {
      alert(e.message || 'Invite failed');
    }
  }

  async function handleRemoveMember(membershipId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/organizations/current/members/${membershipId}`);
      loadSettings();
    } catch (e: any) {
      alert(e.message || 'Remove failed');
    }
  }

  if (isLoading) {
    return <div className="p-8 text-xs text-ink-muted">Loading Organization Settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Organization & Security Settings</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Manage team member roles, developer API credentials, and regulatory compliance standards.
        </p>
      </div>

      {/* Organization Info */}
      <div className="bg-surface rounded-lg border border-border p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-ink flex items-center space-x-2">
          <Building className="w-4 h-4 text-forest" />
          <span>Organization Identity</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-ink-muted mb-1">Company Name</label>
            <div className="font-semibold text-ink text-sm">{orgDetails?.name}</div>
          </div>
          <div>
            <label className="block text-ink-muted mb-1">Organization Slug</label>
            <div className="font-mono text-ink text-sm">{orgDetails?.slug}</div>
          </div>
          <div>
            <label className="block text-ink-muted mb-1">Primary Timezone</label>
            <div className="text-ink text-sm">{orgDetails?.timezone || 'America/New_York'}</div>
          </div>
        </div>
      </div>

      {/* Team Members & Role Permissions */}
      <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Team Members & Role Access Control</h2>
            <p className="text-[11px] text-ink-muted">Enforced at backend middleware level</p>
          </div>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded bg-forest text-white hover:bg-forest-hover shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </button>
        </div>

        <table className="w-full text-left text-xs divide-y divide-border">
          <thead className="bg-canvas text-ink-muted font-medium">
            <tr>
              <th className="px-5 py-3">NAME & EMAIL</th>
              <th className="px-5 py-3">ROLE</th>
              <th className="px-5 py-3">JOINED</th>
              <th className="px-5 py-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-canvas/50">
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-ink">{m.user?.name}</div>
                  <div className="text-[11px] text-ink-muted">{m.user?.email}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      m.role === 'OWNER'
                        ? 'bg-forest-subtle text-forest'
                        : 'bg-canvas text-ink border border-border'
                    }`}
                  >
                    {m.role}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-ink-muted">
                  {new Date(m.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {m.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="text-xs text-danger hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compliance Checklist */}
      <div className="bg-surface rounded-lg border border-border p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-ink flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-forest" />
          <span>Regulatory Compliance Controls</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-canvas rounded border border-border space-y-1">
            <div className="font-semibold text-ink">Calling Hours Restriction</div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Outbound campaigns strictly execute between 09:00 and 18:00 recipient local time. Calls outside this window are automatically suppressed.
            </p>
          </div>

          <div className="p-3.5 bg-canvas rounded border border-border space-y-1">
            <div className="font-semibold text-ink">In-Call Verbal Opt-Out Trigger</div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              If an agent detects phrases like &quot;do not call me again&quot; or &quot;remove my number&quot;, the caller is appended to the DNC registry automatically.
            </p>
          </div>

          <div className="p-3.5 bg-canvas rounded border border-border space-y-1">
            <div className="font-semibold text-ink">TRAI Commercial Scrubbing (India)</div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Supports DLT principle entity header binding and pre-dial scrubbing against the National Customer Preference Register.
            </p>
          </div>

          <div className="p-3.5 bg-canvas rounded border border-border space-y-1">
            <div className="font-semibold text-ink">Encrypted Call Media & Signed URLs</div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              All recordings and transcripts are stored in tenant-isolated S3 buckets accessible only via short-lived HMAC signed URLs.
            </p>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg border border-border shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-ink">Invite Organization Member</h2>

            <form onSubmit={handleInviteMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-ink mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="colleague@apexglobal.io"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-canvas focus:border-forest"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Role & Permissions</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-canvas text-xs"
                >
                  <option value="ADMIN">Admin (Full access except billing ownership)</option>
                  <option value="OPERATOR">Operator (Manage agents, calls, campaigns)</option>
                  <option value="ANALYST">Analyst (View metrics and export transcripts)</option>
                  <option value="MEMBER">Member (Read-only)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-3 py-2 rounded border border-border text-ink hover:bg-canvas"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-forest text-white hover:bg-forest-hover"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
