'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Users, RefreshCw } from 'lucide-react';

const ROLE_FILTER_NONE = '__all__';

export default function AdminUsersPage() {
    const [roleFilter, setRoleFilter] = useState<string>(ROLE_FILTER_NONE);

    const roleArg = roleFilter === ROLE_FILTER_NONE ? undefined : (roleFilter as 'student' | 'lecturer' | 'admin');
    const { data: users = [], error, isLoading, mutate } = useSWR(
        ['admin-users', roleFilter],
        () => apiClient.adminUsers({ role: roleArg, limit: 100 }),
        { dedupingInterval: 30000 }
    );

    useEffect(() => { if (error) toast.error(error?.message || 'Failed to load users'); }, [error]);

    const handleRoleChange = (value: string) => setRoleFilter(value);

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:px-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Users</h1>
                        <p className="text-sm text-gray-500 mt-0.5">All registered users in the system</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={roleFilter} onValueChange={handleRoleChange}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ROLE_FILTER_NONE}>All roles</SelectItem>
                                <SelectItem value="student">Students</SelectItem>
                                <SelectItem value="lecturer">Lecturers</SelectItem>
                                <SelectItem value="admin">Admins</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => mutate()}>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Refresh
                        </Button>
                    </div>
                </div>

                <Card className="border-gray-200/80 bg-white shadow-md overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                                <Users className="h-4 w-4 text-emerald-600" />
                            </div>
                            Users
                            {!isLoading && <span className="text-sm font-normal text-gray-400">({users.length})</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading && users.length === 0 ? (
                            <p className="text-gray-500 py-4">Loading...</p>
                        ) : users.length === 0 ? (
                            <p className="text-gray-500 py-4">No users found.</p>
                        ) : (
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>User ID</TableHead>
                                            <TableHead>Device</TableHead>
                                            <TableHead>Records</TableHead>
                                            <TableHead>Created</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((u: any) => (
                                            <TableRow key={u.id}>
                                                <TableCell className="font-medium">{u.id}</TableCell>
                                                <TableCell>{u.email}</TableCell>
                                                <TableCell>{u.full_name || '-'}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                        u.role === 'lecturer' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-gray-500">{u.user_id || '-'}</TableCell>
                                                <TableCell className="text-gray-500">{u.device_id_hash || '-'}</TableCell>
                                                <TableCell>{u.attendance_count ?? '-'}</TableCell>
                                                <TableCell className="text-gray-500">
                                                    {u.created_at?.replace('T', ' ').slice(0, 19)}
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
