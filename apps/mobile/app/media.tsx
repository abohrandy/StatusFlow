import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Modal, Image } from 'react-native';

export interface MobileMediaFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSizeMb: number;
  mimeType: string;
}

export default function MobileMediaLibrary() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSimulateUpload = () => {
    setUploading(true);
    setTimeout(() => {
      const newFile: MobileMediaFile = {
        id: `m_${Date.now()}`,
        fileName: `status_asset_${Math.floor(Math.random() * 100)}.png`,
        fileUrl: `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 100)}`,
        fileSizeMb: 2.1,
        mimeType: 'image/png'
      };
      setMediaList([newFile, ...mediaList]);
      setUploading(false);
    }, 1200);
  };

  const handleDelete = (id: string) => {
    setMediaList(mediaList.filter((m) => m.id !== id));
    setSelectedFile(null);
  };

  const filteredMedia = mediaList.filter((m) => m.fileName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={styles.container}>
      {/* Top Header Actions */}
      <View style={styles.header}>
        <Text style={styles.title}>Media Library</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={handleSimulateUpload} disabled={uploading}>
          <Text style={styles.uploadBtnText}>{uploading ? 'Uploading...' : '+ Upload Asset'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search media files..."
          placeholderTextColor="#71717a"
        />
      </View>

      {/* Media Grid */}
      <ScrollView
        contentContainerStyle={styles.gridContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#25D366" />}
      >
        {filteredMedia.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No media files found</Text>
            <Text style={styles.emptySub}>Upload images or videos from your gallery to schedule statuses.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredMedia.map((item) => (
              <TouchableOpacity key={item.id} style={styles.mediaCard} onPress={() => setSelectedFile(item)}>
                <Image source={{ uri: item.fileUrl }} style={styles.thumbnail} />
                <View style={styles.mediaInfo}>
                  <Text style={styles.mediaName} numberOfLines={1}>{item.fileName}</Text>
                  <Text style={styles.mediaMeta}>{item.fileSizeMb} MB • {item.mimeType.split('/')[1].toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Fullscreen Preview Modal */}
      {selectedFile && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Image source={{ uri: selectedFile.fileUrl }} style={styles.previewImage} />
              <Text style={styles.modalTitle}>{selectedFile.fileName}</Text>
              <Text style={styles.modalMeta}>{selectedFile.fileSizeMb} MB • {selectedFile.mimeType}</Text>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(selectedFile.id)}>
                  <Text style={styles.deleteBtnText}>Delete Asset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedFile(null)}>
                  <Text style={styles.closeBtnText}>Close Preview</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  uploadBtn: { backgroundColor: '#25D366', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  uploadBtnText: { color: '#09090b', fontWeight: 'bold', fontSize: 12 },
  searchBox: { marginBottom: 16 },
  searchInput: { backgroundColor: '#18181b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#ffffff', fontSize: 14, borderWidth: 1, borderColor: '#27272a' },
  gridContainer: { paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  mediaCard: { width: '48%', backgroundColor: '#18181b', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#27272a' },
  thumbnail: { width: '100%', height: 120 },
  mediaInfo: { padding: 10 },
  mediaName: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
  mediaMeta: { fontSize: 10, color: '#71717a', marginTop: 2 },
  emptyBox: { paddingVertical: 40, alignItems: 'center', borderWidth: 1, borderColor: '#27272a', borderStyle: 'dashed', borderRadius: 16 },
  emptyTitle: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  emptySub: { fontSize: 12, color: '#71717a', textAlign: 'center', marginTop: 4, paddingHorizontal: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(9, 9, 11, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#18181b', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#27272a' },
  previewImage: { width: '100%', height: 240, borderRadius: 12, marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  modalMeta: { fontSize: 12, color: '#71717a', marginTop: 2, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  deleteBtn: { flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  deleteBtnText: { color: '#f87171', fontWeight: '600', fontSize: 12 },
  closeBtn: { flex: 1, backgroundColor: '#27272a', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  closeBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 12 },
});
