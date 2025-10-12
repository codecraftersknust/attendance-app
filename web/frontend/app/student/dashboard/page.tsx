'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-14 sm:h-16">
                            <div className="flex items-center">
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Student Dashboard</h1>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-4">
                                <span className="text-xs sm:text-sm text-gray-700 hidden sm:block">Welcome, {user?.full_name || user?.email}</span>
                                <Button onClick={handleLogout} variant="outline" size="sm" className="text-xs sm:text-sm">
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Attendance Overview */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Attendance Overview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-emerald-600">85%</div>
                                    <p className="text-sm text-gray-600">Current attendance rate</p>
                                </CardContent>
                            </Card>

                            {/* Recent Classes */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Recent Classes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="text-sm">
                                            <span className="font-medium">Data Structures</span>
                                            <span className="text-gray-500 ml-2">Today, 10:00 AM</span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-medium">Algorithms</span>
                                            <span className="text-gray-500 ml-2">Yesterday, 2:00 PM</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button className="w-full" variant="outline">
                                        Mark Attendance
                                    </Button>
                                    <Button className="w-full" variant="outline">
                                        View Schedule
                                    </Button>
                                    <Button className="w-full" variant="outline">
                                        Check Grades
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Upcoming Classes */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="text-base sm:text-lg">Upcoming Classes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-2 sm:gap-0">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-sm sm:text-base">Database Systems</h3>
                                            <p className="text-xs sm:text-sm text-gray-600">Prof. John Doe</p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="text-xs sm:text-sm font-medium">Tomorrow</p>
                                            <p className="text-xs sm:text-sm text-gray-600">9:00 AM - 11:00 AM</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-2 sm:gap-0">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-sm sm:text-base">Software Engineering</h3>
                                            <p className="text-xs sm:text-sm text-gray-600">Prof. Jane Smith</p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="text-xs sm:text-sm font-medium">Friday</p>
                                            <p className="text-xs sm:text-sm text-gray-600">2:00 PM - 4:00 PM</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}