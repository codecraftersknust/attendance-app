'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, X, BookOpen, Calendar, UserCheck, AlertTriangle, Gauge, Plus, Loader2, BarChart } from 'lucide-react';
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
			<div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:px-8 space-y-8">
				{/* Welcome section */}
				<div className="relative overflow-hidden rounded-2xl bg-emerald-900 px-6 py-8 shadow-xl">
					<div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
					<div className="relative">
						<h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
							Welcome back, {user?.full_name || user?.email}
						</h1>
						<p className="mt-1.5 text-emerald-100/90 text-sm sm:text-base">
							Here&apos;s an overview of your courses and attendance activity
						</p>
					</div>
				</div>

				{/* Stats grid */}
				{stats && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card className="group relative border-gray-200/80 bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
							<div className="absolute left-0 top-0 h-full w-1 bg-emerald-600" />
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
								<CardTitle className="text-sm font-semibold text-gray-600">Courses</CardTitle>
								<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200/80 transition-colors">
									<BookOpen className="h-4 w-4" />
								</div>
							</CardHeader>
							<CardContent className="pl-5">
								<div className="text-3xl font-bold text-gray-900 tracking-tight">{stats.total_courses}</div>
								<p className="text-xs text-gray-500 mt-1">Active courses</p>
							</CardContent>
						</Card>
						<Card className="group relative border-gray-200/80 bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
							<div className="absolute left-0 top-0 h-full w-1 bg-emerald-600" />
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
								<CardTitle className="text-sm font-semibold text-gray-600">Active sessions</CardTitle>
								<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200/80 transition-colors">
									<Calendar className="h-4 w-4" />
								</div>
							</CardHeader>
							<CardContent className="pl-5">
								<div className="text-3xl font-bold text-gray-900 tracking-tight">{stats.active_sessions}</div>
								<p className="text-xs text-gray-500 mt-1">{stats.total_sessions} total sessions</p>
							</CardContent>
						</Card>
						<Card className="group relative border-gray-200/80 bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
							<div className="absolute left-0 top-0 h-full w-1 bg-emerald-600" />
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
								<CardTitle className="text-sm font-semibold text-gray-600">Attendance marks</CardTitle>
								<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200/80 transition-colors">
									<UserCheck className="h-4 w-4" />
								</div>
							</CardHeader>
							<CardContent className="pl-5">
								<div className="text-3xl font-bold text-emerald-700 tracking-tight">{stats.confirmed_records}</div>
								<p className="text-xs text-gray-500 mt-1">{stats.total_attendance_records} total submissions</p>
							</CardContent>
						</Card>
						<Card className="group relative border-gray-200/80 bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
							<div className="absolute left-0 top-0 h-full w-1 bg-amber-500" />
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
								<CardTitle className="text-sm font-semibold text-gray-600">Needs review</CardTitle>
								<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-200/80 transition-colors">
									<AlertTriangle className="h-4 w-4" />
								</div>
							</CardHeader>
							<CardContent className="pl-5">
								<div className="text-3xl font-bold text-amber-600 tracking-tight">{stats.flagged_records}</div>
								<p className="text-xs text-gray-500 mt-1">Flagged attendance</p>
							</CardContent>
						</Card>
					</div>
				)}

				{stats && stats.total_attendance_records > 0 && (
					<Card className="border-gray-200/80 bg-white shadow-md">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
									<Gauge className="h-4 w-4 text-emerald-600" />
								</div>
								Attendance confirmed rate
							</CardTitle>
							<CardDescription className="text-xs text-gray-500 mt-1">
								Share of submissions you have confirmed (vs flagged for review).
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-4">
								<div className="relative h-3 flex-1 max-w-md rounded-full bg-gray-100 overflow-hidden">
									<div
										className="absolute inset-y-0 left-0 rounded-full bg-emerald-600 transition-all duration-500"
										style={{ width: `${confirmedRate}%` }}
									/>
								</div>
								<span className="font-bold text-gray-900 tabular-nums text-lg">{confirmedRate}%</span>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Quick actions */}
				<div className="flex flex-wrap gap-3">
					<Link href="/lecturer/create-session">
						<Button size="default" className="bg-emerald-900 hover:bg-emerald-900/90 text-white px-5">
							<Plus className="h-4 w-4 mr-2" />
							Create session
						</Button>
					</Link>
					<Link href="/lecturer/reports">
						<Button variant="outline" size="default" className="border-gray-200 hover:bg-gray-50 px-5">
							<BarChart className="h-4 w-4 mr-2" />
							View reports
						</Button>
					</Link>
				</div>

				{/* Your courses */}
				<Card className="border-gray-200/80 bg-white shadow-md overflow-hidden">
					<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
						<h2 className="text-lg font-semibold text-gray-900">Your Courses</h2>
						<Button className="bg-emerald-900 hover:bg-emerald-900/90 text-white" onClick={() => setShowBrowse(true)}>
							<Plus className="h-4 w-4 mr-2" />
							Add Course
						</Button>
					</div>
					<div className="p-4">
						{loading ? (
							<div className="flex items-center gap-2 py-8 text-gray-500">
								<Loader2 className="h-5 w-5 animate-spin" />
								<span>Loading courses...</span>
							</div>
						) : courses.length === 0 ? (
							<div className="text-center py-12">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
									<BookOpen className="h-8 w-8" />
								</div>
								<p className="mt-4 font-medium text-gray-600">No courses yet</p>
								<p className="mt-1 text-sm text-gray-500">Search for courses and add the ones you teach.</p>
								<Button variant="outline" size="sm" className="mt-5" onClick={() => setShowBrowse(true)}>
									<Search className="h-4 w-4 mr-2" />
									Browse courses
								</Button>
							</div>
						) : (
							<ul className="divide-y divide-gray-100">
								{courses.map((c) => (
									<li
										key={c.id}
										className="py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors rounded-lg px-3 -mx-1 group"
										onClick={() => {
											setSelectedCourseId(c.id);
											setShowCourseDetails(true);
										}}
									>
										<div className="flex-1 min-w-0">
											<div className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
												{c.code} — {c.name}
											</div>
											{c.description && (
												<div className="text-sm text-gray-600 truncate mt-0.5">{c.description}</div>
											)}
										</div>
										<div className="flex items-center gap-3 shrink-0">
											<span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">{c.semester}</span>
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
				</Card>
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
