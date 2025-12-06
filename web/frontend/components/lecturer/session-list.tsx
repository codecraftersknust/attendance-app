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
        <div className="bg-white rounded-md shadow p-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Sessions</h2>
                <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
            </div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="space-y-6">
                    <div>
                        <h3 className="font-medium mb-2">Active</h3>
                        {active.length === 0 ? (
                            <p className="text-gray-600 text-sm">No active sessions</p>
                        ) : (
                            <ul className="divide-y">
                                {active.map((s) => (
                                    <li key={s.id} className="py-3 flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">#{s.id} - Code: {s.code}</div>
                                            <div className="text-xs text-gray-500">Active</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="default" size="sm" onClick={() => setQrSessionId(s.id)}>
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
                        <h3 className="font-medium mb-2">Recent (Closed)</h3>
                        {inactive.length === 0 ? (
                            <p className="text-gray-600 text-sm">No closed sessions</p>
                        ) : (
                            <ul className="divide-y">
                                {inactive.map((s) => (
                                    <li key={s.id} className="py-3 flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">#{s.id} - Code: {s.code}</div>
                                            <div className="text-xs text-gray-500">Closed</div>
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


