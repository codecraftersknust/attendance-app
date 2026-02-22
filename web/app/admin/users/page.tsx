'use client';

import { useEffect, useState } from 'react';
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
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<string>(ROLE_FILTER_NONE);

    const loadUsers = async (role?: 'student' | 'lecturer' | 'admin') => {
        try {
            setLoading(true);
            const data = await apiClient.adminUsers({ role, limit: 100 });
            setUsers(data);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleRoleChange = (value: string) => {
        setRoleFilter(value);
        loadUsers(value === ROLE_FILTER_NONE ? undefined : value as any);
    };

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 lg:px-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Users</h1>
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
                        <Button variant="outline" size="sm" onClick={() => loadUsers(roleFilter === ROLE_FILTER_NONE ? undefined : roleFilter as any)}>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Refresh
                        </Button>
                    </div>
                </div>

                <Card className="border-gray-200/80 bg-white">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Users
                            {!loading && <span className="text-sm font-normal text-gray-400">({users.length})</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading && users.length === 0 ? (
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
