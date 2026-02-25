"use client";

import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QRScannerProps = {
    onDecode: (value: string) => void;
    paused?: boolean;
    className?: string;
};

export function QRScanner({ onDecode, paused = false, className }: QRScannerProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const controlsRef = useRef<IScannerControls | null>(null);
    const lastResultRef = useRef<string | null>(null);

    const [status, setStatus] = useState<string>("Requesting camera access…");
    const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

    const supported = useMemo(() => {
        if (typeof window === "undefined" || typeof navigator === "undefined") return false;
        return typeof navigator.mediaDevices !== "undefined" && typeof navigator.mediaDevices.getUserMedia === "function";
    }, []);

    const stopScanner = useCallback(() => {
        if (controlsRef.current) {
            controlsRef.current.stop();
            controlsRef.current = null;
        }
    }, []);

    const startScanner = useCallback(async () => {
        if (!supported || !videoRef.current) {
            return;
        }
        stopScanner();
        setPermissionDenied(false);
        setStatus("Starting camera…");

        const reader = new BrowserMultiFormatReader();
        try {
            controlsRef.current = await reader.decodeFromVideoDevice(
                undefined,
                videoRef.current,
                (result, error) => {
                    if (result) {
                        const text = result.getText();
                        if (text && text !== lastResultRef.current) {
                            lastResultRef.current = text;
                            onDecode(text);
                        }
                        setStatus("QR detected");
                        setTimeout(() => setStatus("Point your camera at the QR code"), 1500);
                    } else if (error && !(error instanceof DOMException)) {
                        console.debug("QR scan error", error);
                    }
                }
            );
            setStatus("Point your camera at the QR code");
        } catch (err) {
            console.error("Unable to start QR scanner", err);
            setPermissionDenied(true);
            setStatus("Camera permission denied or unavailable");
            stopScanner();
        }
    }, [onDecode, stopScanner, supported]);

    useEffect(() => {
        if (!supported) {
            setStatus("Camera access is not supported in this browser");
            return;
        }
        if (paused) {
            stopScanner();
            return;
        }
        startScanner();
        return () => {
            stopScanner();
        };
    }, [paused, startScanner, stopScanner, supported]);

    return (
        <div className={cn("space-y-3", className)}>
            <div className="relative rounded-xl border border-dashed border-gray-300 bg-black/80">
                {supported ? (
                    <video
                        ref={videoRef}
                        className="w-full h-64 object-cover rounded-xl"
                        muted
                        playsInline
                        autoPlay
                    />
                ) : (
                    <div className="w-full h-64 flex items-center justify-center text-white text-sm">
                        Camera not supported
                    </div>
                )}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-emerald-400/80 rounded-lg animate-pulse"></div>
                </div>
            </div>

            <div className="text-sm text-gray-600">{status}</div>

            {permissionDenied && (
                <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                    Camera access was denied. Please enable camera permission in your browser settings and tap retry.
                    <div className="mt-2">
                        <Button variant="outline" size="sm" onClick={startScanner}>Retry camera</Button>
                    </div>
                </div>
            )}
        </div>
    );
}