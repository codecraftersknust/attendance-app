"use client";

import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface QRDisplayDialogProps {
    sessionId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function QRDisplayDialog({ sessionId, open, onOpenChange }: QRDisplayDialogProps) {
    const [loading, setLoading] = useState(true);
    const [qrData, setQrData] = useState<string>("");
    const [qrImage, setQrImage] = useState<string>("");
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [sessionCode, setSessionCode] = useState<string>("");

    const [sessionEndsAt, setSessionEndsAt] = useState<Date | null>(null);

    const loadQr = useCallback(async () => {
        if (!sessionId || !open) return;
        try {
            setLoading(true);
            const data = await apiClient.lecturerQrDisplay(sessionId);
            setQrData(data.qr_data);
            setSessionCode(data.session_code);
            setExpiresAt(new Date(data.expires_at));
            setTimeLeft(data.time_remaining_seconds);
            if (data.session_ends_at) {
                setSessionEndsAt(new Date(data.session_ends_at));
            }

            // Generate QR image
            const url = await QRCode.toDataURL(data.qr_data, { width: 400, margin: 2 });
            setQrImage(url);
        } catch (e: any) {
            const msg = e?.message || "Failed to load QR code";
            toast.error(msg);
            // Close if session ended or inactive
            if (msg.includes("Session has ended") || msg.includes("Session inactive")) {
                onOpenChange(false);
            }
        } finally {
            setLoading(false);
        }
    }, [sessionId, open, onOpenChange]);

    useEffect(() => {
        loadQr();
    }, [loadQr]);

    // Session auto-close timer
    useEffect(() => {
        if (!sessionEndsAt) return;
        const now = new Date();
        const diff = sessionEndsAt.getTime() - now.getTime();

        if (diff <= 0) {
            toast.error("Session has ended");
            onOpenChange(false);
            return;
        }

        const timer = setTimeout(() => {
            toast.error("Session has ended");
            onOpenChange(false);
        }, diff);

        return () => clearTimeout(timer);
    }, [sessionEndsAt, onOpenChange]);

    // QR Rotation Countdown timer
    useEffect(() => {
        if (!expiresAt) return;
        const interval = setInterval(() => {
            const now = new Date();
            const diff = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000));
            setTimeLeft(diff);

            // Auto-refresh when expired
            if (diff <= 0) {
                loadQr();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [expiresAt, loadQr]);

    const handleRotate = async () => {
        if (!sessionId) return;
        try {
            setLoading(true);
            await apiClient.lecturerRotateQr(sessionId);
            await loadQr();
            toast.success("QR code rotated");
        } catch (e: any) {
            toast.error(e?.message || "Failed to rotate QR");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">Session QR Code</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center space-y-4 py-4">
                    {loading && !qrImage ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-900" />
                        </div>
                    ) : (
                        <>
                            <div className="relative group">
                                <img src={qrImage} alt="Session QR Code" className="w-64 h-64 border rounded-lg shadow-sm" />
                                {timeLeft < 5 && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                                        <Loader2 className="h-8 w-8 animate-spin text-emerald-900" />
                                    </div>
                                )}
                            </div>

                            <div className="text-center space-y-1">
                                <p className="text-sm font-medium text-gray-500">Session Code</p>
                                <p className="text-2xl font-bold tracking-widest font-mono">{sessionCode}</p>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <span className={timeLeft < 10 ? "text-red-600 font-bold" : "text-gray-600"}>
                                    Expires in {timeLeft}s
                                </span>
                            </div>

                            <Button onClick={handleRotate} variant="outline" size="sm" className="mt-2">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Rotate Now
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
