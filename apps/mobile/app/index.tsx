import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

export default function MobileDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((state) => state.user);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#25D366" colors={['#25D366']} />
      }
    >
      {/* Top Banner / User Welcome */}
      <View style={styles.welcomeBanner}>
        <View>
          <Text style={styles.welcomeTitle}>StatusFlow Mobile</Text>
          <Text style={styles.userEmail}>{user?.email || 'User Account'}</Text>
        </View>
        <TouchableOpacity style={styles.newPostButton}>
          <Text style={styles.newPostButtonText}>+ New Status</Text>
        </TouchableOpacity>
      </View>

      {/* Grid: Status Cards */}
      <View style={styles.grid}>
        {/* 1. WhatsApp Connection */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>WhatsApp Connection</Text>
            <View style={styles.badgeInactive}>
              <Text style={styles.badgeInactiveText}>Disconnected</Text>
            </View>
          </View>
          <Text style={styles.cardMainText}>Single Device Session</Text>
          <Text style={styles.cardSubText}>Connect in WhatsApp Pairing</Text>
        </View>

        {/* 2. Upcoming Queue */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Upcoming Queue</Text>
          <Text style={styles.cardBigNumber}>0</Text>
          <Text style={styles.cardSubText}>No statuses scheduled</Text>
        </View>

        {/* 3. Storage Usage */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Media Storage</Text>
            <Text style={styles.cardSubText}>0% Used</Text>
          </View>
          <Text style={styles.cardMainText}>0.0 MB / 5.0 GB</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '0%' }]} />
          </View>
        </View>

        {/* 4. Subscription Plan */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Subscription Plan</Text>
            <Text style={styles.planBadgeText}>Free Tier</Text>
          </View>
          <Text style={styles.cardMainText}>₦0.00 / wk</Text>
          <Text style={styles.cardSubText}>1 scheduled status every 7 days</Text>
        </View>
      </View>

      {/* Upcoming Schedules Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Upcoming Status Posts</Text>

        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>📅</Text>
          </View>
          <Text style={styles.emptyTitle}>No status posts scheduled</Text>
          <Text style={styles.emptyDesc}>Schedule your first status update image, video, or text announcement.</Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyActivityBox}>
          <Text style={styles.emptyActivityText}>No recent activity recorded yet.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeBanner: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userEmail: {
    fontSize: 12,
    color: '#25D366',
    marginTop: 2,
    fontWeight: '500',
  },
  newPostButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  newPostButtonText: {
    color: '#09090b',
    fontWeight: 'bold',
    fontSize: 12,
  },
  grid: {
    gap: 16,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  badgeInactive: {
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeInactiveText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '600',
  },
  planBadgeText: {
    color: '#25D366',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardMainText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 4,
  },
  cardBigNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 4,
  },
  cardSubText: {
    fontSize: 11,
    color: '#71717a',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#27272a',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#25D366',
  },
  sectionCard: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#27272a',
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyIcon: {
    fontSize: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyActivityBox: {
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  emptyActivityText: {
    fontSize: 12,
    color: '#71717a',
  },
});
