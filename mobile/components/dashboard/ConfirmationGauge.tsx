import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { ColorSchemeName } from '@/hooks/use-color-scheme';

interface ConfirmationGaugeProps {
    confirmedCount: number;
    totalCount: number;
    colorScheme: ColorSchemeName;
}

export default function ConfirmationGauge({
    confirmedCount,
    totalCount,
    colorScheme
}: ConfirmationGaugeProps) {
    const isDark = colorScheme === 'dark';
    const percentage = totalCount > 0
        ? Math.round((confirmedCount / totalCount) * 100)
        : 100;

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: isDark ? '#252829' : '#ffffff',
                borderColor: isDark ? '#383b3d' : '#e5e5e5',
            }
        ]}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <IconSymbol name="gauge" size={16} color={isDark ? '#ffffff' : '#374151'} />
                    <Text style={[
                        styles.title,
                        { color: isDark ? '#ffffff' : '#374151' }
                    ]}>
                        Attendance confirmed rate
                    </Text>
                </View>
                <Text style={[
                    styles.description,
                    { color: isDark ? '#8e8e93' : '#6b7280' }
                ]}>
                    Share of your attendance marks that have been confirmed
                </Text>
            </View>

            <View style={styles.gaugeContainer}>
                <View style={[
                    styles.gaugeBackground,
                    { backgroundColor: isDark ? '#2c2f30' : '#e5e5e5' }
                ]}>
                    <View
                        style={[
                            styles.gaugeFill,
                            {
                                width: `${percentage}%`,
                                backgroundColor: '#10b981'
                            }
                        ]}
                    />
                </View>
                <Text style={[
                    styles.percentage,
                    { color: isDark ? '#ffffff' : '#111827' }
                ]}>
                    {percentage}%
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
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
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
    },
    description: {
        fontSize: 11,
        lineHeight: 16,
    },
    gaugeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    gaugeBackground: {
        flex: 1,
        height: 12,
        borderRadius: 9999,
        overflow: 'hidden',
    },
    gaugeFill: {
        height: '100%',
        borderRadius: 9999,
    },
    percentage: {
        fontSize: 24,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
});
