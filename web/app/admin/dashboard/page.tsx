'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Users, GraduationCap, UserCog, CalendarClock, BookOpen, Flag, Activity, Calendar, Settings2, AlertOctagon } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [overview, setOverview] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    type SchoolSettings = { current_semester: string; is_on_break: boolean; enrollment_open: boolean; academic_year: string; updated_at: string | null };
    const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [settingsForm, setSettingsForm] = useState({ current_semester: '1st Semester', is_on_break: false, enrollment_open: true, academic_year: '2024/2025' });
    const [savingSettings, setSavingSettings] = useState(false);
    const [showCloseSemester, setShowCloseSemester] = useState(false);
    const [closingSemester, setClosingSemester] = useState(false);

    const SEMESTER_OPTIONS = ['1st Semester', '2nd Semester'] as const;

    const loadSchoolSettings = async () => {
        try {
            const s = await apiClient.adminGetSchoolSettings();
            setSchoolSettings(s);
            setSettingsForm({ current_semester: s.current_semester, is_on_break: s.is_on_break, enrollment_open: s.enrollment_open, academic_year: s.academic_year });
        } catch { /* non-fatal */ }
    };

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const dash = await apiClient.adminDashboard();
                setOverview(dash);
            } catch (e: any) {
                toast.error(e?.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        })();
        loadSchoolSettings();
    }, []);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSavingSettings(true);
            const updated = await apiClient.adminUpdateSchoolSettings(settingsForm);
            setSchoolSettings(updated);
            setShowSettingsDialog(false);
            toast.success('Academic settings updated');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to update settings');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleCloseSemester = async () => {
        try {
            setClosingSemester(true);
            const result = await apiClient.adminCloseSemester();
            toast.success(`Semester closed — ${result.students_unenrolled} students unenrolled, ${result.levels_updated} levels advanced`);
            setShowCloseSemester(false);
            await loadSchoolSettings();
        } catch (e: any) {
            toast.error(e?.message || 'Failed to close semester');
        } finally {
            setClosingSemester(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:px-8 space-y-8">
                {/* Welcome section */}
                <div className="relative overflow-hidden rounded-2xl bg-emerald-900 px-6 py-8 shadow-xl">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
                    <div className="relative">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                            Welcome, {user?.full_name || user?.email}
                        </h1>
                        <p className="mt-1.5 text-emerald-100/90 text-sm sm:text-base">
                            School administration overview
                        </p>
                    </div>
                </div>

                {/* Academic Calendar Card */}
                <Card className="border-gray-200/80 bg-white shadow-md">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Academic Calendar
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline-accent" onClick={() => setShowSettingsDialog(true)}>
                                    <Settings2 className="h-3.5 w-3.5 mr-1" /> Update Settings
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => setShowCloseSemester(true)}>
                                    <AlertOctagon className="h-3.5 w-3.5 mr-1" /> End Semester
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {schoolSettings ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Academic Year</p>
                                    <p className="font-semibold text-gray-900">{schoolSettings.academic_year}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Current Semester</p>
                                    <p className="font-semibold text-gray-900">{schoolSettings.current_semester}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">School Status</p>
                                    <Badge variant={schoolSettings.is_on_break ? 'secondary' : 'default'} className={schoolSettings.is_on_break ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'}>
                                        {schoolSettings.is_on_break ? 'On Break' : 'Active'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Enrolment</p>
                                    <Badge variant={schoolSettings.enrollment_open ? 'default' : 'secondary'} className={schoolSettings.enrollment_open ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-amber-100 text-amber-800 hover:bg-amber-100'}>
                                        {schoolSettings.enrollment_open ? 'Open' : 'Closed'}
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Loading academic settings...</p>
                        )}
                    </CardContent>
                </Card>

                {loading ? (
                    <p className="text-gray-500 py-8">Loading...</p>
                ) : overview ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="group relative border-gray-200/80 bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                                <div className="absolute left-0 top-0 h-full w-1 bg-emerald-600" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
                                    <CardTitle className="text-sm font-semibold text-gray-600">Total Users</CardTitle>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <Users className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pl-5">
                                    <div className="text-2xl font-bold text-gray-900">{overview.overview?.total_users ?? '-'}</div>
                                    <p className="text-xs text-gray-500 mt-0.5">All registered accounts</p>
                                </CardContent>
                            </Card>
                            <Card className="group relative border-gray-200/80 bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                                <div className="absolute left-0 top-0 h-full w-1 bg-emerald-600" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
                                    <CardTitle className="text-sm font-semibold text-gray-600">Students</CardTitle>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <GraduationCap className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pl-5">
                                    <div className="text-2xl font-bold text-gray-900">{overview.overview?.total_students ?? '-'}</div>
                                    <p className="text-xs text-gray-500 mt-0.5">Enrolled students</p>
                                </CardContent>
                            </Card>
                            <Card className="group relative border-gray-200/80 bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                                <div className="absolute left-0 top-0 h-full w-1 bg-emerald-600" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
                                    <CardTitle className="text-sm font-semibold text-gray-600">Lecturers</CardTitle>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <UserCog className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pl-5">
                                    <div className="text-2xl font-bold text-gray-900">{overview.overview?.total_lecturers ?? '-'}</div>
                                    <p className="text-xs text-gray-500 mt-0.5">Teaching staff</p>
                                </CardContent>
                            </Card>
                            <Card className="group relative border-gray-200/80 bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                                <div className="absolute left-0 top-0 h-full w-1 bg-emerald-600" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
                                    <CardTitle className="text-sm font-semibold text-gray-600">Sessions</CardTitle>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <CalendarClock className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pl-5">
                                    <div className="text-2xl font-bold text-gray-900">{overview.overview?.total_sessions ?? '-'}</div>
                                    <p className="text-xs text-gray-500 mt-0.5">All-time sessions</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link href="/admin/courses">
                                <Button size="default" variant="primary">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Manage Courses
                                </Button>
                            </Link>
                            <Link href="/admin/flagged">
                                <Button variant="outline-accent" size="default" className="px-5">
                                    <Flag className="h-4 w-4 mr-2" />
                                    View Flagged
                                </Button>
                            </Link>
                            <Link href="/admin/activity">
                                <Button variant="outline" size="default" className="border-gray-200 hover:bg-gray-50 px-5">
                                    <Activity className="h-4 w-4 mr-2" />
                                    Activity Log
                                </Button>
                            </Link>
                        </div>
                    </>
                ) : (
                    <p className="text-gray-500">No data available.</p>
                )}
            </div>

            {/* Update Academic Settings Dialog */}
            <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Academic Settings</DialogTitle>
                        <DialogDescription>Change the current semester, academic year, break status, and enrolment availability.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveSettings} className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label>Current Semester</Label>
                            <Select value={settingsForm.current_semester} onValueChange={(v) => setSettingsForm(f => ({ ...f, current_semester: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {SEMESTER_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="settings-year">Academic Year</Label>
                            <Input id="settings-year" value={settingsForm.academic_year} onChange={(e) => setSettingsForm(f => ({ ...f, academic_year: e.target.value }))} placeholder="e.g. 2024/2025" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>School Status</Label>
                                <Select value={settingsForm.is_on_break ? 'break' : 'active'} onValueChange={(v) => setSettingsForm(f => ({ ...f, is_on_break: v === 'break' }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="break">On Break</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Enrolment</Label>
                                <Select value={settingsForm.enrollment_open ? 'open' : 'closed'} onValueChange={(v) => setSettingsForm(f => ({ ...f, enrollment_open: v === 'open' }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setShowSettingsDialog(false)} disabled={savingSettings}>Cancel</Button>
                            <Button type="submit" variant="primary" disabled={savingSettings}>
                                {savingSettings ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* End Semester Confirmation Dialog */}
            <Dialog open={showCloseSemester} onOpenChange={setShowCloseSemester}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-700">End {schoolSettings?.current_semester}?</DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-3 text-sm text-gray-600 mt-1">
                                <p>This will immediately:</p>
                                <ul className="list-disc list-inside space-y-1 text-gray-700">
                                    <li>Close all active attendance sessions</li>
                                    <li>Unenrol all students from this semester's courses</li>
                                    {schoolSettings?.current_semester === '2nd Semester' && (
                                        <li>Advance every student's level (100→200, 200→300, 300→400)</li>
                                    )}
                                    <li>Mark enrolment as <strong>closed</strong> and school as <strong>on break</strong></li>
                                    <li>Advance to <strong>{schoolSettings?.current_semester === '1st Semester' ? '2nd Semester' : '1st Semester (next year)'}</strong></li>
                                </ul>
                                <p className="text-red-600 font-medium">⚠ This cannot be undone. Enrolment records will be permanently deleted.</p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setShowCloseSemester(false)} disabled={closingSemester}>Cancel</Button>
                        <Button variant="destructive" onClick={handleCloseSemester} disabled={closingSemester}>
                            {closingSemester ? 'Closing semester...' : 'Yes, end this semester'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ProtectedRoute>
    );
}
