'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
    const { user, logout, loading } = useAuth();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className="w-full bg-gray-100 border-b px-4 sm:px-6 py-4 sm:py-5">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-4 sm:space-x-8">
                    <Link href="/">
                        <h1 className="font-semibold text-lg">
                            Absence
                        </h1>
                    </Link>
                    {!user && (
                        <nav className="hidden lg:flex items-center space-x-4 text-sm font-medium">
                            <Link href="/getting-started" className="hover:text-emerald-900">
                                Getting Started
                            </Link>
                            <Link href="/instructor-resources" className="hover:text-emerald-900">
                                Instructor Resources
                            </Link>
                            <Link href="/support" className="hover:text-emerald-900">
                                Support & Help
                            </Link>
                            <Link href="/about" className="hover:text-emerald-900">
                                About
                            </Link>
                        </nav>
                    )}
                </div>

                {/* Desktop Auth Section */}
                <div className="hidden sm:flex items-center space-x-4">
                    {loading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-900"></div>
                    ) : user ? (
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">
                                Welcome, {user.full_name || user.email}
                            </span>
                            <Button onClick={handleLogout} variant="outline" size="sm">
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Link href="/auth/register">
                                <Button variant="outline" size="sm">
                                    Create an Account
                                </Button>
                            </Link>
                            <Link href="/auth/login">
                                <Button className="bg-emerald-900 hover:bg-emerald-900/90" size="sm">
                                    Sign In
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                {!user && (
                    <button
                        onClick={toggleMenu}
                        className="sm:hidden p-2 rounded-md hover:bg-gray-200"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                )}
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && !user && (
                <div className="sm:hidden border-t bg-white">
                    <nav className="px-4 py-4 space-y-4">
                        <Link
                            href="/getting-started"
                            className="block text-sm font-medium hover:text-emerald-900"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Getting Started
                        </Link>
                        <Link
                            href="/instructor-resources"
                            className="block text-sm font-medium hover:text-emerald-900"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Instructor Resources
                        </Link>
                        <Link
                            href="/support"
                            className="block text-sm font-medium hover:text-emerald-900"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Support & Help
                        </Link>
                        <Link
                            href="/about"
                            className="block text-sm font-medium hover:text-emerald-900"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            About
                        </Link>
                        <div className="flex flex-col space-y-2 pt-4 border-t">
                            <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                                <Button variant="outline" className="w-full">
                                    Create an Account
                                </Button>
                            </Link>
                            <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                                <Button className="bg-emerald-900 hover:bg-emerald-900/90 w-full">
                                    Sign In
                                </Button>
                            </Link>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}