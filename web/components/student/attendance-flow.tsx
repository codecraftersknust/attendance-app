"use client";

import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { QRScanner } from "@/components/qr-scanner";
import { FaceCapture } from "@/components/face-capture";
import { ActiveSession } from "./types";
import { CheckCircle2, Clock, MapPin, Camera, QrCode, ChevronRight, Loader2 } from "lucide-react";

const DEVICE_STORAGE_KEY = "absense.device_id";

export function AttendanceFlow(props: { session: ActiveSession; onDone: () => void }) {
    const { session, onDone } = props;

    // Session countdown
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);

    useEffect(() => {
        if (!session.ends_at) return;

        const updateCountdown = () => {
            const now = new Date();
            const end = new Date(session.ends_at!);
            const diffMs = end.getTime() - now.getTime();

            if (diffMs <= 0) {
                toast.error("Session has ended");
                onDone();
                return;
            }

            const totalSeconds = Math.ceil(diffMs / 1000);
            setTimeLeftSeconds(totalSeconds);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${seconds}s`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [session.ends_at, onDone]);

    const [deviceId, setDeviceId] = useState<string>("");
    const [checkingDevice, setCheckingDevice] = useState<boolean>(false);
    const [deviceStatus, setDeviceStatus] = useState<{ has_device: boolean; is_active: boolean; has_face_enrolled: boolean } | null>(null);
    const [binding, setBinding] = useState<boolean>(false);

    const [qrPayload, setQrPayload] = useState<{ session_id: number; nonce: string } | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState<boolean>(false);

    const [refFaceFile, setRefFaceFile] = useState<File | null>(null);
    const [refCaptureKey, setRefCaptureKey] = useState<number>(0);
    const [enrolling, setEnrolling] = useState<boolean>(false);

    // Derived from backend status
    const isFaceEnrolled = deviceStatus?.has_face_enrolled ?? false;

    const [selfieFile, setSelfieFile] = useState<File | null>(null);
    const [selfieCaptureKey, setSelfieCaptureKey] = useState<number>(0);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Helper to get or create device ID
    const getDeviceId = useCallback(() => {
        if (typeof window === "undefined") return "";
        let id = localStorage.getItem(DEVICE_STORAGE_KEY);
        if (!id) {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                id = crypto.randomUUID();
            } else {
                id = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            }
            localStorage.setItem(DEVICE_STORAGE_KEY, id);
        }
        return id;
    }, []);

    useEffect(() => {
        const id = getDeviceId();
        setDeviceId(id);
    }, [getDeviceId]);

    const getErrorMessage = useCallback((error: unknown): string => {
        if (!error) return "Something went wrong";
        const err = error as { message?: string; response?: { data?: { detail?: string | Array<{ msg?: string }> } } };
        if (typeof err.message === "string" && err.message) return err.message;
        const detail = err.response?.data?.detail;
        if (typeof detail === "string" && detail) return detail;
        if (Array.isArray(detail) && detail.length > 0) {
            const first = detail[0];
            return typeof first === "object" && first?.msg ? first.msg : String(detail[0]);
        }
        if (error instanceof Error && error.message) return error.message;
        if (typeof error === "string") return error;
        return "Something went wrong";
    }, []);

    const bindDevice = useCallback(async (id: string) => {
        try {
            setBinding(true);
            await apiClient.studentBindDevice(id);
            return true;
        } catch (error) {
            console.error("Auto-bind failed", error);
            return false;
        } finally {
            setBinding(false);
        }
    }, []);

    const refreshDeviceStatus = useCallback(async () => {
        try {
            setCheckingDevice(true);
            const status = await apiClient.studentDeviceStatus();
            setDeviceStatus(status);

            if (!status.has_device) {
                const id = getDeviceId();
                if (id) {
                    const success = await bindDevice(id);
                    if (success) {
                        const newStatus = await apiClient.studentDeviceStatus();
                        setDeviceStatus(newStatus);
                    }
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(getErrorMessage(error));
        } finally {
            setCheckingDevice(false);
        }
    }, [getErrorMessage, getDeviceId, bindDevice]);

    useEffect(() => {
        refreshDeviceStatus();
    }, [refreshDeviceStatus]);

    const getLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported");
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocating(false);
            },
            (err) => {
                console.error(err);
                toast.error("Failed to get location");
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }, []);

    const parseQrPayload = useCallback(
        (raw: string) => {
            let sessionId: number | null = null;
            let nonce: string | null = null;
            const trimmed = raw.trim();

            if (trimmed.startsWith("ABSENSE")) {
                const parts = trimmed.split(":");
                if (parts.length >= 3) {
                    sessionId = Number(parts[1]);
                    nonce = parts[2];
                }
            } else {
                try {
                    const parsed = JSON.parse(trimmed);
                    sessionId = Number(parsed.session_id ?? parsed.sessionId);
                    nonce = String(parsed.nonce ?? parsed.qr_nonce ?? "");
                } catch (err) {
                    console.error("QR parse error", err);
                }
            }

            if (!sessionId || !nonce) throw new Error("Invalid QR payload");
            if (sessionId !== session.id) throw new Error("QR belongs to another session");
            return { session_id: sessionId, nonce };
        },
        [session.id],
    );

    const onScan = useCallback(
        (value: string) => {
            try {
                const payload = parseQrPayload(value);
                setQrPayload(payload);
                toast.success("QR scanned");
            } catch (error) {
                toast.error(getErrorMessage(error));
            }
        },
        [getErrorMessage, parseQrPayload],
    );

    const enrollFace = async () => {
        if (!refFaceFile) {
            toast.error("Capture a reference selfie first");
            return;
        }
        try {
            setEnrolling(true);
            await apiClient.studentEnrollFace(refFaceFile);
            toast.success("Reference face enrolled");
            setRefFaceFile(null);
            setRefCaptureKey((key) => key + 1);
            refreshDeviceStatus();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setEnrolling(false);
        }
    };

    const submit = async () => {
        if (!qrPayload) {
            toast.error("Scan the QR code displayed by your lecturer");
            return;
        }
        if (!selfieFile) {
            toast.error("Capture a selfie for attendance");
            return;
        }
        if (!coords) {
            toast.error("Capture your current location");
            return;
        }
        const value = deviceId.trim();
        if (!value) {
            toast.error("Device ID missing");
            return;
        }
        try {
            setSubmitting(true);
            const res = await apiClient.studentSubmitAttendance({
                qr_session_id: qrPayload.session_id,
                qr_nonce: qrPayload.nonce,
                latitude: coords.lat,
                longitude: coords.lng,
                device_id: value,
                selfie: selfieFile,
            });
            toast.success(`Attendance marked (${res.status})`);
            if (res.within_geofence === false) {
                const dist = res.distance_m != null ? ` (${Math.round(res.distance_m)} m away)` : "";
                toast.error(`You were outside the class location${dist}. Your attendance may be flagged for review.`, { duration: 6000 });
            }
            setSelfieFile(null);
            setSelfieCaptureKey((key) => key + 1);
            setQrPayload(null);
            setCoords(null);
            onDone();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    // Step tracking
    const steps = [
        { key: "qr", label: "Scan QR", done: !!qrPayload },
        { key: "selfie", label: "Selfie", done: !!selfieFile },
        { key: "location", label: "Location", done: !!coords },
    ];
    const completedCount = steps.filter((s) => s.done).length;
    const currentStepIndex = steps.findIndex((s) => !s.done);
    const allDone = completedCount === steps.length;

    // Countdown styles
    const getCountdownStyles = () => {
        if (timeLeftSeconds == null) return "bg-gray-50 text-gray-500 border-gray-200";
        if (timeLeftSeconds < 60) return "bg-red-50 text-red-600 border-red-200 font-bold";
        if (timeLeftSeconds < 300) return "bg-amber-50 text-amber-600 border-amber-200 font-semibold";
        return "bg-gray-50 text-gray-600 border-gray-200";
    };

    return (
        <div className="max-w-lg mx-auto space-y-5">
            {/* Header with countdown */}
            <div className="border border-gray-200 bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{session.course_code} — {session.course_name}</h2>
                        <div className="text-xs text-gray-500 mt-0.5">Session #{session.id}</div>
                    </div>
                    {timeLeft && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${getCountdownStyles()}`}>
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-xs">{timeLeft}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Step progress bar */}
            <div className="border border-gray-200 bg-white rounded-xl shadow-sm p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Step {Math.min(completedCount + 1, 3)} of 3
                </div>
                <div className="flex items-start">
                    {steps.map((step, i) => (
                        <Fragment key={step.key}>
                            {/* Step column: dot + label */}
                            <div className="flex flex-col items-center shrink-0 w-16">
                                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${step.done
                                    ? "bg-emerald-500 text-white"
                                    : i === currentStepIndex
                                        ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500"
                                        : "bg-gray-100 text-gray-400"
                                    }`}>
                                    {step.done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                                </div>
                                <span className={`mt-2 text-[10px] font-bold uppercase tracking-wide text-center ${step.done ? "text-gray-900" : i === currentStepIndex ? "text-gray-900" : "text-gray-400"
                                    }`}>
                                    {step.label}
                                </span>
                            </div>

                            {/* Connecting line */}
                            {i < steps.length - 1 && (
                                <div className="flex-1 pt-3.5">
                                    <div className={`h-0.5 mx-1 rounded ${step.done && steps[i + 1].done ? "bg-emerald-400" : "bg-gray-200"
                                        }`} />
                                </div>
                            )}
                        </Fragment>
                    ))}
                </div>
            </div>

            {/* Face enrollment banner (prerequisite) */}
            {!isFaceEnrolled && (
                <div className="border-2 border-amber-300 bg-amber-50 rounded-xl p-5 space-y-4">
                    <div>
                        <p className="text-sm font-bold text-amber-800">⚠️ Reference Face Required</p>
                        <p className="text-xs text-amber-700 mt-1">You must enroll your face once before marking attendance.</p>
                    </div>
                    <FaceCapture
                        key={`ref-${refCaptureKey}`}
                        label="Capture a clear reference selfie"
                        allowUpload
                        note="Use good lighting, remove face coverings, and center your face."
                        onCapture={(file) => setRefFaceFile(file)}
                        onClear={() => setRefFaceFile(null)}
                    />
                    <Button
                        variant="outline"
                        onClick={enrollFace}
                        disabled={!refFaceFile || enrolling}
                        className="w-full"
                    >
                        {enrolling ? "Uploading..." : "Enroll Reference Face"}
                    </Button>
                </div>
            )}

            {/* Step 1: QR Scanner */}
            <div className={`border rounded-xl p-5 transition-all ${qrPayload ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200 bg-white shadow-sm"
                }`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${qrPayload ? "bg-emerald-500" : "bg-gray-100"
                        }`}>
                        {qrPayload ? (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : (
                            <QrCode className="h-4 w-4 text-gray-500" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Step 1: Scan QR Code</p>
                        <p className="text-xs text-gray-500">Scan the rotating QR displayed by your lecturer</p>
                    </div>
                </div>

                {qrPayload ? (
                    <p className="text-sm text-emerald-700 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> QR locked for session #{qrPayload.session_id}
                    </p>
                ) : (
                    <QRScanner onDecode={onScan} />
                )}
            </div>

            {/* Step 2: Selfie */}
            <div className={`border rounded-xl p-5 transition-all ${selfieFile ? "border-emerald-200 bg-emerald-50/30" : !qrPayload ? "border-gray-100 bg-gray-50 opacity-60" : "border-gray-200 bg-white shadow-sm"
                }`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${selfieFile ? "bg-emerald-500" : "bg-gray-100"
                        }`}>
                        {selfieFile ? (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : (
                            <Camera className="h-4 w-4 text-gray-500" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Step 2: Capture Selfie</p>
                        <p className="text-xs text-gray-500">Take a selfie for this attendance submission</p>
                    </div>
                </div>

                {selfieFile ? (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-emerald-700 font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" /> Selfie captured
                        </p>
                        <Button variant="secondary" size="sm" onClick={() => { setSelfieFile(null); setSelfieCaptureKey(k => k + 1); }}>
                            Retake
                        </Button>
                    </div>
                ) : (
                    <div className={!qrPayload ? "pointer-events-none" : ""}>
                        <FaceCapture
                            key={`selfie-${selfieCaptureKey}`}
                            label="Capture real-time selfie"
                            allowUpload
                            note="This selfie is uploaded with your attendance submission."
                            onCapture={(file) => setSelfieFile(file)}
                            onClear={() => setSelfieFile(null)}
                        />
                    </div>
                )}
            </div>

            {/* Step 3: Location */}
            <div className={`border rounded-xl p-5 transition-all ${coords ? "border-emerald-200 bg-emerald-50/30" : !selfieFile ? "border-gray-100 bg-gray-50 opacity-60" : "border-gray-200 bg-white shadow-sm"
                }`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${coords ? "bg-emerald-500" : "bg-gray-100"
                        }`}>
                        {coords ? (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : (
                            <MapPin className="h-4 w-4 text-gray-500" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Step 3: Capture Location</p>
                        <p className="text-xs text-gray-500">Your location verifies you&apos;re in the right place</p>
                    </div>
                </div>

                {coords ? (
                    <p className="text-sm text-emerald-700 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> Location captured
                    </p>
                ) : (
                    <Button
                        variant="outline"
                        onClick={getLocation}
                        disabled={locating || !selfieFile}
                        className="w-full"
                    >
                        {locating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Locating...
                            </>
                        ) : (
                            <>
                                <MapPin className="mr-2 h-4 w-4" />
                                Capture Location
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Submit */}
            <div>
                <Button
                    variant="primary"
                    className="w-full py-6 text-lg"
                    onClick={submit}
                    disabled={submitting || !isFaceEnrolled || !allDone}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            Submit Attendance
                            <ChevronRight className="ml-2 h-5 w-5" />
                        </>
                    )}
                </Button>
                {!isFaceEnrolled && (
                    <p className="text-center text-xs text-red-500 mt-2">
                        Please enroll your reference face first.
                    </p>
                )}
                {isFaceEnrolled && !allDone && (
                    <p className="text-center text-xs text-gray-400 mt-2">
                        Complete all steps above to submit.
                    </p>
                )}
            </div>
        </div>
    );
}
