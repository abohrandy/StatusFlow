import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, EmptyState, TopAppBar } from '../components';
import { Colors, Radius, Spacing, Typography } from '../theme';

interface DayEvent {
  title: string;
  time: string;
  status: 'success' | 'primary';
}

// Sample events keyed by day-of-month, for demonstration — a real backend would supply these.
const SAMPLE_EVENTS: Record<number, DayEvent[]> = {
  1: [{ title: 'Project Launch Announcement', time: '9:00 AM', status: 'primary' }],
  12: [
    { title: 'Product Showcase: Minimalist Collection', time: '9:00 AM', status: 'success' },
    { title: 'Webinar Reminder: Workflow Mastery', time: '9:00 PM', status: 'primary' },
  ],
};

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

  const grid = useMemo(() => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const isCurrentMonth = cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();
  const dayEvents = isCurrentMonth ? SAMPLE_EVENTS[selectedDay] : undefined;

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
              const hasEvents = isCurrentMonth && !!SAMPLE_EVENTS[day];
              const isSelected = isCurrentMonth && day === selectedDay;
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
              {isCurrentMonth ? `${MONTH_NAMES[cursor.getMonth()]} ${selectedDay}` : 'Select a day'}
            </Text>
            <Pressable onPress={() => router.push('/composer')}>
              <Text style={styles.scheduleLink}>+ Schedule</Text>
            </Pressable>
          </View>

          {dayEvents && dayEvents.length > 0 ? (
            <View style={styles.eventList}>
              {dayEvents.map((event) => (
                <Card key={event.title} style={styles.eventCard}>
                  <Text style={styles.eventTime}>{event.time}</Text>
                  <Text style={styles.eventTitle}>{event.title}</Text>
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
