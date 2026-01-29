"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Sidebar({ role }: { role: "student" | "lecturer" }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const links =
        role === "student"
            ? [
                { href: "/student/dashboard", label: "Dashboard" },
                { href: "/student/mark", label: "Mark Attendance" },
            ]
            : [
                { href: "/lecturer/dashboard", label: "Dashboard" },
                { href: "/lecturer/create-session", label: "Create Session" },
                { href: "/lecturer/reports", label: "Reports" },
            ];

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-100 rounded-md shadow-md hover:bg-gray-200"
                aria-label="Toggle sidebar"
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-100 border-r transform transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="p-4 h-full overflow-y-auto">
                    <h2 className="text-lg font-bold mb-6">{role === "student" ? "Student" : "Lecturer"} Panel</h2>
                    <nav className="space-y-2">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "block px-3 py-2 rounded-md transition-colors text-sm sm:text-base",
                                    pathname === link.href ? "bg-gray-200 font-medium" : "hover:bg-gray-200"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </aside>
        </>
    );
}