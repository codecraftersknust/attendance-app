import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const HEADER_HEIGHT = 48;

type ScreenHeaderProps = {
  title: string;
  rightContent?: React.ReactNode;
};

export function ScreenHeader({ title, rightContent }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const paddingTop = Math.max(insets.top, Platform.OS === 'ios' ? 8 : 12) + 8;

  return (
    <View style={[styles.wrapper, { paddingTop, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {rightContent && <View style={styles.right}>{rightContent}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    minHeight: HEADER_HEIGHT,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    flex: 1,
    letterSpacing: 0.2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
