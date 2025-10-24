'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Sidebar } from '@/components/admin/Sidebar';
import { Navbar } from '@/components/admin/Navbar';

type Flagged = {
  record_id: number;
  session_id: number;
  student_id: number;
  lecturer_id: number | null;
  imei: string | null;
  face_verified: boolean | null;
  face_distance: number | null;
  face_threshold: number | null;
  face_model: string | null;
};

export default function AdminDashboard() {
  const [flagged, setFlagged] = useState<Flagged[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [newImei, setNewImei] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [active, setActive] = useState<'overview' | 'flagged' | 'imei' | 'sessions' | 'users' | 'activity' | 'manual'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activity, setActivity] = useState<any|null>(null);
  const [sessionAttendance, setSessionAttendance] = useState<Record<number, any[]>>({});
  const [manual, setManual] = useState({ session_id: '', student_id: '', status: 'confirmed', reason: '' });

  const loadFlagged = async () => {
    try {
      setLoading(true);
      const data = await apiClient.adminListFlagged();
      setFlagged(data);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load flagged records');
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await apiClient.adminSessions({ limit: 50 });
      setSessions(data);
    } catch (e:any) {
      toast.error(e?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (role?: 'student'|'lecturer'|'admin') => {
    try {
      setLoading(true);
      const data = await apiClient.adminUsers({ role, limit: 100 });
      setUsers(data);
    } catch (e:any) {
      toast.error(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      setLoading(true);
      const data = await apiClient.adminActivity({ hours: 24, limit: 100 });
      setActivity(data);
    } catch (e:any) {
      toast.error(e?.message || 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load initial data (middleware enforces portal cookie)
    (async () => {
      try {
        setLoading(true);
        const [dash, flg] = await Promise.all([
          apiClient.adminDashboard(),
          apiClient.adminListFlagged()
        ]);
        setOverview(dash);
        setFlagged(flg);
      } catch (e:any) {
        // ignore handled toasts in callers
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Lazy-load when switching tabs
  useEffect(() => {
    if (active === 'sessions' && sessions.length === 0) loadSessions();
    if (active === 'users' && users.length === 0) loadUsers();
    if (active === 'activity' && !activity) loadActivity();
  }, [active]);

  const approveImei = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newImei) {
      toast.error('User ID and IMEI are required');
      return;
    }
    try {
      setSubmitting(true);
      const res = await apiClient.adminApproveImeiReset(Number(userId), newImei);
      toast.success(`IMEI approved for user ${res.user_id}`);
      setUserId('');
      setNewImei('');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to approve IMEI');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
        <Sidebar active={active} onSelect={(k)=>setActive(k as any)} mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 lg:ml-0 ml-0">
          <Navbar onMenuClick={() => setSidebarOpen(true)} onLogout={() => { try { document.cookie = 'admin_portal_ok=; Path=/; Max-Age=0; SameSite=Lax'; } catch {}; window.location.href='/auth/login'; }} />

          {/* Overview */}
          {active==='overview' && (
            <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Overview</h2>
              {!overview ? (
                <div className="text-slate-500 dark:text-slate-400">Loading...</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard title="Users" value={overview.overview?.total_users} />
                  <StatCard title="Students" value={overview.overview?.total_students} />
                  <StatCard title="Lecturers" value={overview.overview?.total_lecturers} />
                  <StatCard title="Sessions" value={overview.overview?.total_sessions} />
                </div>
              )}
            </section>
          )}

          {/* IMEI approval */}
          {active==='imei' && (
          <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Approve IMEI Reset</h2>
            <form onSubmit={approveImei} className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">User ID</label>
                <input
                  className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="123"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">New IMEI</label>
                <input
                  className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={newImei}
                  onChange={(e) => setNewImei(e.target.value)}
                  placeholder="356938035643809"
                />
              </div>
              <div className="sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-60 py-2 font-medium text-white"
                >
                  {submitting ? 'Submitting...' : 'Approve Reset'}
                </button>
              </div>
            </form>
          </section>
          )}

          {/* Flagged */}
          {active==='flagged' && (
          <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">Flagged Attendances</h2>
              <button
                onClick={loadFlagged}
                className="rounded-md bg-blue-100 hover:bg-blue-200 text-blue-900 px-3 py-1 text-sm"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-slate-500 dark:text-slate-400">Loading...</div>
            ) : flagged.length === 0 ? (
              <div className="py-8 text-slate-500 dark:text-slate-400">No flagged records.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600 dark:text-slate-300">
                      <th className="px-3 py-2">Record ID</th>
                      <th className="px-3 py-2">Session</th>
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">IMEI</th>
                      <th className="px-3 py-2">Face</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flagged.map((f) => (
                      <tr key={f.record_id} className="border-t border-slate-200 dark:border-slate-700">
                        <td className="px-3 py-2">{f.record_id}</td>
                        <td className="px-3 py-2">{f.session_id}</td>
                        <td className="px-3 py-2">{f.student_id}</td>
                        <td className="px-3 py-2">{f.imei ?? '-'}</td>
                        <td className="px-3 py-2">{f.face_verified === null ? '-' : f.face_verified ? 'Verified' : 'Failed'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          )}

          {/* Sessions placeholder */}
          {active==='sessions' && (
            <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">Sessions</h2>
                <button onClick={loadSessions} className="rounded-md bg-blue-100 hover:bg-blue-200 text-blue-900 px-3 py-1 text-sm">Refresh</button>
              </div>
              {loading && sessions.length===0 ? (
                <div className="text-slate-500 dark:text-slate-400">Loading...</div>
              ) : sessions.length===0 ? (
                <div className="text-slate-500 dark:text-slate-400">No sessions.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600 dark:text-slate-300">
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Code</th>
                        <th className="px-3 py-2">Lecturer</th>
                        <th className="px-3 py-2">Active</th>
                        <th className="px-3 py-2">Created</th>
                        <th className="px-3 py-2">Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s:any) => (
                        <tr key={s.id} className="border-t border-slate-200 dark:border-slate-700 align-top">
                          <td className="px-3 py-2">{s.id}</td>
                          <td className="px-3 py-2">{s.code}</td>
                          <td className="px-3 py-2">{s.lecturer_name || '-'}</td>
                          <td className="px-3 py-2">{s.is_active ? 'Yes' : 'No'}</td>
                          <td className="px-3 py-2">{s.created_at?.replace('T',' ').slice(0,19)}</td>
                          <td className="px-3 py-2">
                            <button
                              onClick={async()=>{
                                if (!sessionAttendance[s.id]) {
                                  const rows = await apiClient.adminSessionAttendance(s.id);
                                  setSessionAttendance(prev=>({ ...prev, [s.id]: rows }));
                                } else {
                                  setSessionAttendance(prev=>{ const c={...prev}; delete c[s.id]; return c; });
                                }
                              }}
                              className="rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1 text-xs"
                            >{sessionAttendance[s.id] ? 'Hide' : 'View'}</button>
                            {sessionAttendance[s.id] && (
                              <div className="mt-2 max-h-64 overflow-auto border border-slate-200 dark:border-slate-700 rounded-md">
                                <table className="min-w-full text-xs">
                                  <thead>
                                    <tr className="text-left text-slate-600 dark:text-slate-300">
                                      <th className="px-2 py-1">Record</th>
                                      <th className="px-2 py-1">Student</th>
                                      <th className="px-2 py-1">Status</th>
                                      <th className="px-2 py-1">IMEI</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sessionAttendance[s.id].map((r:any)=> (
                                      <tr key={r.id} className="border-t border-slate-200 dark:border-slate-700">
                                        <td className="px-2 py-1">{r.id}</td>
                                        <td className="px-2 py-1">{r.student_name || r.student_id}</td>
                                        <td className="px-2 py-1">{r.status}</td>
                                        <td className="px-2 py-1">{r.imei || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Users placeholder */}
          {active==='users' && (
            <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">Users</h2>
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e)=>loadUsers(e.target.value as any || undefined)}
                    className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm"
                  >
                    <option value="">All</option>
                    <option value="student">Students</option>
                    <option value="lecturer">Lecturers</option>
                    <option value="admin">Admins</option>
                  </select>
                  <button onClick={()=>loadUsers()} className="rounded-md bg-blue-100 hover:bg-blue-200 text-blue-900 px-3 py-1 text-sm">Refresh</button>
                </div>
              </div>
              {loading && users.length===0 ? (
                <div className="text-slate-500 dark:text-slate-400">Loading...</div>
              ) : users.length===0 ? (
                <div className="text-slate-500 dark:text-slate-400">No users.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600 dark:text-slate-300">
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Role</th>
                        <th className="px-3 py-2">Student ID</th>
                        <th className="px-3 py-2">IMEI</th>
                        <th className="px-3 py-2">Records</th>
                        <th className="px-3 py-2">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u:any)=> (
                        <tr key={u.id} className="border-t border-slate-200 dark:border-slate-700">
                          <td className="px-3 py-2">{u.id}</td>
                          <td className="px-3 py-2">{u.email}</td>
                          <td className="px-3 py-2">{u.full_name || '-'}</td>
                          <td className="px-3 py-2">{u.role}</td>
                          <td className="px-3 py-2">{u.student_id || '-'}</td>
                          <td className="px-3 py-2">{u.device_imei || '-'}</td>
                          <td className="px-3 py-2">{u.attendance_count ?? '-'}</td>
                          <td className="px-3 py-2">{u.created_at?.replace('T',' ').slice(0,19)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {active==='activity' && (
            <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">Recent Activity</h2>
                <button onClick={loadActivity} className="rounded-md bg-blue-100 hover:bg-blue-200 text-blue-900 px-3 py-1 text-sm">Refresh</button>
              </div>
              {!activity ? (
                <div className="text-slate-500 dark:text-slate-400">Loading...</div>
              ) : (
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard title="Sessions (24h)" value={activity.summary?.sessions_count} />
                    <StatCard title="Attendance (24h)" value={activity.summary?.attendance_count} />
                    <StatCard title="Audit Logs (24h)" value={activity.summary?.audit_logs_count} />
                  </div>
                  <div>
                    <h3 className="text-md font-medium mb-2">Recent Sessions</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-600 dark:text-slate-300">
                            <th className="px-3 py-2">ID</th>
                            <th className="px-3 py-2">Code</th>
                            <th className="px-3 py-2">Lecturer</th>
                            <th className="px-3 py-2">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activity.recent_sessions?.map((s:any)=> (
                            <tr key={s.id} className="border-t border-slate-200 dark:border-slate-700">
                              <td className="px-3 py-2">{s.id}</td>
                              <td className="px-3 py-2">{s.code}</td>
                              <td className="px-3 py-2">{s.lecturer_name || '-'}</td>
                              <td className="px-3 py-2">{s.created_at?.replace('T',' ').slice(0,19)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-md font-medium mb-2">Recent Attendance</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-600 dark:text-slate-300">
                            <th className="px-3 py-2">ID</th>
                            <th className="px-3 py-2">Student</th>
                            <th className="px-3 py-2">Lecturer</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Session</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activity.recent_attendance?.map((a:any)=> (
                            <tr key={a.id} className="border-t border-slate-200 dark:border-slate-700">
                              <td className="px-3 py-2">{a.id}</td>
                              <td className="px-3 py-2">{a.student_name || '-'}</td>
                              <td className="px-3 py-2">{a.lecturer_name || '-'}</td>
                              <td className="px-3 py-2">{a.status}</td>
                              <td className="px-3 py-2">{a.session_id}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-md font-medium mb-2">Audit Logs</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-600 dark:text-slate-300">
                            <th className="px-3 py-2">ID</th>
                            <th className="px-3 py-2">Action</th>
                            <th className="px-3 py-2">User</th>
                            <th className="px-3 py-2">Details</th>
                            <th className="px-3 py-2">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activity.recent_audit_logs?.map((l:any)=> (
                            <tr key={l.id} className="border-t border-slate-200 dark:border-slate-700">
                              <td className="px-3 py-2">{l.id}</td>
                              <td className="px-3 py-2">{l.action}</td>
                              <td className="px-3 py-2">{l.user_email || '-'}</td>
                              <td className="px-3 py-2">{l.details || '-'}</td>
                              <td className="px-3 py-2">{l.timestamp?.replace('T',' ').slice(0,19)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {active==='manual' && (
            <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Manual Mark Attendance</h2>
              <form
                onSubmit={async (e)=>{
                  e.preventDefault();
                  if (!manual.session_id || !manual.student_id) { toast.error('Session ID and Student ID are required'); return; }
                  try {
                    setSubmitting(true);
                    const res = await apiClient.adminManualMark({
                      session_id: Number(manual.session_id),
                      student_id: Number(manual.student_id),
                      status: manual.status,
                      reason: manual.reason || undefined,
                    });
                    toast.success(`Marked ${res.status} for student ${res.student_id} in session ${res.session_id}`);
                    setManual({ session_id: '', student_id: '', status: 'confirmed', reason: '' });
                  } catch (e:any) {
                    toast.error(e?.message || 'Failed to mark');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="grid gap-3 sm:grid-cols-4"
              >
                <div>
                  <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">Session ID</label>
                  <input value={manual.session_id} onChange={e=>setManual(v=>({...v, session_id: e.target.value}))}
                    className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">Student ID</label>
                  <input value={manual.student_id} onChange={e=>setManual(v=>({...v, student_id: e.target.value}))}
                    className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">Status</label>
                  <select value={manual.status} onChange={e=>setManual(v=>({...v, status: e.target.value}))}
                    className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2">
                    <option value="confirmed">confirmed</option>
                    <option value="present">present</option>
                    <option value="absent">absent</option>
                    <option value="flagged">flagged</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">Reason (optional)</label>
                  <input value={manual.reason} onChange={e=>setManual(v=>({...v, reason: e.target.value}))}
                    className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2" />
                </div>
                <div className="sm:col-span-4 flex justify-end">
                  <button type="submit" disabled={submitting} className="rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-4 py-2">{submitting ? 'Submitting...' : 'Submit'}</button>
                </div>
              </form>
            </section>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <div className="text-sm text-slate-600 dark:text-slate-400">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value ?? '-'}</div>
    </div>
  );
}
