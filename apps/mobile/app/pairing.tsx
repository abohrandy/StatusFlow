import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { Card, SegmentedControl, TopAppBar } from '../components';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { apiClient } from '../lib/apiClient';

type PairingMethod = 'code' | 'qr';

const CONNECTION_LOGS = [
  { event: 'Session Handshake', icon: 'devices' as const, time: 'Today, 10:42 AM' },
  { event: 'Media Catalog Sync', icon: 'sync' as const, time: 'Today, 09:15 AM' },
  { event: 'Key Rotation', icon: 'lock' as const, time: 'Yesterday, 11:59 PM' },
];

export default function PairingScreen() {
  const router = useRouter();
  const [method, setMethod] = useState<PairingMethod>('code');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient
      .get('/whatsapp/status')
      .then(({ data }) => {
        setIsConnected(data.connected);
        if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
      })
      .catch(() => {
        // No session yet, or a transient error — either way, default to "not connected".
      });
  }, []);

  const handleRequestCode = async () => {
    if (!phoneNumber) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post('/whatsapp/pairing/request', { phoneNumber });
      setSessionId(data.sessionId);
      setPairingCode(data.pairingCode);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : null;
      Alert.alert('Could not connect', message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Only the pairing-code path actually collects a phone number to check/persist — the QR
  // flow (below) never has one to give the backend, so it stays a local-only simulation.
  const handleConfirmPairingCode = async () => {
    if (!sessionId) return;
    try {
      await apiClient.post('/whatsapp/pairing/confirm', { sessionId });
      setIsConnected(true);
      setPairingCode(null);
    } catch {
      Alert.alert('Could not confirm', 'Please try again.');
    }
  };

  const handleSimulateQrScan = () => {
    setIsConnected(true);
  };

  const handleDisconnect = async () => {
    try {
      await apiClient.post('/whatsapp/disconnect');
    } finally {
      setIsConnected(false);
    }
  };

  return (
    <View style={styles.screen}>
      <TopAppBar
        title="WhatsApp Connection"
        leftMode="back"
        onLeftPress={() => router.back()}
        actions={isConnected ? [{ icon: 'verified-user', accessibilityLabel: 'Connected', onPress: () => {} }] : []}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {isConnected ? (
          <>
            <Card style={styles.heroCard}>
              <View style={styles.heroIconCircle}>
                <MaterialIcons name="verified-user" size={36} color={Colors.primary} />
              </View>
              <Text style={styles.heroTitle}>Securely Connected</Text>
              <Text style={styles.heroDescription}>
                Your WhatsApp account is actively synchronized with StatusFlow using an encrypted multi-device session.
              </Text>
              <View style={styles.heroActions}>
                <Pressable style={styles.reconnectButton}>
                  <MaterialIcons name="sync" size={16} color={Colors.onPrimary} />
                  <Text style={styles.reconnectLabel}>Reconnect</Text>
                </Pressable>
                <Pressable style={styles.disconnectButton} onPress={handleDisconnect}>
                  <MaterialIcons name="logout" size={16} color={Colors.error} />
                  <Text style={styles.disconnectLabel}>Disconnect</Text>
                </Pressable>
              </View>
            </Card>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Connection Logs</Text>
              <View style={styles.logList}>
                {CONNECTION_LOGS.map((log) => (
                  <Card key={log.event} style={styles.logRow} padding="sm">
                    <MaterialIcons name={log.icon} size={20} color={Colors.primary} />
                    <View style={styles.logText}>
                      <Text style={styles.logEvent}>{log.event}</Text>
                      <Text style={styles.logTime}>{log.time}</Text>
                    </View>
                    <View style={styles.successPill}>
                      <Text style={styles.successPillLabel}>Success</Text>
                    </View>
                  </Card>
                ))}
              </View>
            </View>

            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Device Details</Text>
              <DetailRow label="Phone Number" value="+234 812 345 6789" />
              <DetailRow label="Linked Device" value="Pixel 8" />
              <DetailRow label="Last Active" value="2 mins ago" last />
            </Card>

            <View style={[styles.section, styles.securityCard]}>
              <View style={styles.securityHeader}>
                <MaterialIcons name="security" size={22} color={Colors.onPrimaryContainer} />
                <Text style={styles.securityTitle}>Security Policy</Text>
              </View>
              <Text style={styles.securityBody}>
                Connections are powered by the Baileys multi-device protocol — your primary phone doesn't need to stay
                online, and your messages are never stored on our servers.
              </Text>
            </View>
          </>
        ) : (
          <>
            <SegmentedControl
              options={[
                { label: 'Pairing Code', value: 'code' },
                { label: 'QR Code', value: 'qr' },
              ]}
              value={method}
              onChange={(next) => {
                setMethod(next);
                setPairingCode(null);
              }}
            />

            {method === 'code' ? (
              <Card style={styles.section}>
                {!pairingCode ? (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>WHATSAPP PHONE NUMBER</Text>
                    <TextInput
                      style={styles.input}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="+2348123456789"
                      placeholderTextColor={Colors.outline}
                      keyboardType="phone-pad"
                    />
                    <Pressable style={styles.primaryButton} onPress={handleRequestCode} disabled={loading}>
                      {loading ? (
                        <ActivityIndicator color={Colors.onPrimary} />
                      ) : (
                        <Text style={styles.primaryButtonLabel}>Request Pairing Code</Text>
                      )}
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.codeContainer}>
                    <Text style={styles.instructions}>Open WhatsApp → Linked Devices → Link with Phone Number</Text>
                    <View style={styles.codeBox}>
                      <Text style={styles.codeText}>{pairingCode}</Text>
                    </View>
                    <Pressable style={styles.primaryButton} onPress={handleConfirmPairingCode}>
                      <Text style={styles.primaryButtonLabel}>I've entered the code</Text>
                    </Pressable>
                  </View>
                )}
              </Card>
            ) : (
              <Card style={styles.section}>
                <View style={styles.codeContainer}>
                  <Text style={styles.instructions}>Open WhatsApp → Linked Devices → Scan QR Code</Text>
                  <View style={styles.qrWrapper}>
                    <Image
                      source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=STATUSFLOW-MOBILE-PAIR' }}
                      style={styles.qrImage}
                    />
                  </View>
                  <Pressable style={styles.primaryButton} onPress={handleSimulateQrScan}>
                    <Text style={styles.primaryButtonLabel}>I've scanned the code</Text>
                  </Pressable>
                </View>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const DetailRow: React.FC<{ label: string; value: string; last?: boolean }> = ({ label, value, last }) => (
  <View style={[styles.detailRow, !last && styles.detailRowDivider]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.marginMobile, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  heroCard: { alignItems: 'center', gap: Spacing.sm },
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: `${Colors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
  },
  heroDescription: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  heroActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  reconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  reconnectLabel: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  disconnectLabel: {
    ...Typography.labelMd,
    color: Colors.error,
  },
  section: { gap: Spacing.sm },
  sectionTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
  },
  logList: { gap: Spacing.sm },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logText: { flex: 1 },
  logEvent: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  logTime: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  successPill: {
    backgroundColor: `${Colors.tertiary}1A`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  successPillLabel: {
    ...Typography.labelSm,
    color: Colors.tertiary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  detailRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  detailLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  detailValue: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  securityCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  securityHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  securityTitle: {
    ...Typography.headlineSm,
    color: Colors.onPrimaryContainer,
  },
  securityBody: {
    ...Typography.bodySm,
    color: Colors.onPrimaryContainer,
    opacity: 0.9,
  },
  formGroup: { gap: Spacing.sm },
  label: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  input: {
    ...Typography.bodyMd,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.onSurface,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  primaryButtonLabel: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
  },
  codeContainer: { alignItems: 'center', gap: Spacing.sm },
  instructions: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  codeBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  codeText: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 4,
  },
  qrWrapper: {
    backgroundColor: '#ffffff',
    padding: Spacing.md,
    borderRadius: Radius.xl,
  },
  qrImage: { width: 160, height: 160 },
});
