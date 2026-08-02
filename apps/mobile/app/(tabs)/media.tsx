import React, { useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View, type DimensionValue } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheet, EmptyState, TopAppBar } from '../../components';
import { Colors, Radius, Spacing, Typography } from '../../theme';

export interface MobileMediaFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSizeMb: number;
  mimeType: string;
}

type Filter = 'all' | 'images' | 'videos';

// Fixed at 2 columns regardless of screen width wastes most of a tablet's space; scale
// up the column count with available width instead.
function useMediaColumnWidth(): DimensionValue {
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  return `${100 / columns - 2}%` as DimensionValue;
}

export default function MediaLibraryScreen() {
  const cardWidth = useMediaColumnWidth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedFile, setSelectedFile] = useState<MobileMediaFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaList, setMediaList] = useState<MobileMediaFile[]>([
    { id: 'm1', fileName: 'promo_banner.png', fileUrl: 'https://picsum.photos/400/400?random=1', fileSizeMb: 1.2, mimeType: 'image/png' },
    { id: 'm2', fileName: 'product_demo.mp4', fileUrl: 'https://picsum.photos/400/400?random=2', fileSizeMb: 4.8, mimeType: 'video/mp4' },
  ]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handlePickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access in your device settings to upload media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    const asset = result.assets[0];
    const newFile: MobileMediaFile = {
      id: `m_${Date.now()}`,
      fileName: asset.fileName ?? asset.uri.split('/').pop() ?? 'media_asset',
      fileUrl: asset.uri,
      fileSizeMb: asset.fileSize ? Number((asset.fileSize / (1024 * 1024)).toFixed(1)) : 0,
      mimeType: asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
    };
    setMediaList((prev) => [newFile, ...prev]);
    setUploading(false);
  };

  const handleDelete = (id: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== id));
    setSelectedFile(null);
  };

  const filteredMedia = mediaList
    .filter((m) => m.fileName.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((m) => {
      if (filter === 'images') return m.mimeType.startsWith('image');
      if (filter === 'videos') return m.mimeType.startsWith('video');
      return true;
    });

  return (
    <View style={styles.screen}>
      <TopAppBar
        title="Media Library"
        actions={[{ icon: 'cloud-upload', accessibilityLabel: 'Upload media', onPress: handlePickMedia }]}
      />

      <View style={styles.controls}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color={Colors.outline} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search media assets..."
            placeholderTextColor={Colors.outline}
          />
        </View>

        <View style={styles.filterRow}>
          {(['all', 'images', 'videos'] as Filter[]).map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterPill, filter === f && styles.filterPillActive]}>
              <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>
                {f === 'all' ? 'All' : f === 'images' ? 'Images' : 'Videos'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.gridContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {uploading && (
          <View style={styles.uploadingBanner}>
            <Text style={styles.uploadingText}>Uploading asset...</Text>
          </View>
        )}

        {filteredMedia.length === 0 ? (
          <EmptyState icon="perm-media" title="No media files found" subtitle="Upload images or videos to use in scheduled statuses." />
        ) : (
          <View style={styles.grid}>
            {filteredMedia.map((item) => {
              const isVideo = item.mimeType.startsWith('video');
              return (
                <Pressable key={item.id} style={[styles.mediaCard, { width: cardWidth }]} onPress={() => setSelectedFile(item)}>
                  <View style={styles.thumbnailWrap}>
                    <Image source={{ uri: item.fileUrl }} style={styles.thumbnail} />
                    <View style={styles.typeBadge}>
                      <MaterialIcons name={isVideo ? 'videocam' : 'image'} size={12} color="#ffffff" />
                      <Text style={styles.typeBadgeLabel}>{item.mimeType.split('/')[1].toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.mediaInfo}>
                    <Text style={styles.mediaName} numberOfLines={1}>
                      {item.fileName}
                    </Text>
                    <Text style={styles.mediaMeta}>{item.fileSizeMb} MB</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomSheet visible={!!selectedFile} onDismiss={() => setSelectedFile(null)}>
        {selectedFile && (
          <View style={styles.sheetContent}>
            <Image source={{ uri: selectedFile.fileUrl }} style={styles.previewImage} />
            <Text style={styles.sheetTitle}>{selectedFile.fileName}</Text>
            <Text style={styles.sheetMeta}>
              {selectedFile.fileSizeMb} MB • {selectedFile.mimeType}
            </Text>
            <View style={styles.sheetActions}>
              <Pressable style={styles.deleteButton} onPress={() => handleDelete(selectedFile.id)}>
                <Text style={styles.deleteButtonLabel}>Delete Asset</Text>
              </Pressable>
              <Pressable style={styles.closeButton} onPress={() => setSelectedFile(null)}>
                <Text style={styles.closeButtonLabel}>Close</Text>
              </Pressable>
            </View>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  controls: { paddingHorizontal: Spacing.marginMobile, paddingTop: Spacing.md, gap: Spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    ...Typography.bodySm,
    flex: 1,
    paddingVertical: Spacing.sm,
    color: Colors.onSurface,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceContainer,
    padding: 4,
    borderRadius: Radius.xl,
  },
  filterPill: {
    flex: 1,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  filterPillActive: { backgroundColor: Colors.primary },
  filterLabel: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  filterLabelActive: { color: Colors.onPrimary },
  gridContainer: { padding: Spacing.marginMobile, paddingBottom: Spacing.xxl, gap: Spacing.md },
  uploadingBanner: {
    backgroundColor: `${Colors.primary}14`,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  uploadingText: {
    ...Typography.labelMd,
    color: Colors.primary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  mediaCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  thumbnailWrap: { position: 'relative' },
  thumbnail: { width: '100%', height: 120 },
  typeBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20, 27, 43, 0.7)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  typeBadgeLabel: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  mediaInfo: { padding: Spacing.sm },
  mediaName: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  mediaMeta: {
    ...Typography.labelSm,
    color: Colors.outline,
    marginTop: 2,
  },
  sheetContent: { padding: Spacing.lg, alignItems: 'center' },
  previewImage: { width: '100%', height: 220, borderRadius: Radius.lg, marginBottom: Spacing.md },
  sheetTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
  },
  sheetMeta: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  sheetActions: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  deleteButton: {
    flex: 1,
    backgroundColor: Colors.errorContainer,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  deleteButtonLabel: {
    ...Typography.labelMd,
    color: Colors.error,
  },
  closeButton: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  closeButtonLabel: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
});
