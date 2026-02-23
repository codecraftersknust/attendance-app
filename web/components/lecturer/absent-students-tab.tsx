'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserX } from 'lucide-react';

interface AbsentStudent {
    id: number;
    user_id: string | null;
    full_name: string | null;
    email: string;
    status: string;
}

interface AbsentStudentsTabProps {
    sessionId: number;
}

export function AbsentStudentsTab({ sessionId }: AbsentStudentsTabProps) {
    const [students, setStudents] = useState<AbsentStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAbsentStudents();
    }, [sessionId]);

    async function loadAbsentStudents() {
        try {
            setLoading(true);
            const data = await apiClient.lecturerGetAbsentStudents(sessionId);
            setStudents(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load absent students');
        } finally {
            setLoading(false);
        }
    }

    function getInitials(name: string | null, email: string) {
        if (name) {
            return name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        return email[0].toUpperCase();
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="size-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <Card className="border-gray-200/80 bg-white shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                    <span>Absent Students</span>
                    <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-200">
                        Total: {students.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {students.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <UserX className="size-10 mx-auto mb-3 text-gray-300" />
                        <p>No absent students found for this session.</p>
                        <p className="text-sm mt-1">Everyone enrolled was present!</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>ID</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-red-100 text-red-700 text-xs">
                                                    {getInitials(student.full_name, student.email)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>{student.full_name || 'No Name'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{student.email}</TableCell>
                                    <TableCell>{student.user_id || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                            Absent
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
