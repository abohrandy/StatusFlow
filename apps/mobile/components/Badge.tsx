import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme';

export type BadgeVariant = 'success' | 'error' | 'warning' | 'neutral' | 'primary';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; fg: string }> = {
  success: { bg: `${Colors.tertiary}1A`, fg: Colors.tertiary },
  error: { bg: Colors.errorContainer, fg: Colors.error },
  warning: { bg: Colors.warningContainer, fg: Colors.warning },
  neutral: { bg: Colors.surfaceContainerHigh, fg: Colors.onSurfaceVariant },
  primary: { bg: `${Colors.primary}1A`, fg: Colors.primary },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral' }) => {
  const { bg, fg } = VARIANT_STYLES[variant];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.labelSm,
    textTransform: 'uppercase',
  },
});
