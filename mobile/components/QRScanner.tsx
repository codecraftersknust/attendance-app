import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface QRScannerProps {
    visible: boolean;
    onClose: () => void;
    onScan: (data: string) => void;
}

export function QRScanner({ visible, onClose, onScan }: QRScannerProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (visible && !permission?.granted) {
            requestPermission();
        }
    }, [visible]);

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;

        setScanned(true);
        onScan(data);

        // Reset after a delay
        setTimeout(() => {
            setScanned(false);
            onClose();
        }, 500);
    };

    if (!visible) return null;

    if (!permission) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={styles.container}>
                    <Text style={styles.message}>Requesting camera permission...</Text>
                </View>
            </Modal>
        );
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={styles.container}>
                    <Text style={styles.message}>Camera permission is required to scan QR codes</Text>
                    <TouchableOpacity style={styles.button} onPress={requestPermission} activeOpacity={0.8}>
                        <Text style={styles.buttonText}>Grant Permission</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={onClose} activeOpacity={0.8}>
                        <Text style={styles.buttonTextSecondary}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                />

                {/* Close button */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
                        <IconSymbol name="xmark" size={24} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                {/* Scanning frame */}
                <View style={styles.scanFrame}>
                    <View style={styles.corner} />
                    <View style={[styles.corner, styles.cornerTopRight]} />
                    <View style={[styles.corner, styles.cornerBottomLeft]} />
                    <View style={[styles.corner, styles.cornerBottomRight]} />
                </View>

                {/* Instructions */}
                <View style={styles.bottomBar}>
                    <Text style={styles.instructions}>
                        Position the QR code within the frame
                    </Text>
                    {scanned && (
                        <Text style={styles.scannedText}>✓ Scanned!</Text>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000000',
    },
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    message: {
        color: '#ffffff',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ffffff',
    },
    buttonTextSecondary: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingTop: 34,
        zIndex: 10,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanFrame: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 250,
        height: 250,
        marginLeft: -125,
        marginTop: -125,
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#ffffff',
        borderTopWidth: 3,
        borderLeftWidth: 3,
        top: 0,
        left: 0,
    },
    cornerTopRight: {
        top: 0,
        left: undefined,
        right: 0,
        borderLeftWidth: 0,
        borderRightWidth: 3,
    },
    cornerBottomLeft: {
        top: undefined,
        bottom: 0,
        left: 0,
        borderTopWidth: 0,
        borderBottomWidth: 3,
    },
    cornerBottomRight: {
        top: undefined,
        bottom: 0,
        left: undefined,
        right: 0,
        borderTopWidth: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 0,
        borderRightWidth: 3,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 60,
        alignItems: 'center',
    },
    instructions: {
        color: '#ffffff',
        fontSize: 16,
        textAlign: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    scannedText: {
        color: '#10b981',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 12,
    },
});
