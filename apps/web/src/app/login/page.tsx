'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, AlertCircle, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('alex.mercer@apexglobal.io');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="w-8 h-8 rounded bg-forest flex items-center justify-center text-white font-semibold text-sm">
            CA
          </div>
          <span className="font-semibold text-xl tracking-tight text-ink">CallAgent</span>
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-ink">
          Sign in to your organization
        </h2>
        <p className="mt-2 text-xs text-ink-muted">
          Enterprise conversational voice management platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 sm:px-8 rounded-lg border border-border shadow-sm">
          {error && (
            <div className="mb-6 p-3 rounded bg-danger-subtle border border-danger/20 text-xs text-danger flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3 py-2 text-sm rounded border border-border bg-canvas focus:bg-surface focus:border-forest transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-ink">
                  Password
                </label>
                <a href="#" className="text-xs text-forest hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border border-border bg-canvas focus:bg-surface focus:border-forest transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded bg-forest text-white text-sm font-medium hover:bg-forest-hover transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-xs text-ink-muted mb-2 font-medium">Quick Demo Accounts:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoCredentials('alex.mercer@apexglobal.io')}
                className="p-2 text-left rounded bg-canvas border border-border hover:border-forest transition-colors"
              >
                <div className="font-medium text-ink">Alex Mercer</div>
                <div className="text-[10px] text-forest">Owner (Apex Global)</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('sarah.chen@apexglobal.io')}
                className="p-2 text-left rounded bg-canvas border border-border hover:border-forest transition-colors"
              >
                <div className="font-medium text-ink">Sarah Chen</div>
                <div className="text-[10px] text-forest">Admin (Apex Global)</div>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Need an account?{' '}
          <Link href="/register" className="font-medium text-forest hover:underline">
            Register your organization
          </Link>
        </p>
      </div>
    </div>
  );
}
