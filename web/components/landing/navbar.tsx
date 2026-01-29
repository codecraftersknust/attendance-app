'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import UserMenu from "../user-menu";

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
        <header className="w-full border-b max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 relative z-50">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 sm:space-x-8">
                    <Link className="font-semibold text-lg" href="/">
                        Absence
                    </Link>
                    <nav className="hidden lg:flex items-center space-x-4 text-sm font-medium">
                        <Link href="/getting-started" className="hover:text-emerald-900">
                            Getting Started
                        </Link>
                        <Link href="/support" className="hover:text-emerald-900">
                            Support & Help
                        </Link>
                        <Link href="/about" className="hover:text-emerald-900">
                            About
                        </Link>
                    </nav>
                </div>

                {/* Desktop Auth Section */}
                <div className="hidden sm:flex items-center space-x-4">
                    {loading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-900"></div>
                    ) : user ? (
                        <UserMenu />
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

                {/* Mobile Menu Button - always visible on small screens */}
                <button
                    onClick={toggleMenu}
                    className="sm:hidden p-2 rounded-md hover:bg-gray-200 w-10 h-10 flex items-center justify-center"
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu - shows for both guests and authenticated users (overlay) */}
            {isMenuOpen && (
                <div className="sm:hidden absolute left-0 right-0 top-full border-t bg-white z-40 shadow-lg">
                    <nav className="px-4 py-4 space-y-4">
                        <Link
                            href="/getting-started"
                            className="block text-sm font-medium hover:text-emerald-900"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Getting Started
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

                        {/* Auth actions for mobile */}
                        <div className="pt-4 border-t">
                            {loading ? (
                                <div className="flex justify-center py-2">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-900"></div>
                                </div>
                            ) : user ? (
                                <div className="flex flex-col space-y-2">
                                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                                        <Button variant="outline" className="w-full">
                                            Dashboard
                                        </Button>
                                    </Link>
                                    <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                                        <Button variant="outline" className="w-full">
                                            My Profile
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                        className="bg-emerald-900 hover:bg-emerald-900/90 w-full"
                                    >
                                        Sign Out
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col space-y-2">
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
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}