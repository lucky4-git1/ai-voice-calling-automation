'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  GitBranch,
  Play,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  Ear,
  Split,
  Wrench,
  PhoneForwarded,
  Square,
  Sparkles,
} from 'lucide-react';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // Simulation execution state
  const [simMessage, setSimMessage] = useState('I want to schedule an appointment');
  const [simTrace, setSimTrace] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  async function loadWorkflows() {
    try {
      const data = await api.get<any[]>('/workflows');
      setWorkflows(data || []);
      if (data && data.length > 0) {
        selectWorkflow(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  function selectWorkflow(w: any) {
    setSelectedWorkflow(w);
    const def = w.latestVersion?.definition || { nodes: [], edges: [] };
    setNodes(def.nodes || []);
    setEdges(def.edges || []);
    setSelectedNode(def.nodes?.[0] || null);
    setSimTrace([]);
  }

  async function handleSaveWorkflow() {
    if (!selectedWorkflow) return;
    try {
      await api.post(`/workflows/${selectedWorkflow.id}/definition`, {
        definition: { nodes, edges },
        publish: true,
      });
      alert('Workflow published successfully! All branches and tool triggers are validated.');
      loadWorkflows();
    } catch (err: any) {
      alert(err.message || 'Save failed');
    }
  }

  async function handleSimulateExecution() {
    if (!selectedWorkflow) return;
    setIsSimulating(true);
    try {
      const res: any = await api.post(`/workflows/${selectedWorkflow.id}/simulate`, {
        message: simMessage,
      });
      setSimTrace(res.traceLog || []);
    } catch (e: any) {
      alert(e.message || 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  }

  function handleAddNode(type: string) {
    const newId = `node_${Date.now()}`;
    const newNode = {
      id: newId,
      type,
      label: type.replace('_', ' '),
      position: { x: 300, y: 150 },
      data: type === 'SPEAK' ? { message: 'Thank you for reaching out.' } : {},
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode);
  }

  function handleDeleteNode(id: string) {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
    if (selectedNode?.id === id) setSelectedNode(null);
  }

  if (isLoading) {
    return <div className="p-8 text-xs text-ink-muted">Loading Workflows...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Visual Workflow Engine</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Design multi-step call routing, branch conditions, tool executions, and transfer escalations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleSaveWorkflow}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium rounded bg-forest text-white hover:bg-forest-hover transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Publish Flow Version</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Node Toolbox & Graph View */}
        <div className="lg:col-span-8 bg-surface rounded-lg border border-border shadow-sm p-6 space-y-6">
          {/* Node palette toolbar */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <span className="text-xs font-semibold text-ink">Add Node to Canvas:</span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handleAddNode('SPEAK')}
                className="px-2.5 py-1 text-[11px] rounded bg-canvas border border-border text-ink hover:border-forest flex items-center space-x-1"
              >
                <MessageSquare className="w-3 h-3 text-forest" />
                <span>Speak</span>
              </button>
              <button
                onClick={() => handleAddNode('LISTEN')}
                className="px-2.5 py-1 text-[11px] rounded bg-canvas border border-border text-ink hover:border-forest flex items-center space-x-1"
              >
                <Ear className="w-3 h-3 text-forest" />
                <span>Listen</span>
              </button>
              <button
                onClick={() => handleAddNode('BRANCH_CONDITION')}
                className="px-2.5 py-1 text-[11px] rounded bg-canvas border border-border text-ink hover:border-forest flex items-center space-x-1"
              >
                <Split className="w-3 h-3 text-forest" />
                <span>Branch</span>
              </button>
              <button
                onClick={() => handleAddNode('CALL_TOOL')}
                className="px-2.5 py-1 text-[11px] rounded bg-canvas border border-border text-ink hover:border-forest flex items-center space-x-1"
              >
                <Wrench className="w-3 h-3 text-forest" />
                <span>Tool</span>
              </button>
              <button
                onClick={() => handleAddNode('TRANSFER_HUMAN')}
                className="px-2.5 py-1 text-[11px] rounded bg-canvas border border-border text-ink hover:border-forest flex items-center space-x-1"
              >
                <PhoneForwarded className="w-3 h-3 text-forest" />
                <span>Transfer</span>
              </button>
            </div>
          </div>

          {/* Visual Node Flow Layout */}
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase text-ink-muted">Executed Node Pipeline</div>

            <div className="space-y-2">
              {nodes.map((node, index) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-forest bg-forest-subtle/30 ring-1 ring-forest'
                        : 'border-border bg-canvas hover:border-ink-muted'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded bg-surface border border-border flex items-center justify-center font-mono text-[11px] font-bold text-ink">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-ink">{node.label}</div>
                        <div className="text-[10px] text-ink-muted font-mono">
                          Type: {node.type} • ID: {node.id}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {node.type !== 'START' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNode(node.id);
                          }}
                          className="p-1 text-ink-muted hover:text-danger"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Node Inspector & Simulation Trace */}
        <div className="lg:col-span-4 space-y-6">
          {/* Selected Node Properties */}
          {selectedNode && (
            <div className="bg-surface rounded-lg border border-border shadow-sm p-5 space-y-3 text-xs">
              <h3 className="font-semibold text-ink">Node Configuration: {selectedNode.label}</h3>

              <div>
                <label className="block text-[11px] text-ink-muted mb-1">Node Label</label>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) => {
                    const updated = { ...selectedNode, label: e.target.value };
                    setSelectedNode(updated);
                    setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
                  }}
                  className="w-full px-3 py-1.5 rounded border border-border bg-canvas"
                />
              </div>

              {selectedNode.type === 'SPEAK' && (
                <div>
                  <label className="block text-[11px] text-ink-muted mb-1">Spoken Content</label>
                  <textarea
                    rows={3}
                    value={selectedNode.data?.message || ''}
                    onChange={(e) => {
                      const updated = { ...selectedNode, data: { ...selectedNode.data, message: e.target.value } };
                      setSelectedNode(updated);
                      setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
                    }}
                    className="w-full px-3 py-1.5 rounded border border-border bg-canvas"
                  />
                </div>
              )}
            </div>
          )}

          {/* Test Workflow Interpreter */}
          <div className="bg-surface rounded-lg border border-border shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-semibold text-ink flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-forest" />
              <span>Simulate Flow Execution</span>
            </h3>

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Caller input utterance..."
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded border border-border bg-canvas"
              />
              <button
                type="button"
                onClick={handleSimulateExecution}
                disabled={isSimulating}
                className="px-3 py-1.5 text-xs font-medium rounded bg-forest text-white hover:bg-forest-hover"
              >
                Run Trace
              </button>
            </div>

            {simTrace.length > 0 && (
              <div className="pt-2 space-y-1.5">
                <div className="text-[10px] font-mono text-ink-muted uppercase">Execution Trace Log:</div>
                <div className="max-h-60 overflow-y-auto space-y-1 text-[11px] font-mono">
                  {simTrace.map((t, idx) => (
                    <div key={idx} className="p-2 bg-canvas rounded border border-border">
                      <div className="text-forest font-semibold">Step {t.step}: {t.label}</div>
                      <div className="text-ink-muted text-[10px]">{t.actionResult}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
