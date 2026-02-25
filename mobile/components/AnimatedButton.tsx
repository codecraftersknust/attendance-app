import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle, StyleSheet, Text, TextStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Emerald } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps extends PressableProps {
    children?: React.ReactNode;
    label?: string;
    style?: StyleProp<ViewStyle>;
    labelStyle?: StyleProp<TextStyle>;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    hapticFeedback?: boolean;
}

export function AnimatedButton({
    children,
    label,
    style,
    labelStyle,
    variant = 'primary',
    hapticFeedback = true,
    onPress,
    onPressIn,
    onPressOut,
    ...rest
}: AnimatedButtonProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = (e: any) => {
        scale.value = withSpring(0.96, {
            mass: 0.5,
            damping: 10,
            stiffness: 150
        });
        if (hapticFeedback) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        if (onPressIn) onPressIn(e);
    };

    const handlePressOut = (e: any) => {
        scale.value = withSpring(1, {
            mass: 0.5,
            damping: 10,
            stiffness: 150
        });
        if (onPressOut) onPressOut(e);
    };

    const getVariantStyles = (): StyleProp<ViewStyle> => {
        switch (variant) {
            case 'secondary':
                return { backgroundColor: Emerald[100] };
            case 'outline':
                return { backgroundColor: 'transparent', borderWidth: 1, borderColor: Emerald[600] };
            case 'ghost':
                return { backgroundColor: 'transparent' };
            case 'primary':
            default:
                return { backgroundColor: Emerald[600] };
        }
    };

    const getLabelColor = (): string => {
        switch (variant) {
            case 'secondary':
            case 'outline':
            case 'ghost':
                return Emerald[700];
            case 'primary':
            default:
                return '#ffffff';
        }
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
                styles.base,
                getVariantStyles(),
                animatedStyle,
                style,
            ]}
            {...rest}
        >
            {label ? (
                <Text style={[styles.labelBase, { color: getLabelColor() }, labelStyle]}>
                    {label}
                </Text>
            ) : (
                children
            )}
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    base: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    labelBase: {
        fontSize: 16,
        fontWeight: '600',
    },
});
