import React, { useEffect } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SkeletonProps {
    style?: StyleProp<ViewStyle>;
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
}

export function Skeleton({ style, width, height, borderRadius = 8 }: SkeletonProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const backgroundColor = isDark ? '#333333' : '#E2E8F0'; // slate-200

    const opacity = useSharedValue(0.5);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1000 }),
                withTiming(0.5, { duration: 1000 })
            ),
            -1, // Infinite repeat
            true // Reverse direction
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    return (
        <Animated.View
            style={[
                {
                    backgroundColor,
                    width: width as any,
                    height: height as any,
                    borderRadius,
                },
                animatedStyle,
                style,
            ]}
        />
    );
}
