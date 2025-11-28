"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

const QrScanner = dynamic(() => import("@/components/qr-scanner").then(m => m.QRScanner), { ssr: false });

type ActiveSession = { id: number; code: string; course_id: number; course_code?: string; course_name?: string };

export function AttendanceFlow(props: { session: ActiveSession; onDone: () => void }) {
    const { session, onDone } = props;

    const [imei, setImei] = useState<string>("");
    const [binding, setBinding] = useState<boolean>(false);
    const [bound, setBound] = useState<boolean>(false);

    const [refFace, setRefFace] = useState<File | null>(null);
    const [enrolling, setEnrolling] = useState<boolean>(false);
    const [enrolled, setEnrolled] = useState<boolean>(false);

    const [selfie, setSelfie] = useState<File | null>(null);
    const [qrPayload, setQrPayload] = useState<{ session_id: number; nonce: string } | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    const getLocation = useCallback(() => {
        if (!navigator.geolocation) return toast.error("Geolocation not supported");
        navigator.geolocation.getCurrentPosition(
            (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => toast.error("Failed to get location"),
            { enableHighAccuracy: true, timeout: 8000 }
        );
    }, []);

    const bindDevice = async () => {
        if (!imei.trim()) return toast.error("Enter your device IMEI");
        try {
            setBinding(true);
            await apiClient.studentBindDevice(imei.trim());
            setBound(true);
            toast.success("Device bound");
        } catch (e: any) {
            toast.error(e?.message || "Failed to bind device");
        } finally {
            setBinding(false);
        }
    };

    const enrollFace = async () => {
        if (!refFace) return toast.error("Choose a selfie for enrollment");
        try {
            setEnrolling(true);
            await apiClient.studentEnrollFace(refFace);
            setEnrolled(true);
            toast.success("Face enrolled");
        } catch (e: any) {
            toast.error(e?.message || "Failed to enroll face");
        } finally {
            setEnrolling(false);
        }
    };

    const onScan = (value: string) => {
        try {
            const parsed = JSON.parse(value);
            if (parsed && parsed.session_id && parsed.nonce) {
                setQrPayload({ session_id: Number(parsed.session_id), nonce: String(parsed.nonce) });
                toast.success("QR scanned");
            } else {
                toast.error("Invalid QR payload");
            }
        } catch {
            toast.error("Invalid QR payload");
        }
    };

    const submit = async () => {
        if (!qrPayload) return toast.error("Scan the QR code shown by your lecturer");
        if (!coords) return toast.error("Get your location first");
        if (!imei.trim()) return toast.error("Bind your device");
        try {
            setSubmitting(true);
            const res = await apiClient.studentSubmitAttendance({
                qr_session_id: qrPayload.session_id,
                qr_nonce: qrPayload.nonce,
                latitude: coords.lat,
                longitude: coords.lng,
                imei: imei.trim(),
                selfie,
            });
            toast.success(`Attendance marked (${res.status})`);
            onDone();
        } catch (e: any) {
            toast.error(e?.message || "Failed to submit attendance");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-md shadow p-4 space-y-6">
            <div>
                <h2 className="text-lg font-semibold">{session.course_code} — {session.course_name}</h2>
                <div className="text-xs text-gray-500">Session #{session.id}</div>
            </div>

            <div className="space-y-2">
                <Label>Device IMEI</Label>
                <div className="flex gap-2">
                    <Input value={imei} onChange={(e) => setImei(e.target.value)} placeholder="Enter your device IMEI" />
                    <Button onClick={bindDevice} disabled={binding || bound}>{binding ? "Binding..." : bound ? "Bound" : "Bind"}</Button>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Enroll Reference Face (optional but recommended)</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setRefFace(e.target.files?.[0] || null)} />
                    <Button onClick={enrollFace} disabled={enrolling || !refFace || enrolled}>{enrolling ? "Enrolling..." : enrolled ? "Enrolled" : "Enroll"}</Button>
                </div>
                <div className="space-y-2">
                    <Label>Selfie for this Attendance (optional)</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] || null)} />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Scan QR from Lecturer</Label>
                <QrScanner onSuccess={() => {
                    // In the mock scanner, ask for the nonce so we can simulate the QR payload
                    const nonce = window.prompt("Enter QR nonce from lecturer screen:") || "";
                    if (!nonce) {
                        toast.error("Nonce required");
                        return;
                    }
                    onScan(JSON.stringify({ session_id: session.id, nonce }));
                }} />
            </div>

            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={getLocation}>Get Location</Button>
                <div className="text-xs text-gray-600">{coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "Location not set"}</div>
            </div>

            <div>
                <Button className="bg-emerald-900 hover:bg-emerald-900/90 text-white" onClick={submit} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Attendance"}
                </Button>
            </div>
        </div>
    );
}


