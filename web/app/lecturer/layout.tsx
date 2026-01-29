"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { NavUser } from "@/components/nav-user";
import { useAuth } from "@/contexts/AuthContext";
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
import { Plus, BarChart, LayoutDashboard } from 'lucide-react'

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuth();

    const links = [
        { href: "/lecturer/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/lecturer/create-session", label: "Create Session", icon: Plus },
        { href: "/lecturer/reports", label: "Reports", icon: BarChart },
    ];

    return (
        <SidebarProvider>
            <ShadSidebar collapsible="offcanvas">
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Lecturer</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {links.map((link) => (
                                    <SidebarMenuItem key={link.href}>
                                        <Link href={link.href} >
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


