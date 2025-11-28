"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

type ActiveSession = { id: number; code: string; course_id: number; course_code?: string; course_name?: string; starts_at?: string; ends_at?: string };

export function ActiveSessionList(props: { onOpen: (session: ActiveSession) => void }) {
    const { onOpen } = props;
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const load = async () => {
        try {
            setLoading(true);
            const list = await apiClient.studentActiveSessions();
            setSessions(list as any);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load active sessions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        const t = setInterval(load, 30000);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="bg-white rounded-md shadow p-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Active Sessions</h2>
                <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
            </div>
            {loading ? (
                <p>Loading...</p>
            ) : sessions.length === 0 ? (
                <p className="text-gray-600">No active sessions for your courses.</p>
            ) : (
                <ul className="divide-y">
                    {sessions.map((s) => (
                        <li key={s.id} className="py-3 flex items-center justify-between">
                            <div>
                                <div className="font-medium">{s.course_code} — {s.course_name}</div>
                                <div className="text-xs text-gray-500">Session #{s.id} • Code {s.code}</div>
                            </div>
                            <Button className="bg-emerald-900 hover:bg-emerald-900/90 text-white" onClick={() => onOpen(s)}>Open</Button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}


