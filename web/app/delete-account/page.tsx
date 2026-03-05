'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

export default function DeleteAccountPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    const CONFIRM_PHRASE = 'delete my account';

    async function handleDeleteAccount() {
        if (confirmText.toLowerCase() !== CONFIRM_PHRASE) {
            toast.error(`Please type "${CONFIRM_PHRASE}" to confirm`);
            return;
        }

        setDeleting(true);
        try {
            await apiClient.deleteAccount();
            toast.success('Your account has been deleted');
            logout();
            router.push('/');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to delete account';
            toast.error(message);
        } finally {
            setDeleting(false);
            setConfirmOpen(false);
            setConfirmText('');
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Request Account Deletion</h1>
                    <p className="mt-2 text-gray-600">
                        Absense — Smart attendance verification for educational institutions
                    </p>
                </div>

                {/* App & Developer reference (required by store policies) */}
                <section className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                        About Absense
                    </h2>
                    <p className="mt-2 text-gray-700">
                        Absense is a smart multi-layered attendance verification system for schools, colleges, and universities. It is developed and operated by the Absense team. If you wish to delete your account and associated data, please follow the steps below.
                    </p>
                </section>

                {/* Steps to request deletion (prominently featured) */}
                <section className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                        How to Request Account Deletion
                    </h2>
                    <p className="mt-2 text-gray-600">
                        You can request deletion of your Absense account and associated data using the following options:
                    </p>
                    <ol className="mt-4 space-y-4 list-decimal list-inside">
                        <li className="text-gray-700">
                            <strong>Option A — In-app (recommended):</strong> Sign in to your Absense account and go to the{' '}
                            <Link href="/profile" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                                Profile
                            </Link> page. Scroll to the &quot;Delete Account&quot; section and click the button to permanently delete your account.
                        </li>
                        <li className="text-gray-700">
                            <strong>Option B — Contact support:</strong> If you cannot access your account, email your deletion request to your institution&apos;s Absense administrator or support contact. Include the email address associated with your account for verification.
                        </li>
                    </ol>
                    <p className="mt-4 text-sm text-gray-500">
                        Deletion is typically processed within 30 days. You will receive confirmation once your account and data have been removed.
                    </p>
                </section>

                {/* Data types deleted/kept */}
                <section className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Data Deleted When You Request Account Deletion
                    </h2>
                    <p className="mt-2 text-gray-600">
                        When your account is deleted, the following data is permanently removed:
                    </p>
                    <ul className="mt-4 space-y-2 list-disc list-inside text-gray-700">
                        <li>Account information (email, name, user ID, password)</li>
                        <li>Profile data (year, programme, role)</li>
                        <li>Face reference image (used for verification)</li>
                        <li>Device bindings</li>
                        <li>Course enrollments</li>
                        <li>Attendance records</li>
                        <li>Verification logs</li>
                    </ul>

                    <h3 className="mt-6 text-base font-semibold text-gray-900">
                        Data Retained
                    </h3>
                    <p className="mt-2 text-gray-600">
                        For legal and operational purposes, we may retain anonymized audit logs for up to 90 days after account deletion. These logs do not contain personally identifiable information.
                    </p>

                    <h3 className="mt-6 text-base font-semibold text-gray-900">
                        Additional Retention Period
                    </h3>
                    <p className="mt-2 text-gray-600">
                        Backups may retain deleted data for up to 30 days before being permanently purged. After this period, your data is fully removed from our systems.
                    </p>
                </section>

                {/* Delete account CTA (for logged-in users) */}
                {user && (
                    <section className="rounded-xl border border-red-200 bg-red-50/50 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="size-5 text-red-600" />
                            Delete Your Account Now
                        </h2>
                        <p className="mt-2 text-gray-700">
                            You are signed in as <strong>{user.email}</strong>. Click below to permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <Button
                            variant="destructive"
                            className="mt-4"
                            onClick={() => setConfirmOpen(true)}
                        >
                            <Trash2 className="size-4 mr-2" />
                            Delete My Account
                        </Button>
                    </section>
                )}

                {!user && (
                    <section className="rounded-xl border border-gray-200 bg-white p-6">
                        <p className="text-gray-600">
                            <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                                Sign in
                            </Link> to delete your account directly, or contact your institution&apos;s support for assistance.
                        </p>
                    </section>
                )}

                {/* Links */}
                <div className="flex flex-wrap gap-4 text-sm">
                    <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700">
                        Privacy Policy
                    </Link>
                    <Link href="/terms" className="text-emerald-600 hover:text-emerald-700">
                        Terms of Service
                    </Link>
                    <Link href="/" className="text-emerald-600 hover:text-emerald-700">
                        Home
                    </Link>
                </div>
            </div>

            {/* Confirmation dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Permanently Delete Account?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. All your data will be permanently deleted. Type{' '}
                            <strong>&quot;{CONFIRM_PHRASE}&quot;</strong> to confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="confirm-delete">Type &quot;{CONFIRM_PHRASE}&quot;</Label>
                            <Input
                                id="confirm-delete"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder={CONFIRM_PHRASE}
                                className="font-mono"
                                disabled={deleting}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setConfirmOpen(false);
                                setConfirmText('');
                            }}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={deleting || confirmText.toLowerCase() !== CONFIRM_PHRASE}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Account'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
