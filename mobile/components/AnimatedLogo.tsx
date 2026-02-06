/**
 * Animated Logo Component
 * 
 * SVG path drawing animation for "Absense" text with student icon drop
 * Icon drops from top, then letters draw themselves in sequence
 * 
 * FONT STYLE: Modern Sans-Serif Bold (Option 1)
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Rect } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedView = Animated.createAnimatedComponent(View);

interface AnimatedLogoProps {
    color?: string;
}

export default function AnimatedLogo({ color = '#10b981' }: AnimatedLogoProps) {
    // Icon drop animation value
    const iconTranslateY = useSharedValue(-100);
    const iconOpacity = useSharedValue(0);

    // Control when text animation starts
    const shouldStartText = useSharedValue(0);

    // SVG paths for Modern Sans-Serif Bold style - "Absense"
    const letters = [
        // A - Modern, bold, geometric
        { path: 'M 25 85 L 25 45 Q 25 35 35 35 L 55 35 Q 65 35 65 45 L 65 85 M 25 65 L 65 65', length: 220 },
        // b - lowercase for modern feel
        { path: 'M 85 30 L 85 85 M 85 55 Q 85 45 95 45 L 105 45 Q 115 45 115 55 L 115 75 Q 115 85 105 85 L 95 85 Q 85 85 85 75', length: 260 },
        // s - clean curves
        { path: 'M 145 50 Q 135 45 135 52 Q 135 58 145 60 Q 155 62 155 68 Q 155 75 145 75 Q 135 75 135 70', length: 180 },
        // e - geometric
        { path: 'M 175 60 L 175 55 Q 175 45 185 45 L 195 45 Q 205 45 205 55 L 205 60 L 175 60 M 205 65 Q 205 75 195 75 L 185 75 Q 175 75 175 70', length: 220 },
        // n - bold strokes
        { path: 'M 225 85 L 225 50 M 225 50 Q 225 45 235 45 L 245 45 Q 255 45 255 50 L 255 85', length: 200 },
        // s - matching first s
        { path: 'M 285 50 Q 275 45 275 52 Q 275 58 285 60 Q 295 62 295 68 Q 295 75 285 75 Q 275 75 275 70', length: 180 },
        // e - matching first e
        { path: 'M 315 60 L 315 55 Q 315 45 325 45 L 335 45 Q 345 45 345 55 L 345 60 L 315 60 M 345 65 Q 345 75 335 75 L 325 75 Q 315 75 315 70', length: 220 },
    ];

    // Create animated values for each letter
    const animatedValues = letters.map(() => useSharedValue(0));

    useEffect(() => {
        // Step 1: Icon drops from top
        iconOpacity.value = withTiming(1, { duration: 300 });
        iconTranslateY.value = withTiming(0, {
            duration: 600,
            easing: Easing.bezier(0.34, 1.56, 0.64, 1), // Bounce effect
        });

        // Step 2: After icon lands, start text animation
        setTimeout(() => {
            shouldStartText.value = 1;

            // Animate each letter in sequence
            animatedValues.forEach((value, index) => {
                value.value = withDelay(
                    index * 150, // Stagger each letter by 150ms
                    withTiming(1, {
                        duration: 700,
                        easing: Easing.out(Easing.cubic),
                    })
                );
            });
        }, 700);

    }, []);

    // Icon animation style
    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: iconTranslateY.value }],
        opacity: iconOpacity.value,
    }));

    return (
        <View style={styles.container}>
            {/* Professional Student Icon with Checkmark Badge */}
            <AnimatedView style={[styles.iconContainer, iconStyle]}>
                <Svg width="80" height="80" viewBox="0 0 100 100">
                    <G>
                        {/* Student silhouette */}
                        <Circle cx="50" cy="35" r="16" fill={color} />
                        <Path
                            d="M 50 52 L 30 52 Q 22 52 22 60 L 22 85 Q 22 92 30 92 L 70 92 Q 78 92 78 85 L 78 60 Q 78 52 70 52 Z"
                            fill={color}
                        />

                        {/* Book/Document in front */}
                        <Rect x="35" y="65" width="30" height="20" rx="2" fill="#ffffff" opacity="0.3" />

                        {/* Checkmark badge (darker green) */}
                        <Circle cx="75" cy="30" r="14" fill="#065f46" />
                        <Path
                            d="M 68 30 L 72 34 L 82 24"
                            stroke="#ffffff"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </G>
                </Svg>
            </AnimatedView>

            {/* Animated Text - Modern Sans-Serif Bold */}
            <Svg width="370" height="100" viewBox="0 0 370 100" style={styles.textSvg}>
                {letters.map((letter, index) => {
                    const animatedProps = useAnimatedProps(() => {
                        const pathLength = letter.length;
                        const progress = animatedValues[index].value * shouldStartText.value;
                        const strokeDashoffset = pathLength * (1 - progress);

                        return {
                            strokeDasharray: pathLength,
                            strokeDashoffset: strokeDashoffset,
                        };
                    });

                    return (
                        <AnimatedPath
                            key={index}
                            d={letter.path}
                            stroke={color}
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            animatedProps={animatedProps}
                        />
                    );
                })}
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: 30,
    },
    textSvg: {
        marginTop: 10,
    },
});
