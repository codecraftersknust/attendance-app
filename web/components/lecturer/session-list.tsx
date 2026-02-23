"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw, QrCode, XCircle } from "lucide-react";
import { QRDisplayDialog } from "./qr-display-dialog";

type SessionRow = { id: number; code: string; is_active: boolean };

export function SessionList() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [busyId, setBusyId] = useState<number | null>(null);

    // Filter active based on is_active AND time
    const active = useMemo(() => {
        const now = new Date();
        return sessions.filter(s => {
            if (!s.is_active) return false;
            if (s.ends_at && new Date(s.ends_at) < now) return false;
            return true;
        });
    }, [sessions]);

    const inactive = useMemo(() => {
        const now = new Date();
        return sessions.filter(s => {
            if (!s.is_active) return true;
            if (s.ends_at && new Date(s.ends_at) < now) return true;
            return false;
        });
    }, [sessions]);

    const load = async () => {
        try {
            setLoading(true);
            const list = await apiClient.lecturerSessions();
            setSessions(list as any);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load sessions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const regen = async (id: number) => {
        try {
            setBusyId(id);
            const res = await apiClient.lecturerRegenerateSessionCode(id);
            toast.success(`New code: ${res.code}`);
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Failed to regenerate");
        } finally {
            setBusyId(null);
        }
    };

    const rotate = async (id: number) => {
        try {
            setBusyId(id);
            const res = await apiClient.lecturerRotateQr(id, 60);
            toast.success(`QR rotated. Expires at ${new Date(res.expires_at).toLocaleTimeString()}`);
        } catch (e: any) {
            toast.error(e?.message || "Failed to rotate QR");
        } finally {
            setBusyId(null);
        }
    };

    const close = async (id: number) => {
        try {
            setBusyId(id);
            await apiClient.lecturerCloseSession(id);
            toast.success("Session closed");
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Failed to close session");
        } finally {
            setBusyId(null);
        }
    };

    const [qrSessionId, setQrSessionId] = useState<number | null>(null);

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Sessions</h2>
                <Button variant="outline" onClick={load} disabled={loading} className="border-gray-200">Refresh</Button>
            </div>
            {loading ? (
                <p className="text-gray-500 py-8">Loading sessions...</p>
            ) : (
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-3">Active</h3>
                        {active.length === 0 ? (
                            <p className="text-gray-500 text-sm py-4">No active sessions</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {active.map((s) => (
                                    <li key={s.id} className="py-4 flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                                        <div>
                                            <div className="font-medium text-gray-900">#{s.id} - Code: {s.code}</div>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 mt-1">Active</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" className="bg-emerald-900 hover:bg-emerald-900/90 text-white" onClick={() => setQrSessionId(s.id)}>
                                                <QrCode className="mr-1 h-4 w-4" />
                                                Show QR
                                            </Button>
                                            <Button variant="secondary" size="sm" onClick={() => regen(s.id)} disabled={busyId === s.id}>
                                                <RefreshCw className="mr-1 h-4 w-4" />
                                                Regenerate Code
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => close(s.id)} disabled={busyId === s.id}>
                                                <XCircle className="mr-1 h-4 w-4" />
                                                Close
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-3">Recent (Closed)</h3>
                        {inactive.length === 0 ? (
                            <p className="text-gray-500 text-sm py-4">No closed sessions</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {inactive.map((s) => (
                                    <li key={s.id} className="py-4 flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-gray-900">#{s.id} - Code: {s.code}</div>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 mt-1">Closed</span>
                                        </div>
                                        <div className="text-sm text-gray-500">&nbsp;</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            <QRDisplayDialog
                sessionId={qrSessionId}
                open={!!qrSessionId}
                onOpenChange={(open) => !open && setQrSessionId(null)}
            />
        </div>
    );
}


