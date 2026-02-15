import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();
    const { showToast } = useToast();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const handleRegister = async () => {
        if (!email.trim() || !password.trim() || !fullName.trim()) {
            showToast('Fill in all required fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords don\'t match', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Use at least 6 characters for password', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Check your email address', 'error');
            return;
        }

        setIsLoading(true);

        try {
            await register({
                email: email.trim(),
                password,
                full_name: fullName.trim(),
                user_id: studentId.trim() || undefined,
                role: 'student',
            });
            showToast('Account created successfully!', 'success');
            router.replace('/(tabs)');
        } catch (error: any) {
            showToast(error.message || 'Could not create account', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: isDark ? '#1a1d1e' : '#f8fafc' }]}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>A</Text>
                    </View>
                    <Text style={[styles.title, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Create Account</Text>
                    <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Join Absense for smart attendance
                    </Text>
                </View>

                <View style={[styles.formCard, { backgroundColor: isDark ? '#252829' : '#ffffff' }]}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                            Full Name <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#2c2f30' : '#f8fafc',
                                    color: isDark ? '#f1f5f9' : '#1e293b',
                                    borderColor: isDark ? '#383b3d' : '#e2e8f0',
                                },
                            ]}
                            placeholder="Enter your full name"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                            Email <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#2c2f30' : '#f8fafc',
                                    color: isDark ? '#f1f5f9' : '#1e293b',
                                    borderColor: isDark ? '#383b3d' : '#e2e8f0',
                                },
                            ]}
                            placeholder="your.email@example.com"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                            Student ID <Text style={styles.optional}>(Optional)</Text>
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#2c2f30' : '#f8fafc',
                                    color: isDark ? '#f1f5f9' : '#1e293b',
                                    borderColor: isDark ? '#383b3d' : '#e2e8f0',
                                },
                            ]}
                            placeholder="e.g., STU12345"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            value={studentId}
                            onChangeText={setStudentId}
                            autoCapitalize="characters"
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                            Password <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#2c2f30' : '#f8fafc',
                                    color: isDark ? '#f1f5f9' : '#1e293b',
                                    borderColor: isDark ? '#383b3d' : '#e2e8f0',
                                },
                            ]}
                            placeholder="At least 6 characters"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                            Confirm Password <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#2c2f30' : '#f8fafc',
                                    color: isDark ? '#f1f5f9' : '#1e293b',
                                    borderColor: isDark ? '#383b3d' : '#e2e8f0',
                                },
                            ]}
                            placeholder="Re-enter password"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            editable={!isLoading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Create Account</Text>}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Already have an account?{' '}
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={isLoading}>
                        <Text style={styles.linkText}>Sign In</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
    },
    formCard: {
        borderRadius: 12,
        padding: 24,
    },
    inputGroup: {
        marginBottom: 18,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    required: {
        color: '#ef4444',
    },
    optional: {
        color: '#94a3b8',
        fontWeight: 'normal',
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    button: {
        height: 48,
        borderRadius: 8,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: 15,
    },
    linkText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#10b981',
    },
});
