/**
 * App Entry Point
 * 
 * Shows splash screen while checking auth, then redirects appropriately
 */

import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import apiClientService from '@/services/apiClient.service';
import SplashScreen from '@/screens/SplashScreen';

export default function Index() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const [showSplash, setShowSplash] = useState(true);
    const [needsFaceSetup, setNeedsFaceSetup] = useState<boolean | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isAuthenticated || !user) return;
        if (user.role !== 'student') {
            setNeedsFaceSetup(false);
            return;
        }
        apiClientService.getProfile()
            .then((profile) => setNeedsFaceSetup(!profile.has_face_enrolled))
            .catch(() => setNeedsFaceSetup(false));
    }, [isAuthenticated, user]);

    if (isLoading || showSplash) {
        return <SplashScreen />;
    }

    if (!isAuthenticated || !user) {
        return <Redirect href="/(auth)" replace />;
    }

    if (user.role === 'student' && needsFaceSetup === null) {
        return <SplashScreen />;
    }

    if (needsFaceSetup === true) {
        return <Redirect href="/(auth)/setup-face" replace />;
    }

    return <Redirect href="/(tabs)" replace />;
}
