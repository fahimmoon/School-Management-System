'use client';

import { useState, useEffect } from 'react';
import PortalShell from '@/components/PortalShell';
import { apiRequest } from '@/lib/api';

const ADMIN_NAV = [{ label: 'Admin Dashboard', href: '/admin' }];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [circulars, setCirculars] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form States
  const [studentForm, setStudentForm] = useState({ rollNumber: '', fullName: '', classId: '', parentId: '' });
  const [linkForm, setLinkForm] = useState({ parentId: '', studentId: '' });
  const [userForm, setUserForm] = useState({ username: '', fullName: '', password: '', role: 'TEACHER' });
  const [classForm, setClassForm] = useState({ name: '', teacherId: '' });
  const [feeForm, setFeeForm] = useState({ studentId: '', title: '', totalAmount: '', paidAmount: '0', dueDate: '' });
  const [circularForm, setCircularForm] = useState({ title: '', body: '', type: 'CIRCULAR', eventDate: '' });

  async function loadAllData() {
    try {
      const [u, c, s, f, circ] = await Promise.all([
        apiRequest('/admin/users'),
        apiRequest('/admin/classes'),
        apiRequest('/admin/students'),
        apiRequest('/admin/billing'),
        apiRequest('/admin/circulars'),
      ]);
      setUsers(u);
      setClasses(c);
      setStudents(s);
      setFees(f);
      setCirculars(circ);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  function notify(msg) {
    setError('');
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    try {
      await apiRequest('/admin/students', { method: 'POST', body: JSON.stringify(studentForm) });
      setStudentForm({ rollNumber: '', fullName: '', classId: '', parentId: '' });
      notify('Student enrolled successfully.');
      loadAllData();
    } catch (err) { setError(err.message); }
  }

  async function handleLinkChild(e) {
    e.preventDefault();
    try {
      await apiRequest('/admin/link-child', { method: 'POST', body: JSON.stringify(linkForm) });
      setLinkForm({ parentId: '', studentId: '' });
      notify('Parent linked to child account.');
      loadAllData();
    } catch (err) { setError(err.message); }
  }

  async function handleDeleteStudent(id) {
    if (!window.confirm('Remove this student record?')) return;
    try {
      await apiRequest(`/admin/students/${id}`, { method: 'DELETE' });
      notify('Student removed.');
      loadAllData();
    } catch (err) { setError(err.message); }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    try {
      await apiRequest('/admin/users', { method: 'POST', body: JSON.stringify(userForm) });
      setUserForm({ username: '', fullName: '', password: '', role: 'TEACHER' });
      notify('Portal user account created.');
      loadAllData();
    } catch (err) { setError(err.message); }
  }

  async function handleAddClass(e) {
    e.preventDefault();
    try {
      await apiRequest('/admin/classes', { method: 'POST', body: JSON.stringify(classForm) });
      setClassForm({ name: '', teacherId: '' });
      notify('Class created.');
      loadAllData();
    } catch (err) { setError(err.message); }
  }

  async function handleAddFee(e) {
    e.preventDefault();
    try {
      await apiRequest('/admin/billing', { method: 'POST', body: JSON.stringify(feeForm) });
      setFeeForm({ studentId: '', title: '', totalAmount: '', paidAmount: '0', dueDate: '' });
      notify('Fee voucher issued.');
      loadAllData();
    } catch (err) { setError(err.message); }
  }

  async function handleRecordPayment(feeId, remainingDue) {
    const input = window.prompt(`Enter payment amount in PKR (Remaining due: ${remainingDue}):`, String(remainingDue));
    if (!input || isNaN(Number(input)) || Number(input) <= 0) return;
    try {
      await apiRequest(`/admin/billing/${feeId}/pay`, {
        method: 'PATCH',
        body: JSON.stringify({ amount: Number(input) }),
      });
      notify('Payment recorded and balance updated.');
      loadAllData();
    } catch (err) { setError(err.message); }
  }

  async function handleAddCircular(e) {
    e.preventDefault();
    try {
      await apiRequest('/admin/circulars', { method: 'POST', body: JSON.stringify(circularForm) });
      setCircularForm({ title: '', body: '', type: 'CIRCULAR', eventDate: '' });
      notify('Circular published to Parent Portal.');
      loadAllData();
    } catch (err) { setError(err.message); }
  }

  const parents = users.filter((u) => u.role === 'PARENT');
  const teachers = users.filter((u) => u.role === 'TEACHER');
  const totalPendingDues = fees.reduce((sum, f) => sum + (f.totalAmount - f.paidAmount), 0);

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.class?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition';
  const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5';

  return (
    <PortalShell allowedRole="ADMIN" title="Administrator Portal" navItems={ADMIN_NAV}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administration Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Centralized control for student enrollment, multi-child family links, billing, and announcements
          </p>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Students</span>
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">{students.length}</p>
          <p className="text-xs text-slate-500 mt-1">Enrolled in {classes.length} classes</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faculty</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">{teachers.length}</p>
          <p className="text-xs text-slate-500 mt-1">Active teaching staff</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Parents</span>
            <span className="h-2 w-2 rounded-full bg-sky-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">{parents.length}</p>
          <p className="text-xs text-slate-500 mt-1">Linked family accounts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Dues</span>
            <span className="h-2 w-2 rounded-full bg-rose-500" />
          </div>
          <p className="text-3xl font-extrabold text-rose-600 mt-2 tabular-nums">
            PKR {totalPendingDues.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">Across {fees.length} vouchers</p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          {message}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-rose-600" />
          {error}
        </div>
      )}

      {/* Workspace Switcher Tabs */}
      <div className="border-b border-slate-200 mb-8 flex flex-wrap gap-6">
        {[
          { id: 'students', label: 'Students & Family Links' },
          { id: 'users_classes', label: 'Users & Academic Classes' },
          { id: 'billing', label: 'Fee Billing & Vouchers' },
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

      {/* TAB 1: STUDENTS & MULTI-CHILD LINKS (Split 4/8 Grid) */}
      {activeTab === 'students' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Forms */}
          <div className="lg:col-span-4 space-y-6">
            <form onSubmit={handleAddStudent} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Enroll Student</h3>
                <p className="text-xs text-slate-500 mt-0.5">Register student & assign class</p>
              </div>
              <div>
                <label className={labelClass}>Roll Number</label>
                <input required placeholder="e.g. SMS-103" value={studentForm.rollNumber} onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Full Name</label>
                <input required placeholder="e.g. Hamza Tariq" value={studentForm.fullName} onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Class</label>
                <select required value={studentForm.classId} onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })} className={inputClass}>
                  <option value="">Select Class...</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Primary Parent (Optional)</label>
                <select value={studentForm.parentId} onChange={(e) => setStudentForm({ ...studentForm, parentId: e.target.value })} className={inputClass}>
                  <option value="">Select Parent...</option>
                  {parents.map((p) => <option key={p.id} value={p.id}>{p.fullName} (@{p.username})</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer">
                Enroll Student
              </button>
            </form>

            <form onSubmit={handleLinkChild} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Link Sibling to Parent (FR2)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Connect multiple children to one parent login</p>
              </div>
              <div>
                <label className={labelClass}>Parent Account</label>
                <select required value={linkForm.parentId} onChange={(e) => setLinkForm({ ...linkForm, parentId: e.target.value })} className={inputClass}>
                  <option value="">Select Parent...</option>
                  {parents.map((p) => <option key={p.id} value={p.id}>{p.fullName} (@{p.username})</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Student</label>
                <select required value={linkForm.studentId} onChange={(e) => setLinkForm({ ...linkForm, studentId: e.target.value })} className={inputClass}>
                  <option value="">Select Child...</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.fullName} ({s.rollNumber})</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer">
                Link Child Account
              </button>
            </form>
          </div>

          {/* Right Column: Searchable Directory */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Student Directory</h3>
                <p className="text-xs text-slate-500">{filteredStudents.length} student(s) shown</p>
              </div>
              <input
                type="text"
                placeholder="Search name, roll #, or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sm:w-64 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Roll #</th>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Class</th>
                    <th className="px-5 py-3.5">Linked Parent(s)</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-bold text-indigo-600 tabular-nums">{s.rollNumber}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{s.fullName}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                          {s.class?.name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {s.parents.length > 0 ? (
                          s.parents.map((p) => p.parent.fullName).join(', ')
                        ) : (
                          <span className="text-slate-400 italic">Not linked</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteStudent(s.id)}
                          className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS & CLASSES */}
      {activeTab === 'users_classes' && (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            <form onSubmit={handleAddUser} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Create Portal User</h3>
              <div>
                <label className={labelClass}>Full Name</label>
                <input required placeholder="e.g. Ayesha Khan" value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} className={inputClass} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Username</label>
                  <input required placeholder="e.g. teacher2" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Password</label>
                  <input required type="password" placeholder="••••••••" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className={inputClass}>
                  <option value="TEACHER">Teacher (Faculty)</option>
                  <option value="PARENT">Parent (Family Portal)</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer">
                Create User Account
              </button>
            </form>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h4 className="font-bold text-sm text-slate-900 mb-4">Registered Accounts ({users.length})</h4>
              <div className="divide-y divide-slate-100">
                {users.map((u) => (
                  <div key={u.id} className="flex justify-between items-center py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{u.fullName}</p>
                      <p className="text-xs text-slate-400">@{u.username}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 text-[10px] rounded-lg font-bold tracking-wider ${
                        u.role === 'ADMIN'
                          ? 'bg-indigo-50 text-indigo-700'
                          : u.role === 'TEACHER'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <form onSubmit={handleAddClass} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Create Academic Class</h3>
              <div>
                <label className={labelClass}>Class Name</label>
                <input required placeholder="e.g. Grade 9-B" value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Assigned Faculty</label>
                <select value={classForm.teacherId} onChange={(e) => setClassForm({ ...classForm, teacherId: e.target.value })} className={inputClass}>
                  <option value="">Select Teacher...</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer">
                Create Class
              </button>
            </form>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h4 className="font-bold text-sm text-slate-900 mb-4">Active Classes ({classes.length})</h4>
              <div className="divide-y divide-slate-100">
                {classes.map((c) => (
                  <div key={c.id} className="flex justify-between items-center py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">Faculty: {c.teacher?.fullName || 'Unassigned'}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 tabular-nums">
                      {c.students.length} student(s)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BILLING & FEES (Split 4/8 Grid) */}
      {activeTab === 'billing' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleAddFee} className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Issue Fee Voucher</h3>
              <p className="text-xs text-slate-500 mt-0.5">Generate term tuition or exam billing</p>
            </div>
            <div>
              <label className={labelClass}>Student</label>
              <select required value={feeForm.studentId} onChange={(e) => setFeeForm({ ...feeForm, studentId: e.target.value })} className={inputClass}>
                <option value="">Select Student...</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.fullName} ({s.rollNumber})</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Voucher Title</label>
              <input required placeholder="e.g. Term 3 Tuition Fee" value={feeForm.title} onChange={(e) => setFeeForm({ ...feeForm, title: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Amount (PKR)</label>
                <input required type="number" placeholder="25000" value={feeForm.totalAmount} onChange={(e) => setFeeForm({ ...feeForm, totalAmount: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Due Date</label>
                <input required type="date" value={feeForm.dueDate} onChange={(e) => setFeeForm({ ...feeForm, dueDate: e.target.value })} className={inputClass} />
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer">
              Generate Voucher
            </button>
          </form>

          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Fee Ledger</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Voucher</th>
                    <th className="px-5 py-3.5">Total</th>
                    <th className="px-5 py-3.5">Paid</th>
                    <th className="px-5 py-3.5">Balance</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {fees.map((f) => {
                    const due = f.totalAmount - f.paidAmount;
                    return (
                      <tr key={f.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5 font-semibold text-slate-900">{f.student?.fullName}</td>
                        <td className="px-5 py-3.5 text-slate-600">{f.title}</td>
                        <td className="px-5 py-3.5">{f.totalAmount.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-emerald-600 font-semibold">{f.paidAmount.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-rose-600 font-bold">{due.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-right">
                          {due > 0 ? (
                            <button
                              onClick={() => handleRecordPayment(f.id, due)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
                            >
                              Record Payment
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                              Settled
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
        </div>
      )}

      {/* TAB 4: CIRCULARS & EVENTS (Split 4/8 Grid) */}
      {activeTab === 'circulars' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleAddCircular} className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Publish Notice</h3>
              <p className="text-xs text-slate-500 mt-0.5">Broadcast to all Parent Portals</p>
            </div>
            <div>
              <label className={labelClass}>Title</label>
              <input required placeholder="e.g. Annual Science Exhibition" value={circularForm.title} onChange={(e) => setCircularForm({ ...circularForm, title: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Category</label>
                <select value={circularForm.type} onChange={(e) => setCircularForm({ ...circularForm, type: e.target.value })} className={inputClass}>
                  <option value="CIRCULAR">Circular</option>
                  <option value="EVENT">Event</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input type="date" value={circularForm.eventDate} onChange={(e) => setCircularForm({ ...circularForm, eventDate: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Message</label>
              <textarea required rows={4} placeholder="Write announcement details..." value={circularForm.body} onChange={(e) => setCircularForm({ ...circularForm, body: e.target.value })} className={inputClass} />
            </div>
            <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer">
              Publish Notice
            </button>
          </form>

          <div className="lg:col-span-8 space-y-4">
            {circulars.map((c) => (
              <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex justify-between items-center mb-2">
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
        </div>
      )}
    </PortalShell>
  );
}