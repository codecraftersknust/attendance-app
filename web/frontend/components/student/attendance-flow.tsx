"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { QRScanner } from "@/components/qr-scanner";
import { FaceCapture } from "@/components/face-capture";
import { ActiveSession } from "./types";

const DEVICE_STORAGE_KEY = "absense.device_id";

export function AttendanceFlow(props: { session: ActiveSession; onDone: () => void }) {
    const { session, onDone } = props;

    // Auto-exit when session expires
    useEffect(() => {
        if (!session.ends_at) return;

        const checkExpiration = () => {
            const now = new Date();
            const end = new Date(session.ends_at!);
            const diff = end.getTime() - now.getTime();

            if (diff <= 0) {
                toast.error("Session has ended");
                onDone();
            } else {
                // Schedule exit
                const timer = setTimeout(() => {
                    toast.error("Session has ended");
                    onDone();
                }, diff);
                return () => clearTimeout(timer);
            }
        };

        return checkExpiration();
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
            // Generate a persistent random ID
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

    const getErrorMessage = useCallback((error: unknown) => {
        if (error instanceof Error) return error.message;
        if (typeof error === "string") return error;
        return "Something went wrong";
    }, []);

    const bindDevice = useCallback(async (id: string) => {
        try {
            setBinding(true);
            await apiClient.studentBindDevice(id);
            // toast.success("Device bound automatically");
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

            // Auto-bind if not bound
            if (!status.has_device) {
                const id = getDeviceId();
                if (id) {
                    const success = await bindDevice(id);
                    if (success) {
                        // Refresh status after binding
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

    // Removed manual handleBind since it's automatic now

    const getLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported");
            return;
        }

        setLocating(true);

        const handleSuccess = (pos: GeolocationPosition) => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocating(false);
        };

        const handleError = (err: GeolocationPositionError, isRetry: boolean) => {
            console.error(`Geolocation error (retry=${isRetry}):`, err.code, err.message);

            // If this was the first attempt (High Accuracy) and it was a timeout or unavailable,
            // try again with low accuracy.
            if (!isRetry && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
                toast("High accuracy failed, switching to low accuracy...", { icon: '⚠️' });
                navigator.geolocation.getCurrentPosition(
                    handleSuccess,
                    (retryErr) => handleError(retryErr, true),
                    { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
                );
                return;
            }

            // Final error handling
            let msg = "Failed to get location.";
            switch (err.code) {
                case err.PERMISSION_DENIED:
                    msg = "Location permission denied. Please allow location access in your browser settings.";
                    break;
                case err.POSITION_UNAVAILABLE:
                    msg = "Location information is unavailable.";
                    break;
                case err.TIMEOUT:
                    msg = "Location request timed out. Please check your connection.";
                    break;
                default:
                    msg = "An unknown error occurred getting location.";
                    break;
            }
            toast.error(msg);
            setLocating(false);
        };

        // First attempt: High Accuracy, 15s timeout
        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            (err) => handleError(err, false),
            { enableHighAccuracy: true, timeout: 15000 }
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
            refreshDeviceStatus(); // Update status to hide enrollment section
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
        if (!coords) {
            toast.error("Capture your current location");
            return;
        }
        const value = deviceId.trim();
        if (!value) {
            toast.error("Device ID missing");
            return;
        }
        if (!selfieFile) {
            toast.error("Capture a selfie for this attendance");
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

    const deviceStatusText = useMemo(() => {
        if (checkingDevice) return "Checking device status…";
        if (!deviceStatus?.has_device) return "Binding device...";
        if (!deviceStatus.is_active) return "Device pending approval";
        return "Device verified";
    }, [checkingDevice, deviceStatus]);

    return (
        <div className="bg-white rounded-md shadow p-4 space-y-6">
            <div>
                <h2 className="text-lg font-semibold">{session.course_code} — {session.course_name}</h2>
                <div className="text-xs text-gray-500">Session #{session.id}</div>
            </div>

            {/* Device ID section hidden but logic active */}
            {/* <section className="space-y-3">
                <Label>Device Identifier</Label>
                <div className="text-xs text-gray-500 font-mono">{deviceId}</div>
                <p className="text-xs text-emerald-700">{deviceStatusText}</p>
            </section> */}

            <section className="grid gap-6 lg:grid-cols-2">
                {!isFaceEnrolled ? (
                    <div className="space-y-4 border-r pr-4">
                        <Label className="text-amber-600 font-bold">Step 1: Reference Face Enrollment</Label>
                        <p className="text-xs text-gray-600">You must enroll your face once before marking attendance.</p>
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
                ) : (
                    <div className="hidden lg:block space-y-4 border-r pr-4 opacity-50 pointer-events-none">
                        <Label>Reference Face</Label>
                        <div className="h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                            Enrolled
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <Label className={!isFaceEnrolled ? "opacity-50" : "font-bold"}>
                        {!isFaceEnrolled ? "Step 2: Attendance Selfie" : "Attendance Selfie"}
                    </Label>
                    <FaceCapture
                        key={`selfie-${selfieCaptureKey}`}
                        label="Capture real-time selfie"
                        allowUpload
                        note="This selfie is uploaded with your attendance submission."
                        onCapture={(file) => setSelfieFile(file)}
                        onClear={() => setSelfieFile(null)}
                    />
                </div>
            </section>

            <section className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                    <Label>Scan QR from lecturer</Label>
                    <QRScanner onDecode={onScan} />
                    {qrPayload ? (
                        <p className="text-sm text-emerald-700 font-medium">
                            ✓ QR locked for session #{qrPayload.session_id}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500">Position the rotating QR code inside the frame.</p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Button variant="outline" onClick={getLocation} disabled={locating}>
                        {locating ? "Locating..." : "Capture location"}
                    </Button>
                    <div className="text-xs text-gray-600">
                        {coords ? `✓ Location captured` : "Location required"}
                    </div>
                </div>
            </section>

            <div className="pt-2">
                <Button
                    className="w-full bg-emerald-900 hover:bg-emerald-900/90 text-white py-6 text-lg"
                    onClick={submit}
                    disabled={submitting || !isFaceEnrolled}
                >
                    {submitting ? "Submitting..." : "Submit Attendance"}
                </Button>
                {!isFaceEnrolled && (
                    <p className="text-center text-xs text-red-500 mt-2">
                        Please enroll your reference face first.
                    </p>
                )}
            </div>
        </div>
    );
}


