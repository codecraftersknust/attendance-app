'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Trash2, BookOpen, UserCheck, CheckCircle2, Gauge, AlertTriangle } from 'lucide-react';
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
        total_sessions: number;
        attendance_marked_count: number;
        confirmed_count: number;
        profile_complete: boolean;
        enrollment_open: boolean;
        current_semester: string;
        is_on_break: boolean;
        academic_year: string;
    } | null>(null);

    type RecommendedCourse = { id: number; code: string; name: string; description: string | null; semester: string; level: number; programme: string; lecturer_name: string | null; is_enrolled: boolean };
    const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([]);
    const [loadingRecommended, setLoadingRecommended] = useState(false);

    const [history, setHistory] = useState<any[]>([]);

    // Load enrolled courses (and dashboard stats) on mount
    useEffect(() => {
        loadEnrolledCourses();
        loadRecommendedCourses();
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

    const loadRecommendedCourses = async () => {
        try {
            setLoadingRecommended(true);
            const data = await apiClient.studentGetRecommendedCourses();
            setRecommendedCourses(data);
        } catch { /* profile may be incomplete */ } finally {
            setLoadingRecommended(false);
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
            await Promise.all([loadEnrolledCourses(), loadRecommendedCourses()]);
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

    const attendanceRate = stats && stats.total_sessions > 0
        ? Math.round((stats.confirmed_count / stats.total_sessions) * 100)
        : 0;

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 lg:px-8 space-y-6">
                <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Welcome, {user?.full_name || user?.email}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Your courses and attendance at a glance</p>
                </div>

                {/* Incomplete profile alert */}
                {stats && !stats.profile_complete && (
                    <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
                        <AlertTriangle className="size-5 shrink-0 mt-0.5 text-amber-500" />
                        <div className="flex-1 text-sm">
                            <p className="font-semibold">Incomplete profile</p>
                            <p className="mt-0.5">
                                Your level and programme are not set. Please{' '}
                                <Link href="/profile" className="underline underline-offset-2 font-medium hover:text-amber-900">
                                    visit your profile
                                </Link>{' '}
                                to complete your setup.
                            </p>
                        </div>
                    </div>
                )}

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

                {/* Overall attendance rate gauge */}
                {stats && stats.total_sessions > 0 && (
                    <Card className="border-gray-200/80 bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Gauge className="h-4 w-4" />
                                Overall attendance rate
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500">
                                {stats.confirmed_count} confirmed out of {stats.total_sessions} total sessions across your enrolled courses.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="relative h-1 flex-1 max-w-xs rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full bg-emerald-600 transition-all duration-500"
                                        style={{ width: `${attendanceRate}%` }}
                                    />
                                </div>
                                <span className="font-bold text-gray-900 tabular-nums">{attendanceRate}%</span>
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

                {/* Recommended Courses for this Semester */}
                {stats?.profile_complete && (
                    <div className="bg-white rounded-md shadow p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold">
                                Courses for {stats.current_semester}
                                {stats.academic_year && <span className="ml-1 text-sm font-normal text-gray-500">({stats.academic_year})</span>}
                            </h2>
                        </div>

                        {/* Enrolment closed banner */}
                        {!stats.enrollment_open && (
                            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800 mb-3">
                                <AlertTriangle className="size-4 shrink-0 mt-0.5 text-blue-500" />
                                <p className="text-sm">Enrolment is currently <strong>closed</strong>. Courses will be available to join at the start of the next semester.</p>
                            </div>
                        )}

                        {loadingRecommended ? (
                            <p className="text-gray-600 text-sm">Loading courses...</p>
                        ) : recommendedCourses.length === 0 ? (
                            <p className="text-gray-600 text-sm">No courses found for your programme and level this semester.</p>
                        ) : (
                            <ul className="divide-y">
                                {recommendedCourses.map((course) => (
                                    <li key={course.id} className="py-3 flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium">{course.code} - {course.name}</div>
                                            {course.description && (
                                                <div className="text-sm text-gray-600 mt-0.5 truncate">{course.description}</div>
                                            )}
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                {course.semester} {course.lecturer_name && `• ${course.lecturer_name}`}
                                            </div>
                                        </div>
                                        {course.is_enrolled ? (
                                            <span className="ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                Enrolled
                                            </span>
                                        ) : stats.enrollment_open ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEnroll(course.id)}
                                                disabled={enrollingIds.has(course.id)}
                                                className="ml-4 shrink-0"
                                            >
                                                <Plus className="h-4 w-4" />
                                                {enrollingIds.has(course.id) ? 'Adding...' : 'Enrol'}
                                            </Button>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Enrolled Courses Section */}
                <div className="bg-white rounded-md shadow p-4">
                    <h2 className="text-lg font-semibold mb-3">My Enrolled Courses</h2>
                    {loading ? (
                        <p className="text-gray-600">Loading...</p>
                    ) : enrolledCourses.length === 0 ? (
                        <p className="text-gray-600 text-sm">No enrolled courses yet. Courses you enrol in will appear here.</p>
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
