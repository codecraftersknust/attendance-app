'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function Navbar() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const handleGoToHome = () => {
        router.push('/');
    };

    return (
        <header className="bg-emerald-900 shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14 sm:h-16">
                    <div className="flex items-center">
                        <h1 className="text-sm sm:text-base text-white hidden sm:block font-bold">Absense</h1>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <Button onClick={handleGoToHome} variant="outline" size="sm" className="text-xs sm:text-sm">
                            Go to Home
                        </Button>
                        <Button onClick={handleLogout} variant="outline" size="sm" className="text-xs sm:text-sm">
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}