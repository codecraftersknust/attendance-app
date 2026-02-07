import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ColorSchemeName } from 'react-native';

interface StatCardProps {
    title: string;
    value: number | string;
    subtitle: string;
    colorScheme: ColorSchemeName;
}

export default function StatCard({
    title,
    value,
    subtitle,
    colorScheme
}: StatCardProps) {
    const isDark = colorScheme === 'dark';
    const { width } = useWindowDimensions();

    // Calculate card width: 3 cards with gaps, accounting for screen padding
    const containerPadding = 40; // 20px on each side from parent container
    const gap = 12;
    const cardWidth = (width - containerPadding - (gap * 2)) / 3;

    return (
        <View style={[
            styles.card,
            {
                width: cardWidth,
                backgroundColor: isDark ? '#252829' : '#ffffff',
                borderColor: isDark ? '#383b3d' : '#e5e5e5',
            }
        ]}>
            <Text style={[
                styles.title,
                { color: isDark ? '#8e8e93' : '#6b7280' }
            ]}>
                {title}
            </Text>

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
        minWidth: 90,
        maxWidth: 140,
        height: 100,
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    title: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    value: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 11,
        textAlign: 'center',
    },
});
