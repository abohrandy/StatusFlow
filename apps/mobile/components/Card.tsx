import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Defaults to `md` (16px) padding; pass `none` for cards that manage their own inner spacing (e.g. media thumbnails). */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  highlighted?: boolean;
}

const PADDING_MAP = { none: 0, sm: Spacing.sm, md: Spacing.md, lg: Spacing.lg };

export const Card: React.FC<CardProps> = ({ children, onPress, style, padding = 'md', highlighted = false }) => {
  const content = (
    <View
      style={[
        styles.card,
        { padding: PADDING_MAP[padding] },
        highlighted && styles.highlighted,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.lg,
  },
  highlighted: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
