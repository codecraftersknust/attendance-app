"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";


export function Sidebar({ role }: { role: "student" | "lecturer" }) {
    const pathname = usePathname();
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
        <aside className="w-64 bg-gray-100 border-r p-4">
            <h2 className="text-lg font-bold mb-6">{role === "student" ? "Student" : "Lecturer"} Panel</h2>
            <nav className="space-y-2">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "block px-3 py-2 rounded-md transition-colors",
                            pathname === link.href ? "bg-gray-200 font-medium" : "hover:bg-gray-200"
                        )}
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}