import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Badge, BottomSheet, Card, EmptyState, SegmentedControl, TopAppBar } from '../../components';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { apiClient } from '../../lib/apiClient';

export interface QueuedPost {
  id: string;
  caption: string | null;
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  scheduledAt: string;
  status: 'DRAFT' | 'SCHEDULED' | 'QUEUED' | 'PROCESSING';
}

export default function ScheduledQueueScreen() {
  const router = useRouter();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [schedules, setSchedules] = useState<QueuedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<QueuedPost | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    apiClient
      .get('/posts')
      .then(({ data }) => setSchedules(data.posts ?? []))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCancelSchedule = (id: string) => {
    Alert.alert('Cancel Schedule', 'Are you sure you want to cancel this scheduled status broadcast?', [
      { text: 'Keep Scheduled', style: 'cancel' },
      {
        text: 'Cancel Post',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await apiClient.post(`/posts/${id}/cancel`);
            setSchedules((prev) => prev.filter((s) => s.id !== id));
            setSelectedItem(null);
          } catch (err: any) {
            Alert.alert('Could not cancel', err?.response?.data?.error ?? 'Please try again.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <TopAppBar title="Scheduled" />

      <View style={styles.toggleWrap}>
        <SegmentedControl
          options={[
            { label: 'List View', value: 'list' },
            { label: 'Calendar', value: 'calendar' },
          ]}
          value={view}
          onChange={(next) => {
            if (next === 'calendar') {
              router.push('/calendar');
              return;
            }
            setView(next);
          }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={styles.loadingLabel}>Loading your scheduled posts...</Text>
        ) : schedules.length === 0 ? (
          <EmptyState icon="schedule" title="No scheduled statuses" subtitle="Schedule your first WhatsApp status from the Create button." />
        ) : (
          <View style={styles.list}>
            {schedules.map((item) => (
              <Card key={item.id} onPress={() => setSelectedItem(item)} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Badge label={item.mediaType} variant="primary" />
                  <Badge label={item.status} variant={item.status === 'QUEUED' ? 'neutral' : 'warning'} />
                </View>
                <Text style={styles.caption} numberOfLines={2}>
                  {item.caption || '(no caption)'}
                </Text>
                <View style={styles.itemFooter}>
                  <View style={styles.timeRow}>
                    <MaterialIcons name="schedule" size={14} color={Colors.onSurfaceVariant} />
                    <Text style={styles.timeLabel}>{new Date(item.scheduledAt).toLocaleString()}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomSheet visible={!!selectedItem} onDismiss={() => setSelectedItem(null)}>
        {selectedItem && (
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Manage Scheduled Status</Text>
            <Text style={styles.sheetCaption} numberOfLines={2}>
              {selectedItem.caption || '(no caption)'}
            </Text>
            <Text style={styles.sheetTime}>{new Date(selectedItem.scheduledAt).toLocaleString()}</Text>

            <Pressable
              style={styles.cancelButton}
              onPress={() => handleCancelSchedule(selectedItem.id)}
              disabled={cancelling}
            >
              <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
              <Text style={styles.cancelLabel}>{cancelling ? 'Cancelling...' : 'Cancel & remove'}</Text>
            </Pressable>

            <Pressable style={styles.closeButton} onPress={() => setSelectedItem(null)}>
              <Text style={styles.closeLabel}>Close</Text>
            </Pressable>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  toggleWrap: { padding: Spacing.marginMobile, paddingBottom: 0 },
  content: { padding: Spacing.marginMobile, paddingBottom: Spacing.xxl },
  loadingLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  list: { gap: Spacing.md },
  itemCard: { gap: Spacing.sm },
  itemHeader: { flexDirection: 'row', gap: Spacing.xs },
  caption: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    lineHeight: 20,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  sheetContent: { padding: Spacing.lg, gap: Spacing.sm },
  sheetTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
  },
  sheetCaption: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  sheetTime: {
    ...Typography.labelSm,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.errorContainer,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    justifyContent: 'center',
  },
  cancelLabel: {
    ...Typography.labelMd,
    color: Colors.error,
  },
  closeButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  closeLabel: {
    ...Typography.labelMd,
    color: Colors.outline,
  },
});
