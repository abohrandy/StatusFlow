import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from './Card';
import { Colors, Radius, Spacing, Typography } from '../theme';

export interface PricingCardProps {
  planName: string;
  price: string;
  cadence?: string;
  description?: string;
  badge?: string;
  features: string[];
  ctaLabel: string;
  onPressCta: () => void;
  ctaDisabled?: boolean;
  highlighted?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  planName,
  price,
  cadence,
  description,
  badge,
  features,
  ctaLabel,
  onPressCta,
  ctaDisabled = false,
  highlighted = false,
}) => (
  <Card highlighted={highlighted} style={styles.card}>
    {badge && (
      <View style={styles.badge}>
        <Text style={styles.badgeLabel}>{badge}</Text>
      </View>
    )}

    <Text style={styles.planName}>{planName}</Text>
    <View style={styles.priceRow}>
      <Text style={styles.price}>{price}</Text>
      {cadence && <Text style={styles.cadence}> / {cadence}</Text>}
    </View>
    {description && <Text style={styles.description}>{description}</Text>}

    <View style={styles.features}>
      {features.map((feature) => (
        <View key={feature} style={styles.featureRow}>
          <MaterialIcons name="check-circle" size={16} color={Colors.tertiary} />
          <Text style={styles.featureLabel}>{feature}</Text>
        </View>
      ))}
    </View>

    <Pressable
      onPress={onPressCta}
      disabled={ctaDisabled}
      style={[styles.cta, ctaDisabled ? styles.ctaDisabled : styles.ctaEnabled]}
    >
      <Text style={[styles.ctaLabel, ctaDisabled && styles.ctaLabelDisabled]}>{ctaLabel}</Text>
    </Pressable>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: `${Colors.tertiary}26`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeLabel: {
    ...Typography.labelSm,
    color: Colors.tertiary,
  },
  planName: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    ...Typography.headlineLg,
    color: Colors.primary,
  },
  cadence: {
    ...Typography.bodySm,
    color: Colors.outline,
  },
  description: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  features: {
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  featureLabel: {
    ...Typography.bodySm,
    color: Colors.onSurface,
  },
  cta: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  ctaEnabled: {
    backgroundColor: Colors.primary,
  },
  ctaDisabled: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  ctaLabel: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
  },
  ctaLabelDisabled: {
    color: Colors.onSurfaceVariant,
  },
});
