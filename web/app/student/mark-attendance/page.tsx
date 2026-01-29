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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-4">
                <h1 className="text-xl font-semibold">Mark Attendance</h1>
                {selected ? (
                    <AttendanceFlow session={selected} onDone={() => setSelected(null)} />
                ) : (
                    <ActiveSessionList onOpen={setSelected} />
                )}
            </div>
        </ProtectedRoute>
    );
}


