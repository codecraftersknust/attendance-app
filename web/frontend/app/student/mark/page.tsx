"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRScanner } from "@/components/qr-scanner";
import { FaceCapture } from "@/components/face-capture";
import { GeoCheck } from "@/components/geo-check";

export default function MarkAttendancePage() {
    const [step, setStep] = useState<"qr" | "face" | "geo" | "done">("qr");

    const handleNext = () => {
        if (step === "qr") setStep("face");
        else if (step === "face") setStep("geo");
        else setStep("done");
    };

    return (
        <div className="flex flex-col items-center space-y-4 mt-10">
            <Card className="w-full max-w-md p-4">
                <CardContent>
                    {step === "qr" && <QRScanner onSuccess={handleNext} />}
                    {step === "face" && <FaceCapture onCaptured={handleNext} />}
                    {step === "geo" && <GeoCheck onVerified={handleNext} />}
                    {step === "done" && (
                        <div className="text-center">
                            <p className="text-green-600 font-semibold">Attendance Recorded!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            {step !== "done" && (
                <Button onClick={handleNext} className="mt-4">
                    Next
                </Button>
            )}
        </div>
    );
}


