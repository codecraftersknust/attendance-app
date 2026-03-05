'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: ('student' | 'lecturer' | 'admin')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/auth/login');
                return;
            }

            if (allowedRoles && !allowedRoles.includes(user.role)) {
                router.push('/unauthorized');
                return;
            }
        }
    }, [user, loading, router, allowedRoles]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-600"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}
