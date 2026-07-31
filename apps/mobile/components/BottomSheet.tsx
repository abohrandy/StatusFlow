import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius } from '../theme';

export interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
}

/** Styled wrapper around RN's `Modal` — reused for media preview, action sheets, and log
 * viewers (consolidating the ad hoc `Modal` usage already present in several screens). */
export const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onDismiss, children }) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>{children}</View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 27, 43, 0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingTop: 8,
  },
});
