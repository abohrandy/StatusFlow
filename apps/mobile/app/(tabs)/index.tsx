import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, EmptyState, StatCard, TopAppBar } from '../../components';
import { Colors, Radius, Spacing, Typography } from '../../theme';

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((state) => state.user);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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
            <Text style={styles.heroValue}>Not connected</Text>
            <Text style={styles.heroSub}>Tap to pair your WhatsApp account</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.outlineVariant} />
        </Card>

        {/* Stat row */}
        <View style={styles.statRow}>
          <StatCard label="Upcoming" value="0" icon="calendar-today" iconColor={Colors.primaryContainer} />
          <StatCard label="Published" value="0" icon="check-circle" iconColor={Colors.tertiary} />
          <StatCard label="Storage" value="0%" icon="storage" iconColor={Colors.secondary} />
        </View>

        {/* Upcoming queue preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Queue</Text>
            <Text style={styles.sectionLink} onPress={() => router.push('/(tabs)/queue')}>
              View all
            </Text>
          </View>
          <EmptyState icon="calendar-today" title="No status posts scheduled" subtitle="Schedule your first status update from the Create button below." />
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <EmptyState icon="history" title="No recent activity yet" />
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
});
