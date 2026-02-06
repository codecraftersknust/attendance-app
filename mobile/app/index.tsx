/**
 * App Entry Point
 * 
 * Shows splash screen while checking auth, then redirects appropriately
 */

import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import SplashScreen from '@/screens/SplashScreen';

export default function Index() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Minimum splash display time (2.5 seconds for animation)
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    // Show splash screen while loading OR during animation
    if (isLoading || showSplash) {
        return <SplashScreen />;
    }

    // Redirect based on auth status
    if (isAuthenticated && user) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/(auth)/login" />;
}
