import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface CameraCaptureProps {
    visible: boolean;
    onClose: () => void;
    onCapture: (uri: string) => void;
    title?: string;
    cameraOnly?: boolean;
}

export function CameraCapture({ visible, onClose, onCapture, title = 'Take Photo', cameraOnly = false }: CameraCaptureProps) {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);

    // Detect if this is a face/selfie capture
    const isFaceCapture = /selfie|face/i.test(title);

    // For non-face captures, use the old image-picker flow
    const handleTakePhotoWithPicker = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera permission is required to take photos');
            return;
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setImageUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo');
        }
    };

    // For face captures, snap from the live CameraView
    const handleSnapSelfie = async () => {
        if (!cameraRef.current) return;
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
            });
            if (photo?.uri) {
                setImageUri(photo.uri);
            }
        } catch (error) {
            console.error('Error capturing selfie:', error);
            Alert.alert('Error', 'Failed to capture selfie');
        }
    };

    const handleChoosePhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Media library permission is required to choose photos');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setImageUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error choosing photo:', error);
            Alert.alert('Error', 'Failed to choose photo');
        }
    };

    const handleConfirm = () => {
        if (imageUri) {
            onCapture(imageUri);
            setImageUri(null);
            onClose();
        }
    };

    const handleRetake = () => {
        setImageUri(null);
    };

    const handleCancel = () => {
        setImageUri(null);
        onClose();
    };

    if (!visible) return null;

    // Face capture: live camera viewfinder with oval overlay
    if (isFaceCapture) {
        // Permission not yet determined
        if (!permission) {
            return (
                <Modal visible={visible} animationType="slide">
                    <View style={styles.container}>
                        <Text style={styles.permissionMessage}>Requesting camera permission...</Text>
                    </View>
                </Modal>
            );
        }

        // Permission denied
        if (!permission.granted) {
            return (
                <Modal visible={visible} animationType="slide">
                    <View style={styles.container}>
                        <Text style={styles.permissionMessage}>Camera permission is required</Text>
                        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                            <Text style={styles.buttonText}>Grant Permission</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.permissionButton, styles.buttonSecondary]} onPress={handleCancel}>
                            <Text style={styles.buttonTextSecondary}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            );
        }

        return (
            <Modal visible={visible} animationType="slide">
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleCancel}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>{title}</Text>
                        <View style={{ width: 60 }} />
                    </View>

                    {imageUri ? (
                        /* Preview after capture */
                        <View style={styles.content}>
                            <Image source={{ uri: imageUri }} style={styles.preview} />
                            <View style={styles.actions}>
                                <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleRetake}>
                                    <IconSymbol name="camera.fill" size={20} color="#007AFF" />
                                    <Text style={styles.buttonTextSecondary}>Retake</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.button} onPress={handleConfirm}>
                                    <IconSymbol name="checkmark" size={20} color="#ffffff" />
                                    <Text style={styles.buttonText}>Use Photo</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        /* Live camera with face guide overlay */
                        <View style={styles.cameraWrapper}>
                            <CameraView
                                ref={cameraRef}
                                style={StyleSheet.absoluteFill}
                                facing="front"
                            />

                            {/* Translucent scrim + centered oval guide */}
                            <View style={styles.scrim} pointerEvents="none">
                                <View style={styles.ovalGuide} />
                            </View>

                            {/* Guide text */}
                            <View style={styles.guideTextContainer} pointerEvents="none">
                                <Text style={styles.faceGuideTitle}>Center your face</Text>
                                <Text style={styles.faceGuideSubtitle}>Good lighting helps accuracy</Text>
                            </View>

                            {/* Shutter button at bottom */}
                            <View style={styles.shutterContainer}>
                                <TouchableOpacity style={styles.shutterButton} onPress={handleSnapSelfie} activeOpacity={0.7}>
                                    <View style={styles.shutterInner} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        );
    }

    // Non-face capture: original flow with image picker
    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleCancel}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{title}</Text>
                    <View style={{ width: 60 }} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {imageUri ? (
                        <>
                            <Image source={{ uri: imageUri }} style={styles.preview} />
                            <View style={styles.actions}>
                                <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleRetake}>
                                    <IconSymbol name="camera.fill" size={20} color="#007AFF" />
                                    <Text style={styles.buttonTextSecondary}>Retake</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.button} onPress={handleConfirm}>
                                    <IconSymbol name="checkmark" size={20} color="#ffffff" />
                                    <Text style={styles.buttonText}>Use Photo</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.placeholder}>
                                <IconSymbol name="camera.fill" size={64} color="#666666" />
                                <Text style={styles.placeholderText}>No photo taken yet</Text>
                            </View>
                            <View style={styles.actions}>
                                {!cameraOnly && (
                                    <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleChoosePhoto}>
                                        <IconSymbol name="photo.fill" size={20} color="#007AFF" />
                                        <Text style={styles.buttonTextSecondary}>Choose Photo</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={styles.button} onPress={handleTakePhotoWithPicker}>
                                    <IconSymbol name="camera.fill" size={20} color="#ffffff" />
                                    <Text style={styles.buttonText}>Take Photo</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const OVAL_WIDTH = 220;
const OVAL_HEIGHT = 290;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 52,
        backgroundColor: '#1c1c1e',
        zIndex: 10,
    },
    cancelText: {
        color: '#007AFF',
        fontSize: 16,
    },
    title: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    preview: {
        width: 300,
        height: 300,
        borderRadius: 12,
        marginBottom: 20,
    },
    placeholder: {
        alignItems: 'center',
        marginBottom: 40,
    },
    placeholderText: {
        color: '#666666',
        fontSize: 16,
        marginTop: 12,
    },
    // Camera viewfinder for face capture
    cameraWrapper: {
        flex: 1,
    },
    scrim: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ovalGuide: {
        width: OVAL_WIDTH,
        height: OVAL_HEIGHT,
        borderRadius: OVAL_WIDTH / 2,
        borderWidth: 2.5,
        borderColor: 'rgba(16, 185, 129, 0.75)',
        marginTop: -60,
    },
    guideTextContainer: {
        position: 'absolute',
        bottom: 140,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 6,
    },
    faceGuideTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    faceGuideSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    shutterContainer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    shutterButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 4,
        borderColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutterInner: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#ffffff',
    },
    // Permission screens
    permissionMessage: {
        color: '#ffffff',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    permissionButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    // Shared
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    buttonTextSecondary: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
