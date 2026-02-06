import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface CameraCaptureProps {
    visible: boolean;
    onClose: () => void;
    onCapture: (uri: string) => void;
    title?: string;
    cameraOnly?: boolean; // If true, only show camera option (no gallery)
}

export function CameraCapture({ visible, onClose, onCapture, title = 'Take Photo', cameraOnly = false }: CameraCaptureProps) {
    const [imageUri, setImageUri] = useState<string | null>(null);

    const requestPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera permission is required to take photos');
            return false;
        }
        return true;
    };

    const handleTakePhoto = async () => {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;

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
                                <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
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
        paddingTop: 60,
        backgroundColor: '#1c1c1e',
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
