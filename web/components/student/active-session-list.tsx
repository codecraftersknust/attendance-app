"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ActiveSession } from "./types";

export function ActiveSessionList(props: { onOpen: (session: ActiveSession) => void }) {
    const { onOpen } = props;

    const { data: sessions = [], error, isLoading: loading, mutate } = useSWR<ActiveSession[]>(
        "student-active-sessions",
        async () => {
            const list = await apiClient.studentActiveSessions();
            // Anchor the session end to this device's clock using the
            // server-computed remaining seconds, so countdowns stay correct
            // even if the device clock differs from the server's
            const fetchedAt = Date.now();
            return list.map((s) => ({
                ...s,
                ends_at_ms: s.time_remaining_seconds != null
                    ? fetchedAt + s.time_remaining_seconds * 1000
                    : undefined,
            }));
        },
        { dedupingInterval: 5000, refreshInterval: 30000 }
    );

    useEffect(() => { if (error) toast.error(error?.message || "Failed to load active sessions"); }, [error]);

    return (
        <div className="border-gray-200/80 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
                <Button variant="outline" size="sm" onClick={() => mutate()} disabled={loading}>
                    Refresh
                </Button>
            </div>
            <div className="p-4">
            {loading ? (
                <p className="text-gray-500 py-6">Loading...</p>
            ) : sessions.length === 0 ? (
                <p className="text-gray-500 py-6">No active sessions for your courses.</p>
            ) : (
                <ul className="divide-y">
                    {sessions.map((s) => (
                        <li key={s.id} className="py-3 flex items-center justify-between">
                            <div>
                                <div className="font-medium">{s.course_code} — {s.course_name}</div>
                                <div className="text-xs text-gray-500">Session #{s.id} • Code {s.code}</div>
                                {s.already_marked && (
                                    <div className="text-xs text-emerald-600 mt-1 font-medium">Already marked {s.attendance_status === "confirmed" ? "✓" : "(pending review)"}</div>
                                )}
                            </div>
                            {s.already_marked ? (
                                <span className="text-sm text-gray-500">Marked</span>
                            ) : (
                                <Button variant="primary" onClick={() => onOpen(s)}>Open</Button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            </div>
        </div>
    );
}


