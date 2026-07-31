import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, EmptyState, TopAppBar } from '../components';
import { Colors, Radius, Spacing, Typography } from '../theme';

export interface MobileNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<MobileNotification[]>([
    { id: 'n1', title: 'Status Broadcast Delivered', message: 'Image status delivered successfully to 142 contacts.', time: '10 mins ago', isRead: false },
    { id: 'n2', title: 'WhatsApp Socket Connected', message: 'Single WhatsApp device session handshake established.', time: '1 hour ago', isRead: true },
    { id: 'n3', title: 'Weekly Plan Active', message: 'Paystack ₦2,000 subscription renewal confirmed.', time: '2 days ago', isRead: true },
  ]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
          <Pressable onPress={() => handleToggleRead(item.id)}>
            <Card style={!item.isRead ? styles.unreadItem : styles.item}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.itemMessage}>{item.message}</Text>
              <Text style={styles.itemTime}>{item.time}</Text>
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
