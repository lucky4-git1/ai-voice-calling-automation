'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatPhone } from '@/lib/utils';
import {
  Users,
  Plus,
  Upload,
  Search,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Tag,
  Building,
  Mail,
  Phone,
  FileSpreadsheet,
} from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // New Contact Form State
  const [phone, setPhone] = useState('+14155550299');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [consentSource, setConsentSource] = useState('Inbound Web Demo Form');

  // Import State
  const [csvConsentAffirmation, setCsvConsentAffirmation] = useState(false);
  const [importConsentSource, setImportConsentSource] = useState('Webinar Registrations');

  useEffect(() => {
    loadContacts();
  }, [search]);

  async function loadContacts() {
    try {
      const data = await api.get<any[]>(`/contacts${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setContacts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateContact(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/contacts', {
        phoneNumber: phone,
        name,
        email,
        company,
        consentStatus: 'EXPRESS',
        consentSource,
        tags: ['web-lead'],
      });
      setIsCreateOpen(false);
      setName('');
      setEmail('');
      setCompany('');
      loadContacts();
    } catch (err: any) {
      alert(err.message || 'Create contact failed');
    }
  }

  async function handleToggleDnc(contactId: string, currentSuppressed: boolean) {
    try {
      await api.patch(`/contacts/${contactId}/suppression`, {
        suppress: !currentSuppressed,
        reason: !currentSuppressed ? 'MANUAL_DNC_FLAG' : undefined,
      });
      loadContacts();
    } catch (e: any) {
      alert(e.message || 'Suppression update failed');
    }
  }

  async function handleBulkImport() {
    if (!csvConsentAffirmation) {
      alert('You must legally affirm that contacts have provided consent prior to import.');
      return;
    }

    try {
      const sampleContacts = [
        { phoneNumber: '+14155550181', name: 'Arthur Pendelton', company: 'Pendelton Financial', consentStatus: 'EXPRESS', consentSource: importConsentSource },
        { phoneNumber: '+12125550192', name: 'Samantha Wu', company: 'Empire Analytics', consentStatus: 'EXPRESS', consentSource: importConsentSource },
        { phoneNumber: '+13125550193', name: 'George Kelly', company: 'Midwest Freight', consentStatus: 'EXPRESS', consentSource: importConsentSource },
      ];

      await api.post('/contacts/import', {
        contacts: sampleContacts,
        defaultConsentSource: importConsentSource,
      });

      setIsImportOpen(false);
      setCsvConsentAffirmation(false);
      loadContacts();
    } catch (e: any) {
      alert(e.message || 'Import failed');
    }
  }

  if (isLoading) {
    return <div className="p-8 text-xs text-ink-muted">Loading Contacts Directory...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Contacts & Compliance Registry</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Maintain lawful calling records, consent audit trails, and Do-Not-Call (DNC) suppression lists.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium rounded bg-surface border border-border text-ink hover:bg-canvas transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium rounded bg-forest text-white hover:bg-forest-hover transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center space-x-3 bg-surface p-3 rounded-lg border border-border">
        <Search className="w-4 h-4 text-ink-muted shrink-0" />
        <input
          type="text"
          placeholder="Search by name, telephone number, company, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs bg-transparent border-none focus:outline-none text-ink placeholder:text-ink-muted"
        />
      </div>

      {/* Contacts Table */}
      <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs divide-y divide-border">
          <thead className="bg-canvas text-ink-muted font-medium">
            <tr>
              <th className="px-5 py-3">NAME & DETAILS</th>
              <th className="px-5 py-3 font-mono">PHONE NUMBER</th>
              <th className="px-5 py-3">COMPANY</th>
              <th className="px-5 py-3">CONSENT AUDIT</th>
              <th className="px-5 py-3">DNC STATUS</th>
              <th className="px-5 py-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-muted">
                  No contacts found matching criteria.
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id} className="hover:bg-canvas/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-ink">{c.name || 'Anonymous Contact'}</div>
                    <div className="text-[11px] text-ink-muted">{c.email || 'No email on record'}</div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-ink">
                    {formatPhone(c.phoneNumber)}
                  </td>
                  <td className="px-5 py-3.5 text-ink-muted">
                    {c.company || '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest-subtle text-forest font-medium">
                      {c.consentStatus}
                    </span>
                    <div className="text-[10px] text-ink-muted mt-0.5 truncate max-w-[180px]">
                      {c.consentSource || 'Direct Consent'}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {c.isDncSuppressed ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-danger-subtle text-danger font-mono">
                        <ShieldAlert className="w-3 h-3 mr-1" />
                        SUPPRESSED (DNC)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-canvas border border-border text-forest font-mono">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        ELIGIBLE
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleDnc(c.id, c.isDncSuppressed)}
                      className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
                        c.isDncSuppressed
                          ? 'border-border text-ink hover:bg-canvas'
                          : 'border-danger/30 text-danger hover:bg-danger-subtle'
                      }`}
                    >
                      {c.isDncSuppressed ? 'Lift DNC' : 'Suppress (DNC)'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Contact Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg border border-border shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-ink">Create Single Contact</h2>

            <form onSubmit={handleCreateContact} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-ink mb-1">Phone Number (E.164)</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-canvas focus:border-forest"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-canvas focus:border-forest"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-canvas focus:border-forest"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-canvas focus:border-forest"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Lawful Consent Source</label>
                <input
                  type="text"
                  required
                  value={consentSource}
                  onChange={(e) => setConsentSource(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-canvas focus:border-forest"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-2 rounded border border-border text-ink hover:bg-canvas"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-forest text-white hover:bg-forest-hover"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal with Consent Affirmation */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg border border-border shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-ink flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-forest" />
              <span>Bulk Contact Import</span>
            </h2>

            <p className="text-xs text-ink-muted leading-relaxed">
              Upload recipient telephone lists for outbound voice campaigns. Telephone numbers will be normalized to international E.164 format and checked against your suppression list.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-ink mb-1">Documented Consent Source</label>
                <input
                  type="text"
                  value={importConsentSource}
                  onChange={(e) => setImportConsentSource(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-canvas"
                />
              </div>

              <div className="p-3 bg-canvas rounded border border-border text-[11px] text-ink space-y-2">
                <div className="font-semibold text-forest">Required Compliance Affirmation:</div>
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={csvConsentAffirmation}
                    onChange={(e) => setCsvConsentAffirmation(e.target.checked)}
                    className="mt-0.5 accent-forest rounded"
                  />
                  <span className="leading-relaxed text-ink-muted">
                    I affirm under penalty of contract that all contacts imported have provided explicit express consent to receive telephone communications under applicable laws (TCPA, TRAI, GDPR, DPDP).
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="px-3 py-2 rounded border border-border text-ink hover:bg-canvas"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                disabled={!csvConsentAffirmation}
                className="px-4 py-2 rounded bg-forest text-white hover:bg-forest-hover disabled:opacity-50"
              >
                Execute Import (3 Seed Contacts)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
