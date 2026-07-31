import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme';

export interface FABProps {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Floating action button. Rendered as a sibling overlay to the tab navigator (see
 * app/(tabs)/_layout.tsx) rather than a 5th tab, matching the Stitch mockups. */
export const FAB: React.FC<FABProps> = ({ icon, onPress, style, accessibilityLabel = 'Create' }) => (
  <Pressable
    onPress={onPress}
    accessibilityLabel={accessibilityLabel}
    style={({ pressed }) => [styles.fab, pressed && styles.pressed, style]}
  >
    <MaterialIcons name={icon} size={28} color={Colors.onPrimary} />
  </Pressable>
);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 84,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
});
