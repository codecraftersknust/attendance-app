import { Button } from "@/components/ui/button";


export function Navbar({ role }: { role: "student" | "lecturer" }) {
    return (
        <header className="w-full bg-gray-100 border-b flex items-center justify-between px-6 py-3">
            <h1 className="font-semibold text-lg">
                {role === "student" ? "Student Dashboard" : role === "lecturer" ? "Lecturer Dashboard" : ""}
            </h1>
            <div className="flex items-center space-x-4">
                <p className="text-gray-600">Logged in as {role}</p>
                <Button variant="outline">Logout</Button>
            </div>
        </header>
    );
}