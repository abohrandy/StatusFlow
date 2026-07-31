import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SegmentedControl, TopAppBar } from '../components';
import { Colors, Radius, Spacing, Typography } from '../theme';

const SWATCHES = ['#128C7E', '#075E54', '#004ac6', '#4b41e1', '#006242', '#ba1a1a'];
const EMOJIS = ['🔥', '🚀', '🎉', '❤️', '👏', '⚡', '✨', '💯'];
const MAX_CAPTION_LENGTH = 700;

type StatusType = 'text' | 'image' | 'video';

export default function ComposerScreen() {
  const router = useRouter();
  const [statusType, setStatusType] = useState<StatusType>('image');
  const [caption, setCaption] = useState('');
  const [selectedColor, setSelectedColor] = useState(SWATCHES[0]);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mediaAsset, setMediaAsset] = useState<{ uri: string; fileName?: string } | null>(null);

  const handleChangeStatusType = (next: StatusType) => {
    setStatusType(next);
    setMediaAsset(null);
  };

  const handlePickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access in your device settings to attach media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: statusType === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setMediaAsset({ uri: asset.uri, fileName: asset.fileName ?? undefined });
  };

  const handleSaveDraft = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccessMessage('Draft saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }, 500);
  };

  const handleScheduleStatus = () => {
    if (!caption && statusType === 'text') {
      Alert.alert('Add a caption', 'Please enter a status text caption.');
      return;
    }
    if (statusType !== 'text' && !mediaAsset) {
      Alert.alert('Add media', `Please select an ${statusType} from your device first.`);
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccessMessage('Status scheduled successfully!');
      setCaption('');
      setMediaAsset(null);
      setTimeout(() => setSuccessMessage(null), 2000);
    }, 800);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopAppBar title="Create Status" leftMode="close" onLeftPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        {successMessage && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{successMessage}</Text>
          </View>
        )}

        <SegmentedControl
          options={[
            { label: 'Image', value: 'image' },
            { label: 'Video', value: 'video' },
            { label: 'Text-only', value: 'text' },
          ]}
          value={statusType}
          onChange={handleChangeStatusType}
        />

        {/* Live WhatsApp-style preview */}
        <View style={[styles.previewFrame, { backgroundColor: statusType === 'text' ? selectedColor : Colors.onBackground }]}>
          {statusType === 'image' && mediaAsset && (
            <Image source={{ uri: mediaAsset.uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          )}
          {statusType === 'image' && mediaAsset && <View style={styles.previewScrim} />}

          <View style={styles.previewHeader}>
            <Text style={styles.previewUser}>Your Status</Text>
            <Text style={styles.previewTime}>Just now</Text>
          </View>

          <View style={styles.previewBody}>
            {statusType === 'text' ? (
              <Text style={styles.previewText}>{caption || 'Type your status message...'}</Text>
            ) : statusType === 'video' && mediaAsset ? (
              <View style={styles.mediaPlaceholder}>
                <MaterialIcons name="videocam" size={36} color="rgba(255,255,255,0.9)" />
                <Text style={styles.mediaLabel} numberOfLines={1}>
                  {mediaAsset.fileName ?? 'Video selected'}
                </Text>
              </View>
            ) : statusType === 'image' && mediaAsset ? null : (
              <View style={styles.mediaPlaceholder}>
                <MaterialIcons name={statusType === 'image' ? 'image' : 'videocam'} size={36} color="rgba(255,255,255,0.7)" />
                <Text style={styles.mediaLabel}>Tap below to select {statusType} from library</Text>
              </View>
            )}
          </View>

          {statusType !== 'text' && !!caption && (
            <View style={styles.previewCaptionBox}>
              <Text style={styles.previewCaptionText}>{caption}</Text>
            </View>
          )}
        </View>

        {statusType === 'text' && (
          <View style={styles.colorRow}>
            {SWATCHES.map((color) => (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[styles.colorDot, { backgroundColor: color }, selectedColor === color && styles.colorDotSelected]}
              />
            ))}
          </View>
        )}

        {statusType !== 'text' && (
          <Pressable style={styles.uploadZone} onPress={handlePickMedia}>
            <MaterialIcons name={mediaAsset ? 'check-circle' : 'upload-file'} size={28} color={Colors.primary} />
            <Text style={styles.uploadTitle}>{mediaAsset ? 'Media selected — tap to change' : 'Tap to select media'}</Text>
            <Text style={styles.uploadSubtitle}>
              {mediaAsset ? mediaAsset.fileName ?? 'Ready to schedule' : 'Choose a photo or video from your device'}
            </Text>
          </Pressable>
        )}

        <View style={styles.captionGroup}>
          <View style={styles.captionHeader}>
            <Text style={styles.label}>STATUS CAPTION</Text>
            <Text style={styles.charCount}>
              {caption.length} / {MAX_CAPTION_LENGTH}
            </Text>
          </View>
          <TextInput
            style={styles.textArea}
            value={caption}
            onChangeText={(text) => setCaption(text.slice(0, MAX_CAPTION_LENGTH))}
            placeholder="Type a status update..."
            placeholderTextColor={Colors.outline}
            multiline
          />
          <View style={styles.emojiRow}>
            {EMOJIS.map((emoji) => (
              <Pressable key={emoji} onPress={() => setCaption((prev) => (prev + emoji).slice(0, MAX_CAPTION_LENGTH))}>
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <Pressable onPress={handleSaveDraft} disabled={saving}>
          <Text style={styles.draftLabel}>Save Draft</Text>
        </Pressable>
        <Pressable style={styles.scheduleButton} onPress={handleScheduleStatus} disabled={saving}>
          <MaterialIcons name="schedule" size={18} color={Colors.onPrimary} />
          <Text style={styles.scheduleLabel}>{saving ? 'Scheduling...' : 'Schedule Status'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.marginMobile, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  banner: {
    backgroundColor: `${Colors.tertiary}1A`,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  bannerText: {
    ...Typography.labelMd,
    color: Colors.tertiary,
    textAlign: 'center',
  },
  previewFrame: {
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    minHeight: 220,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  previewScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewUser: {
    ...Typography.labelMd,
    color: '#ffffff',
  },
  previewTime: {
    ...Typography.labelSm,
    color: 'rgba(255,255,255,0.7)',
  },
  previewBody: { flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: Spacing.md },
  previewText: {
    ...Typography.headlineSm,
    color: '#ffffff',
    textAlign: 'center',
  },
  mediaPlaceholder: { alignItems: 'center', gap: Spacing.sm },
  mediaLabel: {
    ...Typography.bodySm,
    color: 'rgba(255,255,255,0.7)',
  },
  previewCaptionBox: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  previewCaptionText: {
    ...Typography.bodySm,
    color: '#ffffff',
  },
  colorRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md },
  colorDot: { width: 32, height: 32, borderRadius: Radius.full },
  colorDotSelected: { borderWidth: 3, borderColor: Colors.onSurface },
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.xxl,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceContainerLow,
  },
  uploadTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
  },
  uploadSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  captionGroup: { gap: Spacing.sm },
  captionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  charCount: {
    ...Typography.labelSm,
    color: Colors.outline,
  },
  textArea: {
    ...Typography.bodyMd,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
    color: Colors.onSurface,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
  },
  emoji: { fontSize: 20 },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.marginMobile,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  draftLabel: {
    ...Typography.labelMd,
    color: Colors.primary,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
  },
  scheduleLabel: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
  },
});
