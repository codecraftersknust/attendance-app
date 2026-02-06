/**
 * Splash Screen Component
 * 
 * Displays animated app name with SVG path drawing effect
 */

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AnimatedLogo from '@/components/AnimatedLogo';

export default function SplashScreen() {
    const { isLoading } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Animated Logo with Emerald Green */}
            <View style={styles.logoContainer}>
                <AnimatedLogo color="#10b981" />
            </View>

            {/* Loading Indicator */}
            {isLoading && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#10b981" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
    },
    loaderContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
});
