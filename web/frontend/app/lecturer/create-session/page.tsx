"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CreateSessionPage() {
    const [sessionActive, setSessionActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600);

    useEffect(() => {
        if (sessionActive && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [sessionActive, timeLeft]);

    return (
        <div className="max-w-lg mx-auto mt-10">
            {!sessionActive ? (
                <Card>
                    <CardContent className="space-y-4">
                        <h2 className="font-semibold text-xl">Create Attendance Session</h2>
                        <div className="space-y-2">
                            <label>Course</label>
                            <select className="border w-full rounded-md p-2">
                                <option>CS101 - AI Fundamentals</option>
                                <option>EE205 - Control Systems</option>
                            </select>
                            <label>Duration (minutes)</label>
                            <input type="number" className="border w-full rounded-md p-2" defaultValue={10} />
                        </div>
                        <Button className="w-full" onClick={() => setSessionActive(true)}>
                            Start Session
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="space-y-4 text-center">
                        <h2 className="font-semibold text-xl">Session Active</h2>
                        <div className="w-64 h-64 mx-auto bg-gray-200 flex items-center justify-center rounded-md">
                            <p>🔄 QR Code Mock</p>
                        </div>
                        <p className="text-gray-600">Session ends in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
                        <Button variant="destructive" onClick={() => setSessionActive(false)}>
                            End Session
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


