import React, { ComponentType } from 'react';
import { OpaqueColorValue, type StyleProp, type ViewStyle } from 'react-native';
import type { IconProps } from 'phosphor-react-native';
import {
  HouseIcon,
  PaperPlaneRightIcon,
  CodeIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretDownIcon,
  GraduationCapIcon,
  BookOpenIcon,
  BookIcon,
  UserIcon,
  UserCircleIcon,
  IdentificationCardIcon,
  CheckCircleIcon,
  CheckIcon,
  WarningIcon,
  WarningCircleIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  QrCodeIcon,
  MapPinIcon,
  SmileyIcon,
  CalendarBlankIcon,
  ClockIcon,
  XIcon,
  CameraIcon,
  ImageIcon,
  HashIcon,
  ArrowCircleUpIcon,
  PencilSimpleIcon,
  ScanIcon,
  EnvelopeSimpleIcon,
  LockIcon,
  SignOutIcon,
  CircleIcon,
  GaugeIcon,
  HandIcon,
  BellIcon,
  GearIcon,
  ArrowClockwiseIcon,
  InfoIcon,
  MapTrifoldIcon,
  WifiSlashIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  EyeSlashIcon,
} from 'phosphor-react-native';

const MAPPING: Record<string, ComponentType<IconProps>> = {
  'house.fill': HouseIcon,
  'paperplane.fill': PaperPlaneRightIcon,
  'chevron.left.forwardslash.chevron.right': CodeIcon,
  'chevron.left': CaretLeftIcon,
  'chevron.right': CaretRightIcon,
  'chevron.down': CaretDownIcon,
  'graduationcap.fill': GraduationCapIcon,
  'book.fill': BookOpenIcon,
  'book': BookIcon,
  'person.fill': UserIcon,
  'person.circle.fill': UserCircleIcon,
  'person': UserIcon,
  'person.text.rectangle.fill': IdentificationCardIcon,
  'checkmark.circle.fill': CheckCircleIcon,
  'checkmark.circle': CheckCircleIcon,
  'checkmark': CheckIcon,
  'exclamationmark.triangle.fill': WarningIcon,
  'exclamationmark.circle.fill': WarningCircleIcon,
  'plus': PlusIcon,
  'trash': TrashIcon,
  'magnifyingglass': MagnifyingGlassIcon,
  'qrcode': QrCodeIcon,
  'location.fill': MapPinIcon,
  'face.smiling': SmileyIcon,
  'calendar': CalendarBlankIcon,
  'clock.fill': ClockIcon,
  'clock': ClockIcon,
  'xmark': XIcon,
  'camera.fill': CameraIcon,
  'photo.fill': ImageIcon,
  'number': HashIcon,
  'arrow.up.circle.fill': ArrowCircleUpIcon,
  'pencil': PencilSimpleIcon,
  'faceid': ScanIcon,
  'envelope.fill': EnvelopeSimpleIcon,
  'lock.fill': LockIcon,
  'rectangle.portrait.and.arrow.right': SignOutIcon,
  'circle.fill': CircleIcon,
  'gauge': GaugeIcon,
  'gauge.medium': GaugeIcon,
  'hand.raised.fill': HandIcon,
  'bell.fill': BellIcon,
  'gearshape.fill': GearIcon,
  'arrow.clockwise': ArrowClockwiseIcon,
  'info.circle.fill': InfoIcon,
  'map.fill': MapTrifoldIcon,
  'wifi.slash': WifiSlashIcon,
  'ellipsis.vertical': DotsThreeVerticalIcon,
  'eye.fill': EyeIcon,
  'eye.slash.fill': EyeSlashIcon,
};

export type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: string;
}) {
  const PhosphorIcon = MAPPING[name] ?? CircleIcon;
  return (
    <PhosphorIcon
      size={size}
      color={color as string}
      weight="regular"
      style={style}
    />
  );
}
