'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Volume2,
  Headphones,
  FileSpreadsheet,
  Globe2,
  Check,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<'reception' | 'support' | 'sales'>('reception');
  const [demoState, setDemoState] = useState<'idle' | 'calling' | 'connected'>('idle');
  const [demoStep, setDemoStep] = useState(0);

  const demoScenarios = {
    reception: {
      agent: 'Claire — Executive Concierge',
      caller: 'Jonathan Sterling (Summit Capital)',
      turns: [
        { role: 'assistant', text: 'Hello, thank you for calling Apex Global. My name is Claire. How may I direct your call today?' },
        { role: 'user', text: 'Hi Claire, I would like to schedule a 45-minute enterprise consultation for Friday afternoon.' },
        { role: 'assistant', text: 'Checking our calendar for Friday... We have 2:00 PM and 3:30 PM Eastern available. Which time works best for you?' },
        { role: 'user', text: '2:00 PM Eastern works great.' },
        { role: 'assistant', text: 'Confirmed. I have reserved Friday at 2:00 PM Eastern. Calendar invites have been sent to your email. Have a wonderful day!' },
      ],
    },
    support: {
      agent: 'David — Order & Tracking Specialist',
      caller: 'Michael Torres',
      turns: [
        { role: 'assistant', text: 'Thank you for reaching Apex Customer Care. My name is David. Do you have an order number I can look up for you?' },
        { role: 'user', text: 'Yes, it is ORD-99214.' },
        { role: 'assistant', text: 'Looking up ORD-99214... Dispatched via FedEx Priority (7891-2309-8812). Delivery is scheduled for tomorrow by 4:30 PM.' },
        { role: 'user', text: 'That was lightning fast, thank you David!' },
        { role: 'assistant', text: 'You are very welcome! Let us know if you need anything else.' },
      ],
    },
    sales: {
      agent: 'Elena — Outbound Lead Qualifier',
      caller: 'Dr. Rebecca Vance',
      turns: [
        { role: 'assistant', text: 'Hi Dr. Vance, this is Elena with Apex Global following up on your clinic voice automation enquiry. Did I catch you at an okay time?' },
        { role: 'user', text: 'Yes, but I only have two minutes.' },
        { role: 'assistant', text: 'Understood! We help multi-branch healthcare networks automate after-hours triage and appointments. Would a 15-minute walkthrough next Tuesday fit your schedule?' },
        { role: 'user', text: 'Tuesday at 10 AM works.' },
        { role: 'assistant', text: 'Perfect, invite is on its way. Thank you Dr. Vance!' },
      ],
    },
  };

  const currentScenario = demoScenarios[activeTab];

  const handleStartDemo = () => {
    setDemoState('calling');
    setDemoStep(0);
    setTimeout(() => {
      setDemoState('connected');
    }, 900);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-canvas/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-forest flex items-center justify-center text-white font-semibold text-sm">
              CA
            </div>
            <span className="font-semibold text-lg tracking-tight">CallAgent</span>
            <span className="text-xs px-2 py-0.5 rounded border border-border text-ink-muted uppercase font-mono">
              Enterprise Voice
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-ink-muted">
            <a href="#platform" className="hover:text-ink transition-colors">
              Platform Architecture
            </a>
            <a href="#demo" className="hover:text-ink transition-colors">
              Interactive Demo
            </a>
            <a href="#compliance" className="hover:text-ink transition-colors">
              Compliance & Safety
            </a>
            <a href="#pricing" className="hover:text-ink transition-colors">
              Pricing
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 text-ink hover:text-forest transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-4 py-2 rounded bg-forest text-white hover:bg-forest-hover transition-colors shadow-sm"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-forest-subtle border border-forest/20 text-forest text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" />
            <span>Telephony-Agnostic & Sub-Second Latency Runtime</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.12] mb-6">
            Autonomous Voice Agents Built for High-Stakes Operations.
          </h1>

          <p className="text-lg text-ink-muted leading-relaxed mb-8">
            Deploy conversational telephone agents that answer customer calls, execute verified calendar and CRM actions, and run compliant outbound campaigns with zero audio robotic artifacts.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded bg-forest text-white font-medium hover:bg-forest-hover transition-colors shadow"
            >
              <span>Deploy Your First Agent</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded bg-surface border border-border text-ink font-medium hover:bg-border-light transition-colors"
            >
              <span>Listen to Live Simulation</span>
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="mt-12 pt-8 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <div className="text-2xl font-bold font-mono text-ink">450ms</div>
              <div className="text-xs text-ink-muted mt-0.5">Average Turn Latency</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-ink">99.98%</div>
              <div className="text-xs text-ink-muted mt-0.5">SIP Call Completion</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-ink">Strict DNC</div>
              <div className="text-xs text-ink-muted mt-0.5">Regulatory Consent Guard</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-ink">Multi-Tenant</div>
              <div className="text-xs text-ink-muted mt-0.5">Complete Org Isolation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Voice Simulator */}
      <section id="demo" className="py-16 px-6 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                Test the Conversational Pipeline
              </h2>
              <p className="text-sm text-ink-muted mt-1">
                Hear how CallAgent chains low-latency STT, LLM reasoning with typed tool execution, and natural TTS.
              </p>
            </div>

            {/* Scenario switcher */}
            <div className="mt-4 md:mt-0 flex p-1 rounded bg-canvas border border-border">
              {(['reception', 'support', 'sales'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveTab(key);
                    setDemoState('idle');
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize ${
                    activeTab === key
                      ? 'bg-surface text-ink shadow-sm'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {key === 'reception' ? 'Inbound Clinic / Front Desk' : key === 'support' ? 'Order Triage' : 'Outbound Lead Gen'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Call visualizer container */}
            <div className="lg:col-span-7 bg-canvas rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-forest text-white flex items-center justify-center">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink">{currentScenario.agent}</div>
                    <div className="text-xs text-ink-muted">Caller: {currentScenario.caller}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {demoState === 'connected' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-forest-subtle text-forest border border-forest/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse mr-1.5" />
                      LIVE AUDIO
                    </span>
                  )}
                  {demoState === 'idle' ? (
                    <button
                      onClick={handleStartDemo}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-forest text-white hover:bg-forest-hover transition-colors"
                    >
                      Connect Test Call
                    </button>
                  ) : (
                    <button
                      onClick={() => setDemoState('idle')}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-surface border border-border text-ink hover:bg-danger-subtle hover:text-danger transition-colors"
                    >
                      End Call
                    </button>
                  )}
                </div>
              </div>

              {/* Transcript stream */}
              <div className="py-6 min-h-[300px] flex flex-col justify-end space-y-4">
                {demoState === 'idle' && (
                  <div className="text-center py-12 text-ink-muted text-sm">
                    Press &quot;Connect Test Call&quot; to inspect real-time conversational streaming and tool invocation.
                  </div>
                )}

                {demoState === 'calling' && (
                  <div className="text-center py-12 text-ink-muted text-sm flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-forest animate-bounce" />
                    <span>Dialing carrier and establishing audio session...</span>
                  </div>
                )}

                {demoState === 'connected' && (
                  <>
                    {currentScenario.turns.slice(0, demoStep + 2).map((turn, idx) => (
                      <div
                        key={idx}
                        className={`flex ${turn.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                            turn.role === 'assistant'
                              ? 'bg-surface border border-border text-ink shadow-sm'
                              : 'bg-forest text-white'
                          }`}
                        >
                          <div className="text-[10px] font-mono uppercase tracking-wider mb-1 opacity-70">
                            {turn.role === 'assistant' ? currentScenario.agent.split('—')[0] : 'Customer'}
                          </div>
                          {turn.text}
                        </div>
                      </div>
                    ))}

                    {demoStep + 2 < currentScenario.turns.length && (
                      <div className="pt-2 flex justify-center">
                        <button
                          onClick={() => setDemoStep((s) => s + 1)}
                          className="text-xs px-3 py-1 rounded bg-surface border border-border text-ink hover:bg-border-light flex items-center space-x-1"
                        >
                          <span>Next Conversational Turn</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Audio waveform bar */}
              <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-ink-muted">
                <div className="flex items-center space-x-2 font-mono">
                  <Volume2 className="w-3.5 h-3.5 text-forest" />
                  <span>24kHz Opus / Linear PCM</span>
                </div>
                <div className="font-mono">Turn Latency: ~380ms</div>
              </div>
            </div>

            {/* Architecture inspection panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-canvas rounded-lg border border-border p-5">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-muted mb-3">
                  Telemetry & Tool Invocations
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-2.5 rounded bg-surface border border-border">
                    <div className="flex items-center justify-between text-ink font-mono mb-1">
                      <span>STT Model</span>
                      <span className="text-forest">Deepgram Nova-2</span>
                    </div>
                    <div className="text-ink-muted">Audio streaming with live endpointing and speaker diarization.</div>
                  </div>

                  <div className="p-2.5 rounded bg-surface border border-border">
                    <div className="flex items-center justify-between text-ink font-mono mb-1">
                      <span>LLM Reasoning</span>
                      <span className="text-forest">GPT-4o Mini / 0.6 Temp</span>
                    </div>
                    <div className="text-ink-muted">JSON Schema constrained function dispatch with prompt injection isolation.</div>
                  </div>

                  <div className="p-2.5 rounded bg-surface border border-border">
                    <div className="flex items-center justify-between text-ink font-mono mb-1">
                      <span>Active Tool Executed</span>
                      <span className="text-forest font-bold">check_calendar_availability</span>
                    </div>
                    <pre className="mt-1 p-1.5 bg-canvas rounded text-[11px] font-mono text-ink overflow-x-auto">
                      {JSON.stringify({ date: '2026-10-30', availableSlots: ['14:00', '15:30'] }, null, 2)}
                    </pre>
                  </div>

                  <div className="p-2.5 rounded bg-surface border border-border">
                    <div className="flex items-center justify-between text-ink font-mono mb-1">
                      <span>Speech Synthesis</span>
                      <span className="text-forest">ElevenLabs Turbo v2.5</span>
                    </div>
                    <div className="text-ink-muted">Voice: Rachel (Warm, composed pacing, 1.0x rate).</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded border border-border bg-forest-subtle text-xs text-ink leading-relaxed">
                <span className="font-semibold text-forest">Zero Vendor Lock-in:</span> Switch between OpenAI, Deepgram, Cartesia, Telnyx, or your own SIP gateways directly from the organization settings.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="platform" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-ink">
            Engineered for Production Reliability
          </h2>
          <p className="text-ink-muted mt-2">
            Every layer of CallAgent is designed for high uptime, clean tenant isolation, and strict telecom compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg bg-surface border border-border">
            <div className="w-10 h-10 rounded bg-canvas border border-border flex items-center justify-center mb-4 text-forest">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-ink text-base mb-2">Dual Voice Engine</h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Run OpenAI Realtime WebSocket sessions for ultra-fast conversational reflexes, or our resilient chained pipeline (Deepgram + LLM + ElevenLabs) with custom tool sandboxing.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-surface border border-border">
            <div className="w-10 h-10 rounded bg-canvas border border-border flex items-center justify-center mb-4 text-forest">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-ink text-base mb-2">Visual Workflow Builder</h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Design complex multi-branch call logic without touching code. Visual node graphs compile into versioned JSON schemas with step-by-step backend runtime execution.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-surface border border-border">
            <div className="w-10 h-10 rounded bg-canvas border border-border flex items-center justify-center mb-4 text-forest">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-ink text-base mb-2">Lawful Calling & DNC Protection</h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Automated consent verification, calling window boundaries (e.g. 9 AM - 6 PM local time), instant opt-out processing, and suppression checks before dialing.
            </p>
          </div>
        </div>
      </section>

      {/* Compliance & Trust Center */}
      <section id="compliance" className="py-16 px-6 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <div className="text-xs font-mono uppercase tracking-wider text-forest font-semibold mb-2">
              Regulatory Standards
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-ink">
              Enterprise Compliance & Data Sovereignty
            </h2>
            <p className="text-sm text-ink-muted mt-2">
              Voice automation is governed by strict communications and privacy regulations. CallAgent builds compliance into the database layer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded bg-canvas border border-border">
              <div className="font-semibold text-sm text-ink mb-1">TRAI Commercial Rules</div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Pre-configured calling window limitations, scrubbing against National Customer Preference Register (NCPR), and DLT registration alignment.
              </p>
            </div>

            <div className="p-5 rounded bg-canvas border border-border">
              <div className="font-semibold text-sm text-ink mb-1">HIPAA BAA Readiness</div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Encrypted audio storage, redaction of sensitive patient identifiers in transcripts, and configurable retention schedules.
              </p>
            </div>

            <div className="p-5 rounded bg-canvas border border-border">
              <div className="font-semibold text-sm text-ink mb-1">SOC 2 Type II Alignment</div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Strict multi-tenant database scoping, role-based access control (RBAC), tamper-evident audit logs, and encrypted secrets.
              </p>
            </div>

            <div className="p-5 rounded bg-canvas border border-border">
              <div className="font-semibold text-sm text-ink mb-1">GDPR & DPDP Act 2023</div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Granular consent source logging, verbal in-call opt-out triggers, and one-click data erasure APIs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-ink">
            Transparent, Predictable Pricing
          </h2>
          <p className="text-ink-muted mt-2 text-sm">
            No surprise overages. Configure hard monthly spend limits on every organization account.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="p-8 rounded-lg bg-surface border border-border flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold text-ink">Starter</div>
              <div className="text-xs text-ink-muted mt-1">For single-location clinics and emerging SaaS teams.</div>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-bold font-mono text-ink">$49</span>
                <span className="text-xs text-ink-muted ml-2">/ month</span>
              </div>

              <div className="mt-8 space-y-3 text-xs text-ink">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>300 included AI voice minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>3 concurrent call channels</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>2 published AI voice agents</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>Appointment scheduling & order triage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>Twilio / Telnyx SIP connectivity</span>
                </div>
              </div>
            </div>

            <Link
              href="/register"
              className="mt-8 w-full py-2.5 text-center text-xs font-semibold rounded bg-canvas border border-border text-ink hover:bg-border-light transition-colors"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Professional */}
          <div className="p-8 rounded-lg bg-surface border-2 border-forest relative flex flex-col justify-between shadow-md">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-forest text-white text-[11px] font-medium tracking-wide">
              MOST POPULAR
            </div>

            <div>
              <div className="text-sm font-semibold text-ink">Professional</div>
              <div className="text-xs text-ink-muted mt-1">For multi-channel support and outbound campaigns.</div>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-bold font-mono text-ink">$199</span>
                <span className="text-xs text-ink-muted ml-2">/ month</span>
              </div>

              <div className="mt-8 space-y-3 text-xs text-ink">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>1,500 included AI voice minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>15 concurrent call channels</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>Unlimited AI voice agents</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>Visual Workflow Builder & Custom Tools</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>HubSpot & Google Calendar Integrations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>CSV Contact Import & Campaign Pacing</span>
                </div>
              </div>
            </div>

            <Link
              href="/register"
              className="mt-8 w-full py-2.5 text-center text-xs font-semibold rounded bg-forest text-white hover:bg-forest-hover transition-colors shadow"
            >
              Get Started with Professional
            </Link>
          </div>

          {/* Enterprise */}
          <div className="p-8 rounded-lg bg-surface border border-border flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold text-ink">Enterprise</div>
              <div className="text-xs text-ink-muted mt-1">High-concurrency call centers and hospital networks.</div>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-bold font-mono text-ink">$899</span>
                <span className="text-xs text-ink-muted ml-2">/ month</span>
              </div>

              <div className="mt-8 space-y-3 text-xs text-ink">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>10,000 included minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>100+ concurrent call channels</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>Dedicated SIP trunking & private LLM models</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>Custom HIPAA BAA & DPA agreements</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-forest" />
                  <span>24/7 Solutions Architect Support & SLA</span>
                </div>
              </div>
            </div>

            <Link
              href="/register"
              className="mt-8 w-full py-2.5 text-center text-xs font-semibold rounded bg-canvas border border-border text-ink hover:bg-border-light transition-colors"
            >
              Contact Enterprise Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-canvas text-xs text-ink-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded bg-forest flex items-center justify-center text-white text-[10px] font-semibold">
              CA
            </div>
            <span>© 2026 CallAgent Technologies Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/login" className="hover:text-ink">Log In</Link>
            <Link href="/register" className="hover:text-ink">Register</Link>
            <a href="#compliance" className="hover:text-ink">Security Center</a>
            <a href="#platform" className="hover:text-ink">API Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
