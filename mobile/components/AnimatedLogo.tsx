import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    Easing,
} from 'react-native-reanimated';

export default function AnimatedLogo() {
    const rotation = useSharedValue(-180); // Start upside down or rotated
    const opacity = useSharedValue(0);

    useEffect(() => {
        // Fade in
        opacity.value = withTiming(1, { duration: 800 });

        // Spin to settle upright (0 degrees)
        rotation.value = withDelay(
            200,
            withTiming(0, {
                duration: 1200,
                easing: Easing.out(Easing.back(1.5)), // Gives a nice settling effect
            })
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    return (
        <View style={styles.container}>
            <Animated.View style={animatedStyle}>
                <Image
                    source={require('@/assets/images/animated-logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
    },
});
