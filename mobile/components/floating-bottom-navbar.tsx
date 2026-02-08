import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';

export function FloatingBottomNavbar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getIconName = (routeName: string): any => {
    switch (routeName) {
      case 'index':
        return 'house.fill';
      case 'courses':
        return 'book.fill';
      case 'attendance':
        return 'checkmark.circle.fill';
      case 'search':
        return 'magnifyingglass';
      case 'profile':
        return 'person.fill';
      default:
        return 'circle.fill';
    }
  };

  // Get route indices for layout - main routes (0-2,4) and search (3)
  const mainRouteIndices = [0, 1, 2, 4]; // index, courses, attendance, profile
  const searchRouteIndex = 3; // search

  return (
    <View style={styles.container}>
      {/* Main floating navbar with 4 items */}
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
        {mainRouteIndices.map((routeIndex) => {
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
              style={styles.tabButton}
            >
              <View
                style={[
                  styles.iconContainer,
                  isFocused && {
                    backgroundColor: colors.tint + '20',
                  },
                ]}
              >
                <IconSymbol
                  size={26}
                  name={getIconName(route.name)}
                  color={isFocused ? colors.tint : colors.tabIconDefault}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Separate circular search button */}
      {state.routes[searchRouteIndex] && (
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            navigation.navigate(state.routes[searchRouteIndex].name);
          }}
          style={[
            styles.searchButton,
            {
              backgroundColor: colors.tint,
              shadowColor: colors.tint,
            },
          ]}
        >
          <IconSymbol size={24} name="magnifyingglass" color="#ffffff" />
        </TouchableOpacity>
      )}
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
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flex: 1,
    marginRight: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    padding: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
