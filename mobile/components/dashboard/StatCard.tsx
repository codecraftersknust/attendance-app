import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { ColorSchemeName } from '@/hooks/use-color-scheme';

interface StatCardProps {
    title: string;
    value: number | string;
    subtitle: string;
    icon: string;
    iconColor: string;
    colorScheme: ColorSchemeName;
}

export default function StatCard({
    title,
    value,
    subtitle,
    icon,
    iconColor,
    colorScheme
}: StatCardProps) {
    const isDark = colorScheme === 'dark';

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: isDark ? '#252829' : '#ffffff',
                borderColor: isDark ? '#383b3d' : '#e5e5e5',
            }
        ]}>
            <View style={styles.header}>
                <Text style={[
                    styles.title,
                    { color: isDark ? '#8e8e93' : '#6b7280' }
                ]}>
                    {title}
                </Text>
                <IconSymbol name={icon} size={20} color={iconColor} />
            </View>

            <Text style={[
                styles.value,
                { color: isDark ? '#ffffff' : '#111827' }
            ]}>
                {value}
            </Text>

            <Text style={[
                styles.subtitle,
                { color: isDark ? '#8e8e93' : '#6b7280' }
            ]}>
                {subtitle}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: 110,
        height: 120,
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        marginRight: 12,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 11,
        fontWeight: '500',
    },
    value: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: -4,
    },
    subtitle: {
        fontSize: 10,
        lineHeight: 14,
    },
});
