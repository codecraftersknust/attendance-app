'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace('/auth/login');
            return;
        }

        switch (user.role) {
            case 'student':
                router.replace('/student/dashboard');
                break;
            case 'lecturer':
                router.replace('/lecturer/dashboard');
                break;
            case 'admin':
                router.replace('/admin/dashboard');
                break;
            default:
                router.replace('/auth/login');
        }
    }, [user, loading, router]);

    // Always show a loading fallback while redirecting
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-900"></div>
        </div>
    );
}
