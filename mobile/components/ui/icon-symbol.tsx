// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.down': 'expand-more',
  'graduationcap.fill': 'school',
  'book.fill': 'menu-book',
  'book': 'book',
  'person.fill': 'person',
  'person': 'person-outline',
  'person.text.rectangle.fill': 'badge',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.circle': 'check-circle-outline',
  'checkmark': 'check',
  'exclamationmark.triangle.fill': 'warning',
  'plus': 'add',
  'trash': 'delete',
  'magnifyingglass': 'search',
  'qrcode': 'qr-code-2',
  'location.fill': 'location-on',
  'face.smiling': 'face',
  'calendar': 'event',
  'clock.fill': 'schedule',
  'clock': 'schedule',
  'xmark': 'close',
  'camera.fill': 'photo-camera',
  'photo.fill': 'photo-library',
  'number': 'tag',
  'arrow.up.circle.fill': 'upload',
  'pencil': 'edit',
  'faceid': 'fingerprint',
  'envelope.fill': 'email',
  'lock.fill': 'lock',
  'rectangle.portrait.and.arrow.right': 'logout',
  'circle.fill': 'circle',
  'gauge': 'speed',
  'gauge.medium': 'speed',
  'hand.raised.fill': 'pan-tool',
  'bell.fill': 'notifications',
  'gearshape.fill': 'settings',
  'arrow.clockwise': 'refresh',
  'info.circle.fill': 'info',
  'map.fill': 'map',
  'wifi.slash': 'wifi-off',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const mappedName = MAPPING[name] ?? 'help-outline';
  return <MaterialIcons color={color} size={size} name={mappedName} style={style} />;
}
