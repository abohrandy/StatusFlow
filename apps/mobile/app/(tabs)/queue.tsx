import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Badge, BottomSheet, Card, EmptyState, SegmentedControl, TopAppBar } from '../../components';
import { Colors, Radius, Spacing, Typography } from '../../theme';

export interface MobileScheduleItem {
  id: string;
  caption: string;
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  scheduledTime: string;
  timezone: string;
  status: 'SCHEDULED' | 'QUEUED' | 'COMPLETED' | 'FAILED';
}

export default function ScheduledQueueScreen() {
  const router = useRouter();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [schedules, setSchedules] = useState<MobileScheduleItem[]>([
    { id: 'sch_1', caption: 'Flash Sale Alert! 30% Off Storewide Today Only', mediaType: 'IMAGE', scheduledTime: 'Today at 02:30 PM', timezone: 'WAT (UTC+1)', status: 'QUEUED' },
    { id: 'sch_2', caption: 'New Product Unboxing Video', mediaType: 'VIDEO', scheduledTime: 'Tomorrow at 09:00 AM', timezone: 'WAT (UTC+1)', status: 'SCHEDULED' },
  ]);
  const [selectedItem, setSelectedItem] = useState<MobileScheduleItem | null>(null);

  const handleCancelSchedule = (id: string) => {
    Alert.alert('Cancel Schedule', 'Are you sure you want to cancel this scheduled status broadcast?', [
      { text: 'Keep Scheduled', style: 'cancel' },
      {
        text: 'Cancel Post',
        style: 'destructive',
        onPress: () => {
          setSchedules((prev) => prev.filter((s) => s.id !== id));
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
    setSchedules((prev) => [newItem, ...prev]);
    setSelectedItem(null);
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
        {schedules.length === 0 ? (
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
                  {item.caption}
                </Text>
                <View style={styles.itemFooter}>
                  <View style={styles.timeRow}>
                    <MaterialIcons name="schedule" size={14} color={Colors.onSurfaceVariant} />
                    <Text style={styles.timeLabel}>{item.scheduledTime}</Text>
                  </View>
                  <Text style={styles.tzLabel}>{item.timezone}</Text>
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
              {selectedItem.caption}
            </Text>
            <Text style={styles.sheetTime}>
              {selectedItem.scheduledTime} • {selectedItem.timezone}
            </Text>

            <Pressable style={styles.actionButton} onPress={() => handleDuplicateSchedule(selectedItem)}>
              <MaterialIcons name="content-copy" size={18} color={Colors.onSurface} />
              <Text style={styles.actionLabel}>Duplicate schedule</Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={() => handleCancelSchedule(selectedItem.id)}>
              <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
              <Text style={styles.cancelLabel}>Cancel & remove</Text>
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
  tzLabel: {
    ...Typography.labelSm,
    color: Colors.outline,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    justifyContent: 'center',
  },
  actionLabel: {
    ...Typography.labelMd,
    color: Colors.onSurface,
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
