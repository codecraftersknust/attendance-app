'use client';

import { Fragment, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { CalendarClock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminSessionsPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSession, setExpandedSession] = useState<number | null>(null);
    const [sessionAttendance, setSessionAttendance] = useState<Record<number, any[]>>({});

    const loadSessions = async () => {
        try {
            setLoading(true);
            const data = await apiClient.adminSessions({ limit: 50 });
            setSessions(data);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load sessions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const toggleAttendance = async (sessionId: number) => {
        if (expandedSession === sessionId) {
            setExpandedSession(null);
            return;
        }
        setExpandedSession(sessionId);
        if (!sessionAttendance[sessionId]) {
            try {
                const rows = await apiClient.adminSessionAttendance(sessionId);
                setSessionAttendance((prev) => ({ ...prev, [sessionId]: rows }));
            } catch (e: any) {
                toast.error(e?.message || 'Failed to load attendance');
            }
        }
    };

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:px-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sessions</h1>
                        <p className="text-sm text-gray-500 mt-0.5">All attendance sessions across the school</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadSessions}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                    </Button>
                </div>

                <Card className="border-gray-200/80 bg-white shadow-md overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                                <CalendarClock className="h-4 w-4 text-emerald-600" />
                            </div>
                            Sessions
                            {!loading && <span className="text-sm font-normal text-gray-400">({sessions.length})</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading && sessions.length === 0 ? (
                            <p className="text-gray-500 py-4">Loading...</p>
                        ) : sessions.length === 0 ? (
                            <p className="text-gray-500 py-4">No sessions found.</p>
                        ) : (
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Lecturer</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="text-right">Attendance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sessions.map((s: any) => (
                                            <Fragment key={s.id}>
                                                <TableRow className="cursor-pointer" onClick={() => toggleAttendance(s.id)}>
                                                    <TableCell className="font-medium">{s.id}</TableCell>
                                                    <TableCell>{s.code}</TableCell>
                                                    <TableCell className="text-gray-500">{s.lecturer_name || '-'}</TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            s.is_active
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {s.is_active ? 'Active' : 'Closed'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-gray-500">
                                                        {s.created_at?.replace('T', ' ').slice(0, 19)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {expandedSession === s.id
                                                            ? <ChevronUp className="h-4 w-4 inline" />
                                                            : <ChevronDown className="h-4 w-4 inline" />
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                                {expandedSession === s.id && (
                                                    <TableRow key={`${s.id}-attendance`}>
                                                        <TableCell colSpan={6} className="bg-gray-50 p-4">
                                                            {!sessionAttendance[s.id] ? (
                                                                <p className="text-gray-500 text-sm">Loading attendance...</p>
                                                            ) : sessionAttendance[s.id].length === 0 ? (
                                                                <p className="text-gray-500 text-sm">No attendance records.</p>
                                                            ) : (
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead>Record</TableHead>
                                                                            <TableHead>Student</TableHead>
                                                                            <TableHead>Status</TableHead>
                                                                            <TableHead>Device</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {sessionAttendance[s.id].map((r: any) => (
                                                                            <TableRow key={r.id}>
                                                                                <TableCell>{r.id}</TableCell>
                                                                                <TableCell>{r.student_name || r.student_id}</TableCell>
                                                                                <TableCell>
                                                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                                        r.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                                                        r.status === 'flagged' ? 'bg-yellow-100 text-yellow-800' :
                                                                                        'bg-gray-100 text-gray-800'
                                                                                    }`}>
                                                                                        {r.status}
                                                                                    </span>
                                                                                </TableCell>
                                                                                <TableCell className="text-gray-500">{r.imei || '-'}</TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
    );
}
