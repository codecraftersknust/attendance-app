import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, LayoutChangeEvent } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';

export function FloatingBottomNavbar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Track tab layouts for the sliding highlight
  const tabLayouts = useRef<{ x: number; width: number }[]>([]).current;
  const highlightX = useRef(new Animated.Value(0)).current;
  const highlightWidth = useRef(new Animated.Value(0)).current;
  const hasInitialized = useRef(false);

  const animateHighlight = useCallback((index: number) => {
    const layout = tabLayouts[index];
    if (!layout) return;

    if (!hasInitialized.current) {
      // First render — snap without animation
      highlightX.setValue(layout.x);
      highlightWidth.setValue(layout.width);
      hasInitialized.current = true;
      return;
    }

    Animated.parallel([
      Animated.spring(highlightX, {
        toValue: layout.x,
        useNativeDriver: false,
        damping: 20,
        stiffness: 200,
        mass: 0.8,
      }),
      Animated.spring(highlightWidth, {
        toValue: layout.width,
        useNativeDriver: false,
        damping: 20,
        stiffness: 200,
        mass: 0.8,
      }),
    ]).start();
  }, [highlightX, highlightWidth, tabLayouts]);

  // Animate when the active tab changes
  useEffect(() => {
    animateHighlight(state.index);
  }, [state.index, animateHighlight]);

  const handleTabLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    tabLayouts[index] = { x, width };

    // Initialize highlight position once all tabs are measured
    if (index === state.index) {
      if (!hasInitialized.current) {
        highlightX.setValue(x);
        highlightWidth.setValue(width);
        hasInitialized.current = true;
      }
    }
  };

  const getIconName = (routeName: string): any => {
    switch (routeName) {
      case 'index':
        return 'house.fill';
      case 'courses':
        return 'book.fill';
      case 'attendance':
        return 'checkmark.circle.fill';
      case 'profile':
        return 'person.fill';
      default:
        return 'circle.fill';
    }
  };

  const getTabLabel = (routeName: string): string => {
    switch (routeName) {
      case 'index':
        return 'Home';
      case 'courses':
        return 'Courses';
      case 'attendance':
        return 'Attend';
      case 'profile':
        return 'Profile';
      default:
        return '';
    }
  };

  const routeIndices = [0, 1, 2, 3];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.navbar,
          {
            backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
            shadowColor: '#000',
            outlineColor: 'transparent',
          },
        ]}
      >
        {/* Animated sliding highlight */}
        <Animated.View
          style={[
            styles.highlight,
            {
              backgroundColor: colors.tint + '18',
              left: highlightX,
              width: highlightWidth,
            },
          ]}
        />

        {routeIndices.map((routeIndex) => {
          const route = state.routes[routeIndex];
          if (!route) return null;

          const { options } = descriptors[route.key];
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              activeOpacity={0.7}
              onLayout={handleTabLayout(routeIndex)}
              style={styles.tabButton}
            >
              <IconSymbol
                size={22}
                name={getIconName(route.name)}
                color={isFocused ? colors.tint : colors.tabIconDefault}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? colors.tint : colors.tabIconDefault,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {getTabLabel(route.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 16 : 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 24,
    flex: 1,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  highlight: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    borderRadius: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    gap: 2,
    minWidth: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    maxWidth: '100%',
    letterSpacing: 0.3,
  },
});
