"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FaceCaptureProps = {
    onCapture: (file: File, previewUrl: string) => void;
    onClear?: () => void;
    label?: string;
    allowUpload?: boolean;
    note?: string;
};

export function FaceCapture({
    onCapture,
    onClear,
    label = "Capture selfie",
    allowUpload = true,
    note,
}: FaceCaptureProps) {
    const webcamRef = useRef<Webcam | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [busy, setBusy] = useState<boolean>(false);

    const videoConstraints = useMemo(() => ({ facingMode: "user" as const }), []);

    const dataUrlToFile = useCallback(async (dataUrl: string): Promise<File> => {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const ext = blob.type === "image/png" ? "png" : "jpg";
        return new File([blob], `capture-${Date.now()}.${ext}`, { type: blob.type || "image/jpeg" });
    }, []);

    const handleCapture = useCallback(async () => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;
        setBusy(true);
        try {
            const file = await dataUrlToFile(imageSrc);
            setPreview(imageSrc);
            onCapture(file, imageSrc);
        } finally {
            setBusy(false);
        }
    }, [dataUrlToFile, onCapture]);

    const handleUpload = useCallback(
        (file?: File | null) => {
            if (!file) return;
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
            onCapture(file, previewUrl);
        },
        [onCapture],
    );

    const clear = () => {
        if (preview?.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        onClear?.();
    };

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <p className="text-sm font-medium text-gray-800">{label}</p>
                {note && <p className="text-xs text-gray-500">{note}</p>}
            </div>

            <div className="relative rounded-xl border border-gray-200 overflow-hidden">
                {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={preview}
                        alt="Captured selfie"
                        className="w-full h-64 object-cover"
                    />
                ) : (
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="w-full h-64 object-cover"
                    />
                )}
                {!preview && (
                    <div className="absolute inset-0 border-2 border-emerald-400 pointer-events-none rounded-xl" />
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {preview ? (
                    <>
                        <Button variant="secondary" onClick={clear}>
                            Retake
                        </Button>
                    </>
                ) : (
                    <Button onClick={handleCapture} disabled={busy}>
                        {busy ? "Capturing..." : "Capture"}
                    </Button>
                )}
                {allowUpload && (
                    <label className="inline-flex items-center gap-2 text-sm text-emerald-700 cursor-pointer">
                        <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleUpload(e.target.files?.[0])}
                        />
                        Upload photo
                    </label>
                )}
            </div>
        </div>
    );
}