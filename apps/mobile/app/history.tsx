import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Badge, Card, EmptyState, SegmentedControl, TopAppBar } from '../components';
import { Colors, Radius, Spacing, Typography } from '../theme';

export interface HistoryItem {
  id: string;
  caption: string;
  status: 'SUCCESS' | 'FAILED' | 'SCHEDULED' | 'PROCESSING' | 'CANCELLED';
  time: string;
  logs: string;
}

const HISTORY_ITEMS: HistoryItem[] = [
  { id: 'h1', caption: 'Flash Sale Alert! 30% Off Storewide Today Only', status: 'SUCCESS', time: 'Today at 02:30 PM', logs: 'Delivered to 142 contacts' },
  { id: 'h2', caption: 'New Product Line Unboxing & Demonstration', status: 'SCHEDULED', time: 'Tomorrow at 09:00 AM', logs: 'Queued for delivery' },
  { id: 'h3', caption: 'System Maintenance Notice', status: 'CANCELLED', time: 'Jul 20 at 10:00 AM', logs: 'Cancelled by user' },
];

const STATUS_BADGE_VARIANT: Record<HistoryItem['status'], 'success' | 'error' | 'warning' | 'neutral'> = {
  SUCCESS: 'success',
  FAILED: 'error',
  SCHEDULED: 'warning',
  PROCESSING: 'warning',
  CANCELLED: 'neutral',
};

export default function HistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = HISTORY_ITEMS.filter((h) => filter === 'ALL' || h.status === filter).filter((h) =>
    h.caption.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={styles.screen}>
      <TopAppBar title="Posting History" leftMode="back" onLeftPress={() => router.back()} />

      <View style={styles.controls}>
        <SegmentedControl
          options={[
            { label: 'All', value: 'ALL' },
            { label: 'Success', value: 'SUCCESS' },
            { label: 'Failed', value: 'FAILED' },
          ]}
          value={filter}
          onChange={setFilter}
        />

        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color={Colors.outline} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search posting history..."
            placeholderTextColor={Colors.outline}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<EmptyState icon="history" title="No history matches your filters" />}
        renderItem={({ item }) => (
          <Card style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.timeLabel}>{item.time}</Text>
              <Badge label={item.status} variant={STATUS_BADGE_VARIANT[item.status]} />
            </View>
            <Text style={styles.caption}>{item.caption}</Text>
            <Text style={styles.logLine}>{item.logs}</Text>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  controls: { padding: Spacing.marginMobile, paddingBottom: 0, gap: Spacing.sm },
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
  listContainer: { padding: Spacing.marginMobile, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  item: { gap: 6 },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    ...Typography.labelSm,
    color: Colors.outline,
  },
  caption: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  logLine: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
});
