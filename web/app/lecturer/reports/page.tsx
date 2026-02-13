'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Users, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import { AbsentStudentsTab } from '@/components/lecturer/absent-students-tab';

type Session = {
    id: number;
    code: string;
    is_active: boolean;
    starts_at?: string;
    ends_at?: string;
};

type Analytics = {
    total_students: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    flagged_count: number;
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
    face_not_verified: 'Face verification failed',
};

export default function ReportsPage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [loadingSessions, setLoadingSessions] = useState<boolean>(true);

    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loadingReport, setLoadingReport] = useState<boolean>(false);
    const [confirmingId, setConfirmingId] = useState<number | null>(null);

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        if (selectedSessionId) {
            loadReport(Number(selectedSessionId));
        } else {
            setAnalytics(null);
            setRecords([]);
        }
    }, [selectedSessionId]);

    const loadSessions = async () => {
        try {
            setLoadingSessions(true);
            const data = await apiClient.lecturerSessions();
            setSessions(data as any);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load sessions');
        } finally {
            setLoadingSessions(false);
        }
    };

    const loadReport = async (sessionId: number) => {
        try {
            setLoadingReport(true);
            const [analyticsResponse, recordsData] = await Promise.all([
                apiClient.lecturerSessionAnalytics(sessionId),
                apiClient.lecturerSessionAttendance(sessionId)
            ]);
            const data = analyticsResponse as { analytics?: Analytics; session?: unknown; recent_attendance?: unknown };
            setAnalytics(data.analytics ?? (data as unknown as Analytics));
            setRecords(recordsData);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load report data');
        } finally {
            setLoadingReport(false);
        }
    };

    const formatTime = (isoString?: string) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString();
    };

    const handleConfirmFlagged = async (recordId: number) => {
        try {
            setConfirmingId(recordId);
            await apiClient.lecturerConfirmFlagged(recordId);
            toast.success('Attendance confirmed');
            if (selectedSessionId) loadReport(Number(selectedSessionId));
        } catch (e: any) {
            toast.error(e?.message || 'Failed to confirm attendance');
        } finally {
            setConfirmingId(null);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['lecturer']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
                        <p className="text-gray-500">View analytics and detailed attendance records</p>
                    </div>

                    <div className="w-full md:w-72">
                        <Select value={selectedSessionId} onValueChange={setSelectedSessionId} disabled={loadingSessions}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingSessions ? "Loading sessions..." : "Select a session"} />
                            </SelectTrigger>
                            <SelectContent>
                                {sessions.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        #{s.id} - {s.code} ({s.is_active ? 'Active' : 'Closed'})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {!selectedSessionId ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed mt-4">
                        <BarChart className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No session selected</h3>
                        <p className="mt-1 text-sm text-gray-500">Select a session from the dropdown to view its report.</p>
                    </div>
                ) : loadingReport ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading report data...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Analytics Cards */}
                        {analytics && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{analytics.total_students}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Present</CardTitle>
                                        <UserCheck className="h-4 w-4 text-emerald-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-600">{analytics.present_count}</div>
                                        <p className="text-xs text-muted-foreground">{(analytics.attendance_rate * 100).toFixed(1)}% rate</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Flagged</CardTitle>
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-amber-500">{analytics.flagged_count}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Absent</CardTitle>
                                        <UserX className="h-4 w-4 text-red-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-500">{analytics.absent_count}</div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Attendance Table */}
                        <div className="bg-white rounded-md shadow overflow-hidden mt-4">
                            <div className="p-4 border-b">
                                <h3 className="font-semibold">Attendance Records</h3>
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
                                                No attendance records found for this session.
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
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                        ${record.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                                                            record.status === 'flagged' ? 'bg-amber-100 text-amber-800' :
                                                                'bg-gray-100 text-gray-800'}`}>
                                                        {record.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {record.status === 'flagged' && record.flag_reasons && record.flag_reasons.length > 0 ? (
                                                        <ul className="list-disc list-inside space-y-0.5">
                                                            {record.flag_reasons.map((code) => (
                                                                <li key={code}>{FLAG_REASON_LABELS[code] ?? code}</li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {record.status === 'flagged' ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                                            onClick={() => handleConfirmFlagged(record.id)}
                                                            disabled={confirmingId === record.id}
                                                        >
                                                            {confirmingId === record.id ? 'Confirming…' : 'Confirm attendance'}
                                                        </Button>
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

                        {/* Absent Students Tab */}
                        <div className="mt-8">
                            <AbsentStudentsTab sessionId={Number(selectedSessionId)} />
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
