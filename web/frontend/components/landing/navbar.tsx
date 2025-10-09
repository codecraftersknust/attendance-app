import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
    return (
        <header className="w-full bg-gray-100 border-b px-6 py-5">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-8">
                    <Link href="/">
                        <h1 className="font-semibold text-lg">
                            Absence
                        </h1>
                    </Link>
                    <nav className="flex items-center space-x-4 text-sm font-medium">
                        <Link href="/getting-started">
                            Getting Started
                        </Link>
                        <Link href="/instructor-resources">
                            Instructor Resources
                        </Link>
                        <Link href="/support">
                            Support & Help
                        </Link>
                        <Link href="/about">
                            About
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center space-x-4">
                    <Link href="/auth/register">
                        <Button variant="outline">
                            Create an Account
                        </Button>
                    </Link>
                    <Link href="/auth/login">
                        <Button className="bg-emerald-900 hover:bg-emerald-900/90">
                            Sign In
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}