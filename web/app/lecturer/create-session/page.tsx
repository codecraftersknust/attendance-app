"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CreateSessionForm } from "@/components/lecturer/create-session-form";
import { SessionList } from "@/components/lecturer/session-list";
import { useCallback, useRef } from "react";

export default function CreateSessionPage() {
    const listRef = useRef<{ reload?: () => void } | null>(null);
    const onCreated = useCallback(() => {
        // optional: could instruct list to reload; current list has a Refresh button
    }, []);

    return (
        <ProtectedRoute allowedRoles={["lecturer"]}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Session</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Start a new attendance session for your students</p>
                </div>
                <CreateSessionForm onCreated={onCreated} />
                <SessionList />
            </div>
        </ProtectedRoute>
    );
}


