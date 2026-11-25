'use client';

import { useState, useEffect } from 'react';
import PortalShell from '@/components/PortalShell';
import { apiRequest } from '@/lib/api';

const TEACHER_NAV = [
  { label: 'Faculty Workspace', href: '/teacher' },
];

export default function TeacherDashboardPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [activeTab, setActiveTab] = useState('attendance');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({});

  // Results State
  const [examTitle, setExamTitle] = useState('');
  const [totalMarks, setTotalMarks] = useState('100');
  const [marksMap, setMarksMap] = useState({});
  const [existingResults, setExistingResults] = useState([]);

  // Homework State
  const [hwForm, setHwForm] = useState({ title: '', description: '', dueDate: '', fileUrl: '' });
  const [existingHomework, setExistingHomework] = useState([]);

  function notify(msg) {
    setError('');
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  }

  useEffect(() => {
    async function loadClasses() {
      try {
        const data = await apiRequest('/teacher/my-classes');
        setClasses(data);
        if (data.length > 0) {
          setSelectedClassId(String(data[0].id));
        }
      } catch (err) {
        setError(err.message);
      }
    }
    loadClasses();
  }, []);

  const currentClass = classes.find((c) => String(c.id) === String(selectedClassId));

  useEffect(() => {
    if (!currentClass) return;

    const defaultAtt = {};
    const defaultMarks = {};
    currentClass.students.forEach((s) => {
      defaultAtt[s.id] = 'PRESENT';
      defaultMarks[s.id] = '';
    });
    setMarksMap(defaultMarks);

    async function loadClassDetails() {
      try {
        const [attRecords, results, homeworks] = await Promise.all([
          apiRequest(`/teacher/classes/${currentClass.id}/attendance?date=${attendanceDate}`),
          apiRequest(`/teacher/classes/${currentClass.id}/results`),
          apiRequest(`/teacher/classes/${currentClass.id}/homework`),
        ]);

        const mergedAtt = { ...defaultAtt };
        attRecords.forEach((rec) => {
          mergedAtt[rec.studentId] = rec.status;
        });
        setAttendanceMap(mergedAtt);
        setExistingResults(results);
        setExistingHomework(homeworks);
      } catch (err) {
        setError(err.message);
      }
    }

    loadClassDetails();
  }, [currentClass, attendanceDate]);

  async function handleSaveAttendance(e) {
    e.preventDefault();
    if (!currentClass) return;
    try {
      const records = currentClass.students.map((s) => ({
        studentId: s.id,
        status: attendanceMap[s.id] || 'PRESENT',
      }));
      const res = await apiRequest(`/teacher/classes/${currentClass.id}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ date: attendanceDate, records }),
      });
      notify(res.message);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveResults(e) {
    e.preventDefault();
    if (!currentClass) return;
    try {
      const entries = currentClass.students
        .filter((s) => marksMap[s.id] !== '' && marksMap[s.id] !== undefined)
        .map((s) => ({
          studentId: s.id,
          marks: Number(marksMap[s.id]),
        }));

      if (entries.length === 0) {
        setError('Please enter marks for at least one student.');
        return;
      }

      const res = await apiRequest(`/teacher/classes/${currentClass.id}/results`, {
        method: 'POST',
        body: JSON.stringify({ examTitle, totalMarks: Number(totalMarks), entries }),
      });

      setExamTitle('');
      notify(res.message);

      const updatedResults = await apiRequest(`/teacher/classes/${currentClass.id}/results`);
      setExistingResults(updatedResults);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePostHomework(e) {
    e.preventDefault();
    if (!currentClass) return;
    try {
      const res = await apiRequest(`/teacher/classes/${currentClass.id}/homework`, {
        method: 'POST',
        body: JSON.stringify(hwForm),
      });
      setHwForm({ title: '', description: '', dueDate: '', fileUrl: '' });
      notify(res.message);

      const updatedHw = await apiRequest(`/teacher/classes/${currentClass.id}/homework`);
      setExistingHomework(updatedHw);
    } catch (err) {
      setError(err.message);
    }
  }

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition';

  return (
    <PortalShell allowedRole="TEACHER" title="Teacher Portal" navItems={TEACHER_NAV}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Faculty Class Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mark daily attendance, publish assessment scores, and trigger automated parent homework alerts
          </p>
        </div>

        {/* Class Selector Pill */}
        <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Class</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-sm font-bold text-indigo-700 bg-transparent focus:outline-none cursor-pointer"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.students.length} students)
              </option>
            ))}
          </select>
        </div>
      </div>

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

      {/* Segmented Navigation Tabs */}
      <div className="inline-flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-slate-200/70 mb-8">
        {[
          { id: 'attendance', label: 'Daily Attendance' },
          { id: 'results', label: 'Exam Results' },
          { id: 'homework', label: 'Homework & Parent Alerts' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!currentClass ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-sm text-slate-500">
          No classes assigned to your account yet.
        </div>
      ) : (
        <>
          {/* TAB 1: DAILY ATTENDANCE */}
          {activeTab === 'attendance' && (
            <form onSubmit={handleSaveAttendance} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Daily Roll Call — {currentClass.name}</h3>
                  <p className="text-xs text-slate-500">Toggle Present or Absent for each student</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Date</label>
                  <input
                    type="date"
                    required
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Roll #</th>
                      <th className="px-6 py-3.5">Student Name</th>
                      <th className="px-6 py-3.5 text-right">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentClass.students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 font-bold text-indigo-600">{student.rollNumber}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{student.fullName}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {['PRESENT', 'ABSENT'].map((status) => (
                            <button
                              type="button"
                              key={status}
                              onClick={() => setAttendanceMap({ ...attendanceMap, [student.id]: status })}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                attendanceMap[student.id] === status
                                  ? status === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer"
                >
                  Save Attendance Records
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: EXAM RESULTS */}
          {activeTab === 'results' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <form onSubmit={handleSaveResults} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 h-fit">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Enter Assessment Marks</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Scores immediately sync to the Parent Portal</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <input
                    required
                    placeholder="Exam Title (e.g. Midterm Math)"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className={`col-span-2 ${inputClass}`}
                  />
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="Max Marks"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {currentClass.students.map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-4 py-3 bg-white">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{s.fullName}</p>
                        <p className="text-xs text-slate-400">{s.rollNumber}</p>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max={totalMarks}
                        placeholder={`0 - ${totalMarks}`}
                        value={marksMap[s.id] ?? ''}
                        onChange={(e) => setMarksMap({ ...marksMap, [s.id]: e.target.value })}
                        className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-right text-sm font-semibold"
                      />
                    </div>
                  ))}
                </div>

                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer">
                  Publish Assessment Results
                </button>
              </form>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">Published Results — {currentClass.name}</h3>
                {existingResults.length === 0 ? (
                  <p className="text-sm text-slate-500">No results recorded yet for this class.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {existingResults.map((r) => (
                      <div key={r.id} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{r.student?.fullName}</p>
                          <p className="text-xs text-slate-500">{r.examTitle}</p>
                        </div>
                        <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                          {r.marks} / {r.totalMarks}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HOMEWORK & PARENT ALERTS */}
          {activeTab === 'homework' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <form onSubmit={handlePostHomework} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 h-fit">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Assign Homework &amp; Alert Parents</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Automatically dispatches a notification to all parents in {currentClass.name} (FR7)
                  </p>
                </div>

                <input
                  required
                  placeholder="Homework Title (e.g. Algebra Worksheet #4)"
                  value={hwForm.title}
                  onChange={(e) => setHwForm({ ...hwForm, title: e.target.value })}
                  className={inputClass}
                />

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Due Date</label>
                    <input
                      required
                      type="date"
                      value={hwForm.dueDate}
                      onChange={(e) => setHwForm({ ...hwForm, dueDate: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Attachment URL</label>
                    <input
                      placeholder="Optional resource link"
                      value={hwForm.fileUrl}
                      onChange={(e) => setHwForm({ ...hwForm, fileUrl: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <textarea
                  required
                  rows={4}
                  placeholder="Homework instructions and chapter details..."
                  value={hwForm.description}
                  onChange={(e) => setHwForm({ ...hwForm, description: e.target.value })}
                  className={inputClass}
                />

                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer">
                  Upload Homework &amp; Notify Parents
                </button>
              </form>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Assigned Homework — {currentClass.name}</h3>
                {existingHomework.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-sm text-slate-500">
                    No homework assigned yet.
                  </div>
                ) : (
                  existingHomework.map((hw) => (
                    <div key={hw.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="font-bold text-slate-900 text-base">{hw.title}</h4>
                        <span className="shrink-0 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                          Due: {hw.dueDate}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{hw.description}</p>
                      {hw.fileUrl && (
                        <a href={hw.fileUrl} target="_blank" rel="noreferrer" className="inline-block mt-3 text-xs font-semibold text-indigo-600 hover:underline">
                          Open Attachment →
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </PortalShell>
  );
}