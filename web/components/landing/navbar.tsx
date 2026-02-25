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
        <header className="w-full border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50 shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                <div className="flex items-center justify-between gap-4 min-w-0">
                <Link className="font-semibold text-lg" href="/">
                    Absense
                </Link>

                {/* Auth: one Sign in link + one Get Started button */}
                <div className="hidden sm:flex items-center gap-4">
                    {loading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-700"></div>
                    ) : user ? (
                        <UserMenu />
                    ) : (
                        <>
                            <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-emerald-700 active:text-emerald-800 transition-colors">
                                Sign in
                            </Link>
                            <Link href="/auth/register">
                                <Button variant="primary" size="sm">
                                    Get Started
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button - visible on small screens, min 44px touch target */}
                <button
                    onClick={toggleMenu}
                    className="sm:hidden p-2.5 -m-2.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                    aria-label="Toggle menu"
                    aria-expanded={isMenuOpen}
                >
                    {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
                </div>
            </div>

            {/* Mobile Menu - full width dropdown */}
            {isMenuOpen && (
                <div className="sm:hidden border-t bg-white shadow-lg">
                    <nav className="px-4 sm:px-6 py-4">
                        {loading ? (
                            <div className="flex justify-center py-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-700"></div>
                            </div>
                        ) : user ? (
                            <div className="flex flex-col gap-2">
                                <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                                    <Button variant="outline" className="w-full min-h-[44px]">
                                        Dashboard
                                    </Button>
                                </Link>
                                <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                                    <Button variant="outline" className="w-full min-h-[44px]">
                                        My Profile
                                    </Button>
                                </Link>
                                <Button
                                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                    variant="primary"
                                    className="w-full min-h-[44px]"
                                >
                                    Sign Out
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/auth/login"
                                    className="block text-sm font-medium text-gray-600 hover:text-emerald-700 active:text-emerald-800 py-3 min-h-[44px] flex items-center transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Sign in
                                </Link>
                                <Link href="/auth/register" onClick={() => setIsMenuOpen(false)} className="block">
                                    <Button variant="primary"
                                    className="w-full min-h-[44px]">
                                        Get Started
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}