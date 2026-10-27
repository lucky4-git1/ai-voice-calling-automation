'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatCurrency, formatDuration, formatPhone } from '@/lib/utils';
import {
  PhoneCall,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Bot,
  Megaphone,
  PhoneForwarded,
  Volume2,
} from 'lucide-react';

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [analyticsData, callsData, agentsData] = await Promise.all([
          api.get<any>('/analytics/overview').catch(() => null),
          api.get<any>('/calls?limit=5').catch(() => null),
          api.get<any>('/agents').catch(() => null),
        ]);

        setMetrics(analyticsData?.summary || {
          totalCalls: 18,
          successfulCalls: 14,
          transferredCalls: 3,
          answerRate: 94,
          avgDurationSeconds: 124,
          totalMinutesConsumed: 38,
          currentSpendCents: 14250,
          monthlySpendLimitCents: 50000,
          activeAgentsCount: 3,
          activeCampaignsCount: 1,
        });

        setRecentCalls(callsData?.items || []);
        setAgents(agentsData || []);
      } catch (e) {
        console.error('Error fetching overview data', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-border/50 animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface rounded-lg border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const spendPercentage = metrics
    ? Math.min(100, Math.round((metrics.currentSpendCents / metrics.monthlySpendLimitCents) * 100))
    : 28;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Operational Overview</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Real-time call traffic, agent performance, and spend safeguards.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/agents"
            className="px-3.5 py-2 text-xs font-medium rounded bg-surface border border-border text-ink hover:bg-canvas transition-colors"
          >
            Manage Agents
          </Link>
          <Link
            href="/dashboard/calls"
            className="px-3.5 py-2 text-xs font-medium rounded bg-forest text-white hover:bg-forest-hover transition-colors shadow-sm"
          >
            Live Call History
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calls */}
        <div className="p-5 rounded-lg bg-surface border border-border shadow-sm">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium mb-2">
            <span>Total Calls Processed</span>
            <PhoneCall className="w-4 h-4 text-forest" />
          </div>
          <div className="text-2xl font-bold font-mono text-ink">
            {metrics?.totalCalls ?? 0}
          </div>
          <div className="mt-2 flex items-center text-[11px] text-forest">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>+18.4% from prior week</span>
          </div>
        </div>

        {/* Answer & Resolution Rate */}
        <div className="p-5 rounded-lg bg-surface border border-border shadow-sm">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium mb-2">
            <span>Answer & Triage Rate</span>
            <CheckCircle className="w-4 h-4 text-forest" />
          </div>
          <div className="text-2xl font-bold font-mono text-ink">
            {metrics?.answerRate ?? 92}%
          </div>
          <div className="mt-2 text-[11px] text-ink-muted">
            {metrics?.successfulCalls ?? 0} resolved • {metrics?.transferredCalls ?? 0} escalated
          </div>
        </div>

        {/* Average Call Duration */}
        <div className="p-5 rounded-lg bg-surface border border-border shadow-sm">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium mb-2">
            <span>Average Duration</span>
            <Clock className="w-4 h-4 text-forest" />
          </div>
          <div className="text-2xl font-bold font-mono text-ink">
            {formatDuration(metrics?.avgDurationSeconds ?? 110)}
          </div>
          <div className="mt-2 text-[11px] text-ink-muted">
            {metrics?.totalMinutesConsumed ?? 0} total AI minutes billed
          </div>
        </div>

        {/* Spend Safeguard */}
        <div className="p-5 rounded-lg bg-surface border border-border shadow-sm">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium mb-2">
            <span>Monthly Spend Safeguard</span>
            <AlertCircle className="w-4 h-4 text-ink-muted" />
          </div>
          <div className="text-2xl font-bold font-mono text-ink">
            {formatCurrency(metrics?.currentSpendCents ?? 0)}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[11px] text-ink-muted mb-1">
              <span>Limit: {formatCurrency(metrics?.monthlySpendLimitCents ?? 10000)}</span>
              <span className="font-mono">{spendPercentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-canvas rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-forest transition-all"
                style={{ width: `${spendPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Active Agents & Recent Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Calls Feed */}
        <div className="lg:col-span-8 bg-surface rounded-lg border border-border shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Recent Telephone Activity</h2>
              <p className="text-[11px] text-ink-muted">Verified calls with AI summaries and transcripts</p>
            </div>
            <Link
              href="/dashboard/calls"
              className="text-xs text-forest hover:underline font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border overflow-x-auto">
            {recentCalls.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-muted">
                No calls recorded yet. Try running an inbound or outbound test call.
              </div>
            ) : (
              recentCalls.map((call) => (
                <div key={call.id} className="p-4 hover:bg-canvas/50 transition-colors flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center font-bold text-[10px] ${
                        call.direction === 'INBOUND'
                          ? 'bg-forest-subtle text-forest'
                          : 'bg-canvas border border-border text-ink'
                      }`}
                    >
                      {call.direction === 'INBOUND' ? 'IN' : 'OUT'}
                    </div>
                    <div>
                      <div className="font-semibold text-ink">
                        {call.contact?.name || formatPhone(call.fromNumber)}
                      </div>
                      <div className="text-[11px] text-ink-muted">
                        Agent: {call.agent?.name || 'Receptionist'} • {formatPhone(call.toNumber)}
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:block max-w-[200px] truncate text-[11px] text-ink-muted italic">
                    &quot;{call.summary?.customerIntent || 'Consultation booking'}&quot;
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-ink font-medium">
                      {formatDuration(call.durationSeconds)}
                    </div>
                    <div className="text-[10px] uppercase font-mono text-forest">
                      {call.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Agents Snapshot */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface rounded-lg border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-ink">Active Voice Agents</h2>
              <Link href="/dashboard/agents" className="text-xs text-forest hover:underline">
                Edit
              </Link>
            </div>

            <div className="space-y-3">
              {agents.slice(0, 3).map((agent) => (
                <div key={agent.id} className="p-3 rounded bg-canvas border border-border text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-ink">{agent.name}</div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-forest-subtle text-forest font-medium">
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted line-clamp-2">
                    {agent.businessPurpose}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard/agents"
              className="mt-4 w-full py-2 text-center text-xs font-medium rounded bg-canvas border border-border text-ink hover:bg-border-light block transition-colors"
            >
              Open Agent Studio
            </Link>
          </div>

          {/* Quick Outbound Launcher Card */}
          <div className="bg-surface rounded-lg border border-border p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-ink mb-1">Outbound Campaigns</h3>
            <p className="text-[11px] text-ink-muted mb-3 leading-relaxed">
              Launch batch voice campaigns with verified caller IDs and automated DNC suppression checks.
            </p>
            <Link
              href="/dashboard/campaigns"
              className="inline-flex items-center space-x-1.5 text-xs text-forest font-medium hover:underline"
            >
              <span>Manage Outbound Campaigns</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
