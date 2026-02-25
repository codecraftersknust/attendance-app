import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Emerald } from '@/constants/theme';

const CORNER_RADIUS = 28;
const HEADER_HEIGHT = 48;

type ScreenHeaderProps = {
  title: string;
  rightContent?: React.ReactNode;
};

export function ScreenHeader({ title, rightContent }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, Platform.OS === 'ios' ? 8 : 12) + 16;

  return (
    <View style={[styles.wrapper, { paddingTop }]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {rightContent && <View style={styles.right}>{rightContent}</View>}
      </View>
      {/* Rounded corner transition into content area */}
      <View style={styles.cornerMask} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Emerald[900],
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    minHeight: HEADER_HEIGHT,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    letterSpacing: 0.3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cornerMask: {
    height: CORNER_RADIUS,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: CORNER_RADIUS,
    borderTopRightRadius: CORNER_RADIUS,
  },
});
