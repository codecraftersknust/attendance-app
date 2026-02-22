"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";

type CourseDetails = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    semester: string;
    level: number;
    programme: string;
    is_active: boolean;
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

export function CourseDetailsDialog({
    open,
    onOpenChange,
    courseId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courseId: number | null;
}) {
    const [loading, setLoading] = useState(false);
    const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);

    useEffect(() => {
        if (open && courseId) {
            loadCourseDetails();
        } else {
            setCourseDetails(null);
        }
    }, [open, courseId]);

    const loadCourseDetails = async () => {
        if (!courseId) return;
        try {
            setLoading(true);
            const data = await apiClient.lecturerCourseDetails(courseId);
            setCourseDetails(data);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load course details");
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    if (!courseId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Course Details</DialogTitle>
                    <DialogDescription>
                        {courseDetails ? `${courseDetails.code} - ${courseDetails.name}` : "Loading..."}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 text-center text-gray-500">Loading course details...</div>
                ) : courseDetails ? (
                    <div className="space-y-6">
                        {/* Course Info */}
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

                        {/* Enrolled Students */}
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

                        {/* Recent Sessions */}
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
                                                        {session.starts_at
                                                            ? new Date(session.starts_at).toLocaleString()
                                                            : 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {session.ends_at
                                                            ? new Date(session.ends_at).toLocaleString()
                                                            : 'N/A'}
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
    );
}
