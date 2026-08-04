import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Badge, Card, EmptyState, SegmentedControl, TopAppBar } from '../components';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { apiClient } from '../lib/apiClient';

export interface HistoryPost {
  id: string;
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  caption: string | null;
  scheduledAt: string;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
  errorMessage: string | null;
}

const STATUS_BADGE_VARIANT: Record<HistoryPost['status'], 'success' | 'error' | 'neutral'> = {
  COMPLETED: 'success',
  FAILED: 'error',
  CANCELLED: 'neutral',
};

export default function HistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'FAILED'>('ALL');
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState<HistoryPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return apiClient
      .get('/posts/history')
      .then(({ data }) => setHistory(data.posts ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = history
    .filter((h) => filter === 'ALL' || h.status === filter)
    .filter((h) => (h.caption ?? '').toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.screen}>
      <TopAppBar title="Posting History" leftMode="back" onLeftPress={() => router.back()} />

      <View style={styles.controls}>
        <SegmentedControl
          options={[
            { label: 'All', value: 'ALL' },
            { label: 'Success', value: 'COMPLETED' },
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
        ListEmptyComponent={<EmptyState icon="history" title={loading ? 'Loading...' : 'No history matches your filters'} />}
        renderItem={({ item }) => (
          <Card style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.timeLabel}>{new Date(item.scheduledAt).toLocaleString()}</Text>
              <Badge label={item.status} variant={STATUS_BADGE_VARIANT[item.status]} />
            </View>
            <Text style={styles.caption}>{item.caption || `${item.mediaType} status`}</Text>
            {item.errorMessage && <Text style={styles.logLine}>{item.errorMessage}</Text>}
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
