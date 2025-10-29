'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateCourseDialog } from '@/components/lecturer/create-course-dialog';

export default function LecturerDashboard() {
	const { user } = useAuth();
	const [courses, setCourses] = useState<Array<{ id: number; code: string; name: string; description: string | null; semester: string; is_active: boolean }>>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [showCreate, setShowCreate] = useState<boolean>(false);

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				const data = await apiClient.lecturerCourses();
				setCourses(data as any);
			} catch (e: any) {
				toast.error(e?.message || 'Failed to load courses');
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	const refreshCourses = async () => {
		try {
			setLoading(true);
			const data = await apiClient.lecturerCourses();
			setCourses(data as any);
		} catch (e: any) {
			toast.error(e?.message || 'Failed to refresh courses');
		} finally {
			setLoading(false);
		}
	};

	// creation is handled in the dialog component

	return (
		<ProtectedRoute allowedRoles={['lecturer']}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h1 className="text-lg sm:text-xl hidden sm:block py-4">Welcome, {user?.full_name || user?.email}</h1>
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
								<li key={c.id} className="py-3 flex items-center justify-between">
									<div>
										<div className="font-medium">{c.code} - {c.name}</div>
										{c.description ? (
											<div className="text-sm text-gray-600">{c.description}</div>
										) : null}
									</div>
									<div className="text-sm text-gray-500">{c.semester}</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			<CreateCourseDialog open={showCreate} onOpenChange={setShowCreate} onCreated={refreshCourses} />
		</ProtectedRoute>
	);
}