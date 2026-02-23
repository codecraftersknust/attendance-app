'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Smartphone } from 'lucide-react';

export default function AdminDeviceResetPage() {
    const [userId, setUserId] = useState('');
    const [newDeviceId, setNewDeviceId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !newDeviceId) {
            toast.error('User ID and Device ID are required');
            return;
        }
        try {
            setSubmitting(true);
            const res = await apiClient.adminApproveDeviceReset(Number(userId), newDeviceId);
            toast.success(`Device reset approved for user ${res.user_id}`);
            setUserId('');
            setNewDeviceId('');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to approve device reset');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:px-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Device Resets</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Approve device changes for students</p>
                </div>

                <Card className="border-gray-200/80 bg-white shadow-md max-w-2xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                                <Smartphone className="h-4 w-4 text-emerald-600" />
                            </div>
                            Approve Device Reset
                        </CardTitle>
                        <CardDescription>
                            When a student changes their device, approve the new device ID to allow continued attendance tracking.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="user-id">User ID</Label>
                                <Input
                                    id="user-id"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    placeholder="e.g., 123"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-device-id">New Device ID</Label>
                                <Input
                                    id="new-device-id"
                                    value={newDeviceId}
                                    onChange={(e) => setNewDeviceId(e.target.value)}
                                    placeholder="Device identifier from student's phone"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-emerald-900 hover:bg-emerald-900/90 text-white"
                            >
                                {submitting ? 'Submitting...' : 'Approve Reset'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
    );
}
