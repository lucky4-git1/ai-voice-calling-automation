'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  BookOpen,
  Plus,
  Upload,
  Search,
  FileText,
  Layers,
  Trash2,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

export default function KnowledgeBasePage() {
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);
  const [selectedKb, setSelectedKb] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);

  // Ingestion Form State
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [sourceType, setSourceType] = useState('TEXT');

  // Search Tester State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  async function loadKnowledgeBases() {
    try {
      const data = await api.get<any[]>('/knowledge/bases');
      setKnowledgeBases(data || []);
      if (data && data.length > 0) {
        loadKbDetail(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadKbDetail(kbId: string) {
    try {
      const kb = await api.get<any>(`/knowledge/bases/${kbId}`);
      setSelectedKb(kb);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleIngestDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedKb) return;

    try {
      await api.post(`/knowledge/bases/${selectedKb.id}/documents`, {
        title: docTitle,
        sourceType,
        content: docContent,
      });

      setIsAddDocOpen(false);
      setDocTitle('');
      setDocContent('');
      loadKbDetail(selectedKb.id);
    } catch (err: any) {
      alert(err.message || 'Ingestion failed');
    }
  }

  async function handleTestSearch() {
    if (!searchQuery.trim() || !selectedKb) return;
    setIsSearching(true);
    try {
      const res: any = await api.get(`/knowledge/bases/${selectedKb.id}/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleDeleteDoc(docId: string) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/knowledge/documents/${docId}`);
      if (selectedKb) loadKbDetail(selectedKb.id);
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    }
  }

  if (isLoading) {
    return <div className="p-8 text-xs text-ink-muted">Loading Knowledge Bases...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Title & Ingest Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Knowledge Base & Retrieval</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Ingest corporate FAQs, clinic policies, and SLAs into vector embeddings for grounded AI call responses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddDocOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium rounded bg-forest text-white hover:bg-forest-hover transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Ingest Document</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Documents list */}
        <div className="lg:col-span-7 bg-surface rounded-lg border border-border shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                {selectedKb?.name || 'Enterprise Knowledge Base'}
              </h2>
              <div className="text-[11px] text-ink-muted">
                Embedding Model: text-embedding-3-small • {selectedKb?.documents?.length || 0} Ingested Documents
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {selectedKb?.documents?.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-muted">
                No documents ingested yet. Upload text or markdown files to ground agent answers.
              </div>
            ) : (
              selectedKb?.documents?.map((doc: any) => (
                <div key={doc.id} className="p-4 rounded-lg bg-canvas border border-border flex items-start justify-between">
                  <div className="space-y-1 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-forest shrink-0" />
                      <span className="font-semibold text-xs text-ink">{doc.title}</span>
                    </div>
                    <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed">
                      {doc.originalContent}
                    </p>
                    <div className="text-[10px] font-mono text-forest">
                      {doc.chunkCount} Vector Chunks Created • Status: {doc.status}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="p-1 rounded text-ink-muted hover:text-danger"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Live Semantic Retrieval Search Simulator */}
        <div className="lg:col-span-5 bg-surface rounded-lg border border-border shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-ink flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-forest" />
              <span>Semantic Retrieval Playground</span>
            </h3>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Test queries against your knowledge embeddings to inspect what context agents retrieve during calls.
            </p>
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="e.g. What is your cancellation policy?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestSearch()}
              className="flex-1 px-3 py-2 text-xs rounded border border-border bg-canvas focus:border-forest"
            />
            <button
              type="button"
              onClick={handleTestSearch}
              disabled={isSearching}
              className="px-3.5 py-2 text-xs font-medium rounded bg-forest text-white hover:bg-forest-hover disabled:opacity-50"
            >
              Search
            </button>
          </div>

          {/* Results list */}
          <div className="space-y-2 pt-2">
            {searchResults.length === 0 ? (
              <div className="p-4 bg-canvas rounded border border-border text-[11px] text-ink-muted text-center">
                Enter a query and run search to test vector similarity retrieval.
              </div>
            ) : (
              searchResults.map((res: any, idx: number) => (
                <div key={idx} className="p-3 bg-canvas rounded border border-border text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-semibold text-forest">{res.documentTitle}</span>
                    <span className="text-ink-muted">Cosine: {res.similarityScore}</span>
                  </div>
                  <p className="text-[11px] text-ink leading-relaxed">
                    &quot;{res.content}&quot;
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ingest Document Modal */}
      {isAddDocOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg border border-border shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-ink">Ingest Knowledge Document</h2>

            <form onSubmit={handleIngestDoc} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-ink mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clinic Appointment & Cancellation Policy"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-canvas focus:border-forest"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Document Content (Text / Markdown)</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Paste guidelines, FAQs, pricing rules, or business hours..."
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-[11px] rounded border border-border bg-canvas focus:border-forest"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddDocOpen(false)}
                  className="px-3 py-2 rounded border border-border text-ink hover:bg-canvas"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-forest text-white hover:bg-forest-hover"
                >
                  Ingest & Generate Chunks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
