/**
 * Face Enrollment Setup
 * Shown after registration - user must enroll reference face before continuing to app
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CameraCapture } from '@/components/CameraCapture';
import { Emerald } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/utils/error';
import AttendanceService from '@/services/attendance.service';

const DEVICE_STORAGE_KEY = 'absense.device_id';

const generateDeviceId = (): string => {
    if (Platform.OS === 'web' && typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default function SetupFaceScreen() {
    const colorScheme = useColorScheme();
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const isDark = colorScheme === 'dark';

    const [deviceId, setDeviceId] = useState('');
    const [binding, setBinding] = useState(true);
    const [refFaceUri, setRefFaceUri] = useState<string | null>(null);
    const [enrolling, setEnrolling] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [hasFaceEnrolled, setHasFaceEnrolled] = useState(false);

    const initDevice = useCallback(async () => {
        try {
            let id = await AsyncStorage.getItem(DEVICE_STORAGE_KEY);
            if (!id) {
                id = generateDeviceId();
                await AsyncStorage.setItem(DEVICE_STORAGE_KEY, id);
            }
            setDeviceId(id);
            return id;
        } catch {
            return '';
        }
    }, []);

    const bindAndCheckFace = useCallback(async () => {
        const id = await initDevice();
        if (!id) return;

        try {
            setBinding(true);
            const status = await AttendanceService.getDeviceStatus();
            if (!status.has_device) {
                await AttendanceService.bindDevice(id);
            }
            setHasFaceEnrolled(status.has_face_enrolled ?? false);
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
        } finally {
            setBinding(false);
        }
    }, [initDevice, showToast]);

    useEffect(() => {
        bindAndCheckFace();
    }, [bindAndCheckFace]);

    const handleCaptureReferenceFace = () => setShowCamera(true);

    const handleEnrollFace = async () => {
        if (!refFaceUri) {
            showToast('Please capture a reference selfie first', 'error');
            return;
        }

        try {
            setEnrolling(true);
            await AttendanceService.enrollFace(refFaceUri);
            showToast('Reference face enrolled successfully', 'success');
            setRefFaceUri(null);
            setHasFaceEnrolled(true);
        } catch (error) {
            showToast(getErrorMessage(error), 'error');
        } finally {
            setEnrolling(false);
        }
    };

    const handleContinue = () => {
        router.replace('/(tabs)');
    };

    const bg = isDark ? '#0f1419' : '#ffffff';
    const cardBg = isDark ? '#1a1f23' : '#f8fafc';
    const text = isDark ? '#f1f5f9' : '#0f172a';
    const muted = isDark ? '#94a3b8' : '#64748b';

    if (binding && !hasFaceEnrolled) {
        return (
            <View style={[styles.container, { backgroundColor: bg }]}>
                <View style={styles.loadingCenter}>
                    <ActivityIndicator size="large" color={Emerald[600]} />
                    <Text style={[styles.loadingText, { color: muted }]}>Setting up...</Text>
                </View>
            </View>
        );
    }

    if (hasFaceEnrolled) {
        return (
            <View style={[styles.container, { backgroundColor: bg }]}>
                <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
                    <View style={[styles.successCard, { backgroundColor: Emerald[50] }]}>
                        <IconSymbol name="checkmark.circle.fill" size={64} color={Emerald[600]} />
                        <Text style={[styles.successTitle, { color: Emerald[900] }]}>You're all set!</Text>
                        <Text style={[styles.successSubtitle, { color: Emerald[700] }]}>
                            Your face is enrolled. You can now mark attendance quickly.
                        </Text>
                        <TouchableOpacity
                            style={[styles.continueButton, { backgroundColor: Emerald[900] }]}
                            onPress={handleContinue}
                        >
                            <Text style={styles.continueButtonText}>Continue to App</Text>
                            <IconSymbol name="chevron.right" size={20} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: bg }]}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={[styles.logoCircle, { backgroundColor: Emerald[900] }]}>
                        <Text style={styles.logoText}>A</Text>
                    </View>
                    <Text style={[styles.title, { color: text }]}>Enroll Your Face</Text>
                    <Text style={[styles.subtitle, { color: muted }]}>
                        Take a clear photo of your face. This will be used to verify your attendance.
                    </Text>
                </View>

                <View style={[styles.card, { backgroundColor: cardBg }]}>
                    <Text style={[styles.cardTitle, { color: text }]}>Reference Face</Text>
                    <Text style={[styles.cardDescription, { color: muted }]}>
                        Look at the camera in good lighting. Remove glasses if possible.
                    </Text>

                    <TouchableOpacity
                        style={[styles.captureButton, { borderColor: Emerald[600] }]}
                        onPress={handleCaptureReferenceFace}
                    >
                        <IconSymbol name="camera.fill" size={24} color={Emerald[600]} />
                        <Text style={[styles.captureButtonText, { color: Emerald[700] }]}>Capture Reference Face</Text>
                    </TouchableOpacity>

                    {refFaceUri && (
                        <TouchableOpacity
                            style={[styles.enrollButton, { backgroundColor: Emerald[900] }]}
                            onPress={handleEnrollFace}
                            disabled={enrolling}
                        >
                            {enrolling ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <IconSymbol name="arrow.up.circle.fill" size={20} color="#ffffff" />
                                    <Text style={styles.enrollButtonText}>Enroll Face</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            <CameraCapture
                visible={showCamera}
                onClose={() => setShowCamera(false)}
                onCapture={(uri) => {
                    setRefFaceUri(uri);
                    setShowCamera(false);
                }}
                title="Capture Reference Face"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: { fontSize: 16 },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoText: {
        fontSize: 34,
        fontWeight: '800',
        color: '#ffffff',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    card: {
        borderRadius: 20,
        padding: 24,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
    },
    captureButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        marginBottom: 12,
    },
    captureButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    enrollButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
    },
    enrollButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    successCard: {
        alignItems: 'center',
        padding: 32,
        borderRadius: 20,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginTop: 16,
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    continueButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
    },
});
