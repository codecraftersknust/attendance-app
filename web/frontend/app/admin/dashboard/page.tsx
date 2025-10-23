'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

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
  const [active, setActive] = useState<'overview' | 'flagged' | 'imei' | 'sessions' | 'users'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

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

  useEffect(() => {
    // Enforce admin portal second-factor
    if (typeof window !== 'undefined') {
      const ok = sessionStorage.getItem('admin_portal_ok');
      if (!ok) {
        window.location.href = '/admin/login';
        return;
      }
    }
    // Load initial data
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
      <div className="min-h-screen bg-white text-slate-900 flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-200 bg-white p-4 transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="text-xl font-semibold text-slate-900">Admin</div>
            <button className="lg:hidden text-slate-600" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>
          <nav className="space-y-1">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'flagged', label: 'Flagged' },
              { key: 'imei', label: 'IMEI Resets' },
              { key: 'sessions', label: 'Sessions' },
              { key: 'users', label: 'Users' },
            ].map((item:any) => (
              <button key={item.key} onClick={() => { setActive(item.key); setSidebarOpen(false); }}
                className={`w-full text-left rounded px-3 py-2 ${active===item.key ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}`}>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 lg:ml-0 ml-0">
          {/* Top bar */}
          <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between">
            <button className="lg:hidden text-slate-700" onClick={() => setSidebarOpen(true)}>☰</button>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => { if (typeof window !== 'undefined') sessionStorage.removeItem('admin_portal_ok'); toast.success('Admin session cleared'); }} className="hidden sm:inline text-sm text-slate-600 hover:text-slate-900">Clear Portal</button>
              <button onClick={() => { sessionStorage.removeItem('admin_portal_ok'); window.location.href='/auth/login'; }} className="rounded-md bg-slate-900 text-white px-3 py-1.5 text-sm">Logout</button>
            </div>
          </div>

          {/* Overview */}
          {active==='overview' && (
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-medium text-slate-900 mb-4">Overview</h2>
              {!overview ? (
                <div className="text-slate-500">Loading...</div>
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
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-medium text-slate-900 mb-4">Approve IMEI Reset</h2>
            <form onSubmit={approveImei} className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="block text-sm mb-1 text-slate-700">User ID</label>
                <input
                  className="w-full rounded-md bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="123"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm mb-1 text-slate-700">New IMEI</label>
                <input
                  className="w-full rounded-md bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-slate-900">Flagged Attendances</h2>
              <button
                onClick={loadFlagged}
                className="rounded-md bg-blue-100 hover:bg-blue-200 text-blue-900 px-3 py-1 text-sm"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-slate-500">Loading...</div>
            ) : flagged.length === 0 ? (
              <div className="py-8 text-slate-500">No flagged records.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600">
                      <th className="px-3 py-2">Record ID</th>
                      <th className="px-3 py-2">Session</th>
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">IMEI</th>
                      <th className="px-3 py-2">Face</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flagged.map((f) => (
                      <tr key={f.record_id} className="border-t border-slate-200">
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
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-medium text-slate-900 mb-2">Sessions</h2>
              <p className="text-slate-600 text-sm">Coming soon — integrate admin sessions list.</p>
            </section>
          )}

          {/* Users placeholder */}
          {active==='users' && (
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-medium text-slate-900 mb-2">Users</h2>
              <p className="text-slate-600 text-sm">Coming soon — integrate admin users list.</p>
            </section>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-sm text-slate-600">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value ?? '-'}</div>
    </div>
  );
}
