'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { apiClient, UserProfile, UserUpdateRequest } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ArrowLeft,
    Mail,
    User,
    IdCard,
    Shield,
    Calendar,
    Pencil,
    Lock,
    ScanFace,
    Loader2,
    GraduationCap,
    BookOpen,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { user, refreshAuth } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit profile dialog
    const [editOpen, setEditOpen] = useState(false);
    const [editFullName, setEditFullName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editUserId, setEditUserId] = useState('');
    const [editLevel, setEditLevel] = useState<number>(100);
    const [editProgramme, setEditProgramme] = useState('');
    const [saving, setSaving] = useState(false);

    // Change password dialog
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            setLoading(true);
            const data = await apiClient.getProfile();
            setProfile(data);
        } catch (err: any) {
            toast.error(err.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    }

    function openEditDialog() {
        if (!profile) return;
        setEditFullName(profile.full_name || '');
        setEditEmail(profile.email);
        setEditUserId(profile.user_id || '');
        setEditLevel(profile.level || 100);
        setEditProgramme(profile.programme || '');
        setEditOpen(true);
    }

    async function handleSaveProfile() {
        if (!profile) return;
        setSaving(true);

        try {
            const updates: UserUpdateRequest = {};
            if (editFullName !== (profile.full_name || '')) updates.full_name = editFullName;
            if (editEmail !== profile.email) updates.email = editEmail;
            if (editUserId !== (profile.user_id || '')) updates.user_id = editUserId;
            if (profile.role === 'student') {
                if (editLevel !== (profile.level || 0)) updates.level = editLevel;
                if (editProgramme !== (profile.programme || '')) updates.programme = editProgramme;
            }

            if (Object.keys(updates).length === 0) {
                toast('No changes to save');
                setEditOpen(false);
                return;
            }

            const updated = await apiClient.updateProfile(updates);
            setProfile(updated);
            await refreshAuth();
            toast.success('Profile updated');
            setEditOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    }

    async function handleChangePassword() {
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setChangingPassword(true);
        try {
            await apiClient.changePassword({
                current_password: currentPassword,
                new_password: newPassword,
            });
            toast.success('Password changed successfully');
            setPasswordOpen(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    }

    function getInitials(name: string | null, email: string) {
        if (name) {
            return name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        return email[0].toUpperCase();
    }

    function formatDate(dateStr: string | null) {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    function getRoleLabel(role: string) {
        return role.charAt(0).toUpperCase() + role.slice(1);
    }

    function getRoleColor(role: string) {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-700';
            case 'lecturer':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-emerald-100 text-emerald-700';
        }
    }

    function getBackPath() {
        if (!user) return '/';
        switch (user.role) {
            case 'student':
                return '/student/dashboard';
            case 'lecturer':
                return '/lecturer/dashboard';
            case 'admin':
                return '/admin/dashboard';
            default:
                return '/';
        }
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <button
                            onClick={() => router.push(getBackPath())}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
                        >
                            <ArrowLeft className="size-4" />
                            Back to Dashboard
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage your account settings
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="size-8 animate-spin text-gray-400" />
                        </div>
                    ) : profile ? (
                        <>
                            {/* Profile header card */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                        <Avatar className="h-20 w-20 text-2xl">
                                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-semibold">
                                                {getInitials(profile.full_name, profile.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 text-center sm:text-left">
                                            <h2 className="text-xl font-semibold text-gray-900">
                                                {profile.full_name || 'No name set'}
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                {profile.email}
                                            </p>
                                            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                                                        profile.role
                                                    )}`}
                                                >
                                                    {getRoleLabel(profile.role)}
                                                </span>
                                                {profile.has_face_enrolled && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                        <ScanFace className="size-3" />
                                                        Face Enrolled
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={openEditDialog}
                                            className="shrink-0"
                                        >
                                            <Pencil className="size-4 mr-2" />
                                            Edit Profile
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Details card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Account Details</CardTitle>
                                    <CardDescription>
                                        Your personal information and account settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4">
                                        <div className="flex items-start gap-3">
                                            <User className="size-5 text-gray-400 mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Full Name
                                                </p>
                                                <p className="text-sm text-gray-900 mt-0.5">
                                                    {profile.full_name || 'Not set'}
                                                </p>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="flex items-start gap-3">
                                            <Mail className="size-5 text-gray-400 mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Email Address
                                                </p>
                                                <p className="text-sm text-gray-900 mt-0.5">
                                                    {profile.email}
                                                </p>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="flex items-start gap-3">
                                            <IdCard className="size-5 text-gray-400 mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {profile.role === 'student'
                                                        ? 'Student ID'
                                                        : profile.role === 'lecturer'
                                                            ? 'Lecturer ID'
                                                            : 'User ID'}
                                                </p>
                                                <p className="text-sm text-gray-900 mt-0.5">
                                                    {profile.user_id || 'Not set'}
                                                </p>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Level & Programme — only shown for students */}
                                        {profile.role === 'student' && (
                                            <>
                                                <div className="flex items-start gap-3">
                                                    <GraduationCap className="size-5 text-gray-400 mt-0.5 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Level
                                                        </p>
                                                        <p className="text-sm mt-0.5">
                                                            {profile.level ? (
                                                                <span className="text-gray-900">{`Level ${profile.level}`}</span>
                                                            ) : (
                                                                <span className="text-amber-600 font-medium">Not set</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Separator />

                                                <div className="flex items-start gap-3">
                                                    <BookOpen className="size-5 text-gray-400 mt-0.5 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Programme
                                                        </p>
                                                        <p className="text-sm mt-0.5">
                                                            {profile.programme ? (
                                                                <span className="text-gray-900">{profile.programme}</span>
                                                            ) : (
                                                                <span className="text-amber-600 font-medium">Not set</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Separator />
                                            </>
                                        )}

                                        <div className="flex items-start gap-3">
                                            <Shield className="size-5 text-gray-400 mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Role
                                                </p>
                                                <p className="text-sm text-gray-900 mt-0.5">
                                                    {getRoleLabel(profile.role)}
                                                </p>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="flex items-start gap-3">
                                            <Calendar className="size-5 text-gray-400 mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Member Since
                                                </p>
                                                <p className="text-sm text-gray-900 mt-0.5">
                                                    {formatDate(profile.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Security card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Security</CardTitle>
                                    <CardDescription>
                                        Manage your password and account security
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                Password
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Change your account password
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPasswordOpen(true)}
                                        >
                                            <Lock className="size-4 mr-2" />
                                            Change Password
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card>
                            <CardContent className="py-10 text-center text-gray-500">
                                Failed to load profile. Please try again.
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Edit Profile Dialog */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                            <DialogDescription>
                                Update your personal information
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Full Name</Label>
                                <Input
                                    id="edit-name"
                                    value={editFullName}
                                    onChange={(e) => setEditFullName(e.target.value)}
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    placeholder="Enter your email"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-userid">
                                    {profile?.role === 'student'
                                        ? 'Student ID'
                                        : profile?.role === 'lecturer'
                                            ? 'Lecturer ID'
                                            : 'User ID'}
                                </Label>
                                <Input
                                    id="edit-userid"
                                    value={editUserId}
                                    onChange={(e) => setEditUserId(e.target.value)}
                                    placeholder="Enter your ID"
                                />
                            </div>
                            {profile?.role === 'student' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-level">Level</Label>
                                        <Select
                                            value={String(editLevel)}
                                            onValueChange={(v) => setEditLevel(Number(v))}
                                        >
                                            <SelectTrigger id="edit-level" className="w-full">
                                                <SelectValue placeholder="Select level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[100, 200, 300, 400].map((lvl) => (
                                                    <SelectItem key={lvl} value={String(lvl)}>Level {lvl}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-programme">Programme</Label>
                                        <Select
                                            value={editProgramme || '__none__'}
                                            onValueChange={(v) => setEditProgramme(v === '__none__' ? '' : v)}
                                        >
                                            <SelectTrigger id="edit-programme" className="w-full">
                                                <SelectValue placeholder="Select programme" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">None</SelectItem>
                                                <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                                                <SelectItem value="Telecommunication Engineering">Telecommunication Engineering</SelectItem>
                                                <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                                                <SelectItem value="Biomedical Engineering">Biomedical Engineering</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setEditOpen(false)}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                variant="primary"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Change Password Dialog */}
                <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                                Enter your current password and choose a new one
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setPasswordOpen(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                disabled={changingPassword}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleChangePassword}
                                variant="primary"
                                disabled={
                                    changingPassword ||
                                    !currentPassword ||
                                    !newPassword ||
                                    !confirmPassword
                                }
                            >
                                {changingPassword ? (
                                    <>
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                        Changing...
                                    </>
                                ) : (
                                    'Change Password'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    );
}
