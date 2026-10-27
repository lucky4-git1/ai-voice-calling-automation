'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Bot,
  Phone,
  Users,
  Megaphone,
  History,
  BookOpen,
  GitBranch,
  Plug,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Menu,
  X,
  Radio,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Agents', href: '/dashboard/agents', icon: Bot },
  { name: 'Phone Numbers', href: '/dashboard/phone-numbers', icon: Phone },
  { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
  { name: 'Call History', href: '/dashboard/calls', icon: History },
  { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: BookOpen },
  { name: 'Workflows', href: '/dashboard/workflows', icon: GitBranch },
  { name: 'Integrations', href: '/dashboard/integrations', icon: Plug },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Billing & Usage', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, activeOrg, organizations, switchOrg, logout } = useAuth();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas flex flex-col md:flex-row text-ink">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-forest text-white flex items-center justify-center font-bold text-xs">
            CA
          </div>
          <span className="font-semibold text-sm">CallAgent</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded border border-border text-ink"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-surface border-r border-border flex flex-col justify-between shrink-0 h-auto md:h-screen md:sticky md:top-0 z-40`}
      >
        <div>
          {/* Logo & Org Switcher */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                className="w-full flex items-center justify-between p-2 rounded border border-border hover:border-ink-muted text-left transition-colors bg-canvas"
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div className="w-7 h-7 rounded bg-forest text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {activeOrg?.name ? activeOrg.name.slice(0, 2).toUpperCase() : 'AP'}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-ink truncate leading-tight">
                      {activeOrg?.name || 'Apex Global Tech'}
                    </div>
                    <div className="text-[10px] text-ink-muted uppercase font-mono tracking-wider">
                      {activeOrg?.plan || 'STARTER'} • {activeOrg?.role || 'OWNER'}
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-ink-muted shrink-0 ml-1" />
              </button>

              {/* Org dropdown */}
              {isOrgDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded shadow-lg p-1 z-50">
                  <div className="text-[10px] font-mono uppercase text-ink-muted px-2 py-1">
                    Select Organization
                  </div>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        switchOrg(org.id);
                        setIsOrgDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center justify-between ${
                        org.id === activeOrg?.id ? 'bg-forest-subtle text-forest font-medium' : 'hover:bg-canvas'
                      }`}
                    >
                      <span className="truncate">{org.name}</span>
                      <span className="text-[10px] uppercase font-mono">{org.role}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-160px)]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-forest text-white shadow-sm'
                      : 'text-ink-muted hover:text-ink hover:bg-canvas'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & sign out */}
        <div className="p-3 border-t border-border bg-canvas">
          <div className="flex items-center justify-between">
            <div className="truncate mr-2">
              <div className="text-xs font-medium text-ink truncate">
                {user?.name || 'Alex Mercer'}
              </div>
              <div className="text-[10px] text-ink-muted truncate">
                {user?.email || 'alex.mercer@apexglobal.io'}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded text-ink-muted hover:text-danger hover:bg-danger-subtle transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Subtle Top Status Bar */}
        <header className="h-14 bg-surface border-b border-border px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-ink-muted">
            <span className="font-medium text-ink">CallAgent</span>
            <span>/</span>
            <span className="capitalize">
              {pathname === '/dashboard'
                ? 'Overview'
                : pathname.replace('/dashboard/', '').replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-forest bg-forest-subtle px-2.5 py-1 rounded border border-forest/20">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-medium">Telephony Engine Live</span>
            </div>

            <div className="text-xs font-mono text-ink-muted">
              Spend: <span className="text-ink font-semibold">$142.50</span> / $500.00
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-6 md:p-8 flex-1">{children}</div>
      </main>
    </div>
  );
}
