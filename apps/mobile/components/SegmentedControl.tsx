import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme';

export interface SegmentedControlOption<T extends string> {
  label: string;
  value: T;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.xl,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  label: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  labelActive: {
    color: Colors.onPrimary,
  },
});
