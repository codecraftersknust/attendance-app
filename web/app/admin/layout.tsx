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
        <SidebarProvider>
            <ShadSidebar collapsible="offcanvas">
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Admin</SidebarGroupLabel>
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
