'use client';

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";
import { LayoutDashboard } from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const PAGE_LABELS: Record<string, string> = {
    dashboard: "Dashboard",
    "create-session": "Create Session",
    reports: "Reports",
    courses: "Courses",
    sessions: "Sessions",
    users: "Users",
    flagged: "Flagged",
    activity: "Activity",
    imei: "Device Resets",
    "manual-mark": "Manual Mark",
    "mark-attendance": "Mark Attendance",
};

export function Navbar() {
    const pathname = usePathname();

    const { dashboardHref, currentLabel } = useMemo(() => {
        const segments = pathname.split("/").filter(Boolean);
        if (segments.length === 0) return { dashboardHref: null, currentLabel: "Home" };

        const role = segments[0];
        const dashboardHref = `/${role}/dashboard`;
        const currentSlug = segments[segments.length - 1];
        const currentLabel =
            PAGE_LABELS[currentSlug] ??
            currentSlug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

        return { dashboardHref, currentLabel };
    }, [pathname]);

    const isOnDashboard = pathname.endsWith("/dashboard");

    return (
        <header className="sticky top-0 z-50 bg-emerald-900 shadow-sm border-b shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <Breadcrumb>
                    <BreadcrumbList className="text-white">
                        {dashboardHref && !isOnDashboard && (
                            <>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link
                                            href={dashboardHref}
                                            className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
                                        >
                                            <LayoutDashboard className="size-4" />
                                            Dashboard
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-white/60" />
                            </>
                        )}
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-white">{currentLabel}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
        </header>
    );
}