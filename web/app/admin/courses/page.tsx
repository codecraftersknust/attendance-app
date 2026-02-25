'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Trash2, Eye, Pencil, BookOpen, Users } from 'lucide-react';

type Course = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    semester: string;
    level: number;
    programme: string;
    is_active: boolean;
    lecturer_name: string | null;
    enrolled_count: number;
    session_count: number;
    created_at: string;
};

type CourseDetails = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    semester: string;
    level: number;
    programme: string;
    is_active: boolean;
    lecturer_id: number | null;
    lecturer_name: string | null;
    created_at: string;
    enrolled_students: Array<{
        id: number;
        user_id: string | null;
        full_name: string | null;
        email: string;
        enrolled_at: string;
    }>;
    enrolled_count: number;
    recent_sessions: Array<{
        id: number;
        code: string;
        is_active: boolean;
        starts_at: string | null;
        ends_at: string | null;
        attendance_count: number;
    }>;
};

type CreateCoursePayload = {
    code: string;
    name: string;
    description?: string;
    semester?: string;
    level?: number;
    programme?: string;
};

const SEMESTER_OPTIONS = ['1st Semester', '2nd Semester'] as const;
const LEVEL_OPTIONS = [100, 200, 300, 400] as const;
const PROGRAMME_OPTIONS = [
    'Computer Engineering',
    'Telecommunication Engineering',
    'Electrical Engineering',
    'Biomedical Engineering',
] as const;
const NONE_VALUE = '__none__';

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState<CreateCoursePayload>({ code: '', name: '', description: '', semester: '', level: 100, programme: '' });
    const [creating, setCreating] = useState(false);

    const [showDetails, setShowDetails] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);

    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState<{ code: string; name: string; description: string; semester: string; level: number; programme: string }>({ code: '', name: '', description: '', semester: '', level: 100, programme: '' });
    const [editCourseId, setEditCourseId] = useState<number | null>(null);
    const [updating, setUpdating] = useState(false);


    const loadCourses = async (search?: string) => {
        try {
            setLoading(true);
            const data = await apiClient.adminGetCourses({ search, limit: 100 });
            setCourses(data);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadCourses(searchQuery.trim() || undefined);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.code.trim() || !createForm.name.trim()) {
            toast.error('Course code and name are required');
            return;
        }
        try {
            setCreating(true);
            await apiClient.adminCreateCourse({
                code: createForm.code.trim(),
                name: createForm.name.trim(),
                description: createForm.description?.trim() || undefined,
                semester: createForm.semester?.trim() || undefined,
                level: createForm.level,
                programme: createForm.programme?.trim() || undefined,
            });
            toast.success('Course created');
            setShowCreate(false);
            setCreateForm({ code: '', name: '', description: '', semester: '', level: 100, programme: '' });
            await loadCourses(searchQuery.trim() || undefined);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to create course');
        } finally {
            setCreating(false);
        }
    };

    const handleViewDetails = async (courseId: number) => {
        try {
            setShowDetails(true);
            setDetailsLoading(true);
            const data = await apiClient.adminGetCourseDetails(courseId);
            setCourseDetails(data);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load course details');
            setShowDetails(false);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!courseToDelete) return;
        try {
            setDeleting(true);
            await apiClient.adminDeleteCourse(courseToDelete.id);
            toast.success('Course deleted');
            setCourseToDelete(null);
            await loadCourses(searchQuery.trim() || undefined);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to delete course');
        } finally {
            setDeleting(false);
        }
    };

    const openEdit = (course: Course) => {
        setEditCourseId(course.id);
        setEditForm({
            code: course.code,
            name: course.name,
            description: course.description || '',
            semester: course.semester || '',
            level: course.level || 100,
            programme: course.programme || '',
        });
        setShowEdit(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editCourseId) return;
        try {
            setUpdating(true);
            await apiClient.adminUpdateCourse(editCourseId, {
                code: editForm.code.trim() || undefined,
                name: editForm.name.trim() || undefined,
                description: editForm.description.trim() || undefined,
                semester: editForm.semester.trim() || undefined,
                level: editForm.level,
                programme: editForm.programme.trim() || undefined,
            });
            toast.success('Course updated');
            setShowEdit(false);
            await loadCourses(searchQuery.trim() || undefined);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to update course');
        } finally {
            setUpdating(false);
        }
    };


    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:px-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Courses</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage all courses across the school</p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setShowCreate(true)}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Create Course
                    </Button>
                </div>


                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        type="text"
                        placeholder="Search by code or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Card className="border-gray-200/80 bg-white shadow-md overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                                <BookOpen className="h-4 w-4 text-emerald-600" />
                            </div>
                            All Courses
                            {!loading && <span className="text-sm font-normal text-gray-400">({courses.length})</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-gray-500 py-4">Loading courses...</p>
                        ) : courses.length === 0 ? (
                            <p className="text-gray-500 py-4">No courses found. Create one to get started.</p>
                        ) : (
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Level</TableHead>
                                            <TableHead>Programme</TableHead>
                                            <TableHead>Semester</TableHead>
                                            <TableHead>Lecturer</TableHead>
                                            <TableHead className="text-center">Students</TableHead>
                                            <TableHead className="text-center">Sessions</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {courses.map((course) => (
                                            <TableRow key={course.id}>
                                                <TableCell className="font-medium">{course.code}</TableCell>
                                                <TableCell>{course.name}</TableCell>
                                                <TableCell className="text-gray-500">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                        Yr {course.level / 100}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-gray-500">{course.programme || '-'}</TableCell>
                                                <TableCell className="text-gray-500">{course.semester || '-'}</TableCell>
                                                <TableCell className="text-gray-500">{course.lecturer_name || 'Unassigned'}</TableCell>
                                                <TableCell className="text-center">{course.enrolled_count}</TableCell>
                                                <TableCell className="text-center">{course.session_count}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${course.is_active
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {course.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-400 hover:text-emerald-700"
                                                            onClick={() => handleViewDetails(course.id)}
                                                            aria-label="View details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-400 hover:text-blue-600"
                                                            onClick={() => openEdit(course)}
                                                            aria-label="Edit course"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => setCourseToDelete(course)}
                                                            aria-label="Delete course"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
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

            {/* Create Course Dialog */}
            <Dialog open={showCreate} onOpenChange={(v) => !creating && setShowCreate(v)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Course</DialogTitle>
                        <DialogDescription>Add a new course to the school catalog.</DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleCreate}>
                        <div className="space-y-2">
                            <Label htmlFor="create-code">Course Code</Label>
                            <Input
                                id="create-code"
                                value={createForm.code}
                                onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value }))}
                                placeholder="e.g., CS101"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-name">Course Name</Label>
                            <Input
                                id="create-name"
                                value={createForm.name}
                                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="Introduction to Computer Science"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="create-level">Level</Label>
                                <Select
                                    value={String(createForm.level ?? 100)}
                                    onValueChange={(v) => setCreateForm((f) => ({ ...f, level: Number(v) }))}
                                >
                                    <SelectTrigger id="create-level" className="w-full">
                                        <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LEVEL_OPTIONS.map((lvl) => (
                                            <SelectItem key={lvl} value={String(lvl)}>Level {lvl}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create-programme">Programme</Label>
                                <Select
                                    value={createForm.programme || NONE_VALUE}
                                    onValueChange={(v) => setCreateForm((f) => ({ ...f, programme: v === NONE_VALUE ? '' : v }))}
                                >
                                    <SelectTrigger id="create-programme" className="w-full">
                                        <SelectValue placeholder="Select programme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE_VALUE}>None</SelectItem>
                                        {PROGRAMME_OPTIONS.map((p) => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-description">Description</Label>
                            <textarea
                                id="create-description"
                                value={createForm.description}
                                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Optional course description"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-semester">Semester</Label>
                            <Select
                                value={createForm.semester || NONE_VALUE}
                                onValueChange={(v) => setCreateForm((f) => ({ ...f, semester: v === NONE_VALUE ? undefined : v }))}
                            >
                                <SelectTrigger id="create-semester" className="w-full">
                                    <SelectValue placeholder="Select semester (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                                    {SEMESTER_OPTIONS.map((opt) => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => !creating && setShowCreate(false)}>Cancel</Button>
                            <Button variant="primary" type="submit" disabled={creating}>
                                {creating ? 'Creating...' : 'Create Course'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Course Dialog */}
            <Dialog open={showEdit} onOpenChange={(v) => !updating && setShowEdit(v)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Course</DialogTitle>
                        <DialogDescription>Update course details.</DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleUpdate}>
                        <div className="space-y-2">
                            <Label htmlFor="edit-code">Course Code</Label>
                            <Input
                                id="edit-code"
                                value={editForm.code}
                                onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
                                placeholder="e.g., CS101"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Course Name</Label>
                            <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="Introduction to Computer Science"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-level">Level</Label>
                                <Select
                                    value={String(editForm.level ?? 100)}
                                    onValueChange={(v) => setEditForm((f) => ({ ...f, level: Number(v) }))}
                                >
                                    <SelectTrigger id="edit-level" className="w-full">
                                        <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LEVEL_OPTIONS.map((lvl) => (
                                            <SelectItem key={lvl} value={String(lvl)}>Level {lvl}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-programme">Programme</Label>
                                <Select
                                    value={editForm.programme || NONE_VALUE}
                                    onValueChange={(v) => setEditForm((f) => ({ ...f, programme: v === NONE_VALUE ? '' : v }))}
                                >
                                    <SelectTrigger id="edit-programme" className="w-full">
                                        <SelectValue placeholder="Select programme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE_VALUE}>None</SelectItem>
                                        {PROGRAMME_OPTIONS.map((p) => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <textarea
                                id="edit-description"
                                value={editForm.description}
                                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Course description"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-semester">Semester</Label>
                            <Select
                                value={editForm.semester || NONE_VALUE}
                                onValueChange={(v) => setEditForm((f) => ({ ...f, semester: v === NONE_VALUE ? '' : v }))}
                            >
                                <SelectTrigger id="edit-semester" className="w-full">
                                    <SelectValue placeholder="Select semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                                    {SEMESTER_OPTIONS.map((opt) => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => !updating && setShowEdit(false)}>Cancel</Button>
                            <Button variant="primary" type="submit" disabled={updating}>
                                {updating ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Course Details Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Course Details</DialogTitle>
                        <DialogDescription>
                            {courseDetails ? `${courseDetails.code} - ${courseDetails.name}` : 'Loading...'}
                        </DialogDescription>
                    </DialogHeader>

                    {detailsLoading ? (
                        <div className="py-8 text-center text-gray-500">Loading course details...</div>
                    ) : courseDetails ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Course Information</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Code:</span>
                                        <span className="ml-2 font-medium">{courseDetails.code}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Semester:</span>
                                        <span className="ml-2 font-medium">{courseDetails.semester}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Level:</span>
                                        <span className="ml-2 font-medium">Level {courseDetails.level}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Programme:</span>
                                        <span className="ml-2 font-medium">{courseDetails.programme || '-'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-500">Name:</span>
                                        <span className="ml-2 font-medium">{courseDetails.name}</span>
                                    </div>
                                    {courseDetails.description && (
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Description:</span>
                                            <p className="mt-1 text-gray-700">{courseDetails.description}</p>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-gray-500">Lecturer:</span>
                                        <span className="ml-2 font-medium">{courseDetails.lecturer_name || 'Unassigned'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Status:</span>
                                        <span className={`ml-2 font-medium ${courseDetails.is_active ? 'text-emerald-600' : 'text-gray-500'}`}>
                                            {courseDetails.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Created:</span>
                                        <span className="ml-2 font-medium">
                                            {new Date(courseDetails.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-gray-500" />
                                    <h3 className="font-semibold text-lg">
                                        Enrolled Students ({courseDetails.enrolled_count})
                                    </h3>
                                </div>
                                {courseDetails.enrolled_count === 0 ? (
                                    <p className="text-gray-500 text-sm py-4">No students enrolled yet.</p>
                                ) : (
                                    <div className="border rounded-md overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Student ID</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Enrolled At</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {courseDetails.enrolled_students.map((student) => (
                                                    <TableRow key={student.id}>
                                                        <TableCell className="font-medium">
                                                            {student.user_id || `#${student.id}`}
                                                        </TableCell>
                                                        <TableCell>{student.full_name || 'N/A'}</TableCell>
                                                        <TableCell>{student.email}</TableCell>
                                                        <TableCell>
                                                            {new Date(student.enrolled_at).toLocaleDateString()}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>

                            {courseDetails.recent_sessions.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Recent Sessions</h3>
                                    <div className="border rounded-md overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Session Code</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Starts At</TableHead>
                                                    <TableHead>Ends At</TableHead>
                                                    <TableHead>Attendance</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {courseDetails.recent_sessions.map((session) => (
                                                    <TableRow key={session.id}>
                                                        <TableCell className="font-medium">#{session.id} - {session.code}</TableCell>
                                                        <TableCell>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.is_active
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {session.is_active ? 'Active' : 'Closed'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            {session.starts_at ? new Date(session.starts_at).toLocaleString() : 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {session.ends_at ? new Date(session.ends_at).toLocaleString() : 'N/A'}
                                                        </TableCell>
                                                        <TableCell>{session.attendance_count}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete course?</DialogTitle>
                        <DialogDescription>
                            {courseToDelete && (
                                <>
                                    This will permanently delete <strong>{courseToDelete.code} – {courseToDelete.name}</strong> and all its sessions and enrollments. This cannot be undone.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCourseToDelete(null)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete course'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ProtectedRoute>
    );
}
