'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            // Redirect based on user role
            switch (user.role) {
                case 'student':
                    router.push('/student/dashboard');
                    break;
                case 'lecturer':
                    router.push('/lecturer/dashboard');
                    break;
                case 'admin':
                    router.push('/admin/dashboard');
                    break;
                default:
                    router.push('/auth/login');
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-900"></div>
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-900"></div>
            </div>
        </ProtectedRoute>
    );
}
