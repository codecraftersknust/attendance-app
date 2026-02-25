"use client";

import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Maximize2, Minimize2, Clock, BookOpen } from "lucide-react";
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
    const [sessionTimeLeft, setSessionTimeLeft] = useState<string | null>(null);

    // Course info from qr_payload
    const [courseName, setCourseName] = useState<string>("");
    const [courseCode, setCourseCode] = useState<string>("");

    // Full-screen "Project" mode
    const [fullScreen, setFullScreen] = useState(false);

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

            // Extract course info from qr_payload
            if (data.qr_payload) {
                setCourseName(data.qr_payload.course_name || "");
                setCourseCode(data.qr_payload.course_code || "");
            }

            // Generate QR image at large size
            const qrSize = fullScreen ? 500 : 400;
            const url = await QRCode.toDataURL(data.qr_data, { width: qrSize, margin: 2 });
            setQrImage(url);
        } catch (e: any) {
            const msg = e?.message || "Failed to load QR code";
            toast.error(msg);
            if (msg.includes("Session has ended") || msg.includes("Session inactive")) {
                onOpenChange(false);
            }
        } finally {
            setLoading(false);
        }
    }, [sessionId, open, onOpenChange, fullScreen]);

    useEffect(() => {
        loadQr();
    }, [loadQr]);

    // Session countdown
    useEffect(() => {
        if (!sessionEndsAt) return;

        const updateSessionTime = () => {
            const now = new Date();
            const diff = sessionEndsAt.getTime() - now.getTime();
            if (diff <= 0) {
                toast.error("Session has ended");
                onOpenChange(false);
                return;
            }
            const s = Math.ceil(diff / 1000);
            const mins = Math.floor(s / 60);
            const secs = s % 60;
            setSessionTimeLeft(mins > 0 ? `${mins}m ${secs}s` : `${secs}s`);
        };

        updateSessionTime();
        const interval = setInterval(updateSessionTime, 1000);
        return () => clearInterval(interval);
    }, [sessionEndsAt, onOpenChange]);

    // QR Rotation Countdown timer
    useEffect(() => {
        if (!expiresAt) return;
        const interval = setInterval(() => {
            const now = new Date();
            const diff = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000));
            setTimeLeft(diff);

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

    // Determine if QR is about to rotate (pulse)
    const isAboutToRotate = timeLeft > 0 && timeLeft <= 8;

    // Session time urgency color
    const getSessionTimeClass = () => {
        if (!sessionEndsAt) return "text-gray-500";
        const s = Math.ceil((sessionEndsAt.getTime() - Date.now()) / 1000);
        if (s < 60) return "text-red-600 font-bold";
        if (s < 300) return "text-amber-600 font-semibold";
        return "text-gray-600";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={fullScreen
                ? "sm:max-w-4xl bg-gray-950 text-white border-gray-800"
                : "sm:max-w-lg"
            }>
                <DialogHeader>
                    <DialogTitle className={`text-center ${fullScreen ? "text-white" : ""}`}>
                        {fullScreen ? "" : "Session QR Code"}
                    </DialogTitle>
                </DialogHeader>

                <div className={`flex flex-col items-center justify-center py-4 ${fullScreen ? "space-y-6" : "space-y-4"}`}>
                    {loading && !qrImage ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader2 className={`h-8 w-8 animate-spin ${fullScreen ? "text-emerald-400" : "text-emerald-900"}`} />
                        </div>
                    ) : (
                        <>
                            {/* Course info */}
                            {(courseCode || courseName) && (
                                <div className="text-center">
                                    {courseCode && (
                                        <div className={`flex items-center justify-center gap-2 mb-1 ${fullScreen ? "text-emerald-400" : "text-emerald-700"}`}>
                                            <BookOpen className="h-4 w-4" />
                                            <span className={`font-bold tracking-wide ${fullScreen ? "text-lg" : "text-sm"}`}>
                                                {courseCode}
                                            </span>
                                        </div>
                                    )}
                                    {courseName && (
                                        <p className={`${fullScreen ? "text-2xl font-bold text-white" : "text-lg font-semibold text-gray-900"}`}>
                                            {courseName}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Session time remaining */}
                            {sessionTimeLeft && (
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${fullScreen ? "bg-gray-800 border border-gray-700" : "bg-gray-50 border border-gray-200"
                                    }`}>
                                    <Clock className={`h-4 w-4 ${fullScreen ? (getSessionTimeClass().includes('red') ? 'text-red-400' : getSessionTimeClass().includes('amber') ? 'text-amber-400' : 'text-gray-300') : getSessionTimeClass()}`} />
                                    <span className={`text-sm font-medium ${fullScreen ? (getSessionTimeClass().includes('red') ? 'text-red-400 font-bold' : getSessionTimeClass().includes('amber') ? 'text-amber-400 font-semibold' : 'text-gray-300') : getSessionTimeClass()}`}>
                                        Session ends in {sessionTimeLeft}
                                    </span>
                                </div>
                            )}

                            {/* QR Code */}
                            <div className="relative">
                                <img
                                    src={qrImage}
                                    alt="Session QR Code"
                                    className={`border rounded-xl shadow-sm transition-all duration-300 ${fullScreen
                                        ? "w-[480px] h-[480px] border-gray-700"
                                        : "w-[400px] h-[400px]"
                                        } ${isAboutToRotate ? "animate-pulse" : ""}`}
                                />
                                {timeLeft <= 3 && timeLeft > 0 && (
                                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl">
                                        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
                                    </div>
                                )}
                            </div>

                            {/* Session code + QR timer */}
                            <div className={`text-center space-y-1 ${fullScreen ? "" : ""}`}>
                                <p className={`text-xs font-medium ${fullScreen ? "text-gray-400" : "text-gray-500"}`}>Session Code</p>
                                <p className={`tracking-[0.25em] font-mono font-bold ${fullScreen ? "text-3xl text-white" : "text-2xl text-gray-900"
                                    }`}>
                                    {sessionCode}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <span className={`${timeLeft < 10
                                    ? "text-red-500 font-bold"
                                    : fullScreen ? "text-gray-400" : "text-gray-600"
                                    }`}>
                                    QR refreshes in {timeLeft}s
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleRotate}
                                    variant="outline"
                                    size="sm"
                                    style={fullScreen ? { color: '#34d399', borderColor: '#059669', background: 'transparent' } : undefined}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Rotate Now
                                </Button>
                                <Button
                                    onClick={() => setFullScreen(!fullScreen)}
                                    variant="outline"
                                    size="sm"
                                    style={fullScreen ? { color: '#ffffff', borderColor: '#6b7280', background: 'transparent' } : undefined}
                                >
                                    {fullScreen ? (
                                        <>
                                            <Minimize2 className="mr-2 h-4 w-4" />
                                            Exit Full Screen
                                        </>
                                    ) : (
                                        <>
                                            <Maximize2 className="mr-2 h-4 w-4" />
                                            Project Mode
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
