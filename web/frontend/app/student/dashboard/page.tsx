'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentDashboard() {
    const { user } = useAuth();

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-lg sm:text-xl hidden sm:block py-4">Welcome, {user?.full_name || user?.email}</h1>
            </div>
        </ProtectedRoute>
    );
}