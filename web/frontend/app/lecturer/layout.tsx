import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            <Sidebar role="lecturer" />
            <div className="flex-1 flex flex-col">
                <Navbar role="lecturer" />
                <main className="flex-1 p-6 bg-white overflow-auto">{children}</main>
            </div>
        </div>
    );
}


