'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, BookOpen, Calendar, UserCheck, AlertTriangle, Gauge } from 'lucide-react';
import { CreateCourseDialog } from '@/components/lecturer/create-course-dialog';
import { CourseDetailsDialog } from '@/components/lecturer/course-details-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';

export default function LecturerDashboard() {
	const { user } = useAuth();
	const [courses, setCourses] = useState<Array<{ id: number; code: string; name: string; description: string | null; semester: string; is_active: boolean }>>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [showCreate, setShowCreate] = useState<boolean>(false);
	const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
	const [showCourseDetails, setShowCourseDetails] = useState<boolean>(false);
	const [courseToDelete, setCourseToDelete] = useState<{ id: number; code: string; name: string } | null>(null);
	const [deleting, setDeleting] = useState<boolean>(false);
	const [stats, setStats] = useState<{
		total_courses: number;
		total_sessions: number;
		active_sessions: number;
		total_attendance_records: number;
		confirmed_records: number;
		flagged_records: number;
	} | null>(null);

	const loadAll = async () => {
		try {
			setLoading(true);
			const [coursesData, dashboardData] = await Promise.all([
				apiClient.lecturerCourses(),
				apiClient.lecturerDashboard(),
			]);
			setCourses(coursesData as any);
			setStats(dashboardData);
		} catch (e: any) {
			toast.error(e?.message || 'Failed to load dashboard');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadAll();
	}, []);

	const refreshCourses = async () => {
		try {
			setLoading(true);
			const [coursesData, dashboardData] = await Promise.all([
				apiClient.lecturerCourses(),
				apiClient.lecturerDashboard(),
			]);
			setCourses(coursesData as any);
			setStats(dashboardData);
		} catch (e: any) {
			toast.error(e?.message || 'Failed to refresh');
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteCourse = async () => {
		if (!courseToDelete) return;
		try {
			setDeleting(true);
			await apiClient.lecturerDeleteCourse(courseToDelete.id);
			toast.success('Course deleted');
			setCourseToDelete(null);
			await refreshCourses();
		} catch (e: any) {
			toast.error(e?.message || 'Failed to delete course');
		} finally {
			setDeleting(false);
		}
	};

	// creation is handled in the dialog component

	const confirmedRate = stats && stats.total_attendance_records > 0
		? Math.round((stats.confirmed_records / stats.total_attendance_records) * 100)
		: 100;

	return (
		<ProtectedRoute allowedRoles={['lecturer']}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 lg:px-8 space-y-6">
				<div>
					<h1 className="text-lg sm:text-xl font-semibold text-gray-900">Welcome, {user?.full_name || user?.email}</h1>
					<p className="text-sm text-gray-500 mt-0.5">Overview of your courses and attendance</p>
				</div>

				{/* Stats row */}
				{stats && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card className="border-gray-200/80 bg-white">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-gray-600">Courses</CardTitle>
								<BookOpen className="h-4 w-4 text-emerald-600" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-gray-900">{stats.total_courses}</div>
								<p className="text-xs text-gray-500 mt-0.5">Active courses</p>
							</CardContent>
						</Card>
						<Card className="border-gray-200/80 bg-white">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-gray-600">Active sessions</CardTitle>
								<Calendar className="h-4 w-4 text-blue-600" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-gray-900">{stats.active_sessions}</div>
								<p className="text-xs text-gray-500 mt-0.5">{stats.total_sessions} total sessions</p>
							</CardContent>
						</Card>
						<Card className="border-gray-200/80 bg-white">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-gray-600">Attendance marks</CardTitle>
								<UserCheck className="h-4 w-4 text-emerald-600" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-emerald-700">{stats.confirmed_records}</div>
								<p className="text-xs text-gray-500 mt-0.5">{stats.total_attendance_records} total submissions</p>
							</CardContent>
						</Card>
						<Card className="border-gray-200/80 bg-white">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-gray-600">Needs review</CardTitle>
								<AlertTriangle className="h-4 w-4 text-amber-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-amber-600">{stats.flagged_records}</div>
								<p className="text-xs text-gray-500 mt-0.5">Flagged attendance</p>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Confirmed rate gauge */}
				{stats && stats.total_attendance_records > 0 && (
					<Card className="border-gray-200/80 bg-white">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
								<Gauge className="h-4 w-4" />
								Attendance confirmed rate
							</CardTitle>
							<CardDescription className="text-xs text-gray-500">
								Share of submissions you have confirmed (vs flagged for review).
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-4">
								<div className="relative h-12 flex-1 max-w-xs rounded-full bg-gray-100 overflow-hidden">
									<div
										className="absolute inset-y-0 left-0 rounded-full bg-emerald-600 transition-all duration-500"
										style={{ width: `${confirmedRate}%` }}
									/>
								</div>
								<span className="text-2xl font-bold text-gray-900 tabular-nums">{confirmedRate}%</span>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Quick action */}
				<div className="flex flex-wrap gap-2">
					<Link href="/lecturer/create-session">
						<Button size="sm" className="bg-emerald-900 hover:bg-emerald-900/90 text-white">
							Create session
						</Button>
					</Link>
					<Link href="/lecturer/reports">
						<Button variant="outline" size="sm">
							View reports
						</Button>
					</Link>
				</div>

				<div className="bg-white rounded-md shadow p-4">
					<div className="flex items-center justify-between mb-3">
						<h2 className="text-lg font-semibold">Your Courses</h2>
						<Button className="bg-emerald-900 hover:bg-emerald-900/90 text-white" onClick={() => setShowCreate(true)}>
							<Plus />
							Create Course
						</Button>
					</div>
					{loading ? (
						<p>Loading...</p>
					) : courses.length === 0 ? (
						<p className="text-gray-600">No courses yet. Create one from the lecturer menu.</p>
					) : (
						<ul className="divide-y">
							{courses.map((c) => (
								<li 
									key={c.id} 
									className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors rounded-md px-2 -mx-2 group"
									onClick={() => {
										setSelectedCourseId(c.id);
										setShowCourseDetails(true);
									}}
								>
									<div className="flex-1 min-w-0">
										<div className="font-medium">{c.code} - {c.name}</div>
										{c.description ? (
											<div className="text-sm text-gray-600 truncate">{c.description}</div>
										) : null}
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<span className="text-sm text-gray-500">{c.semester}</span>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
											onClick={(e) => {
												e.stopPropagation();
												setCourseToDelete({ id: c.id, code: c.code, name: c.name });
											}}
											aria-label="Delete course"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			<CreateCourseDialog open={showCreate} onOpenChange={setShowCreate} onCreated={refreshCourses} />
			<CourseDetailsDialog 
				open={showCourseDetails} 
				onOpenChange={setShowCourseDetails} 
				courseId={selectedCourseId} 
			/>

			<Dialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
				<DialogContent onClick={(e) => e.stopPropagation()}>
					<DialogHeader>
						<DialogTitle>Delete course?</DialogTitle>
						<DialogDescription>
							{courseToDelete && (
								<>
									This will permanently delete <strong>{courseToDelete.code} – {courseToDelete.name}</strong> and all its sessions. Enrolled students will be removed from this course. This cannot be undone.
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setCourseToDelete(null)} disabled={deleting}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDeleteCourse} disabled={deleting}>
							{deleting ? 'Deleting…' : 'Delete course'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</ProtectedRoute>
	);
}