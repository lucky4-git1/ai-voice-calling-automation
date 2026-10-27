'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Download,
  Shield,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export default function BillingPage() {
  const [billing, setBilling] = useState<any>(null);
  const [spendLimit, setSpendLimit] = useState(500);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadBilling();
  }, []);

  async function loadBilling() {
    try {
      const data = await api.get<any>('/billing');
      setBilling(data);
      if (data?.monthlySpendLimitCents) {
        setSpendLimit(data.monthlySpendLimitCents / 100);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateSpendLimit() {
    try {
      await api.patch('/billing/spend-limit', {
        monthlySpendLimitCents: Math.round(spendLimit * 100),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      loadBilling();
    } catch (e: any) {
      alert(e.message || 'Update failed');
    }
  }

  async function handleChangePlan(tier: string) {
    if (!confirm(`Upgrade subscription to ${tier}?`)) return;
    try {
      await api.post('/billing/change-plan', { plan: tier });
      loadBilling();
    } catch (e: any) {
      alert(e.message || 'Plan change failed');
    }
  }

  if (isLoading) {
    return <div className="p-8 text-xs text-ink-muted">Loading Billing & Usage...</div>;
  }

  const usage = billing?.usage || {};
  const planConfig = billing?.planConfig || { includedMinutes: 1500, priceMonthly: 199, concurrencyLimit: 15 };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Billing & Usage Controls</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Manage your organization subscription plan, granular voice minutes usage, and hard spend safeguards.
        </p>
      </div>

      {/* Subscription Tier Overview */}
      <div className="bg-surface rounded-lg border border-border p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="text-[10px] font-mono uppercase text-forest font-semibold tracking-wider">
            Active Subscription
          </div>
          <div className="text-2xl font-bold text-ink mt-1">
            {billing?.plan || 'PROFESSIONAL'} PLAN
          </div>
          <div className="text-xs text-ink-muted mt-1">
            ${planConfig.priceMonthly} / month • Next billing cycle on{' '}
            {new Date(billing?.currentPeriodEnd || Date.now()).toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {billing?.plan !== 'ENTERPRISE' && (
            <button
              onClick={() => handleChangePlan('ENTERPRISE')}
              className="px-4 py-2 text-xs font-semibold rounded bg-forest text-white hover:bg-forest-hover shadow-sm"
            >
              Upgrade to Enterprise
            </button>
          )}
        </div>
      </div>

      {/* Usage breakdown meters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-lg bg-surface border border-border shadow-sm">
          <div className="text-xs text-ink-muted mb-1">Telephony Minutes</div>
          <div className="text-2xl font-bold font-mono text-ink">{usage.telephonyMinutes || 0} min</div>
          <div className="text-[11px] text-ink-muted mt-1">Carrier SIP connection</div>
        </div>

        <div className="p-5 rounded-lg bg-surface border border-border shadow-sm">
          <div className="text-xs text-ink-muted mb-1">STT Transcription</div>
          <div className="text-2xl font-bold font-mono text-ink">{usage.sttMinutes || 0} min</div>
          <div className="text-[11px] text-forest mt-1">Deepgram Nova-2 streaming</div>
        </div>

        <div className="p-5 rounded-lg bg-surface border border-border shadow-sm">
          <div className="text-xs text-ink-muted mb-1">TTS Characters</div>
          <div className="text-2xl font-bold font-mono text-ink">{usage.ttsCharacters || 0}</div>
          <div className="text-[11px] text-ink-muted mt-1">ElevenLabs Turbo v2.5</div>
        </div>

        <div className="p-5 rounded-lg bg-surface border border-border shadow-sm">
          <div className="text-xs text-ink-muted mb-1">LLM Tokens Consumed</div>
          <div className="text-2xl font-bold font-mono text-ink">{usage.llmTokens || 0}</div>
          <div className="text-[11px] text-forest mt-1">GPT-4o / GPT-4o Mini</div>
        </div>
      </div>

      {/* Monthly Hard Spend Safeguard */}
      <div className="bg-surface rounded-lg border border-border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-forest" />
              <span>Hard Monthly Spend Limit Safeguard</span>
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Prevent surprise overage charges. When spend reaches this ceiling, outbound campaigns pause automatically.
            </p>
          </div>

          <div className="text-right font-mono">
            <span className="text-xl font-bold text-ink">${spendLimit}</span>
            <span className="text-xs text-ink-muted"> / month</span>
          </div>
        </div>

        <input
          type="range"
          min="50"
          max="2000"
          step="25"
          value={spendLimit}
          onChange={(e) => setSpendLimit(parseFloat(e.target.value))}
          className="w-full accent-forest cursor-pointer"
        />

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-ink-muted font-mono">
            Current Month Spend: {formatCurrency(billing?.currentSpendCents || 0)}
          </span>

          <div className="flex items-center space-x-2">
            {saveSuccess && (
              <span className="text-xs text-forest font-medium flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Limit Saved</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleUpdateSpendLimit}
              className="px-3.5 py-1.5 text-xs font-medium rounded bg-forest text-white hover:bg-forest-hover shadow-sm"
            >
              Update Limit
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Records */}
      <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-ink">Invoices & Payment Receipts</h2>
        </div>

        <table className="w-full text-left text-xs divide-y divide-border">
          <thead className="bg-canvas text-ink-muted font-medium">
            <tr>
              <th className="px-5 py-3">INVOICE ID</th>
              <th className="px-5 py-3">DATE</th>
              <th className="px-5 py-3">AMOUNT</th>
              <th className="px-5 py-3">STATUS</th>
              <th className="px-5 py-3 text-right">PDF RECEIPT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {billing?.invoices?.map((inv: any) => (
              <tr key={inv.id} className="hover:bg-canvas/50">
                <td className="px-5 py-3.5 font-mono text-ink font-semibold">{inv.id}</td>
                <td className="px-5 py-3.5 text-ink-muted">
                  {new Date(inv.date).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5 font-mono font-medium text-ink">
                  ${inv.amount.toFixed(2)} USD
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest-subtle text-forest font-medium">
                    {inv.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Downloading certified PDF receipt...');
                    }}
                    className="text-xs text-forest hover:underline font-medium inline-flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
