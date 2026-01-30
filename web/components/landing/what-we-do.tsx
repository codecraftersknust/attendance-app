import Image from "next/image";
import { Button } from "../ui/button";

export function WhatWeDo() {
    return (
        <div id="what-we-do" className="relative bg-[url(/board.jpg)] bg-cover bg-center bg-no-repeat h-auto flex justify-center items-start py-12 sm:py-16 lg:py-20 border-b-4 border-white">
            <div className="absolute inset-0 bg-black/50" />
            <div className="z-10 max-w-7xl mx-auto text-white text-center gap-4 flex flex-col px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Absence is more than just an attendance tracking tool</h1>
                <p className="text-lg sm:text-xl font-medium">
                    It's a platform that helps you manage your attendance and track your progress.
                </p>
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8 mt-4 lg:mt-10">
                    <div className="text-left lg:flex-1">
                        <h2 className="text-lg font-bold">Smart Attendance Management</h2>
                        <ul className="list-disc list-inside flex flex-col gap-3 mt-4">
                            <li>QR Code Attendance</li>
                            <li>Face Recognition</li>
                            <li>Geo Location</li>
                            <li>Email Verification</li>
                        </ul>
                        <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <Button className="bg-emerald-900 hover:bg-emerald-900/90 w-full sm:w-auto" size="lg">Learn More</Button>
                            <Button className="bg-transparent border border-white w-full sm:w-auto" size="lg">Create an Account</Button>
                        </div>
                    </div>
                    <div className="lg:flex-1 flex justify-center">
                        <Image
                            className="rounded-lg w-full max-w-md lg:max-w-lg"
                            src="/lecture-hall.jpg"
                            alt="Board"
                            width={500}
                            height={500}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}