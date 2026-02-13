'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Trash2, BookOpen, UserCheck, CheckCircle2, Gauge } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';

type Course = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    semester: string;
    lecturer_name: string | null;
    is_enrolled?: boolean;
    enrolled_at?: string;
};

export default function StudentDashboard() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<Course[]>([]);
    const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [searching, setSearching] = useState<boolean>(false);
    const [enrollingIds, setEnrollingIds] = useState<Set<number>>(new Set());
    const [courseToDrop, setCourseToDrop] = useState<{ id: number; code: string; name: string } | null>(null);
    const [dropping, setDropping] = useState<boolean>(false);
    const [stats, setStats] = useState<{
        enrolled_courses: number;
        attendance_marked_count: number;
        confirmed_count: number;
    } | null>(null);

    const [history, setHistory] = useState<any[]>([]);

    // Load enrolled courses (and dashboard stats) on mount
    useEffect(() => {
        loadEnrolledCourses();
    }, []);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                performSearch(searchQuery.trim());
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const loadEnrolledCourses = async () => {
        try {
            setLoading(true);
            const [courses, dashboardData, historyData] = await Promise.all([
                apiClient.studentGetCourses(),
                apiClient.studentDashboard(),
                apiClient.studentGetAttendanceHistory(),
            ]);
            setEnrolledCourses(courses as Course[]);
            setStats(dashboardData);
            setHistory(historyData);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const performSearch = async (query: string) => {
        try {
            setSearching(true);
            const results = await apiClient.studentSearchCourses(query);
            setSearchResults(results as Course[]);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to search courses');
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleEnroll = async (courseId: number) => {
        if (enrollingIds.has(courseId)) return;

        try {
            setEnrollingIds((prev) => new Set(prev).add(courseId));
            await apiClient.studentEnrollInCourse(courseId);
            toast.success('Course added successfully');
            // Refresh both lists
            await loadEnrolledCourses();
            if (searchQuery.trim()) {
                await performSearch(searchQuery.trim());
            }
        } catch (e: any) {
            toast.error(e?.message || 'Failed to enroll in course');
        } finally {
            setEnrollingIds((prev) => {
                const next = new Set(prev);
                next.delete(courseId);
                return next;
            });
        }
    };

    const handleDropCourse = async () => {
        if (!courseToDrop) return;
        try {
            setDropping(true);
            await apiClient.studentUnenrollFromCourse(courseToDrop.id);
            toast.success('Dropped course');
            setCourseToDrop(null);
            await loadEnrolledCourses();
        } catch (e: any) {
            toast.error(e?.message || 'Failed to drop course');
        } finally {
            setDropping(false);
        }
    };

    const confirmedRate = stats && stats.attendance_marked_count > 0
        ? Math.round((stats.confirmed_count / stats.attendance_marked_count) * 100)
        : 100;

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 lg:px-8 space-y-6">
                <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Welcome, {user?.full_name || user?.email}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Your courses and attendance at a glance</p>
                </div>

                {/* Stats row */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border-gray-200/80 bg-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Enrolled courses</CardTitle>
                                <BookOpen className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900">{stats.enrolled_courses}</div>
                                <p className="text-xs text-gray-500 mt-0.5">Courses you are in</p>
                            </CardContent>
                        </Card>
                        <Card className="border-gray-200/80 bg-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Attendance marked</CardTitle>
                                <UserCheck className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900">{stats.attendance_marked_count}</div>
                                <p className="text-xs text-gray-500 mt-0.5">Sessions you signed in</p>
                            </CardContent>
                        </Card>
                        <Card className="border-gray-200/80 bg-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Confirmed</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-700">{stats.confirmed_count}</div>
                                <p className="text-xs text-gray-500 mt-0.5">Approved by lecturer</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Confirmed rate gauge */}
                {stats && stats.attendance_marked_count > 0 && (
                    <Card className="border-gray-200/80 bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Gauge className="h-4 w-4" />
                                Attendance confirmed rate
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500">
                                Share of your attendance marks that have been confirmed (vs pending review).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="relative h-1 flex-1 max-w-xs rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full bg-emerald-600 transition-all duration-500"
                                        style={{ width: `${confirmedRate}%` }}
                                    />
                                </div>
                                <span className="font-bold text-gray-900 tabular-nums">{confirmedRate}%</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quick action */}
                <div>
                    <Link href="/student/mark-attendance">
                        <Button className="bg-emerald-900 hover:bg-emerald-900/90 text-white">
                            Mark attendance
                        </Button>
                    </Link>
                </div>

                {/* Attendance History */}
                <div className="bg-white rounded-md shadow p-4 mb-4">
                    <h2 className="text-lg font-semibold mb-3">Recent Attendance History</h2>
                    {loading ? (
                        <p className="text-gray-600">Loading history...</p>
                    ) : history.length === 0 ? (
                        <p className="text-gray-600">No attendance history available yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {history.map((record) => (
                                        <tr key={record.session_id}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(record.starts_at || '').toLocaleDateString()}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                                {record.course_code}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                    ${record.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                        record.status === 'flagged' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'}`}>
                                                    {record.status === 'confirmed' ? 'Present' :
                                                        record.status === 'flagged' ? 'Flagged' : 'Absent'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                                {record.session_code}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Search Section */}
                <div className="bg-white rounded-md shadow p-4 mb-4">
                    <h2 className="text-lg font-semibold mb-3">Search Courses</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Search by course code or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {searching && (
                        <p className="text-sm text-gray-500 mt-2">Searching...</p>
                    )}

                    {searchResults.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h3 className="text-sm font-medium text-gray-700">Search Results</h3>
                            <ul className="divide-y">
                                {searchResults.map((course) => (
                                    <li key={course.id} className="py-3 flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium">{course.code} - {course.name}</div>
                                            {course.description && (
                                                <div className="text-sm text-gray-600 mt-1">{course.description}</div>
                                            )}
                                            <div className="text-xs text-gray-500 mt-1">
                                                {course.semester} {course.lecturer_name && `• ${course.lecturer_name}`}
                                            </div>
                                        </div>
                                        {course.is_enrolled ? (
                                            <span className="text-sm text-gray-500">Enrolled</span>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEnroll(course.id)}
                                                disabled={enrollingIds.has(course.id)}
                                                className="ml-4"
                                            >
                                                <Plus className="h-4 w-4" />
                                                {enrollingIds.has(course.id) ? 'Adding...' : 'Add'}
                                            </Button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {searchQuery.trim() && !searching && searchResults.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">No courses found.</p>
                    )}
                </div>

                {/* Enrolled Courses Section */}
                <div className="bg-white rounded-md shadow p-4">
                    <h2 className="text-lg font-semibold mb-3">My Courses</h2>
                    {loading ? (
                        <p className="text-gray-600">Loading...</p>
                    ) : enrolledCourses.length === 0 ? (
                        <p className="text-gray-600">No enrolled courses yet. Search for courses above to add them.</p>
                    ) : (
                        <ul className="divide-y">
                            {enrolledCourses.map((course) => (
                                <li key={course.id} className="py-3 flex items-center justify-between group">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium">{course.code} - {course.name}</div>
                                        {course.description && (
                                            <div className="text-sm text-gray-600 mt-1 truncate">{course.description}</div>
                                        )}
                                        <div className="text-xs text-gray-500 mt-1">
                                            {course.semester} {course.lecturer_name && `• ${course.lecturer_name}`}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => setCourseToDrop({ id: course.id, code: course.code, name: course.name })}
                                        aria-label="Drop course"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <Dialog open={!!courseToDrop} onOpenChange={(open) => !open && setCourseToDrop(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Drop course?</DialogTitle>
                        <DialogDescription>
                            {courseToDrop && (
                                <>
                                    You will be removed from <strong>{courseToDrop.code} – {courseToDrop.name}</strong>. You can search and re-enroll later if needed.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCourseToDrop(null)} disabled={dropping}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDropCourse} disabled={dropping}>
                            {dropping ? 'Dropping…' : 'Drop course'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ProtectedRoute>
    );
}
