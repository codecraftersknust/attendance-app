"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { FaceCapture } from "@/components/face-capture";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

const DEVICE_STORAGE_KEY = "absense.device_id";

function getOrCreateDeviceId(): string {
    if (typeof window === "undefined") return "";
    let id = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!id) {
        id = typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : "dev_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(DEVICE_STORAGE_KEY, id);
    }
    return id;
}

export default function SetupFacePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [hasFaceEnrolled, setHasFaceEnrolled] = useState(false);
    const [refFaceFile, setRefFaceFile] = useState<File | null>(null);
    const [enrolling, setEnrolling] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/auth/login");
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (!user || user.role !== "student") return;

        const init = async () => {
            try {
                setChecking(true);
                const deviceId = getOrCreateDeviceId();
                const status = await apiClient.studentDeviceStatus();

                if (!status.has_device && deviceId) {
                    await apiClient.studentBindDevice(deviceId);
                }

                setHasFaceEnrolled(status.has_face_enrolled ?? false);
            } catch {
                setHasFaceEnrolled(false);
            } finally {
                setChecking(false);
            }
        };

        init();
    }, [user]);

    const handleEnrollFace = async () => {
        if (!refFaceFile) {
            toast.error("Capture a reference selfie first");
            return;
        }

        try {
            setEnrolling(true);
            await apiClient.studentEnrollFace(refFaceFile);
            toast.success("Reference face enrolled successfully");
            setRefFaceFile(null);
            setHasFaceEnrolled(true);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Failed to enroll face";
            toast.error(msg);
        } finally {
            setEnrolling(false);
        }
    };

    const handleContinue = () => {
        router.replace("/dashboard");
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-svh flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700" />
            </div>
        );
    }

    if (user.role !== "student") {
        router.replace("/dashboard");
        return null;
    }

    if (checking) {
        return (
            <div className="min-h-svh flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700" />
                <p className="mt-4 text-gray-600">Setting up...</p>
            </div>
        );
    }

    if (hasFaceEnrolled) {
        return (
            <div className="min-h-svh flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-6">
                <div className="max-w-md w-full text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-6">
                        <CheckCircle className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-emerald-900">You&apos;re all set!</h1>
                    <p className="mt-2 text-gray-600">
                        Your face is enrolled. You can now mark attendance quickly.
                    </p>
                    <Button
                        variant="primary"
                        className="mt-8 w-full"
                        onClick={handleContinue}
                    >
                        Continue to App
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-svh bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-900 text-white text-2xl font-bold mb-4">
                        A
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Enroll Your Face</h1>
                    <p className="mt-2 text-gray-600 text-sm">
                        Take a clear photo of your face. This will be used to verify your attendance.
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="font-semibold text-gray-900 mb-2">Reference Face</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Look at the camera in good lighting. Remove glasses if possible.
                    </p>

                    <FaceCapture
                        label="Capture a clear reference selfie"
                        allowUpload
                        note="Use good lighting, remove face coverings, and center your face."
                        onCapture={(file) => setRefFaceFile(file)}
                        onClear={() => setRefFaceFile(null)}
                    />

                    <div className="mt-4 flex flex-col gap-2">
                        <Button
                            variant="primary"
                            onClick={handleEnrollFace}
                            disabled={!refFaceFile || enrolling}
                            className="w-full"
                        >
                            {enrolling ? "Enrolling..." : "Enroll Face"}
                        </Button>
                        <Link href="/dashboard" className="text-center text-sm text-gray-500 hover:text-gray-700">
                            Skip for now
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
