'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, X, BookOpen, Calendar, UserCheck, AlertTriangle, Gauge, Plus, Loader2 } from 'lucide-react';
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

type MyCourse = {
	id: number;
	code: string;
	name: string;
	description: string | null;
	semester: string;
	is_active: boolean;
	session_count?: number;
};

type BrowseCourse = {
	id: number;
	code: string;
	name: string;
	description: string | null;
	semester: string;
	lecturer_id: number | null;
	lecturer_name: string | null;
	is_active: boolean;
	is_claimed: boolean;
	is_mine: boolean;
};

export default function LecturerDashboard() {
	const { user } = useAuth();
	const [courses, setCourses] = useState<MyCourse[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
	const [showCourseDetails, setShowCourseDetails] = useState(false);
	const [stats, setStats] = useState<{
		total_courses: number;
		total_sessions: number;
		active_sessions: number;
		total_attendance_records: number;
		confirmed_records: number;
		flagged_records: number;
	} | null>(null);

	// Browse / claim dialog
	const [showBrowse, setShowBrowse] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [browseResults, setBrowseResults] = useState<BrowseCourse[]>([]);
	const [browseLoading, setBrowseLoading] = useState(false);
	const [claimingId, setClaimingId] = useState<number | null>(null);

	// Unclaim dialog
	const [courseToRemove, setCourseToRemove] = useState<MyCourse | null>(null);
	const [removing, setRemoving] = useState(false);

	const loadAll = useCallback(async () => {
		try {
			setLoading(true);
			const [coursesData, dashboardData] = await Promise.all([
				apiClient.lecturerCourses(),
				apiClient.lecturerDashboard(),
			]);
			setCourses(coursesData as MyCourse[]);
			setStats(dashboardData);
		} catch (e: any) {
			toast.error(e?.message || 'Failed to load dashboard');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadAll();
	}, [loadAll]);

	// Browse courses search
	const handleSearch = useCallback(async (query: string) => {
		try {
			setBrowseLoading(true);
			const results = await apiClient.lecturerBrowseCourses({ search: query || undefined });
			setBrowseResults(results);
		} catch (e: any) {
			toast.error(e?.message || 'Failed to search courses');
		} finally {
			setBrowseLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!showBrowse) return;
		const timer = setTimeout(() => handleSearch(searchQuery), 300);
		return () => clearTimeout(timer);
	}, [searchQuery, showBrowse, handleSearch]);

	const handleClaim = async (courseId: number) => {
		try {
			setClaimingId(courseId);
			const result = await apiClient.lecturerClaimCourse(courseId);
			toast.success(result.message || 'Course added');
			await handleSearch(searchQuery);
			await loadAll();
		} catch (e: any) {
			toast.error(e?.message || 'Failed to add course');
		} finally {
			setClaimingId(null);
		}
	};

	const handleUnclaim = async () => {
		if (!courseToRemove) return;
		try {
			setRemoving(true);
			const result = await apiClient.lecturerUnclaimCourse(courseToRemove.id);
			toast.success(result.message || 'Course removed');
			setCourseToRemove(null);
			await loadAll();
		} catch (e: any) {
			toast.error(e?.message || 'Failed to remove course');
		} finally {
			setRemoving(false);
		}
	};

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
						<Button className="bg-emerald-900 hover:bg-emerald-900/90 text-white" onClick={() => setShowBrowse(true)}>
							<Plus className="h-4 w-4 mr-1" />
							Add Course
						</Button>
					</div>
					{loading ? (
						<p className="text-gray-500">Loading...</p>
					) : courses.length === 0 ? (
						<div className="text-center py-10 text-gray-500">
							<BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-300" />
							<p className="font-medium">No courses yet</p>
							<p className="text-sm mt-1">Search for courses and add the ones you teach.</p>
							<Button variant="outline" size="sm" className="mt-4" onClick={() => setShowBrowse(true)}>
								<Search className="h-4 w-4 mr-1" />
								Browse courses
							</Button>
						</div>
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
										{c.description && (
											<div className="text-sm text-gray-600 truncate">{c.description}</div>
										)}
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<span className="text-sm text-gray-500">{c.semester}</span>
										<Button
											variant="ghost"
											size="sm"
											className="text-gray-400 hover:text-red-600 hover:bg-red-50"
											onClick={(e) => {
												e.stopPropagation();
												setCourseToRemove(c);
											}}
										>
											<X className="h-4 w-4 mr-1" />
											Remove
										</Button>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			{/* Browse & Add courses dialog */}
			<Dialog open={showBrowse} onOpenChange={setShowBrowse}>
				<DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
					<DialogHeader>
						<DialogTitle>Search Courses</DialogTitle>
						<DialogDescription>
							Find courses created by the admin and add the ones you teach.
						</DialogDescription>
					</DialogHeader>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search by course code or name..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
							autoFocus
						/>
					</div>
					<div className="flex-1 overflow-y-auto -mx-6 px-6 min-h-0">
						{browseLoading ? (
							<div className="flex items-center justify-center py-8 text-gray-400">
								<Loader2 className="h-5 w-5 animate-spin mr-2" />
								Searching...
							</div>
						) : browseResults.length === 0 ? (
							<p className="text-sm text-gray-500 text-center py-8">
								{searchQuery ? 'No courses found.' : 'Type to search for courses.'}
							</p>
						) : (
							<ul className="divide-y">
								{browseResults.map((c) => (
									<li key={c.id} className="py-3 flex items-start justify-between gap-3">
										<div className="flex-1 min-w-0">
											<div className="font-medium text-sm">{c.code} - {c.name}</div>
											{c.description && (
												<div className="text-xs text-gray-500 truncate">{c.description}</div>
											)}
											<div className="text-xs text-gray-400 mt-0.5">
												{c.semester}
												{c.is_claimed && !c.is_mine && (
													<span className="ml-2 text-amber-600">Taught by {c.lecturer_name}</span>
												)}
											</div>
										</div>
										<div className="shrink-0">
											{c.is_mine ? (
												<span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-0.5">
													Your course
												</span>
											) : c.is_claimed ? (
												<span className="inline-flex items-center text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5">
													Taken
												</span>
											) : (
												<Button
													size="sm"
													className="bg-emerald-900 hover:bg-emerald-900/90 text-white h-7 text-xs"
													disabled={claimingId === c.id}
													onClick={() => handleClaim(c.id)}
												>
													{claimingId === c.id ? (
														<Loader2 className="h-3 w-3 animate-spin" />
													) : (
														<>
															<Plus className="h-3 w-3 mr-1" />
															Add
														</>
													)}
												</Button>
											)}
										</div>
									</li>
								))}
							</ul>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* Course details dialog */}
			<CourseDetailsDialog
				open={showCourseDetails}
				onOpenChange={setShowCourseDetails}
				courseId={selectedCourseId}
			/>

			{/* Remove (unclaim) confirmation dialog */}
			<Dialog open={!!courseToRemove} onOpenChange={(open) => !open && setCourseToRemove(null)}>
				<DialogContent onClick={(e) => e.stopPropagation()}>
					<DialogHeader>
						<DialogTitle>Remove course?</DialogTitle>
						<DialogDescription>
							{courseToRemove && (
								<>
									This will remove <strong>{courseToRemove.code} – {courseToRemove.name}</strong> from
									your courses. The course will remain in the system and can be claimed by another
									lecturer. Your existing sessions and attendance data are preserved.
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setCourseToRemove(null)} disabled={removing}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleUnclaim} disabled={removing}>
							{removing ? 'Removing…' : 'Remove course'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</ProtectedRoute>
	);
}
