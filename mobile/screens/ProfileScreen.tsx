import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Emerald } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { logout, user } = useAuth();
    const router = useRouter();

    // Get user initials
    const getInitials = (name: string | undefined) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    // Logout handler
    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
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
            ]
        );
    };

    const menuItems = [
        { icon: 'bell.fill', label: 'Notifications', onPress: () => { } },
        { icon: 'lock.fill', label: 'Privacy', onPress: () => { } },
        { icon: 'moon.fill', label: 'Appearance', onPress: () => { } },
        { icon: 'questionmark.circle.fill', label: 'Help & Support', onPress: () => { } },
        { icon: 'info.circle.fill', label: 'About', onPress: () => { } },
    ];

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
            <View
                style={[
                    styles.profileCard,
                    {
                        backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                        borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5',
                    },
                ]}
            >
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
                    <Text style={styles.avatarText}>
                        {getInitials(user?.full_name || user?.email)}
                    </Text>
                </View>

                {/* User Info */}
                <Text style={[styles.userName, { color: colors.text }]}>
                    {user?.full_name || 'Student'}
                </Text>
                <Text style={[styles.userEmail, { color: colors.tabIconDefault }]}>
                    {user?.email || 'student@example.com'}
                </Text>

                {/* Edit Profile Button */}
                <TouchableOpacity
                    style={[styles.editButton, { borderColor: colors.tint }]}
                    activeOpacity={0.7}
                >
                    <IconSymbol name="pencil" size={16} color={colors.tint} />
                    <Text style={[styles.editButtonText, { color: colors.tint }]}>
                        Edit Profile
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View
                style={[
                    styles.menuCard,
                    {
                        backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                        borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5',
                    },
                ]}
            >
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={item.label}
                        style={[
                            styles.menuItem,
                            index !== menuItems.length - 1 && {
                                borderBottomWidth: 1,
                                borderBottomColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5',
                            },
                        ]}
                        onPress={item.onPress}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.menuIconContainer, { backgroundColor: colors.tint + '15' }]}>
                            <IconSymbol name={item.icon as any} size={18} color={colors.tint} />
                        </View>
                        <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                        <IconSymbol name="chevron.right" size={16} color={colors.tabIconDefault} />
                    </TouchableOpacity>
                ))}
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

            {/* App Version */}
            <Text style={[styles.versionText, { color: colors.tabIconDefault }]}>
                Version 1.0.0
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        marginBottom: 16,
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
});
