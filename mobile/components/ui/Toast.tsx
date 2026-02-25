import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
    visible: boolean;
    message: string;
    type?: ToastType;
    onHide?: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    visible,
    message,
    type = 'info',
    onHide,
    duration = 3000
}) => {
    const colorScheme = useColorScheme();
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(-100);

    const hide = () => {
        opacity.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(-100, { duration: 300 }, (finished) => {
            if (finished && onHide) {
                runOnJS(onHide)();
            }
        });
    };

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 300 });
            translateY.value = withSpring(0, { mass: 0.8, damping: 12, stiffness: 100 });

            const timer = setTimeout(() => {
                hide();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            hide();
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ translateY: translateY.value }],
        };
    });

    if (!visible) return null;

    const getBackgroundColor = () => {
        const isDark = colorScheme === 'dark';
        switch (type) {
            case 'success':
                return isDark ? '#064e3b' : '#ecfdf5';
            case 'error':
                return isDark ? '#7f1d1d' : '#fef2f2';
            default:
                return isDark ? '#1e3a8a' : '#eff6ff';
        }
    };

    const getBorderColor = () => {
        const isDark = colorScheme === 'dark';
        switch (type) {
            case 'success':
                return isDark ? '#059669' : '#34d399';
            case 'error':
                return isDark ? '#dc2626' : '#f87171';
            default:
                return isDark ? '#2563eb' : '#60a5fa';
        }
    };

    const getTextColor = () => {
        const isDark = colorScheme === 'dark';
        switch (type) {
            case 'success':
                return isDark ? '#ecfdf5' : '#065f46';
            case 'error':
                return isDark ? '#fef2f2' : '#991b1b';
            default:
                return isDark ? '#eff6ff' : '#1e40af';
        }
    };

    const getIconName = () => {
        switch (type) {
            case 'success':
                return 'checkmark.circle.fill';
            case 'error':
                return 'exclamationmark.circle.fill';
            default:
                return 'info.circle.fill';
        }
    };

    const getIconColor = () => {
        const isDark = colorScheme === 'dark';
        switch (type) {
            case 'success':
                return isDark ? '#34d399' : '#059669';
            case 'error':
                return isDark ? '#f87171' : '#dc2626';
            default:
                return isDark ? '#60a5fa' : '#2563eb';
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                },
                animatedStyle,
            ]}
        >
            <View style={styles.content}>
                <IconSymbol
                    name={getIconName()}
                    size={24}
                    color={getIconColor()}
                    style={styles.icon}
                />
                <Text style={[styles.message, { color: getTextColor() }]}>
                    {message}
                </Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        right: 20,
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 12,
    },
    message: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
});
