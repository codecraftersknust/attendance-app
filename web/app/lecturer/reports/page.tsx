'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useEffect, useMemo, useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    BarChart,
    Users,
    UserCheck,
    UserX,
    AlertTriangle,
    Clock,
    ChevronDown,
    ChevronRight,
    Loader2,
    Radio,
} from 'lucide-react';
import { AbsentStudentsTab } from '@/components/lecturer/absent-students-tab';

type Session = {
    id: number;
    code: string;
    is_active: boolean;
    programme?: string | null;
    course_id?: number | null;
    course_code?: string | null;
    course_name?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    attendance_summary?: {
        submitted: number;
        present: number;
        flagged: number;
        pending: number;
        absent: number;
    };
};

type Analytics = {
    total_students: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    flagged_count: number;
    pending_count?: number;
    attendance_rate: number;
};

type AttendanceRecord = {
    id: number;
    student_id: number;
    student_name?: string | null;
    student_email?: string | null;
    status: string;
    device_id_hash: string | null;
    flag_reasons?: string[];
};

const FLAG_REASON_LABELS: Record<string, string> = {
    device_mismatch: 'Device not registered',
    outside_geofence: 'Outside class location',
    location_not_verified: 'Location not set for session',
    face_not_verified: 'Face verification failed',
    face_verification_unavailable: 'Face engine unavailable',
    face_verification_failed: 'Face verification error',
};

const reportFetcher = async (sessionId: number) => {
    const [analyticsResponse, recordsData] = await Promise.all([
        apiClient.lecturerSessionAnalytics(sessionId),
        apiClient.lecturerSessionAttendance(sessionId),
    ]);
    const data = analyticsResponse as { analytics?: Analytics; session?: unknown; recent_attendance?: unknown };
    return {
        analytics: data.analytics ?? (data as unknown as Analytics),
        records: recordsData as AttendanceRecord[],
    };
};

function formatSessionWhen(session: Session) {
    if (!session.starts_at && !session.ends_at) return 'Time not set';
    const start = session.starts_at ? new Date(session.starts_at).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }) : '';
    const end = session.ends_at ? new Date(session.ends_at).toLocaleTimeString(undefined, {
        hour: '2-digit', minute: '2-digit',
    }) : '';
    if (start && end) return `${start} – ${end}`;
    return start || end || 'N/A';
}

function SessionReportPanel({
    sessionId,
    onMutate,
}: {
    sessionId: number;
    onMutate: () => void;
}) {
    const [confirmingId, setConfirmingId] = useState<number | null>(null);
    const [rejectingId, setRejectingId] = useState<number | null>(null);

    const { data: reportData, error, isLoading, mutate } = useSWR(
        ['lecturer-report', sessionId],
        () => reportFetcher(sessionId),
        { dedupingInterval: 5000, refreshInterval: 10000 }
    );

    useEffect(() => { if (error) toast.error(error?.message || 'Failed to load report'); }, [error]);

    const analytics = reportData?.analytics ?? null;
    const records = reportData?.records ?? [];

    const handleConfirmFlagged = async (recordId: number) => {
        try {
            setConfirmingId(recordId);
            await apiClient.lecturerConfirmFlagged(recordId);
            toast.success('Attendance confirmed');
            await mutate();
            onMutate();
            await globalMutate(['lecturer-absent-students', sessionId]);
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to confirm attendance');
        } finally {
            setConfirmingId(null);
        }
    };

    const handleRejectFlagged = async (recordId: number) => {
        try {
            setRejectingId(recordId);
            await apiClient.lecturerRejectFlagged(recordId);
            toast.success('Attendance rejected (marked absent)');
            await mutate();
            onMutate();
            await globalMutate(['lecturer-absent-students', sessionId]);
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to reject attendance');
        } finally {
            setRejectingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10 text-gray-500 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading report…
            </div>
        );
    }

    return (
        <div className="space-y-6 border-t border-gray-100 pt-6">
            {analytics && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <MiniStat label="Enrolled" value={analytics.total_students} icon={Users} tone="gray" />
                    <MiniStat label="Present" value={analytics.present_count} icon={UserCheck} tone="emerald" sub={`${Number(analytics.attendance_rate).toFixed(0)}% rate`} />
                    <MiniStat label="Verifying" value={analytics.pending_count ?? 0} icon={Clock} tone="gray" />
                    <MiniStat label="Flagged" value={analytics.flagged_count} icon={AlertTriangle} tone="gray" />
                    <MiniStat label="Absent" value={analytics.absent_count} icon={UserX} tone="gray" />
                </div>
            )}

            <div className="bg-gray-50/80 rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-white">
                    <h3 className="font-semibold text-gray-900 text-sm">Attendance records</h3>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Why flagged</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                    No submissions yet for this session.
                                </TableCell>
                            </TableRow>
                        ) : (
                            records.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell className="font-medium">
                                        <span className="text-gray-900">{record.student_name || record.student_email || `#${record.student_id}`}</span>
                                        {record.student_email && record.student_name && (
                                            <span className="block text-xs text-gray-500">{record.student_email}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={record.status} />
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {record.status === 'flagged' && record.flag_reasons?.length ? (
                                            <ul className="list-disc list-inside space-y-0.5">
                                                {record.flag_reasons.map((code) => (
                                                    <li key={code}>{FLAG_REASON_LABELS[code] ?? code}</li>
                                                ))}
                                            </ul>
                                        ) : record.status === 'absent' ? (
                                            <span className="text-gray-600">Rejected by lecturer</span>
                                        ) : record.status === 'pending_verification' ? (
                                            <span className="text-gray-600">Face check in progress</span>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {record.status === 'flagged' ? (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                                    onClick={() => handleConfirmFlagged(record.id)}
                                                    disabled={confirmingId === record.id || rejectingId === record.id}
                                                >
                                                    {confirmingId === record.id ? 'Confirming…' : 'Approve'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-700 border-red-200 hover:bg-red-50"
                                                    onClick={() => handleRejectFlagged(record.id)}
                                                    disabled={confirmingId === record.id || rejectingId === record.id}
                                                >
                                                    {rejectingId === record.id ? 'Rejecting…' : 'Reject'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AbsentStudentsTab sessionId={sessionId} />
        </div>
    );
}

function MiniStat({
    label,
    value,
    icon: Icon,
    tone,
    sub,
}: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    tone: 'gray' | 'emerald';
    sub?: string;
}) {
    const tones = {
        gray: 'text-gray-600 bg-gray-100',
        emerald: 'text-emerald-600 bg-emerald-50',
    };
    return (
        <Card className="border-gray-200/80 shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">{label}</span>
                    <div className={`flex h-7 w-7 items-center justify-center rounded-md ${tones[tone]}`}>
                        <Icon className="h-3.5 w-3.5" />
                    </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        confirmed: 'bg-emerald-50 text-emerald-700',
        flagged: 'bg-gray-100 text-gray-700',
        absent: 'bg-gray-100 text-gray-600',
        pending_verification: 'bg-gray-100 text-gray-600',
    };
    const labels: Record<string, string> = {
        confirmed: 'Present',
        flagged: 'Flagged',
        absent: 'Absent',
        pending_verification: 'Verifying',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-800'}`}>
            {labels[status] ?? status}
        </span>
    );
}

export default function ReportsPage() {
    const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'recent'>('all');

    const { data: sessions = [], error: sessionsError, isLoading: loadingSessions, mutate: mutateSessions } = useSWR(
        'lecturer-sessions',
        () => apiClient.lecturerSessions(),
        { dedupingInterval: 15000, refreshInterval: 30000 }
    );

    useEffect(() => { if (sessionsError) toast.error(sessionsError?.message || 'Failed to load sessions'); }, [sessionsError]);

    const filteredSessions = useMemo(() => {
        const list = sessions as Session[];
        if (filter === 'active') return list.filter((s) => s.is_active);
        if (filter === 'recent') {
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            return list.filter((s) => {
                const t = s.starts_at ? new Date(s.starts_at).getTime() : 0;
                return t >= weekAgo;
            });
        }
        return list;
    }, [sessions, filter]);

    useEffect(() => {
        if (expandedSessionId != null) return;
        const active = (sessions as Session[]).find((s) => s.is_active);
        if (active) setExpandedSessionId(active.id);
    }, [sessions, expandedSessionId]);

    const toggleSession = (id: number) => {
        setExpandedSessionId((prev) => (prev === id ? null : id));
    };

    return (
        <ProtectedRoute allowedRoles={['lecturer']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Browse sessions and review submissions — no dropdown needed
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(['all', 'active', 'recent'] as const).map((key) => (
                        <Button
                            key={key}
                            size="sm"
                            variant={filter === key ? 'primary' : 'outline'}
                            onClick={() => setFilter(key)}
                        >
                            {key === 'all' ? 'All sessions' : key === 'active' ? 'Active now' : 'Last 7 days'}
                        </Button>
                    ))}
                </div>

                {loadingSessions ? (
                    <div className="text-center py-16 text-gray-500">Loading sessions…</div>
                ) : filteredSessions.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-200">
                        <BarChart className="h-10 w-10 text-gray-300 mx-auto" />
                        <h3 className="mt-4 text-sm font-semibold text-gray-900">No sessions found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {filter === 'active' ? 'You have no active sessions right now.' : 'Create a session to see reports here.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredSessions.map((session) => {
                            const summary = session.attendance_summary;
                            const expanded = expandedSessionId === session.id;
                            return (
                                <Card
                                    key={session.id}
                                    className={`border-gray-200 shadow-sm overflow-hidden transition-shadow ${expanded ? 'ring-1 ring-emerald-600/30 shadow-md' : 'hover:shadow-md'}`}
                                >
                                    <button
                                        type="button"
                                        className="w-full text-left"
                                        onClick={() => toggleSession(session.id)}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className="mt-0.5 text-gray-400">
                                                        {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <CardTitle className="text-base font-semibold text-gray-900 truncate">
                                                            {session.course_code ? `${session.course_code} — ${session.course_name}` : `Session #${session.id}`}
                                                        </CardTitle>
                                                        <p className="text-sm text-gray-500 mt-0.5">
                                                            Code <span className="font-mono">{session.code}</span>
                                                            {session.programme && <> · {session.programme}</>}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">{formatSessionWhen(session)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {session.is_active && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                                            <Radio className="h-3 w-3" /> Live
                                                        </span>
                                                    )}
                                                    {summary && summary.flagged > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                            <AlertTriangle className="h-3 w-3" /> {summary.flagged} flagged
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {summary && (
                                                <div className="flex flex-wrap gap-4 mt-4 ml-8 text-sm text-gray-600">
                                                    <span><strong className="text-gray-900">{summary.present}</strong> present</span>
                                                    <span><strong className="text-gray-900">{summary.pending}</strong> verifying</span>
                                                    <span><strong className="text-gray-900">{summary.flagged}</strong> flagged</span>
                                                    <span><strong className="text-gray-900">{summary.submitted}</strong> submitted</span>
                                                </div>
                                            )}
                                        </CardHeader>
                                    </button>
                                    {expanded && (
                                        <CardContent className="pt-0 pb-6 px-6">
                                            <SessionReportPanel
                                                sessionId={session.id}
                                                onMutate={() => mutateSessions()}
                                            />
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
