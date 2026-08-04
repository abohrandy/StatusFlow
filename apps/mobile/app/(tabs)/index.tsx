import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, EmptyState, StatCard, TopAppBar } from '../../components';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { apiClient } from '../../lib/apiClient';

const STORAGE_LIMIT_MB = 5 * 1024;

interface Post {
  id: string;
  mediaType: string;
  caption: string | null;
  createdAt: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((state) => state.user);
  const [connected, setConnected] = useState(false);
  const [upcoming, setUpcoming] = useState<Post[]>([]);
  const [published, setPublished] = useState(0);
  const [storagePercent, setStoragePercent] = useState(0);
  const [recentActivity, setRecentActivity] = useState<Post[]>([]);

  const loadDashboard = useCallback(async () => {
    const [statusRes, scheduledRes, historyRes, mediaRes] = await Promise.allSettled([
      apiClient.get('/whatsapp/status'),
      apiClient.get('/posts'),
      apiClient.get('/posts/history'),
      apiClient.get('/media'),
    ]);
    if (statusRes.status === 'fulfilled') setConnected(!!statusRes.value.data.connected);
    if (scheduledRes.status === 'fulfilled') setUpcoming(scheduledRes.value.data.posts ?? []);
    if (historyRes.status === 'fulfilled') {
      const posts: Post[] = historyRes.value.data.posts ?? [];
      setPublished(posts.filter((p: any) => p.status === 'COMPLETED').length);
      setRecentActivity([...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
    }
    if (mediaRes.status === 'fulfilled') {
      const totalBytes = (mediaRes.value.data.media ?? []).reduce((sum: number, m: any) => sum + m.fileSize, 0);
      setStoragePercent(Math.min(100, Math.round((totalBytes / (1024 * 1024) / STORAGE_LIMIT_MB) * 100)));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  return (
    <View style={styles.screen}>
      <TopAppBar
        actions={[{ icon: 'notifications', accessibilityLabel: 'Notifications', onPress: () => router.push('/notifications') }]}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      >
        <View>
          <Text style={styles.greeting}>Good morning{user?.email ? `, ${user.email.split('@')[0]}` : ''}</Text>
          <Text style={styles.subtitle}>Here's what's happening with your status automation today.</Text>
        </View>

        {/* Connection status hero card */}
        <Card style={styles.heroCard} onPress={() => router.push('/pairing')}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="devices" size={22} color={Colors.primary} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroLabel}>DEVICE CONNECTION</Text>
            <Text style={styles.heroValue}>{connected ? 'Connected' : 'Not connected'}</Text>
            <Text style={styles.heroSub}>{connected ? 'Your WhatsApp account is linked' : 'Tap to pair your WhatsApp account'}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.outlineVariant} />
        </Card>

        {/* Stat row */}
        <View style={styles.statRow}>
          <StatCard label="Upcoming" value={String(upcoming.length)} icon="calendar-today" iconColor={Colors.primaryContainer} />
          <StatCard label="Published" value={String(published)} icon="check-circle" iconColor={Colors.tertiary} />
          <StatCard label="Storage" value={`${storagePercent}%`} icon="storage" iconColor={Colors.secondary} />
        </View>

        {/* Upcoming queue preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Queue</Text>
            <Text style={styles.sectionLink} onPress={() => router.push('/(tabs)/queue')}>
              View all
            </Text>
          </View>
          {upcoming.length === 0 ? (
            <EmptyState icon="calendar-today" title="No status posts scheduled" subtitle="Schedule your first status update from the Create button below." />
          ) : (
            upcoming.slice(0, 3).map((p) => (
              <Card key={p.id} padding="sm">
                <Text style={styles.activityTitle}>{p.caption || `${p.mediaType} status`}</Text>
              </Card>
            ))
          )}
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.length === 0 ? (
            <EmptyState icon="history" title="No recent activity yet" />
          ) : (
            recentActivity.map((p) => (
              <Card key={p.id} padding="sm">
                <Text style={styles.activityTitle}>{p.caption || `${p.mediaType} status`}</Text>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.marginMobile, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  greeting: {
    ...Typography.headlineLgMobile,
    color: Colors.onSurface,
  },
  subtitle: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: `${Colors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroLabel: {
    ...Typography.labelSm,
    color: Colors.outline,
  },
  heroValue: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    marginTop: 2,
  },
  heroSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  section: { gap: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
  },
  sectionLink: {
    ...Typography.labelMd,
    color: Colors.primary,
  },
  activityTitle: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
});
