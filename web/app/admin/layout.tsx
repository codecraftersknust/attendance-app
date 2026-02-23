"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar as ShadSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import {
    LayoutDashboard,
    BookOpen,
    CalendarClock,
    Users,
    Flag,
    Activity,
    Smartphone,
    CheckSquare,
    Shield,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const links = [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/courses", label: "Courses", icon: BookOpen },
        { href: "/admin/sessions", label: "Sessions", icon: CalendarClock },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/flagged", label: "Flagged", icon: Flag },
        { href: "/admin/activity", label: "Activity", icon: Activity },
        { href: "/admin/imei", label: "Device Resets", icon: Smartphone },
        { href: "/admin/manual-mark", label: "Manual Mark", icon: CheckSquare },
    ];

    return (
        <SidebarProvider className="admin-layout">
            <ShadSidebar collapsible="offcanvas">
                <SidebarHeader className="border-b border-emerald-200 bg-emerald-50 px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-white">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-emerald-900">Admin</p>
                            <p className="text-xs text-emerald-700">School Administration</p>
                        </div>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {links.map((link) => (
                                    <SidebarMenuItem key={link.href}>
                                        <Link href={link.href}>
                                            <SidebarMenuButton isActive={pathname === link.href}>
                                                <link.icon className="size-4 mr-2" />
                                                <span>{link.label}</span>
                                            </SidebarMenuButton>
                                        </Link>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarSeparator />
                    <NavUser />
                </SidebarFooter>
            </ShadSidebar>
            <SidebarInset>
                <div className="flex-1 flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-1 bg-gray-50 overflow-auto">{children}</main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
