import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MobileDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>StatusFlow Mobile</Text>
      <Text style={styles.subtitle}>Scheduled WhatsApp Status Dashboard</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>WhatsApp Connection</Text>
        <Text style={styles.status}>Single Device Socket Ready</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upcoming Queue</Text>
        <Text style={styles.queueCount}>0 Statuses Scheduled</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#25D366',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cardTitle: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 6,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  queueCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
