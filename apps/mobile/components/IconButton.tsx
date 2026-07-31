import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radius } from '../theme';

export interface IconButtonProps {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
  size?: number;
  /** 'plain' = transparent bg; 'tonal' = tinted surface bg (for standalone icon actions like a card's overflow menu). */
  variant?: 'plain' | 'tonal';
  color?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 22,
  variant = 'plain',
  color,
  accessibilityLabel,
  disabled = false,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    hitSlop={8}
    accessibilityLabel={accessibilityLabel}
    style={({ pressed }) => [
      styles.base,
      variant === 'tonal' && styles.tonal,
      pressed && styles.pressed,
      disabled && styles.disabled,
    ]}
  >
    <MaterialIcons name={icon} size={size} color={color ?? Colors.onSurfaceVariant} />
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  tonal: {
    backgroundColor: Colors.surfaceContainer,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
});
