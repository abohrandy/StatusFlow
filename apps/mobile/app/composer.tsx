import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';

export default function MobileStatusComposer() {
  const [statusType, setStatusType] = useState<'TEXT' | 'IMAGE' | 'VIDEO'>('TEXT');
  const [caption, setCaption] = useState('');
  const [selectedColor, setSelectedColor] = useState('#128C7E');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const colors = ['#128C7E', '#075E54', '#25D366', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];
  const emojis = ['🔥', '🚀', '🎉', '❤️', '👏', '⚡', '✨', '💯'];

  const handleSaveDraft = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccessMsg('Draft saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    }, 500);
  };

  const handleScheduleStatus = () => {
    if (!caption && statusType === 'TEXT') {
      Alert.alert('Validation Error', 'Please enter a status text caption.');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccessMsg('Status scheduled for broadcast!');
      setCaption('');
      setTimeout(() => setSuccessMsg(null), 3000);
    }, 800);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Status Composer</Text>
        <Text style={styles.subtitle}>Create text, image, or video WhatsApp status broadcasts</Text>

        {successMsg ? <Text style={styles.successBanner}>{successMsg}</Text> : null}

        {/* Status Type Selector */}
        <View style={styles.typeSelector}>
          {(['TEXT', 'IMAGE', 'VIDEO'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeBtn, statusType === type && styles.activeTypeBtn]}
              onPress={() => setStatusType(type)}
            >
              <Text style={[styles.typeBtnText, statusType === type && styles.activeTypeBtnText]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Live Smartphone Frame Preview */}
        <View style={[styles.previewFrame, { backgroundColor: statusType === 'TEXT' ? selectedColor : '#18181b' }]}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewUser}>Your Status</Text>
            <Text style={styles.previewTime}>Just now</Text>
          </View>

          <View style={styles.previewBody}>
            {statusType === 'TEXT' ? (
              <Text style={styles.previewText}>{caption || 'Type your status message...'}</Text>
            ) : (
              <View style={styles.mediaPlaceholder}>
                <Text style={styles.mediaIcon}>{statusType === 'IMAGE' ? '🖼️' : '🎥'}</Text>
                <Text style={styles.mediaLabel}>Tap to Select {statusType} from Library</Text>
              </View>
            )}
          </View>

          {statusType !== 'TEXT' && caption ? (
            <View style={styles.previewCaptionBox}>
              <Text style={styles.previewCaptionText}>{caption}</Text>
            </View>
          ) : null}
        </View>

        {/* Color Palette Selector for Text Statuses */}
        {statusType === 'TEXT' && (
          <View style={styles.colorRow}>
            {colors.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.selectedColorDot]}
                onPress={() => setSelectedColor(c)}
              />
            ))}
          </View>
        )}

        {/* Caption Entry */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Status Caption / Text</Text>
          <TextInput
            style={styles.textArea}
            value={caption}
            onChangeText={setCaption}
            placeholder="Write status caption or message..."
            placeholderTextColor="#71717a"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Emoji Quick Picker */}
        <View style={styles.emojiRow}>
          {emojis.map((emoji) => (
            <TouchableOpacity key={emoji} style={styles.emojiBtn} onPress={() => setCaption((prev) => prev + emoji)}>
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.draftBtn} onPress={handleSaveDraft} disabled={saving}>
            <Text style={styles.draftBtnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.publishBtn} onPress={handleScheduleStatus} disabled={saving}>
            <Text style={styles.publishBtnText}>{saving ? 'Scheduling...' : 'Schedule Status'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  contentContainer: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#a1a1aa', textAlign: 'center', marginBottom: 20, marginTop: 4 },
  successBanner: { color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', padding: 12, borderRadius: 12, textAlign: 'center', marginBottom: 16, fontSize: 12, fontWeight: '600' },
  typeSelector: { flexDirection: 'row', backgroundColor: '#18181b', borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: '#27272a' },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTypeBtn: { backgroundColor: '#25D366' },
  typeBtnText: { fontSize: 12, fontWeight: '600', color: '#a1a1aa' },
  activeTypeBtnText: { color: '#09090b' },
  previewFrame: { borderRadius: 24, padding: 20, minHeight: 220, justifyContent: 'space-between', marginBottom: 20, borderWidth: 1, borderColor: '#27272a' },
  previewHeader: { flexDirection: 'row', justifyBetween: 'space-between', alignItems: 'center' },
  previewUser: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },
  previewTime: { fontSize: 11, color: 'rgba(255, 255, 255, 0.7)' },
  previewBody: { flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 16 },
  previewText: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  mediaPlaceholder: { alignItems: 'center', gap: 8 },
  mediaIcon: { fontSize: 36 },
  mediaLabel: { fontSize: 12, color: '#a1a1aa' },
  previewCaptionBox: { backgroundColor: 'rgba(0, 0, 0, 0.6)', padding: 10, borderRadius: 10 },
  previewCaptionText: { color: '#ffffff', fontSize: 12 },
  colorRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  selectedColorDot: { borderWidth: 3, borderColor: '#ffffff' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: '#a1a1aa', marginBottom: 6 },
  textArea: { backgroundColor: '#18181b', borderRadius: 14, padding: 14, color: '#ffffff', fontSize: 14, borderWidth: 1, borderColor: '#27272a', textAlignVertical: 'top', minHeight: 90 },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  emojiBtn: { backgroundColor: '#18181b', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#27272a' },
  emojiText: { fontSize: 18 },
  actionRow: { flexDirection: 'row', gap: 12 },
  draftBtn: { flex: 1, backgroundColor: '#27272a', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  draftBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  publishBtn: { flex: 1, backgroundColor: '#25D366', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  publishBtnText: { color: '#09090b', fontWeight: 'bold', fontSize: 13 },
});
