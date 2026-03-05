'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTopLoader } from 'nextjs-toploader';
import { useEffect } from 'react';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { start } = useTopLoader();

    useEffect(() => {
        if (loading) return;
        if (!user) {
            start();
            router.replace('/auth/login');
            return;
        }

        start();
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
    }, [user, loading, router, start]);

    return null;
}
