import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Animated } from 'react-native';
import { Colors, Emerald } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useToast } from '@/contexts/ToastContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import AttendanceService from '@/services/attendance.service';
import { QRScanner } from '@/components/QRScanner';
import { CameraCapture } from '@/components/CameraCapture';
import { getErrorMessage } from '@/utils/error';
import type { ActiveSession, DeviceStatus } from '@/types/api.types';

const DEVICE_STORAGE_KEY = 'absense.device_id';

// Helper to generate device ID
const generateDeviceId = (): string => {
    if (Platform.OS === 'web' && typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Step order: QR → Selfie → Location
const STEPS = [
    { key: 'qr', label: 'QR Code' },
    { key: 'selfie', label: 'Selfie' },
    { key: 'location', label: 'Location' },
];

export default function AttendanceFlowScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { showToast } = useToast();
    const router = useRouter();
    const params = useLocalSearchParams();

    // Parse session from params
    const session: ActiveSession = params.session ? JSON.parse(params.session as string) : null;

    const [deviceId, setDeviceId] = useState<string>('');
    const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
    const [checkingDevice, setCheckingDevice] = useState(true);
    const [binding, setBinding] = useState(false);

    // Attendance flow state
    const [qrPayload, setQrPayload] = useState<{ session_id: number; nonce: string } | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [selfieUri, setSelfieUri] = useState<string | null>(null);
    const [refFaceUri, setRefFaceUri] = useState<string | null>(null);
    const [enrolling, setEnrolling] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Modal visibility states
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [showSelfieCamera, setShowSelfieCamera] = useState(false);
    const [showRefFaceCamera, setShowRefFaceCamera] = useState(false);

    // Success animation state
    const [showSuccess, setShowSuccess] = useState(false);
    const successScale = useRef(new Animated.Value(0)).current;
    const successOpacity = useRef(new Animated.Value(0)).current;

    // Session countdown state
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);

    // Session countdown timer
    useEffect(() => {
        if (!session?.ends_at) return;

        const updateCountdown = () => {
            const now = new Date();
            const end = new Date(session.ends_at!);
            const diffMs = end.getTime() - now.getTime();

            if (diffMs <= 0) {
                setTimeLeft(null);
                setTimeLeftSeconds(0);
                return;
            }

            const totalSeconds = Math.ceil(diffMs / 1000);
            setTimeLeftSeconds(totalSeconds);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${seconds}s`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [session?.ends_at]);

    // Get or create device ID
    const initializeDeviceId = useCallback(async () => {
        try {
            let id = await AsyncStorage.getItem(DEVICE_STORAGE_KEY);
            if (!id) {
                id = generateDeviceId();
                await AsyncStorage.setItem(DEVICE_STORAGE_KEY, id);
            }
            setDeviceId(id);
            return id;
        } catch (error) {
            console.error('Failed to get device ID:', error);
            return '';
        }
    }, []);

    // Bind device automatically
    const bindDevice = useCallback(async (id: string) => {
        try {
            setBinding(true);
            await AttendanceService.bindDevice(id);
            return true;
        } catch (error) {
            console.error('Auto-bind failed:', error);
            return false;
        } finally {
            setBinding(false);
        }
    }, []);

    // Check device and face status
    const refreshDeviceStatus = useCallback(async () => {
        try {
            setCheckingDevice(true);
            const status = await AttendanceService.getDeviceStatus();
            setDeviceStatus(status);

            // Auto-bind if not bound
            if (!status.has_device && deviceId) {
                const success = await bindDevice(deviceId);
                if (success) {
                    // Refresh status after binding
                    const newStatus = await AttendanceService.getDeviceStatus();
                    setDeviceStatus(newStatus);
                }
            }
        } catch (error) {
            showToast(getErrorMessage(error), 'error');
        } finally {
            setCheckingDevice(false);
        }
    }, [deviceId, bindDevice, showToast]);

    // Initialize on mount
    useEffect(() => {
        const init = async () => {
            const id = await initializeDeviceId();
            if (id) {
                await refreshDeviceStatus();
            }
        };
        init();
    }, [initializeDeviceId, refreshDeviceStatus]);

    // Handle session expiration
    useEffect(() => {
        if (!session?.ends_at) return;

        const checkExpiration = () => {
            const now = new Date();
            const end = new Date(session.ends_at!);
            const diff = end.getTime() - now.getTime();

            if (diff <= 0) {
                Alert.alert('Session Ended', 'This attendance session has ended', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                const timer = setTimeout(() => {
                    Alert.alert('Session Ended', 'This attendance session has ended', [
                        { text: 'OK', onPress: () => router.back() }
                    ]);
                }, diff);
                return () => clearTimeout(timer);
            }
        };

        return checkExpiration();
    }, [session?.ends_at, router]);

    // Play success animation
    const playSuccessAnimation = useCallback(() => {
        setShowSuccess(true);
        successScale.setValue(0);
        successOpacity.setValue(0);

        Animated.parallel([
            Animated.spring(successScale, {
                toValue: 1,
                useNativeDriver: true,
                damping: 12,
                stiffness: 200,
                mass: 0.8,
            }),
            Animated.timing(successOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [successScale, successOpacity]);

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
            await refreshDeviceStatus();
        } catch (error) {
            showToast(getErrorMessage(error), 'error');
        } finally {
            setEnrolling(false);
        }
    };

    const handleSubmit = async () => {
        // Validate all required data
        if (!qrPayload) {
            showToast('Please scan the QR code displayed by your lecturer', 'error');
            return;
        }
        if (!selfieUri) {
            showToast('Please capture a selfie for attendance', 'error');
            return;
        }
        if (!coords) {
            showToast('Please capture your current location', 'error');
            return;
        }
        if (!deviceId) {
            showToast('Device ID is missing', 'error');
            return;
        }
        if (!deviceStatus?.has_face_enrolled) {
            showToast('Please enroll your reference face first', 'error');
            return;
        }

        try {
            setSubmitting(true);
            const result = await AttendanceService.submitAttendance({
                qr_session_id: qrPayload.session_id,
                qr_nonce: qrPayload.nonce,
                latitude: coords.lat,
                longitude: coords.lng,
                device_id: deviceId,
                selfie: selfieUri,
            });

            // Haptic feedback on success
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            const withinGeofence = result.within_geofence !== false;
            const distanceM = result.distance_m;

            // Show success animation
            playSuccessAnimation();

            // Navigate back after animation
            setTimeout(() => {
                if (!withinGeofence) {
                    const distText = distanceM != null ? ` (${Math.round(distanceM)} m away)` : '';
                    showToast(`You were outside the class location${distText}. Your attendance may be flagged for review.`, 'info');
                }
                router.back();
            }, 1800);
        } catch (error) {
            console.error('Attendance submission error:', error);
            showToast(getErrorMessage(error), 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // QR Code parsing
    const parseQrPayload = (raw: string) => {
        let sessionId: number | null = null;
        let nonce: string | null = null;
        const trimmed = raw.trim();

        if (trimmed.startsWith('ABSENSE')) {
            const parts = trimmed.split(':');
            if (parts.length >= 3) {
                sessionId = Number(parts[1]);
                nonce = parts[2];
            }
        } else {
            try {
                const parsed = JSON.parse(trimmed);
                sessionId = Number(parsed.session_id ?? parsed.sessionId);
                nonce = String(parsed.nonce ?? parsed.qr_nonce ?? '');
            } catch (err) {
                console.error('QR parse error', err);
            }
        }

        if (!sessionId || !nonce) throw new Error('Invalid QR payload');
        if (sessionId !== session.id) throw new Error('QR belongs to another session');
        return { session_id: sessionId, nonce };
    };

    // Handler implementations
    const handleScanQR = () => {
        setShowQRScanner(true);
    };

    const onQRScanned = (data: string) => {
        try {
            const payload = parseQrPayload(data);
            setQrPayload(payload);
            setShowQRScanner(false);

            // Haptic feedback on successful scan
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            showToast('QR code scanned successfully', 'success');
        } catch (error) {
            showToast(getErrorMessage(error), 'error');
        }
    };

    const handleCaptureLocation = async () => {
        try {
            setLocating(true);

            // Request permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showToast('Location permission is required to mark attendance', 'error');
                return;
            }

            // Get current position
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            setCoords({
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            });
        } catch (error) {
            console.error('Location error:', error);
            showToast(getErrorMessage(error) || 'Failed to get location. Please try again.', 'error');
        } finally {
            setLocating(false);
        }
    };

    const handleCaptureSelfie = () => {
        setShowSelfieCamera(true);
    };

    const handleCaptureReferenceFace = () => {
        setShowRefFaceCamera(true);
    };

    if (!session) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.errorText, { color: colors.text }]}>No session data</Text>
            </View>
        );
    }

    const isFaceEnrolled = deviceStatus?.has_face_enrolled ?? false;

    // Per-step completion (QR, Selfie, Location)
    const stepDone = [!!qrPayload, !!selfieUri, !!coords];
    const completedCount = stepDone.filter(Boolean).length;
    const currentStep = Math.min(completedCount + 1, 3);
    const totalSteps = 3;

    // Countdown color
    const getCountdownColor = () => {
        if (timeLeftSeconds == null) return colors.tabIconDefault;
        if (timeLeftSeconds < 60) return colors.error;
        if (timeLeftSeconds < 300) return colors.warning ?? '#d97706';
        return colors.tabIconDefault;
    };

    return (
        <>
            {/* Success Overlay */}
            {showSuccess && (
                <View style={styles.successOverlay}>
                    <Animated.View
                        style={[
                            styles.successContent,
                            {
                                transform: [{ scale: successScale }],
                                opacity: successOpacity,
                            },
                        ]}
                    >
                        <View style={[styles.successCircle, { backgroundColor: Emerald[500] }]}>
                            <IconSymbol name="checkmark" size={48} color="#ffffff" />
                        </View>
                        <Text style={styles.successTitle}>Attendance Marked!</Text>
                        <Text style={styles.successSubtitle}>You're all set</Text>
                    </Animated.View>
                </View>
            )}

            <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                        <IconSymbol name="chevron.left" size={24} color={colors.tint} />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={[styles.courseCode, { color: colors.tint }]}>{session.course_code}</Text>
                        <Text style={[styles.courseName, { color: colors.text }]}>{session.course_name}</Text>
                        <View style={styles.headerMetaRow}>
                            <Text style={[styles.sessionId, { color: colors.tabIconDefault }]}>Session #{session.id}</Text>
                            {timeLeft && (
                                <View style={[styles.countdownBadge, { backgroundColor: getCountdownColor() + '18' }]}>
                                    <IconSymbol name="clock" size={12} color={getCountdownColor()} />
                                    <Text style={[styles.countdownText, { color: getCountdownColor() }]}>
                                        {timeLeft}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Progress Stepper */}
                <View style={[styles.stepper, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.stepperLabel, { color: colors.tabIconDefault }]}>
                        Step {currentStep} of {totalSteps}
                    </Text>
                    <View style={styles.stepperRow}>
                        {STEPS.map((step, i) => (
                            <React.Fragment key={step.key}>
                                {/* Step column: dot + label */}
                                <View style={styles.stepperColumn}>
                                    <View
                                        style={[
                                            styles.stepperDot,
                                            {
                                                backgroundColor: stepDone[i] ? colors.tint : colors.border,
                                            },
                                        ]}
                                    >
                                        {stepDone[i] && (
                                            <IconSymbol name="checkmark" size={8} color="#ffffff" />
                                        )}
                                    </View>
                                    <Text style={[styles.stepperDotLabel, { color: stepDone[i] ? colors.text : colors.tabIconDefault }]}>
                                        {step.label}
                                    </Text>
                                </View>
                                {/* Connecting line */}
                                {i < STEPS.length - 1 && (
                                    <View style={styles.stepperLineWrap}>
                                        <View
                                            style={[
                                                styles.stepperLine,
                                                {
                                                    backgroundColor: stepDone[i] && stepDone[i + 1] ? colors.tint : colors.border,
                                                },
                                            ]}
                                        />
                                    </View>
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {/* Device Status */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Device Status</Text>
                    {checkingDevice ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                    ) : (
                        <View style={styles.statusItems}>
                            <StatusItem
                                text="Device Verified"
                                status={!!(deviceStatus?.has_device && deviceStatus?.is_active)}
                                colors={colors}
                            />
                            <StatusItem
                                text="Face Enrolled"
                                status={isFaceEnrolled}
                                colors={colors}
                            />
                        </View>
                    )}
                </View>

                {/* Face Enrollment (only if not enrolled) */}
                {!isFaceEnrolled && (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.warning, borderWidth: 2 }]}>
                        <Text style={[styles.cardTitle, { color: colors.warning }]}>⚠️ Reference Face Enrollment Required</Text>
                        <Text style={[styles.cardDescription, { color: colors.tabIconDefault }]}>
                            You must enroll your face once before marking attendance. This will be used for verification.
                        </Text>

                        <TouchableOpacity
                            style={[styles.button, styles.buttonOutline, { borderColor: colors.tint }]}
                            onPress={handleCaptureReferenceFace}
                            activeOpacity={0.8}
                        >
                            <IconSymbol name="camera.fill" size={20} color={colors.tint} />
                            <Text style={[styles.buttonText, { color: colors.tint }]}>Capture Reference Face</Text>
                        </TouchableOpacity>

                        {refFaceUri && (
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: colors.tint }]}
                                onPress={handleEnrollFace}
                                disabled={enrolling}
                                activeOpacity={0.8}
                            >
                                {enrolling ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <>
                                        <IconSymbol name="arrow.up.circle.fill" size={20} color="#ffffff" />
                                        <Text style={styles.buttonTextWhite}>Enroll Reference Face</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Step 1: QR Scanner */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Step 1: Scan QR Code</Text>
                    <Text style={[styles.cardDescription, { color: colors.tabIconDefault }]}>
                        Scan the rotating QR code displayed by your lecturer
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, styles.buttonOutline, { borderColor: colors.tint }]}
                        onPress={handleScanQR}
                        activeOpacity={0.8}
                    >
                        <IconSymbol name="qrcode" size={20} color={colors.tint} />
                        <Text style={[styles.buttonText, { color: colors.tint }]}>Scan QR Code</Text>
                    </TouchableOpacity>

                    {qrPayload && (
                        <View style={[styles.successBadge, { backgroundColor: colors.successLight }]}>
                            <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                            <Text style={[styles.successBadgeText, { color: colors.success }]}>
                                QR locked for session #{qrPayload.session_id}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Step 2: Selfie (was step 3) */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Step 2: Capture Selfie</Text>
                    <Text style={[styles.cardDescription, { color: colors.tabIconDefault }]}>
                        Take a selfie for this attendance submission
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, styles.buttonOutline, { borderColor: colors.tint }]}
                        onPress={handleCaptureSelfie}
                        activeOpacity={0.8}
                    >
                        <IconSymbol name="camera.fill" size={20} color={colors.tint} />
                        <Text style={[styles.buttonText, { color: colors.tint }]}>Capture Selfie</Text>
                    </TouchableOpacity>

                    {selfieUri && (
                        <View style={[styles.successBadge, { backgroundColor: colors.successLight }]}>
                            <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                            <Text style={[styles.successBadgeText, { color: colors.success }]}>
                                Selfie captured
                            </Text>
                        </View>
                    )}
                </View>

                {/* Step 3: Location (was step 2) */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Step 3: Capture Location</Text>
                    <Text style={[styles.cardDescription, { color: colors.tabIconDefault }]}>
                        Your location is required to verify attendance
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, styles.buttonOutline, { borderColor: colors.tint }]}
                        onPress={handleCaptureLocation}
                        disabled={locating}
                        activeOpacity={0.8}
                    >
                        {locating ? (
                            <ActivityIndicator size="small" color={colors.tint} />
                        ) : (
                            <>
                                <IconSymbol name="location.fill" size={20} color={colors.tint} />
                                <Text style={[styles.buttonText, { color: colors.tint }]}>Capture Location</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {coords && (
                        <View style={[styles.successBadge, { backgroundColor: colors.successLight }]}>
                            <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                            <Text style={[styles.successBadgeText, { color: colors.success }]}>
                                Location captured
                            </Text>
                        </View>
                    )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        { backgroundColor: isFaceEnrolled ? colors.tint : colors.tabIconDefault },
                    ]}
                    onPress={handleSubmit}
                    disabled={submitting || !isFaceEnrolled}
                    activeOpacity={0.85}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Attendance</Text>
                    )}
                </TouchableOpacity>

                {!isFaceEnrolled && (
                    <Text style={[styles.warningText, { color: colors.error }]}>
                        Please enroll your reference face first
                    </Text>
                )}
            </ScrollView>

            {/* Modals */}
            <QRScanner
                visible={showQRScanner}
                onClose={() => setShowQRScanner(false)}
                onScan={onQRScanned}
            />
            <CameraCapture
                visible={showSelfieCamera}
                onClose={() => setShowSelfieCamera(false)}
                onCapture={(uri) => {
                    setSelfieUri(uri);
                    setShowSelfieCamera(false);
                }}
                title="Capture Attendance Selfie"
                cameraOnly={true}
            />
            <CameraCapture
                visible={showRefFaceCamera}
                onClose={() => setShowRefFaceCamera(false)}
                onCapture={(uri) => {
                    setRefFaceUri(uri);
                    setShowRefFaceCamera(false);
                }}
                title="Capture Reference Face"
            />
        </>
    );
}

// Helper component for status items
function StatusItem({ text, status, colors }: { text: string; status: boolean; colors: typeof Colors.light }) {
    return (
        <View style={styles.statusItem}>
            <IconSymbol
                name={status ? "checkmark.circle.fill" : "xmark.circle.fill"}
                size={16}
                color={status ? colors.success : colors.error}
            />
            <Text style={[styles.statusText, { color: colors.text }]}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 40,
    },
    backButton: {
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    headerMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    courseCode: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    courseName: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 4,
    },
    sessionId: {
        fontSize: 12,
    },
    countdownBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 4,
    },
    countdownText: {
        fontSize: 11,
        fontWeight: '700',
    },
    stepper: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    stepperLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    stepperColumn: {
        alignItems: 'center',
    },
    stepperDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperDotLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    stepperLineWrap: {
        flex: 1,
        justifyContent: 'flex-start',
        paddingTop: 8,
    },
    stepperLine: {
        height: 2,
        marginHorizontal: 4,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 14,
        marginBottom: 12,
        lineHeight: 20,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    buttonOutline: {
        borderWidth: 1,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    buttonTextWhite: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    statusItems: {
        gap: 8,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusText: {
        fontSize: 14,
    },
    successBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 6,
        marginTop: 12,
    },
    successBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    submitButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    warningText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
    // Success overlay
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successContent: {
        alignItems: 'center',
    },
    successCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    successTitle: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '700',
    },
    successSubtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        marginTop: 4,
    },
});
