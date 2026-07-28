import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';

export interface HistoryItem {
  id: string;
  caption: string;
  status: 'SUCCESS' | 'FAILED' | 'SCHEDULED' | 'PROCESSING' | 'CANCELLED';
  time: string;
  logs: string;
}

export default function MobilePostingHistory() {
  const [filter, setFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [search, setSearch] = useState('');

  const historyItems: HistoryItem[] = [
    { id: 'h1', caption: 'Flash Sale Alert! 30% Off Storewide Today Only 🔥', status: 'SUCCESS', time: 'Today at 02:30 PM', logs: 'Delivered to 142 contacts' },
    { id: 'h2', caption: 'New Product Line Unboxing & Demonstration 🎥', status: 'SCHEDULED', time: 'Tomorrow at 09:00 AM', logs: 'Queued in BullMQ queue' },
    { id: 'h3', caption: 'System Maintenance Notice', status: 'CANCELLED', time: 'Jul 20 at 10:00 AM', logs: 'Cancelled by user' },
  ];

  const filtered = historyItems
    .filter((h) => filter === 'ALL' || h.status === filter)
    .filter((h) => h.caption.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Posting History</Text>
      <Text style={styles.subtitle}>Execution logs & historical status broadcasts</Text>

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {(['ALL', 'SUCCESS', 'FAILED'] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.tab, filter === f && styles.activeTab]} onPress={() => setFilter(f)}>
            <Text style={[styles.tabText, filter === f && styles.activeTabText]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search posting history..."
        placeholderTextColor="#71717a"
      />

      {/* Optimized FlatList */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.timeText}>{item.time}</Text>
              <View style={[styles.badge, item.status === 'SUCCESS' ? styles.badgeSuccess : styles.badgeDefault]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.captionText}>{item.caption}</Text>
            <Text style={styles.logText}>Log: {item.logs}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#a1a1aa', textAlign: 'center', marginBottom: 20, marginTop: 4 },
  tabRow: { flexDirection: 'row', backgroundColor: '#18181b', borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#25D366' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#a1a1aa' },
  activeTabText: { color: '#09090b' },
  searchInput: { backgroundColor: '#18181b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#ffffff', fontSize: 14, borderWidth: 1, borderColor: '#27272a', marginBottom: 16 },
  listContainer: { paddingBottom: 40, gap: 12 },
  card: { backgroundColor: '#18181b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#27272a' },
  cardHeader: { flexDirection: 'row', justifyBetween: 'space-between', alignItems: 'center', marginBottom: 8 },
  timeText: { fontSize: 11, color: '#71717a' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeSuccess: { backgroundColor: 'rgba(37, 211, 102, 0.1)' },
  badgeDefault: { backgroundColor: '#27272a' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#25D366' },
  captionText: { fontSize: 13, fontWeight: '600', color: '#ffffff', marginBottom: 6 },
  logText: { fontSize: 11, fontFamily: 'monospace', color: '#a1a1aa' },
});
