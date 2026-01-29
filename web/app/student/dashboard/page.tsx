'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';

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

    // Load enrolled courses on mount
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
            const courses = await apiClient.studentGetCourses();
            setEnrolledCourses(courses as Course[]);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load enrolled courses');
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

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-lg sm:text-xl hidden sm:block py-4">Welcome, {user?.full_name || user?.email}</h1>

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
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
