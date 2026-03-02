'use client';

import { Fragment, useEffect, useState } from 'react';
import useSWR from 'swr';
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
    const [expandedSession, setExpandedSession] = useState<number | null>(null);

    const { data: sessions = [], error, isLoading, mutate } = useSWR(
        'admin-sessions',
        () => apiClient.adminSessions({ limit: 50 }),
        { dedupingInterval: 30000 }
    );

    const { data: expandedAttendance, isLoading: attendanceLoading } = useSWR(
        expandedSession ? ['admin-session-attendance', expandedSession] : null,
        ([_, id]) => apiClient.adminSessionAttendance(id),
        { dedupingInterval: 10000 }
    );

    const sessionAttendance: Record<number, any[]> = expandedSession && expandedAttendance
        ? { [expandedSession]: expandedAttendance }
        : {};

    useEffect(() => { if (error) toast.error(error?.message || 'Failed to load sessions'); }, [error]);

    const isSessionEffectivelyActive = (s: { is_active?: boolean; ends_at?: string | null }) => {
        if (!s.is_active) return false;
        if (!s.ends_at) return true;
        return new Date(s.ends_at) > new Date();
    };

    const toggleAttendance = (sessionId: number) => {
        setExpandedSession((prev) => (prev === sessionId ? null : sessionId));
    };

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:px-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sessions</h1>
                        <p className="text-sm text-gray-500 mt-0.5">All attendance sessions across the school</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => mutate()}>
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
                            {!isLoading && <span className="text-sm font-normal text-gray-400">({sessions.length})</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading && sessions.length === 0 ? (
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
                                                            isSessionEffectivelyActive(s)
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {isSessionEffectivelyActive(s) ? 'Active' : 'Closed'}
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
                                                            {attendanceLoading ? (
                                                                <p className="text-gray-500 text-sm">Loading attendance...</p>
                                                            ) : !sessionAttendance[s.id] || sessionAttendance[s.id].length === 0 ? (
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
