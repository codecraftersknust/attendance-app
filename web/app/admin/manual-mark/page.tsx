'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CheckSquare } from 'lucide-react';

export default function AdminManualMarkPage() {
    const [form, setForm] = useState({ session_id: '', student_id: '', status: 'confirmed', reason: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.session_id || !form.student_id) {
            toast.error('Session ID and Student ID are required');
            return;
        }
        try {
            setSubmitting(true);
            const res = await apiClient.adminManualMark({
                session_id: Number(form.session_id),
                student_id: Number(form.student_id),
                status: form.status,
                reason: form.reason || undefined,
            });
            toast.success(`Marked ${res.status} for student ${res.student_id} in session ${res.session_id}`);
            setForm({ session_id: '', student_id: '', status: 'confirmed', reason: '' });
        } catch (e: any) {
            toast.error(e?.message || 'Failed to mark attendance');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 lg:px-8 space-y-6">
                <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Manual Mark</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manually mark attendance for a student in a session</p>
                </div>

                <Card className="border-gray-200/80 bg-white max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                            <CheckSquare className="h-4 w-4" />
                            Manual Attendance Mark
                        </CardTitle>
                        <CardDescription>
                            Override attendance status for a student. This bypasses all verification checks.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="session-id">Session ID</Label>
                                    <Input
                                        id="session-id"
                                        value={form.session_id}
                                        onChange={(e) => setForm((v) => ({ ...v, session_id: e.target.value }))}
                                        placeholder="e.g., 42"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="student-id">Student ID</Label>
                                    <Input
                                        id="student-id"
                                        value={form.student_id}
                                        onChange={(e) => setForm((v) => ({ ...v, student_id: e.target.value }))}
                                        placeholder="e.g., 15"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                                    <SelectTrigger id="status" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="present">Present</SelectItem>
                                        <SelectItem value="absent">Absent</SelectItem>
                                        <SelectItem value="flagged">Flagged</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason (optional)</Label>
                                <Input
                                    id="reason"
                                    value={form.reason}
                                    onChange={(e) => setForm((v) => ({ ...v, reason: e.target.value }))}
                                    placeholder="e.g., Student had technical difficulties"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-emerald-900 hover:bg-emerald-900/90 text-white"
                            >
                                {submitting ? 'Submitting...' : 'Submit'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
    );
}
