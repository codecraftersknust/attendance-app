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
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Emerald } from '@/constants/theme';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const { showToast } = useToast();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            showToast('Enter your email and password', 'error');
            return;
        }

        setIsLoading(true);

        try {
            await login({ username: username.trim(), password });
            showToast('Welcome back!', 'success');
            router.replace('/(tabs)');
        } catch (error: any) {
            showToast(error.message || 'Wrong email or password', 'error');
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
                    <View style={[styles.logoCircle, { backgroundColor: isDark ? Emerald[500] : Emerald[900] }]}>
                        <Text style={styles.logoText}>A</Text>
                    </View>
                    <Text style={[styles.title, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                        Welcome Back
                    </Text>
                    <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Sign in to continue to Absense
                    </Text>
                </View>

                <View style={[styles.formCard, { backgroundColor: isDark ? '#252829' : '#ffffff' }]}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                            Email or Student ID
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
                            placeholder="Enter your email or student ID"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>Password</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#2c2f30' : '#f8fafc',
                                    color: isDark ? '#f1f5f9' : '#1e293b',
                                    borderColor: isDark ? '#383b3d' : '#e2e8f0',
                                },
                            ]}
                            placeholder="Enter your password"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            editable={!isLoading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            { backgroundColor: isDark ? Emerald[500] : Emerald[900] },
                            isLoading && styles.buttonDisabled,
                        ]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Sign In</Text>}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Don't have an account?{' '}
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/register')} disabled={isLoading}>
                        <Text style={[styles.linkText, { color: isDark ? Emerald[500] : Emerald[900] }]}>Create Account</Text>
                    </TouchableOpacity>
                </View>
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
        marginBottom: 40,
    },
    logoCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
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
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
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
        marginTop: 32,
    },
    footerText: {
        fontSize: 15,
    },
    linkText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
