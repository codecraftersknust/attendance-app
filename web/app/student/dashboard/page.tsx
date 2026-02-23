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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:px-8 space-y-8">
                {/* Welcome section */}
                <div className="relative overflow-hidden rounded-2xl bg-emerald-900 px-6 py-8 shadow-xl">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
                    <div className="relative">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                            Welcome, {user?.full_name || user?.email}
                        </h1>
                        <p className="mt-1.5 text-emerald-100/90 text-sm sm:text-base">
                            Your courses and attendance at a glance
                        </p>
                    </div>
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
                        <Card className="group relative border-gray-200/80 bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                            <div className="absolute left-0 top-0 h-full w-1 bg-emerald-600" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
                                <CardTitle className="text-sm font-semibold text-gray-600">Enrolled courses</CardTitle>
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                    <BookOpen className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="pl-5">
                                <div className="text-2xl font-bold text-gray-900">{stats.enrolled_courses}</div>
                                <p className="text-xs text-gray-500 mt-0.5">Courses you are in</p>
                            </CardContent>
                        </Card>
                        <Card className="group relative border-gray-200/80 bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                            <div className="absolute left-0 top-0 h-full w-1 bg-emerald-600" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
                                <CardTitle className="text-sm font-semibold text-gray-600">Attendance marked</CardTitle>
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                    <UserCheck className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="pl-5">
                                <div className="text-2xl font-bold text-gray-900">{stats.attendance_marked_count}</div>
                                <p className="text-xs text-gray-500 mt-0.5">Sessions you signed in</p>
                            </CardContent>
                        </Card>
                        <Card className="group relative border-gray-200/80 bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                            <div className="absolute left-0 top-0 h-full w-1 bg-emerald-600" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
                                <CardTitle className="text-sm font-semibold text-gray-600">Confirmed</CardTitle>
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="pl-5">
                                <div className="text-2xl font-bold text-emerald-700">{stats.confirmed_count}</div>
                                <p className="text-xs text-gray-500 mt-0.5">Approved by lecturer</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Overall attendance rate gauge */}
                {stats && stats.total_sessions > 0 && (
                    <Card className="border-gray-200/80 bg-white shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                                    <Gauge className="h-4 w-4 text-emerald-600" />
                                </div>
                                Overall attendance rate
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500 mt-1">
                                {stats.confirmed_count} confirmed out of {stats.total_sessions} total sessions across your enrolled courses.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="relative h-3 flex-1 max-w-md rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full bg-emerald-600 transition-all duration-500"
                                        style={{ width: `${attendanceRate}%` }}
                                    />
                                </div>
                                <span className="font-bold text-gray-900 tabular-nums text-lg">{attendanceRate}%</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quick action */}
                <div>
                    <Link href="/student/mark-attendance">
                        <Button className="bg-emerald-900 hover:bg-emerald-900/90 text-white px-5">
                            <Plus className="h-4 w-4 mr-2" />
                            Mark attendance
                        </Button>
                    </Link>
                </div>

                {/* Attendance History */}
                <Card className="border-gray-200/80 bg-white shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Attendance History</h2>
                    </div>
                    <div className="p-4">
                    {loading ? (
                        <p className="text-gray-500 py-6">Loading history...</p>
                    ) : history.length === 0 ? (
                        <p className="text-gray-500 py-6">No attendance history available yet.</p>
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
                </Card>

                {/* Recommended Courses for this Semester */}
                {stats?.profile_complete && (
                    <Card className="border-gray-200/80 bg-white shadow-md overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Courses for {stats.current_semester}
                            {stats.academic_year && <span className="ml-1 text-sm font-normal text-gray-500">({stats.academic_year})</span>}
                        </h2>
                        {/* Enrolment closed banner */}
                        {!stats.enrollment_open && (
                            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 mt-4">
                                <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-500" />
                                <p className="text-sm">Enrolment is currently <strong>closed</strong>. Courses will be available to join at the start of the next semester.</p>
                            </div>
                        )}
                    </div>
                    <div className="px-4 py-2">
                        {loadingRecommended ? (
                            <p className="text-gray-500 text-sm py-4">Loading courses...</p>
                        ) : recommendedCourses.length === 0 ? (
                            <p className="text-gray-500 text-sm py-4">No courses found for your programme and level this semester.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {recommendedCourses.map((course) => (
                                    <li key={course.id} className="py-2 flex items-center justify-between">
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
                </Card>
                )}

                {/* Enrolled Courses Section */}
                <Card className="border-gray-200/80 bg-white shadow-md overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">My Enrolled Courses</h2>
                    </div>
                    <div className="px-4 py-2">
                    {loading ? (
                        <p className="text-gray-500 py-4">Loading...</p>
                    ) : enrolledCourses.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4">No enrolled courses yet. Courses you enrol in will appear here.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {enrolledCourses.map((course) => (
                                <li key={course.id} className="py-2 flex items-center justify-between group">
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
                </Card>
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
