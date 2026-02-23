"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ActiveSessionList } from "@/components/student/active-session-list";
import { AttendanceFlow } from "@/components/student/attendance-flow";
import { ActiveSession } from "@/components/student/types";
import { useState } from "react";

export default function MarkAttendancePage() {
    const [selected, setSelected] = useState<ActiveSession | null>(null);

    return (
        <ProtectedRoute allowedRoles={["student"]}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mark Attendance</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Select an active session below to record your attendance
                    </p>
                </div>
                {selected ? (
                    <AttendanceFlow session={selected} onDone={() => setSelected(null)} />
                ) : (
                    <ActiveSessionList onOpen={setSelected} />
                )}
            </div>
        </ProtectedRoute>
    );
}


