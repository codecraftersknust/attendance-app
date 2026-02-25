/**
 * Auth Layout
 * 
 * Stack navigator for authentication screens
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="index"
                options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="setup-face" />
        </Stack>
    );
}
