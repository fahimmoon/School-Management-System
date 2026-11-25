'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(user, pass) {
    setUsername(user);
    setPassword(pass);
    setError('');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
            SZABIST Karachi Campus
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">
            School Management System
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to access your role portal
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin, teacher1, parent1"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:opacity-50"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Credential Fillers */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center mb-3">
            Quick Fill Seeded Demo Accounts:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin', 'admin123')}
              className="py-1.5 px-2 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo('teacher1', 'teacher123')}
              className="py-1.5 px-2 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => fillDemo('parent1', 'parent123')}
              className="py-1.5 px-2 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Parent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}