'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import UserMenu from "../user-menu";
import Image from "next/image";

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
        <header className="w-full border-b border-emerald-800/50 bg-gradient-to-r from-emerald-900 to-teal-900 sticky top-0 z-50 shrink-0 pt-[env(safe-area-inset-top)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-4">
                <div className="flex items-center justify-between gap-4 min-w-0">
                    <Link className="flex items-center gap-2 font-semibold text-lg text-white hover:text-white/90 transition-colors" href="/">
                        <Image src="/icon.png" alt="Absense" className="w-10 h-10 rounded-md" width={100} height={100} />
                        Absense
                    </Link>

                    {/* Auth: one Sign in link + one Get Started button */}
                    <div className="hidden sm:flex items-center gap-4">
                        {loading ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600/50 border-t-emerald-200"></div>
                        ) : user ? (
                            <UserMenu variant="dark" />
                        ) : (
                            <>
                                <Link href="/auth/login" className="text-sm font-medium text-white hover:text-white/90 transition-colors">
                                    Sign in
                                </Link>
                                <Link href="/auth/register">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white text-emerald-700 hover:bg-white/90 hover:text-emerald-800 border-0"
                                    >
                                        Get Started
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button - visible on small screens, min 44px touch target */}
                    <button
                        onClick={toggleMenu}
                        className="sm:hidden p-2.5 -m-2.5 rounded-lg text-white hover:bg-white/10 active:bg-white/20 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation transition-colors"
                        aria-label="Toggle menu"
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu - full width dropdown */}
            {isMenuOpen && (
                <div className="sm:hidden border-t border-emerald-800/50 bg-emerald-900 shadow-lg">
                    <nav className="px-4 sm:px-6 py-4">
                        {loading ? (
                            <div className="flex justify-center py-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600/50 border-t-emerald-200"></div>
                            </div>
                        ) : user ? (
                            <div className="flex flex-col gap-2">
                                <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                                    <Button variant="outline" className="w-full min-h-[44px] bg-transparent border-emerald-600 text-white hover:bg-white/10 hover:border-emerald-400">
                                        Dashboard
                                    </Button>
                                </Link>
                                <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                                    <Button variant="outline" className="w-full min-h-[44px] bg-transparent border-emerald-600 text-white hover:bg-white/10 hover:border-emerald-400">
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
                                    className="flex items-center text-sm font-medium text-white hover:text-white/90 py-3 min-h-[44px] transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Sign in
                                </Link>
                                <Link href="/auth/register" onClick={() => setIsMenuOpen(false)} className="block">
                                    <Button
                                        variant="outline"
                                        className="w-full min-h-[44px] bg-white text-emerald-700 hover:bg-white/90 hover:text-emerald-800 border-0"
                                    >
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