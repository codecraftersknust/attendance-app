'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function LecturerDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <ProtectedRoute allowedRoles={['lecturer']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              <div className="flex items-center">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Lecturer Dashboard</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Students */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">156</div>
                  <p className="text-xs text-gray-600">Across all courses</p>
                </CardContent>
              </Card>

              {/* Active Sessions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">3</div>
                  <p className="text-xs text-gray-600">Currently running</p>
                </CardContent>
              </Card>

              {/* Attendance Rate */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">78%</div>
                  <p className="text-xs text-gray-600">This semester</p>
                </CardContent>
              </Card>

              {/* Today's Classes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">2</div>
                  <p className="text-xs text-gray-600">Scheduled</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" size="lg">
                    Start New Session
                  </Button>
                  <Button className="w-full" variant="outline" size="lg">
                    View Active Sessions
                  </Button>
                  <Button className="w-full" variant="outline" size="lg">
                    Generate Reports
                  </Button>
                  <Button className="w-full" variant="outline" size="lg">
                    Manage Courses
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Data Structures session ended</p>
                        <p className="text-xs text-gray-600">45 students attended</p>
                      </div>
                      <span className="text-xs text-gray-500">2 hours ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Algorithms session started</p>
                        <p className="text-xs text-gray-600">38 students present</p>
                      </div>
                      <span className="text-xs text-gray-500">4 hours ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Attendance report generated</p>
                        <p className="text-xs text-gray-600">Week 8 summary</p>
                      </div>
                      <span className="text-xs text-gray-500">1 day ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg bg-emerald-50 gap-2 sm:gap-0">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm sm:text-base">Data Structures & Algorithms</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Room 101, Building A</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs sm:text-sm font-medium text-emerald-600">In Progress</p>
                      <p className="text-xs sm:text-sm text-gray-600">9:00 AM - 11:00 AM</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-2 sm:gap-0">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm sm:text-base">Database Systems</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Room 205, Building B</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs sm:text-sm font-medium">Upcoming</p>
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