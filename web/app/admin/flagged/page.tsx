'use client';

import { useEffect, useState } from 'react';
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
import { Flag, RefreshCw } from 'lucide-react';

type Flagged = {
    record_id: number;
    session_id: number;
    student_id: number;
    lecturer_id: number | null;
    device_id_hash: string | null;
    face_verified: boolean | null;
    face_distance: number | null;
    face_threshold: number | null;
    face_model: string | null;
};

export default function AdminFlaggedPage() {
    const [flagged, setFlagged] = useState<Flagged[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:px-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Flagged Attendance</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Attendance records flagged for review</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadFlagged}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                    </Button>
                </div>

                <Card className="border-gray-200/80 bg-white shadow-md overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                                <Flag className="h-4 w-4 text-amber-600" />
                            </div>
                            Flagged Records
                            {!loading && <span className="text-sm font-normal text-gray-400">({flagged.length})</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-gray-500 py-4">Loading...</p>
                        ) : flagged.length === 0 ? (
                            <p className="text-gray-500 py-4">No flagged records. Everything looks good.</p>
                        ) : (
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Record ID</TableHead>
                                            <TableHead>Session</TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Device</TableHead>
                                            <TableHead>Face Verified</TableHead>
                                            <TableHead>Distance</TableHead>
                                            <TableHead>Threshold</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {flagged.map((f) => (
                                            <TableRow key={f.record_id}>
                                                <TableCell className="font-medium">{f.record_id}</TableCell>
                                                <TableCell>{f.session_id}</TableCell>
                                                <TableCell>{f.student_id}</TableCell>
                                                <TableCell className="text-gray-500">{f.device_id_hash ?? '-'}</TableCell>
                                                <TableCell>
                                                    {f.face_verified === null ? (
                                                        <span className="text-gray-400">-</span>
                                                    ) : f.face_verified ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Verified</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-gray-500">
                                                    {f.face_distance != null ? f.face_distance.toFixed(4) : '-'}
                                                </TableCell>
                                                <TableCell className="text-gray-500">
                                                    {f.face_threshold != null ? f.face_threshold.toFixed(4) : '-'}
                                                </TableCell>
                                            </TableRow>
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
