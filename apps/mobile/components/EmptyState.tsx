import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../theme';

export interface EmptyStateProps {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle }) => (
  <View style={styles.container}>
    <View style={styles.iconWrap}>
      <MaterialIcons name={icon} size={28} color={Colors.outline} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.xl,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.outline,
    textAlign: 'center',
  },
});
