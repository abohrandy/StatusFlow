import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SegmentedControl, TopAppBar } from '../components';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { apiClient } from '../lib/apiClient';

const SWATCHES = ['#128C7E', '#075E54', '#004ac6', '#4b41e1', '#006242', '#ba1a1a'];
const EMOJIS = ['🔥', '🚀', '🎉', '❤️', '👏', '⚡', '✨', '💯'];
const MAX_CAPTION_LENGTH = 700;

type StatusType = 'text' | 'image' | 'video';

const SCHEDULE_PRESETS: { key: string; label: string; compute: () => Date }[] = [
  { key: 'in_1_hour', label: 'In 1 hour', compute: () => new Date(Date.now() + 60 * 60 * 1000) },
  { key: 'in_3_hours', label: 'In 3 hours', compute: () => new Date(Date.now() + 3 * 60 * 60 * 1000) },
  {
    key: 'tomorrow_9am',
    label: 'Tomorrow 9 AM',
    compute: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
  {
    key: 'tomorrow_6pm',
    label: 'Tomorrow 6 PM',
    compute: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
      return d;
    },
  },
];

export default function ComposerScreen() {
  const router = useRouter();
  const [statusType, setStatusType] = useState<StatusType>('image');
  const [caption, setCaption] = useState('');
  const [selectedColor, setSelectedColor] = useState(SWATCHES[0]);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mediaAsset, setMediaAsset] = useState<{ uri: string; fileName?: string; remoteUrl?: string } | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [schedulePreset, setSchedulePreset] = useState(SCHEDULE_PRESETS[0].key);

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
    const fileName = asset.fileName ?? asset.uri.split('/').pop() ?? 'media_asset';
    const mimeType = asset.mimeType ?? (statusType === 'video' ? 'video/mp4' : 'image/jpeg');
    setMediaAsset({ uri: asset.uri, fileName });

    // Upload immediately so the worker has a real URL to publish, not a device-local
    // path that only exists on this phone.
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri: asset.uri, name: fileName, type: mimeType } as any);
      const { data } = await apiClient.post('/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMediaAsset({ uri: asset.uri, fileName, remoteUrl: data.media.fileUrl });
    } catch (err: any) {
      Alert.alert('Upload failed', err?.response?.data?.error ?? 'Could not upload this file — please try again.');
      setMediaAsset(null);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSaveDraft = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccessMessage('Draft saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }, 500);
  };

  const handleScheduleStatus = async () => {
    if (!caption && statusType === 'text') {
      Alert.alert('Add a caption', 'Please enter a status text caption.');
      return;
    }
    if (statusType !== 'text' && !mediaAsset) {
      Alert.alert('Add media', `Please select an ${statusType} from your device first.`);
      return;
    }
    if (statusType !== 'text' && (uploadingMedia || !mediaAsset?.remoteUrl)) {
      Alert.alert('Still uploading', 'Wait for the media upload to finish before scheduling.');
      return;
    }

    const scheduledAt = SCHEDULE_PRESETS.find((p) => p.key === schedulePreset)!.compute();
    setSaving(true);
    try {
      await apiClient.post('/posts', {
        mediaType: statusType.toUpperCase(),
        caption: caption || undefined,
        mediaUrl: statusType !== 'text' ? mediaAsset?.remoteUrl : undefined,
        scheduledAt: scheduledAt.toISOString(),
      });
      setSuccessMessage('Status scheduled successfully!');
      setCaption('');
      setMediaAsset(null);
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        Alert.alert('Plan limit reached', err.response?.data?.error ?? 'Upgrade your plan to schedule more statuses.');
      } else {
        Alert.alert('Could not schedule', err?.response?.data?.error ?? 'Please try again.');
      }
    } finally {
      setSaving(false);
    }
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
          <Pressable style={styles.uploadZone} onPress={handlePickMedia} disabled={uploadingMedia}>
            <MaterialIcons
              name={uploadingMedia ? 'cloud-upload' : mediaAsset?.remoteUrl ? 'check-circle' : 'upload-file'}
              size={28}
              color={Colors.primary}
            />
            <Text style={styles.uploadTitle}>
              {uploadingMedia ? 'Uploading...' : mediaAsset?.remoteUrl ? 'Media selected — tap to change' : 'Tap to select media'}
            </Text>
            <Text style={styles.uploadSubtitle}>
              {uploadingMedia
                ? mediaAsset?.fileName ?? 'Please wait'
                : mediaAsset?.remoteUrl
                ? mediaAsset.fileName ?? 'Ready to schedule'
                : 'Choose a photo or video from your device'}
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

        <View style={styles.scheduleGroup}>
          <Text style={styles.label}>WHEN TO POST</Text>
          <View style={styles.presetRow}>
            {SCHEDULE_PRESETS.map((preset) => (
              <Pressable
                key={preset.key}
                onPress={() => setSchedulePreset(preset.key)}
                style={[styles.presetChip, schedulePreset === preset.key && styles.presetChipSelected]}
              >
                <Text style={[styles.presetLabel, schedulePreset === preset.key && styles.presetLabelSelected]}>{preset.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.scheduleResolved}>
            Will publish {SCHEDULE_PRESETS.find((p) => p.key === schedulePreset)!.compute().toLocaleString()}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <Pressable onPress={handleSaveDraft} disabled={saving}>
          <Text style={styles.draftLabel}>Save Draft</Text>
        </Pressable>
        <Pressable style={styles.scheduleButton} onPress={handleScheduleStatus} disabled={saving || uploadingMedia}>
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
  scheduleGroup: { gap: Spacing.sm },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  presetChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow,
  },
  presetChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetLabel: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  presetLabelSelected: {
    color: Colors.onPrimary,
  },
  scheduleResolved: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
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
