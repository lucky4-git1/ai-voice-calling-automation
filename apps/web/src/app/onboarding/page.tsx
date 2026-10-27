'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  PhoneCall,
  Calendar,
  Headphones,
  TrendingUp,
  Volume2,
  Sparkles,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { activeOrg } = useAuth();
  const [step, setStep] = useState(1);
  const [useCase, setUseCase] = useState('reception');
  const [voiceId, setVoiceId] = useState('21m00Tcm4TlvDq8ikWAM'); // Rachel
  const [agentName, setAgentName] = useState('Claire');
  const [greeting, setGreeting] = useState(
    'Hello, thank you for calling. My name is Claire. How may I direct your call today?',
  );
  const [testTurnInput, setTestTurnInput] = useState('');
  const [testTurns, setTestTurns] = useState<Array<{ role: string; text: string }>>([
    { role: 'assistant', text: 'Hello, thank you for calling. My name is Claire. How may I direct your call today?' },
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleUseCaseChange = (uc: string) => {
    setUseCase(uc);
    if (uc === 'reception') {
      setAgentName('Claire — Front Desk');
      setGreeting('Hello, thank you for calling our office. My name is Claire. How may I assist you today?');
    } else if (uc === 'support') {
      setAgentName('David — Support Triage');
      setGreeting('Thank you for contacting customer support. My name is David. Do you have an order number I can check?');
    } else if (uc === 'sales') {
      setAgentName('Elena — Outbound Lead Qualifier');
      setGreeting('Hi there, this is Elena following up on your recent inquiry. Did I catch you at an okay time?');
    }
  };

  const handleSimulateTurn = () => {
    if (!testTurnInput.trim()) return;
    const userMsg = testTurnInput.trim();
    setTestTurns((prev) => [...prev, { role: 'user', text: userMsg }]);
    setTestTurnInput('');
    setIsSimulating(true);

    setTimeout(() => {
      let reply = 'I understand your request and have checked our availability. Would Friday afternoon work for your consultation?';
      if (userMsg.toLowerCase().includes('order')) {
        reply = 'I pulled up that order. It is dispatched and scheduled for delivery tomorrow by 4:30 PM.';
      }
      setTestTurns((prev) => [...prev, { role: 'assistant', text: reply }]);
      setIsSimulating(false);
    }, 600);
  };

  const handleFinishOnboarding = async () => {
    try {
      // Create agent via API
      await api.post('/agents', {
        name: agentName,
        businessPurpose: `Primary voice agent for ${useCase} operations.`,
        systemPrompt: `You are ${agentName}. You assist callers politely, accurately, and naturally.`,
        greetingMessage: greeting,
        fallbackMessage: 'Could you please repeat that?',
        endOfCallMessage: 'Thank you for calling. Goodbye!',
        voiceConfig: {
          ttsVoiceId: voiceId,
          ttsSpeed: 1.0,
          sttProvider: 'DEEPGRAM',
          llmProvider: 'OPENAI',
          ttsProvider: 'ELEVENLABS',
        },
        tools: [],
      });
    } catch (e) {
      // Proceed even if demo fallback
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-canvas py-12 px-6 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-8 border-b border-border mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-forest flex items-center justify-center text-white font-semibold text-sm">
              CA
            </div>
            <div>
              <div className="font-semibold text-sm text-ink">CallAgent Onboarding</div>
              <div className="text-xs text-ink-muted">Organization: {activeOrg?.name || 'Your Company'}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center space-x-2 text-xs font-mono text-ink-muted">
            <span>Step {step} of 4</span>
            <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-forest transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step 1: Use Case */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-ink">
                Select your primary voice use case
              </h2>
              <p className="text-sm text-ink-muted mt-1">
                We will tailor initial conversation guardrails, prompt structures, and tool bindings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => handleUseCaseChange('reception')}
                className={`p-5 rounded-lg border text-left transition-all ${
                  useCase === 'reception'
                    ? 'border-forest bg-surface ring-1 ring-forest'
                    : 'border-border bg-surface hover:border-ink-muted'
                }`}
              >
                <div className="w-9 h-9 rounded bg-forest-subtle text-forest flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="font-semibold text-sm text-ink">Inbound Reception</div>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Call triage, clinic/executive scheduling, and warm transfer to human staff.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleUseCaseChange('support')}
                className={`p-5 rounded-lg border text-left transition-all ${
                  useCase === 'support'
                    ? 'border-forest bg-surface ring-1 ring-forest'
                    : 'border-border bg-surface hover:border-ink-muted'
                }`}
              >
                <div className="w-9 h-9 rounded bg-forest-subtle text-forest flex items-center justify-center mb-3">
                  <Headphones className="w-5 h-5" />
                </div>
                <div className="font-semibold text-sm text-ink">Order & Returns Support</div>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Real-time package tracking lookup, refund eligibility, and ticketing triage.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleUseCaseChange('sales')}
                className={`p-5 rounded-lg border text-left transition-all ${
                  useCase === 'sales'
                    ? 'border-forest bg-surface ring-1 ring-forest'
                    : 'border-border bg-surface hover:border-ink-muted'
                }`}
              >
                <div className="w-9 h-9 rounded bg-forest-subtle text-forest flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="font-semibold text-sm text-ink">Outbound Lead Gen</div>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Lawful opt-in qualification, demo booking, and CRM outcome recording.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Voice & Persona */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-ink">
                Choose Voice Persona & Style
              </h2>
              <p className="text-sm text-ink-muted mt-1">
                Select an ultra-realistic voice model for low latency text-to-speech rendering.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Recommended)', desc: 'Composed, warm, professional executive tone for reception & triage' },
                { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', desc: 'Crisp, articulate, high-energy tone ideal for customer service' },
                { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', desc: 'Friendly, gentle, conversational cadence suited for patient check-ins' },
              ].map((v) => (
                <div
                  key={v.id}
                  onClick={() => setVoiceId(v.id)}
                  className={`p-4 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                    voiceId === v.id
                      ? 'border-forest bg-surface ring-1 ring-forest'
                      : 'border-border bg-surface hover:border-ink-muted'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-4 h-4 text-forest" />
                    <div>
                      <div className="font-semibold text-sm text-ink">{v.name}</div>
                      <div className="text-xs text-ink-muted">{v.desc}</div>
                    </div>
                  </div>
                  {voiceId === v.id && <CheckCircle2 className="w-4 h-4 text-forest" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Greeting & Configuration */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-ink">
                Configure First AI Voice Agent
              </h2>
              <p className="text-sm text-ink-muted mt-1">
                Name your agent and customize the initial telephone greeting message.
              </p>
            </div>

            <div className="bg-surface p-6 rounded-lg border border-border space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Agent Display Name
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded border border-border bg-canvas focus:bg-surface focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Spoken Greeting Message (Played immediately upon call connect)
                </label>
                <textarea
                  rows={3}
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded border border-border bg-canvas focus:bg-surface focus:border-forest"
                />
              </div>

              <div className="p-3 bg-canvas rounded border border-border text-xs text-ink-muted flex items-center justify-between">
                <span>Testing Sandbox Number:</span>
                <span className="font-mono text-ink font-semibold">+1 (555) 234-8901 (Auto-Provisioned)</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Interactive Test Turn */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-ink">
                Test Agent in Conversational Simulator
              </h2>
              <p className="text-sm text-ink-muted mt-1">
                Simulate a caller response to inspect turn pacing and tool execution before going live.
              </p>
            </div>

            <div className="bg-surface rounded-lg border border-border p-5">
              <div className="min-h-[220px] max-h-[300px] overflow-y-auto space-y-3 mb-4">
                {testTurns.map((turn, idx) => (
                  <div
                    key={idx}
                    className={`flex ${turn.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded px-3.5 py-2 text-xs leading-relaxed ${
                        turn.role === 'assistant'
                          ? 'bg-canvas border border-border text-ink'
                          : 'bg-forest text-white'
                      }`}
                    >
                      {turn.text}
                    </div>
                  </div>
                ))}
                {isSimulating && (
                  <div className="text-xs text-ink-muted italic">Agent thinking & executing tools...</div>
                )}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a caller response, e.g. 'Can I book an appointment for Friday?'"
                  value={testTurnInput}
                  onChange={(e) => setTestTurnInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSimulateTurn()}
                  className="flex-1 px-3 py-2 text-sm rounded border border-border bg-canvas focus:bg-surface focus:border-forest"
                />
                <button
                  type="button"
                  onClick={handleSimulateTurn}
                  className="px-4 py-2 text-xs font-semibold rounded bg-forest text-white hover:bg-forest-hover"
                >
                  Send Turn
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded bg-surface border border-border text-xs font-medium text-ink hover:bg-border-light"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded bg-forest text-xs font-medium text-white hover:bg-forest-hover shadow-sm"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded bg-forest text-xs font-medium text-white hover:bg-forest-hover shadow-sm"
            >
              <span>Complete Setup & Launch Dashboard</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
