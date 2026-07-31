import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../theme';

export interface AvatarProps {
  uri?: string;
  /** Shown when there's no `uri` — typically the user's initial. */
  fallbackLabel?: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ uri, fallbackLabel, size = 40 }) => {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[styles.image, dimension]} />;
  }

  return (
    <View style={[styles.fallback, dimension]}>
      <Text style={[Typography.labelMd, styles.fallbackLabel]}>{fallbackLabel?.charAt(0).toUpperCase() ?? '?'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  fallback: {
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLabel: {
    color: Colors.onPrimary,
  },
});
