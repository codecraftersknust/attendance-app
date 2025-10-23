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
    loadFlagged();
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
      <div className="min-h-screen bg-[#0b1220] text-white flex">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0e1626] border-r border-blue-900/40 p-4 hidden md:block">
          <div className="text-xl font-semibold text-blue-200 mb-6">Admin</div>
          <nav className="space-y-2">
            <a className="block rounded px-3 py-2 bg-blue-900/20 text-blue-200">Dashboard</a>
            <a className="block rounded px-3 py-2 hover:bg-blue-900/10 text-blue-200/80">Flagged</a>
            <a className="block rounded px-3 py-2 hover:bg-blue-900/10 text-blue-200/80">IMEI Resets</a>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 space-y-8">
          <h1 className="text-2xl font-semibold text-blue-100">Admin Dashboard</h1>

          {/* IMEI approval */}
          <section className="rounded-xl border border-blue-900/40 bg-[#0e1626] p-4">
            <h2 className="text-lg font-medium text-blue-200 mb-4">Approve IMEI Reset</h2>
            <form onSubmit={approveImei} className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="block text-sm mb-1 text-blue-200">User ID</label>
                <input
                  className="w-full rounded-md bg-[#0b1220] border border-blue-900/50 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="123"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm mb-1 text-blue-200">New IMEI</label>
                <input
                  className="w-full rounded-md bg-[#0b1220] border border-blue-900/50 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  value={newImei}
                  onChange={(e) => setNewImei(e.target.value)}
                  placeholder="356938035643809"
                />
              </div>
              <div className="sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md bg-blue-700 hover:bg-blue-600 disabled:opacity-60 py-2 font-medium"
                >
                  {submitting ? 'Submitting...' : 'Approve Reset'}
                </button>
              </div>
            </form>
          </section>

          {/* Flagged */}
          <section className="rounded-xl border border-blue-900/40 bg-[#0e1626] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-blue-200">Flagged Attendances</h2>
              <button
                onClick={loadFlagged}
                className="rounded-md bg-blue-900/40 hover:bg-blue-900/60 px-3 py-1 text-sm"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-blue-300">Loading...</div>
            ) : flagged.length === 0 ? (
              <div className="py-8 text-blue-300/70">No flagged records.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-blue-300/70">
                      <th className="px-3 py-2">Record ID</th>
                      <th className="px-3 py-2">Session</th>
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">IMEI</th>
                      <th className="px-3 py-2">Face</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flagged.map((f) => (
                      <tr key={f.record_id} className="border-t border-blue-900/40">
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
        </main>
      </div>
    </ProtectedRoute>
  );
}
