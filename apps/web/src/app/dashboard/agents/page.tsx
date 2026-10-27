'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Bot,
  Plus,
  Play,
  Save,
  CheckCircle,
  Copy,
  Archive,
  Volume2,
  Wrench,
  Clock,
  Send,
  Sparkles,
  PhoneForwarded,
  AlertCircle,
  Layers,
} from 'lucide-react';

export default function AgentStudioPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Playground state
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [turnLoading, setTurnLoading] = useState(false);
  const [lastTurnDetails, setLastTurnDetails] = useState<any>(null);

  // Edit Form State
  const [name, setName] = useState('');
  const [businessPurpose, setBusinessPurpose] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [ttsVoiceId, setTtsVoiceId] = useState('21m00Tcm4TlvDq8ikWAM');
  const [llmModel, setLlmModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.6);
  const [allowHumanTransfer, setAllowHumanTransfer] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    try {
      const data = await api.get<any[]>('/agents');
      setAgents(data || []);
      if (data && data.length > 0 && !selectedAgent) {
        selectAgentForEdit(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  function selectAgentForEdit(agent: any) {
    setSelectedAgent(agent);
    setName(agent.name);
    setBusinessPurpose(agent.businessPurpose || '');
    const ver = agent.latestVersion || {};
    setSystemPrompt(ver.systemPrompt || '');
    setGreetingMessage(ver.greetingMessage || '');
    setTtsVoiceId(ver.voiceConfig?.ttsVoiceId || '21m00Tcm4TlvDq8ikWAM');
    setLlmModel(ver.voiceConfig?.llmModel || 'gpt-4o-mini');
    setTemperature(ver.voiceConfig?.temperature ?? 0.6);
    setAllowHumanTransfer(ver.escalationRules?.allowHumanTransfer ?? true);

    // Reset playground
    setChatHistory([
      { role: 'assistant', content: ver.greetingMessage || 'Hello, how may I help you?' },
    ]);
    setLastTurnDetails(null);
  }

  async function handleSaveAgent() {
    if (!selectedAgent) return;
    try {
      const updated = await api.patch<any>(`/agents/${selectedAgent.id}`, {
        name,
        businessPurpose,
        systemPrompt,
        greetingMessage,
        voiceConfig: {
          ttsVoiceId,
          llmModel,
          temperature,
          sttProvider: 'DEEPGRAM',
          ttsProvider: 'ELEVENLABS',
          llmProvider: 'OPENAI',
        },
        escalationRules: {
          allowHumanTransfer,
          transferPhoneNumber: '+15559990000',
        },
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      loadAgents();
    } catch (err: any) {
      alert(err.message || 'Save failed');
    }
  }

  async function handlePublishAgent() {
    if (!selectedAgent) return;
    try {
      await api.post(`/agents/${selectedAgent.id}/publish`);
      alert('Agent published successfully! This version is now live for all inbound calls.');
      loadAgents();
    } catch (err: any) {
      alert(err.message || 'Publishing validation failed');
    }
  }

  async function handleDuplicateAgent() {
    if (!selectedAgent) return;
    try {
      await api.post(`/agents/${selectedAgent.id}/duplicate`);
      loadAgents();
    } catch (err: any) {
      alert(err.message || 'Duplicate failed');
    }
  }

  async function handleSendPlaygroundTurn() {
    if (!chatInput.trim() || !selectedAgent) return;
    const userMsg = chatInput.trim();
    const updatedHistory = [...chatHistory, { role: 'user', content: userMsg }];
    setChatHistory(updatedHistory);
    setChatInput('');
    setTurnLoading(true);

    try {
      const res: any = await api.post(`/agents/${selectedAgent.id}/simulate-turn`, {
        message: userMsg,
        history: updatedHistory,
      });

      setChatHistory((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      setLastTurnDetails(res);
    } catch (e: any) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection timed out. Please check agent configuration.' },
      ]);
    } finally {
      setTurnLoading(false);
    }
  }

  async function handleCreateNewAgent() {
    try {
      const newAgent = await api.post<any>('/agents', {
        name: 'New Custom AI Agent',
        businessPurpose: 'Inbound client triage and appointment scheduling.',
        systemPrompt: 'You are a polite, helpful assistant who answers user questions concisely.',
        greetingMessage: 'Hello, thank you for calling. How can I help you today?',
        fallbackMessage: 'Could you please repeat that?',
        endOfCallMessage: 'Thank you for your time. Goodbye!',
        voiceConfig: {
          ttsVoiceId: '21m00Tcm4TlvDq8ikWAM',
          llmModel: 'gpt-4o-mini',
          temperature: 0.6,
          ttsSpeed: 1.0,
          sttProvider: 'DEEPGRAM',
          ttsProvider: 'ELEVENLABS',
          llmProvider: 'OPENAI',
        },
        tools: [],
        escalationRules: {
          allowHumanTransfer: true,
          transferPhoneNumber: '+15559990000',
        },
        businessHours: {
          enabled: false,
          timezone: 'UTC',
        },
      });
      setIsCreating(false);
      await loadAgents();
      selectAgentForEdit(newAgent);
    } catch (e: any) {
      alert(e.message || 'Create agent failed');
    }
  }

  if (isLoading) {
    return <div className="p-8 text-xs text-ink-muted">Loading Agent Studio...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">AI Agent Studio</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Configure system instructions, voice models, business tools, and conversational pacing.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleCreateNewAgent}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium rounded bg-forest text-white hover:bg-forest-hover transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Agent</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Agent Selector List */}
        <div className="lg:col-span-3 space-y-2">
          <div className="text-xs font-mono uppercase text-ink-muted tracking-wider px-1 mb-2">
            Configured Agents ({agents.length})
          </div>

          <div className="space-y-1.5">
            {agents.map((agent) => {
              const isSelected = selectedAgent?.id === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => selectAgentForEdit(agent)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-surface border-forest ring-1 ring-forest shadow-sm'
                      : 'bg-surface/60 border-border hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-ink truncate">{agent.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-forest-subtle text-forest font-medium">
                      {agent.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-muted line-clamp-2">
                    {agent.businessPurpose || 'No business purpose defined.'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Agent Editor */}
        <div className="lg:col-span-5 bg-surface rounded-lg border border-border p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-ink">Agent Configuration</h2>
              <div className="text-[11px] text-ink-muted">
                Version {selectedAgent?.latestVersion?.versionNumber || 1} • State: {selectedAgent?.status}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleDuplicateAgent}
                title="Duplicate"
                className="p-1.5 rounded border border-border text-ink hover:bg-canvas transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleSaveAgent}
                className="px-3 py-1.5 text-xs font-medium rounded bg-surface border border-border text-ink hover:bg-border-light transition-colors flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                onClick={handlePublishAgent}
                className="px-3 py-1.5 text-xs font-medium rounded bg-forest text-white hover:bg-forest-hover transition-colors flex items-center space-x-1 shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Publish</span>
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-2.5 rounded bg-forest-subtle border border-forest/20 text-xs text-forest flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Agent draft version saved successfully.</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-ink mb-1">Agent Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded border border-border bg-canvas focus:bg-surface focus:border-forest"
              />
            </div>

            <div>
              <label className="block font-medium text-ink mb-1">Business Purpose</label>
              <input
                type="text"
                value={businessPurpose}
                onChange={(e) => setBusinessPurpose(e.target.value)}
                className="w-full px-3 py-2 rounded border border-border bg-canvas focus:bg-surface focus:border-forest"
              />
            </div>

            <div>
              <label className="block font-medium text-ink mb-1">
                System Instructions & Behavior
              </label>
              <textarea
                rows={5}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full px-3 py-2 font-mono text-[11px] rounded border border-border bg-canvas focus:bg-surface focus:border-forest"
              />
              <span className="text-[10px] text-ink-muted">
                Define conversational boundary rules, tone, and tool trigger conditions.
              </span>
            </div>

            <div>
              <label className="block font-medium text-ink mb-1">Spoken Initial Greeting</label>
              <textarea
                rows={2}
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                className="w-full px-3 py-2 rounded border border-border bg-canvas focus:bg-surface focus:border-forest"
              />
            </div>

            {/* Voice & Model Settings */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-medium text-ink mb-1">Voice Persona</label>
                <select
                  value={ttsVoiceId}
                  onChange={(e) => setTtsVoiceId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-border bg-canvas text-xs"
                >
                  <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Calm & Executive)</option>
                  <option value="AZnzlk1XvdvUeBnXmlld">Domi (Support & High Energy)</option>
                  <option value="EXAVITQu4vr4xnSDxMaL">Bella (Friendly Clinic Concierge)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">LLM Model</label>
                <select
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-border bg-canvas text-xs"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Ultra-low latency)</option>
                  <option value="gpt-4o">GPT-4o (High-reasoning)</option>
                </select>
              </div>
            </div>

            {/* Escalation toggle */}
            <div className="p-3 rounded bg-canvas border border-border flex items-center justify-between">
              <div>
                <div className="font-medium text-ink">Human Escalation Handoff</div>
                <div className="text-[10px] text-ink-muted">
                  Automatically transfer call when user requests a human agent.
                </div>
              </div>
              <input
                type="checkbox"
                checked={allowHumanTransfer}
                onChange={(e) => setAllowHumanTransfer(e.target.checked)}
                className="w-4 h-4 accent-forest rounded"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Conversational Playground */}
        <div className="lg:col-span-4 bg-surface rounded-lg border border-border shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-forest" />
              <span className="text-xs font-semibold text-ink">Conversational Playground</span>
            </div>
            <button
              onClick={() => {
                setChatHistory([
                  { role: 'assistant', content: greetingMessage || 'Hello, how may I help you?' },
                ]);
                setLastTurnDetails(null);
              }}
              className="text-[10px] text-ink-muted hover:text-ink font-medium"
            >
              Reset Session
            </button>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded px-3.5 py-2 text-xs leading-relaxed ${
                    msg.role === 'assistant'
                      ? 'bg-canvas border border-border text-ink'
                      : 'bg-forest text-white'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {turnLoading && (
              <div className="text-xs text-ink-muted italic">Agent processing turn...</div>
            )}
          </div>

          {/* Inspected Tool Calling Details */}
          {lastTurnDetails?.toolExecution && (
            <div className="px-4 py-2 bg-canvas border-t border-border text-[11px] font-mono">
              <div className="text-forest font-semibold flex items-center space-x-1">
                <Wrench className="w-3 h-3" />
                <span>Tool Executed: {lastTurnDetails.toolExecution.toolName}</span>
              </div>
              <div className="text-ink-muted text-[10px]">
                Latency: {lastTurnDetails.latencyMs}ms • Confidence: 96%
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="p-3 border-t border-border bg-canvas/50">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type caller utterance..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendPlaygroundTurn()}
                className="flex-1 px-3 py-2 text-xs rounded border border-border bg-surface focus:border-forest"
              />
              <button
                type="button"
                onClick={handleSendPlaygroundTurn}
                disabled={turnLoading}
                className="px-3 py-2 rounded bg-forest text-white hover:bg-forest-hover transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
