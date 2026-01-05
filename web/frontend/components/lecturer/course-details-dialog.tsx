import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar } from 'lucide-react';

interface CourseDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courseId: number | null;
}

type Student = {
    id: number;
    matriculation_id: string | null;
    name: string | null;
    email: string;
};

type CourseDetails = {
    id: number;
    code: string;
    name: string;
    recent_sessions: any[];
    enrolled_students: Student[];
};

export function CourseDetailsDialog({ open, onOpenChange, courseId }: CourseDetailsDialogProps) {
    const [course, setCourse] = useState<CourseDetails | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && courseId) {
            loadDetails();
        } else {
            setCourse(null);
        }
    }, [open, courseId]);

    const loadDetails = async () => {
        try {
            setLoading(true);
            const data = await apiClient.lecturerCourseDetails(courseId!);
            setCourse(data as any);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to load course details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {loading ? 'Loading...' : course ? `${course.code} - ${course.name}` : 'Course Details'}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 text-center text-gray-500">Loading details...</div>
                ) : course ? (
                    <Tabs defaultValue="students" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="students">
                                <Users className="w-4 h-4 mr-2" />
                                Enrolled Students ({course.enrolled_students.length})
                            </TabsTrigger>
                            <TabsTrigger value="sessions">
                                <Calendar className="w-4 h-4 mr-2" />
                                Recent Sessions
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="students" className="mt-4">
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {course.enrolled_students.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                                                    No students enrolled in this course.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            course.enrolled_students.map((s) => (
                                                <TableRow key={s.id}>
                                                    <TableCell className="font-mono text-xs">{s.matriculation_id || 'N/A'}</TableCell>
                                                    <TableCell>{s.name || 'Unknown'}</TableCell>
                                                    <TableCell className="text-gray-500 text-sm">{s.email}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="sessions" className="mt-4">
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Session ID</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Attendance</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {course.recent_sessions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                                    No recent sessions.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            course.recent_sessions.map((s) => {
                                                const isActive = s.is_active && (!s.ends_at || new Date(s.ends_at) > new Date());
                                                return (
                                                    <TableRow key={s.id}>
                                                        <TableCell>#{s.id}</TableCell>
                                                        <TableCell>{new Date(s.starts_at).toLocaleDateString()}</TableCell>
                                                        <TableCell>{s.attendance_count}</TableCell>
                                                        <TableCell>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                                {isActive ? 'Active' : 'Closed'}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="py-4 text-center text-red-500">Failed to load course details.</div>
                )}
            </DialogContent>
        </Dialog>
    );
}
