'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { CalendarClock, UserCheck, FileText, RefreshCw } from 'lucide-react';

export default function AdminActivityPage() {
    const [activity, setActivity] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadActivity = async () => {
        try {
            setLoading(true);
            const data = await apiClient.adminActivity({ hours: 24, limit: 100 });
            setActivity(data);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load activity');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadActivity();
    }, []);

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:px-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Recent Activity</h1>
                        <p className="text-sm text-gray-500 mt-0.5">System activity in the last 24 hours</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadActivity}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                    </Button>
                </div>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : !activity ? (
                    <p className="text-gray-500">No activity data available.</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="group relative border-gray-200/80 bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                                <div className="absolute left-0 top-0 h-full w-1 bg-emerald-600" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
                                    <CardTitle className="text-sm font-semibold text-gray-600">Sessions (24h)</CardTitle>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <CalendarClock className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pl-5">
                                    <div className="text-2xl font-bold text-gray-900">{activity.summary?.sessions_count ?? 0}</div>
                                </CardContent>
                            </Card>
                            <Card className="group relative border-gray-200/80 bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                                <div className="absolute left-0 top-0 h-full w-1 bg-emerald-600" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
                                    <CardTitle className="text-sm font-semibold text-gray-600">Attendance (24h)</CardTitle>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <UserCheck className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pl-5">
                                    <div className="text-2xl font-bold text-gray-900">{activity.summary?.attendance_count ?? 0}</div>
                                </CardContent>
                            </Card>
                            <Card className="group relative border-gray-200/80 bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                                <div className="absolute left-0 top-0 h-full w-1 bg-emerald-600" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
                                    <CardTitle className="text-sm font-semibold text-gray-600">Audit Logs (24h)</CardTitle>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pl-5">
                                    <div className="text-2xl font-bold text-gray-900">{activity.summary?.audit_logs_count ?? 0}</div>
                                </CardContent>
                            </Card>
                        </div>

                        {activity.recent_sessions?.length > 0 && (
                            <Card className="border-gray-200/80 bg-white shadow-md overflow-hidden">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                                            <CalendarClock className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        Recent Sessions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="border rounded-md overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Code</TableHead>
                                                    <TableHead>Lecturer</TableHead>
                                                    <TableHead>Created</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {activity.recent_sessions.map((s: any) => (
                                                    <TableRow key={s.id}>
                                                        <TableCell className="font-medium">{s.id}</TableCell>
                                                        <TableCell>{s.code}</TableCell>
                                                        <TableCell className="text-gray-500">{s.lecturer_name || '-'}</TableCell>
                                                        <TableCell className="text-gray-500">
                                                            {s.created_at?.replace('T', ' ').slice(0, 19)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activity.recent_attendance?.length > 0 && (
                            <Card className="border-gray-200/80 bg-white shadow-md overflow-hidden">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                                            <UserCheck className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        Recent Attendance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="border rounded-md overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Student</TableHead>
                                                    <TableHead>Lecturer</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Session</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {activity.recent_attendance.map((a: any) => (
                                                    <TableRow key={a.id}>
                                                        <TableCell className="font-medium">{a.id}</TableCell>
                                                        <TableCell>{a.student_name || '-'}</TableCell>
                                                        <TableCell className="text-gray-500">{a.lecturer_name || '-'}</TableCell>
                                                        <TableCell>
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                a.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                                a.status === 'flagged' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {a.status}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-gray-500">{a.session_id}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activity.recent_audit_logs?.length > 0 && (
                            <Card className="border-gray-200/80 bg-white shadow-md overflow-hidden">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                                            <FileText className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        Audit Logs
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="border rounded-md overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Action</TableHead>
                                                    <TableHead>User</TableHead>
                                                    <TableHead>Details</TableHead>
                                                    <TableHead>Timestamp</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {activity.recent_audit_logs.map((l: any) => (
                                                    <TableRow key={l.id}>
                                                        <TableCell className="font-medium">{l.id}</TableCell>
                                                        <TableCell>{l.action}</TableCell>
                                                        <TableCell className="text-gray-500">{l.user_email || '-'}</TableCell>
                                                        <TableCell className="text-gray-500 max-w-xs truncate">{l.details || '-'}</TableCell>
                                                        <TableCell className="text-gray-500">
                                                            {l.timestamp?.replace('T', ' ').slice(0, 19)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </ProtectedRoute>
    );
}
