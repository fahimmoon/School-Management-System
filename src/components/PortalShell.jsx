'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function PortalShell({ allowedRole, title, navItems, children }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (allowedRole && user.role !== allowedRole) {
        router.push(`/${user.role.toLowerCase()}`);
      }
    }
  }, [user, loading, allowedRole, router]);

  if (loading || !user || (allowedRole && user.role !== allowedRole)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Loading Portal...
        </p>
      </div>
    );
  }

  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'U';

  const roleBadge = {
    ADMIN: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
    TEACHER: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    PARENT: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  }[user.role] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between bg-slate-950 text-white px-5 py-3.5 sticky top-0 z-30 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-extrabold text-sm">
            S
          </div>
          <span className="font-bold text-sm tracking-tight">{title}</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200"
        >
          {mobileMenuOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Left Navigation Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? 'flex' : 'hidden'
        } lg:flex lg:w-68 lg:shrink-0 bg-slate-950 text-white flex-col justify-between p-5 border-r border-slate-800/80 lg:sticky lg:top-0 lg:h-screen`}
      >
        <div>
          {/* Campus Brand */}
          <div className="flex items-center gap-3 pb-5 border-b border-slate-800/80">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-base shadow-lg shadow-indigo-600/20">
              S
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">
                SZABIST Karachi
              </span>
              <h2 className="text-sm font-bold text-white tracking-tight">{title}</h2>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="mt-6 space-y-6">
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Navigation
              </p>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                        active
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-200">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Account Footer */}
        <div className="pt-5 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800/90">
            <div className="h-9 w-9 rounded-lg bg-slate-800 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${roleBadge}`}
              >
                {user.role}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-rose-600 border border-slate-800 hover:border-rose-500 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Context Bar */}
        <header className="hidden lg:flex items-center justify-between bg-white border-b border-slate-200/80 px-8 py-3.5 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">School Management System</span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-800">{title}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-500">Academic Year 2026</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              System Online
            </span>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}