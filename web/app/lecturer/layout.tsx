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
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import { Plus, BarChart, LayoutDashboard } from 'lucide-react'
import Image from "next/image";

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuth();

    const links = [
        { href: "/lecturer/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/lecturer/create-session", label: "Create Session", icon: Plus },
        { href: "/lecturer/reports", label: "Reports", icon: BarChart },
    ];

    return (
        <SidebarProvider className="lecturer-layout">
            <ShadSidebar collapsible="offcanvas">
                <SidebarHeader className="border-b border-gray-200 bg-white px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Image src="/icon.png" alt="Absense" className="h-10 w-10 rounded-xl object-cover" width={40} height={40} />
                        <div>
                            <p className="font-semibold text-emerald-900">Lecturer</p>
                            <p className="text-xs text-emerald-700">Attendance Portal</p>
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
                <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
                    <Navbar />
                    <main className="flex-1 overflow-auto">{children}</main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}


