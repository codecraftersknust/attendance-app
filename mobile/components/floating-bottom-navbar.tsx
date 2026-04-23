import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, LayoutChangeEvent } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Emerald } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';

export function FloatingBottomNavbar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const activeColor = isDark ? Emerald[400] : Emerald[300];
  const inactiveColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.6)';
  const bgColor = isDark ? '#1a2e28' : Emerald[900];
  const highlightBg = isDark ? 'rgba(52,211,153,0.12)' : Emerald[800] + '55';

  const tabLayouts = useRef<{ x: number; width: number }[]>([]).current;
  const highlightX = useRef(new Animated.Value(0)).current;
  const highlightWidth = useRef(new Animated.Value(0)).current;
  const hasInitialized = useRef(false);

  const animateHighlight = useCallback((index: number) => {
    const layout = tabLayouts[index];
    if (!layout) return;

    if (!hasInitialized.current) {
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

  useEffect(() => {
    animateHighlight(state.index);
  }, [state.index, animateHighlight]);

  const handleTabLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    tabLayouts[index] = { x, width };

    if (index === state.index && !hasInitialized.current) {
      highlightX.setValue(x);
      highlightWidth.setValue(width);
      hasInitialized.current = true;
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
        return 'person.circle.fill';
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
      <View style={[styles.navbar, { backgroundColor: bgColor }]}>
        <Animated.View
          style={[
            styles.highlight,
            {
              backgroundColor: highlightBg,
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
                color={isFocused ? activeColor : inactiveColor}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? activeColor : inactiveColor,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
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
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 999,
    overflow: 'hidden',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 12,
  },
  highlight: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 999,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    gap: 4,
    minWidth: 0,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
