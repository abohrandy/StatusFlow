import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../theme';

export interface TopAppBarAction {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
  accessibilityLabel: string;
  /** Small dot badge, e.g. for unread notifications. */
  showDot?: boolean;
}

export interface TopAppBarProps {
  title?: string;
  /** 'back' renders a chevron that calls onLeftPress; 'close' renders a "Cancel" text
   * action (used on modal-presented screens like Create Status). */
  leftMode?: 'none' | 'back' | 'close';
  onLeftPress?: () => void;
  actions?: TopAppBarAction[];
  avatarUri?: string;
  onAvatarPress?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  leftMode = 'none',
  onLeftPress,
  actions = [],
  avatarUri,
  onAvatarPress,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {leftMode === 'back' && (
            <Pressable onPress={onLeftPress} hitSlop={8} style={styles.iconButton} accessibilityLabel="Go back">
              <MaterialIcons name="chevron-left" size={28} color={Colors.onSurface} />
            </Pressable>
          )}
          {leftMode === 'close' && (
            <Pressable onPress={onLeftPress} hitSlop={8} style={styles.closeButton} accessibilityLabel="Cancel">
              <MaterialIcons name="close" size={22} color={Colors.primary} />
              <Text style={styles.closeLabel}>Cancel</Text>
            </Pressable>
          )}
        </View>

        {title && (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}

        <View style={styles.right}>
          {actions.map((action) => (
            <Pressable
              key={action.accessibilityLabel}
              onPress={action.onPress}
              hitSlop={8}
              style={styles.iconButton}
              accessibilityLabel={action.accessibilityLabel}
            >
              <MaterialIcons name={action.icon} size={24} color={Colors.onSurfaceVariant} />
              {action.showDot && <View style={styles.dot} />}
            </Pressable>
          ))}
          {avatarUri && (
            <Pressable onPress={onAvatarPress} hitSlop={8}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  row: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.marginMobile,
  },
  left: {
    minWidth: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    padding: Spacing.xs,
    position: 'relative',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.sm,
  },
  closeLabel: {
    ...Typography.labelMd,
    color: Colors.primary,
  },
  dot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.tertiary,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
});
