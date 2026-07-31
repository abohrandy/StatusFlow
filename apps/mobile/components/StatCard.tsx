import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from './Card';
import { Colors, Spacing, Typography } from '../theme';

export interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  iconColor?: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, iconColor, trend }) => (
  <Card style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.label}>{label}</Text>
      {icon && <MaterialIcons name={icon} size={20} color={iconColor ?? Colors.primary} />}
    </View>
    <Text style={styles.value}>{value}</Text>
    {trend && <Text style={styles.trend}>{trend}</Text>}
  </Card>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  value: {
    ...Typography.headlineLg,
    color: Colors.onSurface,
  },
  trend: {
    ...Typography.labelSm,
    color: Colors.tertiary,
  },
});
