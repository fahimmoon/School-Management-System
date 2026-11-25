'use client';

import { useState, useEffect } from 'react';
import PortalShell from '@/components/PortalShell';
import { apiRequest } from '@/lib/api';

export default function ParentDashboardPage() {
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [childData, setChildData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [circulars, setCirculars] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOverview() {
      try {
        const data = await apiRequest('/parent/overview');
        setChildrenList(data.children);
        setNotifications(data.notifications);
        setCirculars(data.circulars);

        if (data.children.length > 0) {
          setSelectedChildId(data.children[0].id);
        }
      } catch (err) {
        setError(err.message);
      }
    }
    loadOverview();
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;

    async function loadChildDashboard() {
      try {
        setError('');
        const data = await apiRequest(`/parent/children/${selectedChildId}/dashboard`);
        setChildData(data.student);
      } catch (err) {
        setError(err.message);
      }
    }
    loadChildDashboard();
  }, [selectedChildId]);

  async function handleMarkNotificationsRead() {
    try {
      await apiRequest('/parent/notifications/read', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      setError(err.message);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalDays = childData?.attendances?.length || 0;
  const presentDays = childData?.attendances?.filter((a) => a.status === 'PRESENT').length || 0;
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
  const totalDues = childData?.fees?.reduce((sum, f) => sum + (f.totalAmount - f.paidAmount), 0) || 0;

  const PARENT_NAV = [
    { label: 'Family Overview', href: '/parent', badge: unreadCount },
  ];

  return (
    <PortalShell allowedRole="PARENT" title="Parent Portal" navItems={PARENT_NAV}>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Family Academic Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select a child profile to inspect daily attendance, exam scores, homework alerts, and fee status
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Multi-Child Selector Strip */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Linked Children ({childrenList.length})
          </span>
          {childData?.class?.teacher?.fullName && (
            <span className="text-xs text-slate-500">
              Class Teacher: <strong className="text-slate-700">{childData.class.teacher.fullName}</strong>
            </span>
          )}
        </div>

        {childrenList.length === 0 ? (
          <p className="text-sm text-slate-500">No children are currently linked to your account.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {childrenList.map((child) => {
              const isSelected = child.id === selectedChildId;
              return (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`p-4 rounded-xl border text-left transition flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/15'
                      : 'bg-slate-50 text-slate-900 border-slate-200 hover:bg-white hover:border-indigo-300'
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-xl font-extrabold text-sm flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {child.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{child.fullName}</p>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {child.rollNumber} • {child.class?.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* KPI Summary Cards */}
      {childData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance</span>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2 tabular-nums">
              {totalDays > 0 ? `${attendancePct}%` : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-1">{presentDays} of {totalDays} days present</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assessments</span>
            <p className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">{childData.results.length}</p>
            <p className="text-xs text-slate-500 mt-1">Published exam scores</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fee Balance</span>
            <p className={`text-3xl font-extrabold mt-2 tabular-nums ${totalDues > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              PKR {totalDues.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">Remaining term dues</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Homework Alerts</span>
            <p className="text-3xl font-extrabold text-indigo-600 mt-2 tabular-nums">{unreadCount}</p>
            <p className="text-xs text-slate-500 mt-1">Unread notifications</p>
          </div>
        </div>
      )}

      {/* Workspace Tabs */}
      <div className="border-b border-slate-200 mb-8 flex flex-wrap gap-6">
        {[
          { id: 'overview', label: 'Attendance & Exam Results' },
          { id: 'homework', label: `Homework & Alerts (${unreadCount})` },
          { id: 'fees', label: 'Fee Vouchers & Dues' },
          { id: 'circulars', label: 'Circulars & Events' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3.5 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ATTENDANCE & RESULTS */}
      {activeTab === 'overview' && childData && (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Attendance History — {childData.fullName}
            </h3>
            {childData.attendances.length === 0 ? (
              <p className="text-sm text-slate-500">No attendance records logged yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {childData.attendances.map((a) => (
                  <div key={a.id} className="py-3 flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-700 tabular-nums">{a.date}</span>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        a.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Assessment Results — {childData.fullName}
            </h3>
            {childData.results.length === 0 ? (
              <p className="text-sm text-slate-500">No exam marks published yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {childData.results.map((r) => (
                  <div key={r.id} className="py-3 flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-800">{r.examTitle}</span>
                    <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs tabular-nums">
                      {r.marks} / {r.totalMarks}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HOMEWORK & NOTIFICATIONS */}
      {activeTab === 'homework' && childData && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Assigned Homework — {childData.class?.name}
            </h3>
            {childData.class?.homeworks?.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-sm text-slate-500">
                No homework assigned for {childData.class?.name} yet.
              </div>
            ) : (
              childData.class.homeworks.map((hw) => (
                <div key={hw.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-bold text-slate-900 text-base">{hw.title}</h4>
                    <span className="shrink-0 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                      Due: {hw.dueDate}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{hw.description}</p>
                  {hw.fileUrl && (
                    <a
                      href={hw.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-3 text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Open Attachment →
                    </a>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900">Homework Alerts</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkNotificationsRead}
                  className="px-3 py-1 rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                >
                  Mark All Read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500">No homework notifications received yet.</p>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-xl border text-sm ${
                      n.isRead
                        ? 'bg-slate-50 border-slate-200/80 text-slate-600'
                        : 'bg-indigo-50/80 border-indigo-200 text-slate-900 font-semibold'
                    }`}
                  >
                    {n.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FEE STATUS & DUES */}
      {activeTab === 'fees' && childData && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Fee Voucher</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Total (PKR)</th>
                  <th className="px-6 py-3.5">Paid (PKR)</th>
                  <th className="px-6 py-3.5">Remaining Dues</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {childData.fees.map((f) => {
                  const due = f.totalAmount - f.paidAmount;
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">{f.title}</td>
                      <td className="px-6 py-4 text-slate-600">{f.dueDate}</td>
                      <td className="px-6 py-4 font-medium">{f.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 font-semibold text-emerald-600">{f.paidAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-rose-600">{due.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        {due === 0 ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Paid
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Due
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SCHOOL CIRCULARS & EVENTS */}
      {activeTab === 'circulars' && (
        <div className="grid md:grid-cols-2 gap-5">
          {circulars.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex justify-between items-center mb-2.5">
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700">
                  {c.type}
                </span>
                {c.eventDate && <span className="text-xs font-medium text-slate-400">Date: {c.eventDate}</span>}
              </div>
              <h4 className="font-bold text-slate-900 text-base">{c.title}</h4>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  );
}