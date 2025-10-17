"use client";

import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";

export default function StudentLayout({ children }: { children: React.ReactNode }) {

    return (
        <div className="flex min-h-screen">
            <Sidebar role="student" />
            <div className="flex-1 flex flex-col">
                <Navbar />
                <main className="flex-1 bg-gray-50 overflow-auto">{children}</main>
            </div>
        </div>
    );
}


