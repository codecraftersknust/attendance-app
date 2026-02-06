import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface QuickActionButtonProps {
    label: string;
    onPress: () => void;
    icon?: string;
    loading?: boolean;
}

export default function QuickActionButton({
    label,
    onPress,
    icon,
    loading = false
}: QuickActionButtonProps) {
    return (
        <TouchableOpacity
            style={styles.button}
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color="#ffffff" />
            ) : (
                <>
                    {icon && <IconSymbol name={icon} size={20} color="#ffffff" />}
                    <Text style={styles.label}>{label}</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#065f46',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
