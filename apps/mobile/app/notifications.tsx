import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, EmptyState, TopAppBar } from '../components';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { apiClient } from '../lib/apiClient';

export interface MobileNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

function formatTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${Math.round(hours / 24)} day${Math.round(hours / 24) === 1 ? '' : 's'} ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);

  const load = useCallback(() => {
    return apiClient
      .get('/notifications')
      .then(({ data }) => setNotifications(data.notifications ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await apiClient.post('/notifications/read-all');
    } catch {
      load(); // fall back to server truth if the call failed
    }
  };

  const handleToggleRead = async (item: MobileNotification) => {
    if (item.is_read) return; // no "mark unread" endpoint exists — this only ever marks read
    setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
    try {
      await apiClient.post(`/notifications/${encodeURIComponent(item.id)}/read`);
    } catch {
      load();
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <View style={styles.screen}>
      <TopAppBar
        title="Notifications"
        leftMode="back"
        onLeftPress={() => router.back()}
        actions={
          unreadCount > 0
            ? [{ icon: 'done-all', accessibilityLabel: 'Mark all read', onPress: handleMarkAllRead }]
            : []
        }
      />

      <Text style={styles.subtitle}>{unreadCount} unread {unreadCount === 1 ? 'alert' : 'alerts'}</Text>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState icon="notifications-none" title="No notifications yet" />}
        renderItem={({ item }) => (
          <Pressable onPress={() => handleToggleRead(item)}>
            <Card style={!item.is_read ? styles.unreadItem : styles.item}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {!item.is_read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.itemMessage}>{item.message}</Text>
              <Text style={styles.itemTime}>{formatTime(item.created_at)}</Text>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  subtitle: {
    ...Typography.labelMd,
    color: Colors.primary,
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: Spacing.sm,
  },
  listContainer: { padding: Spacing.marginMobile, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  item: { gap: 4 },
  unreadItem: {
    gap: 4,
    borderColor: `${Colors.tertiary}4D`,
    backgroundColor: `${Colors.tertiary}0D`,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.tertiary,
  },
  itemMessage: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  itemTime: {
    ...Typography.labelSm,
    color: Colors.outline,
  },
});
