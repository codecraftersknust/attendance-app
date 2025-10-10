import Image from "next/image";
import { Button } from "../ui/button";

export function WhatWeDo() {
    return (
        <div className="relative bg-[url(/board.jpg)] bg-cover bg-center bg-no-repeat h-auto flex justify-center items-start py-20 border-b-4 border-white">
            <div className="absolute inset-0 bg-black/50" />
            <div className="z-10 max-w-7xl mx-auto text-white text-center gap-4 flex flex-col">
                <h1 className="text-4xl font-bold">Absence is more than just an attendance tracking tool</h1>
                <p className="text-xl font-medium">
                    It's a platform that helps you manage your attendance and track your progress.
                </p>
                <div className="flex justify-between mt-10">
                    <div className="text-left">
                        <h2 className="text-lg font-bold">Smart Attendance Management</h2>
                        <ul className="list-disc list-inside flex flex-col gap-3 mt-4">
                            <li>QR Code Attendance</li>
                            <li>Face Recognition</li>
                            <li>Geo Location</li>
                            <li>Email Verification</li>
                        </ul>
                        <div className="flex gap-4">
                            <Button className="mt-4 bg-emerald-900 hover:bg-emerald-900/90" size="lg">Learn More</Button>
                            <Button className="mt-4 bg-transparent border border-white" size="lg">Create an Account</Button>
                        </div>
                    </div>
                    <div>
                        <Image className="rounded-lg" src="/lecture-hall.jpg" alt="Board" width={500} height={500} />
                    </div>
                </div>
            </div>
        </div>
    );
}