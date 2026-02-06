/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#10b981';
const tintColorDark = '#10b981';

// Emerald Color Palette (matching Tailwind)
export const Emerald = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: Emerald[500],
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorLight,
    card: '#ffffff',
    surface: '#f8fafc',
    border: '#e5e7eb',
    primary: Emerald[900],
    primaryLight: Emerald[700],
    success: Emerald[600],
    successLight: Emerald[100],
    // Additional semantic colors
    error: '#ef4444',
    errorLight: '#fee2e2',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    info: '#3b82f6',
    infoLight: '#dbeafe',
  },
  dark: {
    text: '#f1f5f9',
    background: '#0f1419',
    tint: tintColorDark,
    icon: Emerald[400],
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorDark,
    card: 'rgba(30, 35, 40, 0.95)',
    surface: 'rgba(40, 46, 52, 0.9)',
    border: 'rgba(71, 85, 105, 0.3)',
    primary: Emerald[500],
    primaryLight: Emerald[400],
    success: Emerald[500],
    successLight: 'rgba(16, 185, 129, 0.2)',
    // Additional semantic colors
    error: '#f87171',
    errorLight: 'rgba(248, 113, 113, 0.2)',
    warning: '#fbbf24',
    warningLight: 'rgba(251, 191, 36, 0.2)',
    info: '#60a5fa',
    infoLight: 'rgba(96, 165, 250, 0.2)',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
