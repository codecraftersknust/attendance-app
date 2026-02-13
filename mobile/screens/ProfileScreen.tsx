import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Emerald } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import apiClientService, { UserProfile } from '@/services/apiClient.service';

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { logout, user } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit profile modal
    const [editVisible, setEditVisible] = useState(false);
    const [editFullName, setEditFullName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editUserId, setEditUserId] = useState('');
    const [saving, setSaving] = useState(false);

    // Change password modal
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiClientService.getProfile();
            setProfile(data);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const getRoleLabel = (role: string) => {
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const openEditModal = () => {
        if (!profile) return;
        setEditFullName(profile.full_name || '');
        setEditEmail(profile.email);
        setEditUserId(profile.user_id || '');
        setEditVisible(true);
    };

    const handleSaveProfile = async () => {
        if (!profile) return;
        setSaving(true);
        try {
            const updates: Record<string, string> = {};
            if (editFullName !== (profile.full_name || '')) updates.full_name = editFullName;
            if (editEmail !== profile.email) updates.email = editEmail;
            if (editUserId !== (profile.user_id || '')) updates.user_id = editUserId;

            if (Object.keys(updates).length === 0) {
                Alert.alert('Info', 'No changes to save');
                setEditVisible(false);
                return;
            }

            const updated = await apiClientService.updateProfile(updates);
            setProfile(updated);
            Alert.alert('Success', 'Profile updated');
            setEditVisible(false);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setChangingPassword(true);
        try {
            await apiClientService.changePassword({
                current_password: currentPassword,
                new_password: newPassword,
            });
            Alert.alert('Success', 'Password changed successfully');
            setPasswordVisible(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await logout();
                        router.replace('/(auth)/login');
                    } catch (error) {
                        Alert.alert('Error', 'Failed to logout. Please try again.');
                    }
                },
            },
        ]);
    };

    const cardBg = colorScheme === 'dark' ? '#252829' : '#ffffff';
    const cardBorder = colorScheme === 'dark' ? '#383b3d' : '#e5e5e5';
    const inputBg = colorScheme === 'dark' ? '#1a1c1d' : '#f5f5f5';

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
            </View>

            {/* Profile Card */}
            <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
                    <Text style={styles.avatarText}>
                        {getInitials(profile?.full_name || user?.email)}
                    </Text>
                </View>

                <Text style={[styles.userName, { color: colors.text }]}>
                    {profile?.full_name || 'No name set'}
                </Text>
                <Text style={[styles.userEmail, { color: colors.tabIconDefault }]}>
                    {profile?.email || user?.email}
                </Text>

                {/* Role badge */}
                <View style={[styles.roleBadge, { backgroundColor: colors.tint + '15' }]}>
                    <Text style={[styles.roleBadgeText, { color: colors.tint }]}>
                        {getRoleLabel(profile?.role || user?.role || 'student')}
                    </Text>
                </View>

                {profile?.has_face_enrolled && (
                    <View style={[styles.faceBadge, { backgroundColor: '#8b5cf615' }]}>
                        <IconSymbol name="faceid" size={14} color="#8b5cf6" />
                        <Text style={[styles.faceBadgeText, { color: '#8b5cf6' }]}>
                            Face Enrolled
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.editButton, { borderColor: colors.tint }]}
                    activeOpacity={0.7}
                    onPress={openEditModal}
                >
                    <IconSymbol name="pencil" size={16} color={colors.tint} />
                    <Text style={[styles.editButtonText, { color: colors.tint }]}>
                        Edit Profile
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Account Details */}
            <View style={[styles.menuCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Details</Text>

                <View style={[styles.detailRow, { borderBottomColor: cardBorder }]}>
                    <View style={[styles.menuIconContainer, { backgroundColor: colors.tint + '15' }]}>
                        <IconSymbol name="envelope.fill" size={16} color={colors.tint} />
                    </View>
                    <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Email</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {profile?.email}
                        </Text>
                    </View>
                </View>

                <View style={[styles.detailRow, { borderBottomColor: cardBorder }]}>
                    <View style={[styles.menuIconContainer, { backgroundColor: colors.tint + '15' }]}>
                        <IconSymbol name="person.text.rectangle.fill" size={16} color={colors.tint} />
                    </View>
                    <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>
                            {profile?.role === 'student' ? 'Student ID' : profile?.role === 'lecturer' ? 'Lecturer ID' : 'User ID'}
                        </Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {profile?.user_id || 'Not set'}
                        </Text>
                    </View>
                </View>

                <View style={styles.detailRow}>
                    <View style={[styles.menuIconContainer, { backgroundColor: colors.tint + '15' }]}>
                        <IconSymbol name="calendar" size={16} color={colors.tint} />
                    </View>
                    <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Member Since</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                            {formatDate(profile?.created_at ?? null)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Security */}
            <View style={[styles.menuCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setPasswordVisible(true)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.menuIconContainer, { backgroundColor: '#f59e0b15' }]}>
                        <IconSymbol name="lock.fill" size={16} color="#f59e0b" />
                    </View>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>Change Password</Text>
                    <IconSymbol name="chevron.right" size={16} color={colors.tabIconDefault} />
                </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: colors.error + '15' }]}
                onPress={handleLogout}
                activeOpacity={0.7}
            >
                <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={colors.error} />
                <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
            </TouchableOpacity>

            <Text style={[styles.versionText, { color: colors.tabIconDefault }]}>
                Version 1.0.0
            </Text>

            {/* ─── Edit Profile Modal ─── */}
            <Modal visible={editVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>

                        <Text style={[styles.inputLabel, { color: colors.tabIconDefault }]}>Full Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, color: colors.text, borderColor: cardBorder }]}
                            value={editFullName}
                            onChangeText={setEditFullName}
                            placeholder="Enter your full name"
                            placeholderTextColor={colors.tabIconDefault}
                        />

                        <Text style={[styles.inputLabel, { color: colors.tabIconDefault }]}>Email</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, color: colors.text, borderColor: cardBorder }]}
                            value={editEmail}
                            onChangeText={setEditEmail}
                            placeholder="Enter your email"
                            placeholderTextColor={colors.tabIconDefault}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={[styles.inputLabel, { color: colors.tabIconDefault }]}>
                            {profile?.role === 'student' ? 'Student ID' : profile?.role === 'lecturer' ? 'Lecturer ID' : 'User ID'}
                        </Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, color: colors.text, borderColor: cardBorder }]}
                            value={editUserId}
                            onChangeText={setEditUserId}
                            placeholder="Enter your ID"
                            placeholderTextColor={colors.tabIconDefault}
                            autoCapitalize="none"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn, { borderColor: cardBorder }]}
                                onPress={() => setEditVisible(false)}
                                disabled={saving}
                            >
                                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn, { backgroundColor: colors.tint }]}
                                onPress={handleSaveProfile}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ─── Change Password Modal ─── */}
            <Modal visible={passwordVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>

                        <Text style={[styles.inputLabel, { color: colors.tabIconDefault }]}>Current Password</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, color: colors.text, borderColor: cardBorder }]}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Enter current password"
                            placeholderTextColor={colors.tabIconDefault}
                            secureTextEntry
                        />

                        <Text style={[styles.inputLabel, { color: colors.tabIconDefault }]}>New Password</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, color: colors.text, borderColor: cardBorder }]}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="Enter new password"
                            placeholderTextColor={colors.tabIconDefault}
                            secureTextEntry
                        />

                        <Text style={[styles.inputLabel, { color: colors.tabIconDefault }]}>Confirm Password</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, color: colors.text, borderColor: cardBorder }]}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm new password"
                            placeholderTextColor={colors.tabIconDefault}
                            secureTextEntry
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn, { borderColor: cardBorder }]}
                                onPress={() => {
                                    setPasswordVisible(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                disabled={changingPassword}
                            >
                                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalBtn,
                                    styles.saveBtn,
                                    {
                                        backgroundColor:
                                            !currentPassword || !newPassword || !confirmPassword
                                                ? colors.tint + '60'
                                                : colors.tint,
                                    },
                                ]}
                                onPress={handleChangePassword}
                                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                            >
                                {changingPassword ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Change Password</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    profileCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    avatarText: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        marginBottom: 12,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    roleBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    faceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 16,
    },
    faceBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    menuCard: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 15,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        marginBottom: 20,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        borderWidth: 1,
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '600',
    },
    saveBtn: {},
    saveBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
});
