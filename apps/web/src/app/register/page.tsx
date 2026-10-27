'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(name, email, password, organizationName);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
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
          Create an enterprise account
        </h2>
        <p className="mt-2 text-xs text-ink-muted">
          Includes 300 free test minutes and instant dev sandbox telephony
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
                Your Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Eleanor Vance"
                className="w-full px-3 py-2 text-sm rounded border border-border bg-canvas focus:bg-surface focus:border-forest transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Organization / Company Name
              </label>
              <input
                type="text"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Acme Global Logistics"
                className="w-full px-3 py-2 text-sm rounded border border-border bg-canvas focus:bg-surface focus:border-forest transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eleanor@acme.com"
                className="w-full px-3 py-2 text-sm rounded border border-border bg-canvas focus:bg-surface focus:border-forest transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Password (min 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
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
              <span>{isLoading ? 'Creating Account...' : 'Continue to Onboarding'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-forest hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
