import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import AttendanceService from '@/services/attendance.service';
import { QRScanner } from '@/components/QRScanner';
import { CameraCapture } from '@/components/CameraCapture';
import type { ActiveSession, DeviceStatus } from '@/types/api.types';

const DEVICE_STORAGE_KEY = 'absense.device_id';

// Helper to generate device ID
const generateDeviceId = (): string => {
    if (Platform.OS === 'web' && typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default function AttendanceFlowScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
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
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to check device status');
        } finally {
            setCheckingDevice(false);
        }
    }, [deviceId, bindDevice]);

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

    const handleEnrollFace = async () => {
        if (!refFaceUri) {
            Alert.alert('Error', 'Please capture a reference selfie first');
            return;
        }

        try {
            setEnrolling(true);
            await AttendanceService.enrollFace(refFaceUri);
            Alert.alert('Success', 'Reference face enrolled successfully');
            setRefFaceUri(null);
            await refreshDeviceStatus();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to enroll face');
        } finally {
            setEnrolling(false);
        }
    };

    const handleSubmit = async () => {
        // Validate all required data
        if (!qrPayload) {
            Alert.alert('Error', 'Please scan the QR code displayed by your lecturer');
            return;
        }
        if (!coords) {
            Alert.alert('Error', 'Please capture your current location');
            return;
        }
        if (!deviceId) {
            Alert.alert('Error', 'Device ID is missing');
            return;
        }
        if (!selfieUri) {
            Alert.alert('Error', 'Please capture a selfie for attendance');
            return;
        }
        if (!deviceStatus?.has_face_enrolled) {
            Alert.alert('Error', 'Please enroll your reference face first');
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

            const successMsg = `Attendance marked successfully!\nStatus: ${result.status}`;
            const withinGeofence = result.within_geofence !== false;
            const distanceM = result.distance_m;

            if (withinGeofence) {
                Alert.alert('Success', successMsg, [{ text: 'OK', onPress: () => router.back() }]);
            } else {
                const distText = distanceM != null ? ` (${Math.round(distanceM)} m away)` : '';
                Alert.alert(
                    'Success',
                    successMsg,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                Alert.alert(
                                    'Location Notice',
                                    `You were outside the class location${distText}. Your attendance may be flagged for review.`,
                                    [{ text: 'OK', onPress: () => router.back() }]
                                );
                            },
                        },
                    ]
                );
            }
        } catch (error: any) {
            console.error('Attendance submission error:', error);

            // Extract detailed error message from response
            let errorMessage = 'Failed to submit attendance';
            if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Submission Failed', errorMessage);
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
            Alert.alert('Success', 'QR code scanned successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Invalid QR code');
        }
    };

    const handleCaptureLocation = async () => {
        try {
            setLocating(true);

            // Request permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Location permission is required to mark attendance');
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
        } catch (error: any) {
            console.error('Location error:', error);
            Alert.alert('Error', 'Failed to get location. Please try again.');
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

    return (
        <>
            <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="chevron.left" size={24} color={colors.tint} />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={[styles.courseCode, { color: colors.tint }]}>{session.course_code}</Text>
                        <Text style={[styles.courseName, { color: colors.text }]}>{session.course_name}</Text>
                        <Text style={[styles.sessionId, { color: colors.tabIconDefault }]}>Session #{session.id}</Text>
                    </View>
                </View>

                {/* Device Status */}
                <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff' }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Device Status</Text>
                    {checkingDevice ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                    ) : (
                        <View style={styles.statusItems}>
                            <StatusItem
                                icon="checkmark.circle.fill"
                                text="Device Verified"
                                status={deviceStatus?.has_device && deviceStatus?.is_active}
                                colors={colors}
                            />
                            <StatusItem
                                icon="faceid"
                                text="Face Enrolled"
                                status={isFaceEnrolled}
                                colors={colors}
                            />
                        </View>
                    )}
                </View>

                {/* Face Enrollment (only if not enrolled) */}
                {!isFaceEnrolled && (
                    <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff', borderColor: '#f59e0b', borderWidth: 2 }]}>
                        <Text style={[styles.cardTitle, { color: '#f59e0b' }]}>⚠️ Reference Face Enrollment Required</Text>
                        <Text style={[styles.cardDescription, { color: colors.tabIconDefault }]}>
                            You must enroll your face once before marking attendance. This will be used for verification.
                        </Text>

                        <TouchableOpacity
                            style={[styles.button, styles.buttonOutline, { borderColor: colors.tint }]}
                            onPress={handleCaptureReferenceFace}
                        >
                            <IconSymbol name="camera.fill" size={20} color={colors.tint} />
                            <Text style={[styles.buttonText, { color: colors.tint }]}>Capture Reference Face</Text>
                        </TouchableOpacity>

                        {refFaceUri && (
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: colors.tint }]}
                                onPress={handleEnrollFace}
                                disabled={enrolling}
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

                {/* QR Scanner */}
                <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff' }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Step 1: Scan QR Code</Text>
                    <Text style={[styles.cardDescription, { color: colors.tabIconDefault }]}>
                        Scan the rotating QR code displayed by your lecturer
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, styles.buttonOutline, { borderColor: colors.tint }]}
                        onPress={handleScanQR}
                    >
                        <IconSymbol name="qrcode" size={20} color={colors.tint} />
                        <Text style={[styles.buttonText, { color: colors.tint }]}>Scan QR Code</Text>
                    </TouchableOpacity>

                    {qrPayload && (
                        <View style={[styles.successBadge, { backgroundColor: '#10b981' + '20' }]}>
                            <IconSymbol name="checkmark.circle.fill" size={16} color="#10b981" />
                            <Text style={[styles.successText, { color: '#10b981' }]}>
                                QR locked for session #{qrPayload.session_id}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Location */}
                <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff' }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Step 2: Capture Location</Text>
                    <Text style={[styles.cardDescription, { color: colors.tabIconDefault }]}>
                        Your location is required to verify attendance
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, styles.buttonOutline, { borderColor: colors.tint }]}
                        onPress={handleCaptureLocation}
                        disabled={locating}
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
                        <View style={[styles.successBadge, { backgroundColor: '#10b981' + '20' }]}>
                            <IconSymbol name="checkmark.circle.fill" size={16} color="#10b981" />
                            <Text style={[styles.successText, { color: '#10b981' }]}>
                                Location captured
                            </Text>
                        </View>
                    )}
                </View>

                {/* Attendance Selfie */}
                <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff' }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Step 3: Capture Selfie</Text>
                    <Text style={[styles.cardDescription, { color: colors.tabIconDefault }]}>
                        Take a selfie for this attendance submission
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, styles.buttonOutline, { borderColor: colors.tint }]}
                        onPress={handleCaptureSelfie}
                    >
                        <IconSymbol name="camera.fill" size={20} color={colors.tint} />
                        <Text style={[styles.buttonText, { color: colors.tint }]}>Capture Selfie</Text>
                    </TouchableOpacity>

                    {selfieUri && (
                        <View style={[styles.successBadge, { backgroundColor: '#10b981' + '20' }]}>
                            <IconSymbol name="checkmark.circle.fill" size={16} color="#10b981" />
                            <Text style={[styles.successText, { color: '#10b981' }]}>
                                Selfie captured
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
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Attendance</Text>
                    )}
                </TouchableOpacity>

                {!isFaceEnrolled && (
                    <Text style={[styles.warningText, { color: '#ef4444' }]}>
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
function StatusItem({ icon, text, status, colors }: any) {
    return (
        <View style={styles.statusItem}>
            <IconSymbol
                name={status ? "checkmark.circle.fill" : "xmark.circle.fill"}
                size={16}
                color={status ? '#10b981' : '#ef4444'}
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
    courseCode: {
        fontSize: 14,
        fontWeight: '700',
    },
    courseName: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 4,
    },
    sessionId: {
        fontSize: 12,
        marginTop: 2,
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
    successText: {
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
});
