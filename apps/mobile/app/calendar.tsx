import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, EmptyState, TopAppBar } from '../components';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { apiClient } from '../lib/apiClient';

interface Post {
  id: string;
  mediaType: string;
  caption: string | null;
  scheduledAt: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  return cells;
}

export default function CalendarScreen() {
  const router = useRouter();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    Promise.allSettled([apiClient.get('/posts'), apiClient.get('/posts/history')]).then(([scheduled, history]) => {
      const scheduledPosts = scheduled.status === 'fulfilled' ? scheduled.value.data.posts ?? [] : [];
      const historyPosts = history.status === 'fulfilled' ? history.value.data.posts ?? [] : [];
      setPosts([...scheduledPosts, ...historyPosts]);
    });
  }, []);

  const grid = useMemo(() => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const eventsByDay = useMemo(() => {
    const map: Record<number, Post[]> = {};
    for (const post of posts) {
      const d = new Date(post.scheduledAt);
      if (d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth()) {
        (map[d.getDate()] ??= []).push(post);
      }
    }
    return map;
  }, [posts, cursor]);
  const dayEvents = eventsByDay[selectedDay];

  const changeMonth = (delta: number) => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    setSelectedDay(1);
  };

  return (
    <View style={styles.screen}>
      <TopAppBar title="Schedule" leftMode="back" onLeftPress={() => router.back()} />

      <View style={styles.monthNav}>
        <Pressable onPress={() => changeMonth(-1)} hitSlop={8} style={styles.navButton}>
          <Text style={styles.navArrow}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
        </Text>
        <Pressable onPress={() => changeMonth(1)} hitSlop={8} style={styles.navButton}>
          <Text style={styles.navArrow}>›</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card padding="sm">
          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={styles.weekdayLabel}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {grid.map((day, index) => {
              if (day === null) return <View key={`blank-${index}`} style={styles.dayCell} />;
              const hasEvents = !!eventsByDay[day]?.length;
              const isSelected = day === selectedDay;
              return (
                <Pressable key={day} style={styles.dayCell} onPress={() => setSelectedDay(day)}>
                  <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
                    <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>{day}</Text>
                  </View>
                  {hasEvents && !isSelected && <View style={styles.eventDot} />}
                </Pressable>
              );
            })}
          </View>
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {MONTH_NAMES[cursor.getMonth()]} {selectedDay}
            </Text>
            <Pressable onPress={() => router.push('/composer')}>
              <Text style={styles.scheduleLink}>+ Schedule</Text>
            </Pressable>
          </View>

          {dayEvents && dayEvents.length > 0 ? (
            <View style={styles.eventList}>
              {dayEvents.map((post) => (
                <Card key={post.id} style={styles.eventCard}>
                  <Text style={styles.eventTime}>{new Date(post.scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
                  <Text style={styles.eventTitle}>{post.caption || `${post.mediaType} status`}</Text>
                </Card>
              ))}
            </View>
          ) : (
            <EmptyState icon="event-available" title="No status scheduled" subtitle="Tap Schedule to add one for this day." />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const CELL_SIZE = '14.28%';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  navButton: { padding: Spacing.xs },
  navArrow: {
    fontSize: 24,
    color: Colors.onSurface,
  },
  monthLabel: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    minWidth: 160,
    textAlign: 'center',
  },
  content: { padding: Spacing.marginMobile, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  weekdayRow: { flexDirection: 'row' },
  weekdayLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    ...Typography.labelSm,
    color: Colors.outline,
    marginBottom: Spacing.sm,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: CELL_SIZE,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: { backgroundColor: Colors.primary },
  dayLabel: {
    ...Typography.bodySm,
    color: Colors.onSurface,
  },
  dayLabelSelected: { color: Colors.onPrimary, fontFamily: 'Inter_600SemiBold' },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.tertiary,
    marginTop: 2,
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
  scheduleLink: {
    ...Typography.labelMd,
    color: Colors.primary,
  },
  eventList: { gap: Spacing.sm },
  eventCard: { gap: 4 },
  eventTime: {
    ...Typography.labelSm,
    color: Colors.primary,
  },
  eventTitle: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
});
