import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';

export interface MobileNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

export default function MobileNotifications() {
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
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notification Center</Text>
          <Text style={styles.subtitle}>{unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}</Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications FlatList */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#25D366" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.isRead && styles.unreadCard]}
            onPress={() => handleToggleRead(item.id)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.messageText}>{item.message}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#25D366', marginTop: 2, fontWeight: '500' },
  markReadBtn: { backgroundColor: '#18181b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#27272a' },
  markReadText: { color: '#a1a1aa', fontSize: 11, fontWeight: '600' },
  listContainer: { paddingBottom: 40, gap: 12 },
  card: { backgroundColor: '#18181b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#27272a' },
  unreadCard: { borderColor: 'rgba(37, 211, 102, 0.3)', backgroundColor: '#121215' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#25D366' },
  messageText: { fontSize: 12, color: '#a1a1aa', lineHeight: 18, marginBottom: 8 },
  timeText: { fontSize: 10, color: '#71717a' },
});
