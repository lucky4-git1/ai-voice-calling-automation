'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Plug,
  CheckCircle2,
  AlertCircle,
  Key,
  Shield,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [selectedInteg, setSelectedInteg] = useState<any>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [testingStatus, setTestingStatus] = useState<Record<string, any>>({});

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    try {
      const data = await api.get<any[]>('/integrations');
      setIntegrations(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTest(provider: string) {
    setTestingStatus((prev) => ({ ...prev, [provider]: { loading: true } }));
    try {
      const res: any = await api.post(`/integrations/${provider}/test`);
      setTestingStatus((prev) => ({
        ...prev,
        [provider]: { loading: false, success: res.isHealthy, message: res.message },
      }));
    } catch (e: any) {
      setTestingStatus((prev) => ({
        ...prev,
        [provider]: { loading: false, success: false, message: e.message },
      }));
    }
  }

  async function handleSaveCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInteg) return;

    try {
      await api.post(`/integrations/${selectedInteg.provider}/configure`, {
        credentials: { apiKey: apiKeyInput },
        config: { environment: 'PRODUCTION' },
      });
      setSelectedInteg(null);
      setApiKeyInput('');
      loadIntegrations();
    } catch (e: any) {
      alert(e.message || 'Configure failed');
    }
  }

  async function handleDisconnect(provider: string) {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return;
    try {
      await api.post(`/integrations/${provider}/disconnect`);
      loadIntegrations();
    } catch (e: any) {
      alert(e.message || 'Disconnect failed');
    }
  }

  if (isLoading) {
    return <div className="p-8 text-xs text-ink-muted">Loading Integrations Directory...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">External Service Integrations</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Connect your organization API keys for telephony carriers, speech recognition, synthesis, and CRM synchronization.
        </p>
      </div>

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {integrations.map((integ) => {
          const test = testingStatus[integ.provider];
          const isConnected = integ.status === 'CONNECTED';

          return (
            <div
              key={integ.provider}
              className="p-5 rounded-lg bg-surface border border-border shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-mono uppercase text-ink-muted px-2 py-0.5 rounded bg-canvas border border-border">
                    {integ.category}
                  </div>
                  <span
                    className={`inline-flex items-center text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                      isConnected
                        ? 'bg-forest-subtle text-forest'
                        : 'bg-canvas text-ink-muted border border-border'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        isConnected ? 'bg-forest' : 'bg-ink-muted'
                      }`}
                    />
                    {integ.status}
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-ink">{integ.name}</h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed line-clamp-3">
                  {integ.description}
                </p>

                {test?.message && (
                  <div
                    className={`mt-2 p-2 rounded text-[10px] font-mono ${
                      test.success ? 'bg-forest-subtle text-forest' : 'bg-danger-subtle text-danger'
                    }`}
                  >
                    {test.message}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
                {isConnected ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTest(integ.provider)}
                      disabled={test?.loading}
                      className="text-forest hover:underline font-medium flex items-center space-x-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${test?.loading ? 'animate-spin' : ''}`} />
                      <span>Verify</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDisconnect(integ.provider)}
                      className="text-danger hover:underline"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInteg(integ);
                      setApiKeyInput('');
                    }}
                    className="w-full py-1.5 rounded bg-canvas border border-border text-ink hover:bg-border-light text-center font-medium transition-colors"
                  >
                    Configure Keys
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configure Key Modal */}
      {selectedInteg && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg border border-border shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-ink flex items-center space-x-2">
              <Key className="w-4 h-4 text-forest" />
              <span>Configure {selectedInteg.name}</span>
            </h2>

            <form onSubmit={handleSaveCredentials} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-ink mb-1">
                  API Key / Secret Token
                </label>
                <input
                  type="password"
                  required
                  placeholder="sk_live_..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-canvas focus:border-forest font-mono"
                />
              </div>

              <div className="p-3 bg-canvas rounded border border-border text-[11px] text-ink-muted">
                <span className="font-semibold text-ink">Encryption Notice:</span> Secrets are encrypted at rest with AES-256 and never returned over public endpoints.
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedInteg(null)}
                  className="px-3 py-2 rounded border border-border text-ink hover:bg-canvas"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-forest text-white hover:bg-forest-hover"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
