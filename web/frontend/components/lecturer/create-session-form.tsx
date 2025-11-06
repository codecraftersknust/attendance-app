"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Course = { id: number; code: string; name: string };

export function CreateSessionForm(props: { onCreated?: (session: { id: number; code: string }) => void }) {
    const { onCreated } = props;
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState<boolean>(false);
    const [creating, setCreating] = useState<boolean>(false);
    const [courseId, setCourseId] = useState<string>("");
    const [duration, setDuration] = useState<string>("15");

    useEffect(() => {
        const load = async () => {
            try {
                setLoadingCourses(true);
                const list = await apiClient.lecturerCourses();
                const minimal = (list as any[]).map((c) => ({ id: c.id, code: c.code, name: c.name }));
                setCourses(minimal);
            } catch (e: any) {
                toast.error(e?.message || "Failed to load courses");
            } finally {
                setLoadingCourses(false);
            }
        };
        load();
    }, []);

    const create = async () => {
        if (!courseId) {
            toast.error("Please select a course");
            return;
        }
        const dur = parseInt(duration || "15", 10);
        try {
            setCreating(true);
            const created = await apiClient.lecturerCreateSession({ course_id: Number(courseId), duration_minutes: dur });
            toast.success("Session created");
            onCreated?.({ id: created.id, code: created.code });
        } catch (e: any) {
            toast.error(e?.message || "Failed to create session");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="bg-white rounded-md shadow p-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="space-y-2">
                    <Label>Course</Label>
                    <Select value={courseId} onValueChange={setCourseId} disabled={loadingCourses}>
                        <SelectTrigger>
                            <SelectValue placeholder={loadingCourses ? "Loading..." : "Select a course"} />
                        </SelectTrigger>
                        <SelectContent>
                            {courses.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.code} - {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Button className="w-full bg-emerald-900 hover:bg-emerald-900/90 text-white" onClick={create} disabled={creating}>
                        {creating ? "Creating..." : "Create Session"}
                    </Button>
                </div>
            </div>
        </div>
    );
}


