import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';

export default function MobileCalendarView() {
  const [viewMode, setViewMode] = useState<'MONTHLY' | 'WEEKLY' | 'DAILY'>('MONTHLY');
  const [searchQuery, setSearchQuery] = useState('');

  const events = [
    { id: 'ev_1', title: 'Flash Sale Alert! 30% Off Storewide 🔥', date: 'Jul 28', time: '02:30 PM', status: 'QUEUED', color: '#25D366' },
    { id: 'ev_2', title: 'New Product Unboxing 🎥', date: 'Jul 29', time: '09:00 AM', status: 'SCHEDULED', color: '#3b82f6' },
  ];

  const filteredEvents = events.filter((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History & Calendar</Text>
      <Text style={styles.subtitle}>Calendar schedule & execution history log</Text>

      {/* View Mode Selector Tabs */}
      <View style={styles.tabContainer}>
        {(['MONTHLY', 'WEEKLY', 'DAILY'] as const).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.tab, viewMode === mode && styles.activeTab]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.tabText, viewMode === mode && styles.activeTabText]}>{mode}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Filter calendar events..."
          placeholderTextColor="#71717a"
        />
      </View>

      {/* Calendar View Container */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.calendarCard}>
          <Text style={styles.calendarMonthTitle}>July 2026</Text>
          
          {/* Days Grid Simulation */}
          <View style={styles.daysGrid}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <Text key={i} style={styles.dayHeader}>{day}</Text>
            ))}
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <View key={day} style={[styles.dayCell, day === 28 && styles.activeDayCell]}>
                <Text style={[styles.dayCellText, day === 28 && styles.activeDayCellText]}>{day}</Text>
                {day === 28 && <View style={styles.eventDot} />}
              </View>
            ))}
          </View>
        </View>

        {/* Daily Agenda List */}
        <View style={styles.agendaCard}>
          <Text style={styles.agendaTitle}>Agenda & Execution Logs</Text>

          <View style={styles.eventList}>
            {filteredEvents.map((item) => (
              <View key={item.id} style={styles.eventRow}>
                <View style={[styles.statusColorBar, { backgroundColor: item.color }]} />
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.eventMeta}>{item.date} at {item.time} • <Text style={{ color: item.color }}>{item.status}</Text></Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#a1a1aa', textAlign: 'center', marginBottom: 20, marginTop: 4 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#18181b', borderRadius: 14, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#25D366' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#a1a1aa' },
  activeTabText: { color: '#09090b' },
  searchBox: { marginBottom: 16 },
  searchInput: { backgroundColor: '#18181b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#ffffff', fontSize: 14, borderWidth: 1, borderColor: '#27272a' },
  scrollContainer: { paddingBottom: 40 },
  calendarCard: { backgroundColor: '#18181b', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#27272a' },
  calendarMonthTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 16, textAlign: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  dayHeader: { width: '14.28%', textAlign: 'center', color: '#71717a', fontSize: 12, fontWeight: '600', marginBottom: 12 },
  dayCell: { width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, marginBottom: 4 },
  activeDayCell: { backgroundColor: '#25D366' },
  dayCellText: { color: '#a1a1aa', fontSize: 12 },
  activeDayCellText: { color: '#09090b', fontWeight: 'bold' },
  eventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#09090b', marginTop: 2 },
  agendaCard: { backgroundColor: '#18181b', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#27272a' },
  agendaTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 },
  eventList: { gap: 12 },
  eventRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#09090b', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#27272a' },
  statusColorBar: { width: 4, height: 36, borderRadius: 2, marginRight: 12 },
  eventDetails: { flex: 1 },
  eventTitle: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  eventMeta: { fontSize: 11, color: '#71717a', marginTop: 2 },
});
