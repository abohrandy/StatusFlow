import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';

export interface MobileScheduleItem {
  id: string;
  caption: string;
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  scheduledTime: string;
  timezone: string;
  status: 'SCHEDULED' | 'QUEUED' | 'COMPLETED' | 'FAILED';
}

export default function MobileScheduledQueue() {
  const [schedules, setSchedules] = useState<MobileScheduleItem[]>([
    { id: 'sch_1', caption: 'Flash Sale Alert! 30% Off Storewide Today Only 🔥', mediaType: 'IMAGE', scheduledTime: 'Today at 02:30 PM', timezone: 'WAT (UTC+1)', status: 'QUEUED' },
    { id: 'sch_2', caption: 'New Product Unboxing Video 🎥', mediaType: 'VIDEO', scheduledTime: 'Tomorrow at 09:00 AM', timezone: 'WAT (UTC+1)', status: 'SCHEDULED' },
  ]);
  const [selectedItem, setSelectedItem] = useState<MobileScheduleItem | null>(null);

  const handleCancelSchedule = (id: string) => {
    Alert.alert('Cancel Schedule', 'Are you sure you want to cancel this scheduled status broadcast?', [
      { text: 'Keep Scheduled', style: 'cancel' },
      {
        text: 'Cancel Post',
        style: 'destructive',
        onPress: () => {
          setSchedules(schedules.filter((s) => s.id !== id));
          setSelectedItem(null);
        },
      },
    ]);
  };

  const handleDuplicateSchedule = (item: MobileScheduleItem) => {
    const newItem: MobileScheduleItem = {
      ...item,
      id: `sch_${Date.now()}`,
      caption: `[Copy] ${item.caption}`,
      scheduledTime: 'Tomorrow at 06:00 PM',
      status: 'SCHEDULED',
    };
    setSchedules([newItem, ...schedules]);
    setSelectedItem(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scheduled Queue</Text>
      <Text style={styles.subtitle}>Manage upcoming status broadcasts and execution times</Text>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {schedules.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Scheduled Statuses</Text>
            <Text style={styles.emptySub}>Schedule your first WhatsApp status from the Status Composer.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {schedules.map((item) => (
              <TouchableOpacity key={item.id} style={styles.card} onPress={() => setSelectedItem(item)}>
                <View style={styles.cardHeader}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.mediaType}</Text>
                  </View>
                  <View style={[styles.statusBadge, item.status === 'QUEUED' ? styles.statusQueued : styles.statusScheduled]}>
                    <Text style={styles.statusBadgeText}>{item.status}</Text>
                  </View>
                </View>

                <Text style={styles.captionText} numberOfLines={2}>{item.caption}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.timeText}>⏰ {item.scheduledTime}</Text>
                  <Text style={styles.tzText}>{item.timezone}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Modal */}
      {selectedItem && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Manage Scheduled Status</Text>
              <Text style={styles.modalCaption} numberOfLines={2}>{selectedItem.caption}</Text>
              <Text style={styles.modalTime}>{selectedItem.scheduledTime} • {selectedItem.timezone}</Text>

              <TouchableOpacity style={styles.actionButton} onPress={() => handleDuplicateSchedule(selectedItem)}>
                <Text style={styles.actionButtonText}>📋 Duplicate Schedule</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelActionButton} onPress={() => handleCancelSchedule(selectedItem.id)}>
                <Text style={styles.cancelActionButtonText}>🗑️ Cancel & Remove</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedItem(null)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#a1a1aa', textAlign: 'center', marginBottom: 20, marginTop: 4 },
  scrollContainer: { paddingBottom: 40 },
  list: { gap: 14 },
  card: { backgroundColor: '#18181b', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#27272a' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { backgroundColor: 'rgba(37, 211, 102, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(37, 211, 102, 0.2)' },
  typeBadgeText: { color: '#25D366', fontSize: 11, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusQueued: { backgroundColor: '#27272a' },
  statusScheduled: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  statusBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  captionText: { fontSize: 14, fontWeight: '600', color: '#ffffff', marginBottom: 12, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { fontSize: 12, color: '#a1a1aa' },
  tzText: { fontSize: 11, color: '#71717a' },
  emptyCard: { paddingVertical: 40, alignItems: 'center', borderWidth: 1, borderColor: '#27272a', borderStyle: 'dashed', borderRadius: 16 },
  emptyTitle: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  emptySub: { fontSize: 12, color: '#71717a', textAlign: 'center', marginTop: 4, paddingHorizontal: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(9, 9, 11, 0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#18181b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: '#27272a', gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  modalCaption: { fontSize: 13, color: '#a1a1aa' },
  modalTime: { fontSize: 12, color: '#25D366', fontWeight: '500', marginBottom: 8 },
  actionButton: { backgroundColor: '#27272a', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  cancelActionButton: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  cancelActionButtonText: { color: '#f87171', fontWeight: 'bold', fontSize: 13 },
  closeButton: { backgroundColor: '#09090b', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  closeButtonText: { color: '#71717a', fontSize: 12, fontWeight: '600' },
});
