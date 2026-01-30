"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const SEMESTER_OPTIONS = [
    "1st Semester",
    "2nd Semester",
] as const;

const NONE_VALUE = "__none__";

type CreateCoursePayload = {
    code: string;
    name: string;
    description?: string;
    semester?: string;
};

export function CreateCourseDialog({
    open,
    onOpenChange,
    onCreated,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: () => Promise<void> | void;
}) {
    const [form, setForm] = useState<CreateCoursePayload>({ code: "", name: "", description: "", semester: "" });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code.trim() || !form.name.trim()) {
            toast.error("Course code and name are required");
            return;
        }
        try {
            setSubmitting(true);
            await apiClient.lecturerCreateCourse({
                code: form.code.trim(),
                name: form.name.trim(),
                description: form.description?.trim() || undefined,
                semester: form.semester?.trim() || undefined,
            });
            toast.success("Course created");
            onOpenChange(false);
            setForm({ code: "", name: "", description: "", semester: "" });
            if (onCreated) await onCreated();
        } catch (e: any) {
            toast.error(e?.message || "Failed to create course");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Course</DialogTitle>
                    <DialogDescription>Enter details of the course to create.</DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="code">Course Code</Label>
                        <Input id="code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g., CS101" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Course Name</Label>
                        <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Introduction to Computer Science" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Optional course description"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Select
                            value={form.semester || NONE_VALUE}
                            onValueChange={(v) => setForm((f) => ({ ...f, semester: v === NONE_VALUE ? undefined : v }))}
                        >
                            <SelectTrigger id="semester" className="w-full">
                                <SelectValue placeholder="Select semester (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NONE_VALUE}>None</SelectItem>
                                {SEMESTER_OPTIONS.map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => !submitting && onOpenChange(false)}>Cancel</Button>
                        <Button className="bg-emerald-900 hover:bg-emerald-900/90 text-white" type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Course"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


