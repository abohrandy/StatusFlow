import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { Card, SegmentedControl, TopAppBar } from '../components';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { apiClient } from '../lib/apiClient';

// WhatsApp's own server-side pairing code expiry is short — every second between the code
// appearing and it being typed into WhatsApp counts. There's no documented deep link straight
// to "Settings > Linked Devices > Link with Phone Number", so this just brings WhatsApp to the
// foreground (skipping any home-screen hunting) rather than the exact screen.
const WHATSAPP_URL = 'whatsapp://';
const openWhatsApp = () => {
  Linking.openURL(WHATSAPP_URL).catch(() => {
    Alert.alert('WhatsApp not found', 'Make sure WhatsApp is installed on this phone.');
  });
};

type PairingMethod = 'code' | 'qr';

function formatLastActive(iso: string | null): string {
  if (!iso) return 'Unknown';
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function PairingScreen() {
  const router = useRouter();
  const [method, setMethod] = useState<PairingMethod>('code');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastActive, setLastActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    apiClient
      .get('/whatsapp/status')
      .then(({ data }) => {
        setIsConnected(data.connected);
        if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
        if (data.sessionId) setSessionId(data.sessionId);
        setLastActive(data.lastActive);
      })
      .catch(() => {
        // No session yet, or a transient error — either way, default to "not connected".
      });
  }, []);

  // WhatsApp's mandatory post-pairing restart means the socket doesn't reach 'open' the
  // instant the code/QR is accepted on the phone — it can take several seconds. Poll
  // instead of relying on a single manually-tapped confirm (which was missing this
  // window almost every time) so pairing completes on its own once the phone is done.
  useEffect(() => {
    if (!sessionId || isConnected) return;
    const timer = setInterval(() => {
      apiClient
        .get('/whatsapp/status')
        .then(({ data }) => {
          if (data.connected) {
            setIsConnected(true);
            setPairingCode(null);
            setQrCode(null);
            setLastActive(data.lastActive);
            return;
          }
          apiClient.post('/whatsapp/pairing/confirm', { sessionId }).then(() => {
            setIsConnected(true);
            setPairingCode(null);
            setQrCode(null);
          }).catch(() => {
            // Not confirmed yet — keep polling.
          });
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(timer);
  }, [sessionId, isConnected]);

  const handleRequestCode = async () => {
    if (!phoneNumber) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post('/whatsapp/pairing/request', { phoneNumber, method: 'PAIRING_CODE' });
      setSessionId(data.sessionId);
      setPairingCode(data.pairingCode);
      // Copied immediately, not on a tap — every second matters against WhatsApp's own
      // short-lived code expiry, and a long-press-to-paste is faster and less error-prone
      // than reading and typing 8 characters under time pressure.
      Clipboard.setStringAsync(data.pairingCode).catch(() => {});
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : null;
      Alert.alert('Could not connect', message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestQr = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/whatsapp/pairing/request', { phoneNumber, method: 'QR_CODE' });
      setSessionId(data.sessionId);
      setQrCode(data.qrCode);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : null;
      Alert.alert('Could not connect', message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await apiClient.post('/whatsapp/disconnect');
    } finally {
      setIsConnected(false);
    }
  };

  // A stuck PAIRING session (e.g. from an abandoned pairing attempt) still counts against
  // the plan's connected-account limit even though nothing ever actually connected — and
  // there's no "Disconnect" button to clear it from this screen's not-yet-connected state.
  // /whatsapp/disconnect clears every PAIRING/CONNECTED session row for the account
  // regardless of which one is "latest", so it's safe to call here too.
  const [resetting, setResetting] = useState(false);
  const handleResetStuckSession = async () => {
    setResetting(true);
    try {
      await apiClient.post('/whatsapp/disconnect');
      setSessionId(null);
      setPairingCode(null);
      setQrCode(null);
      Alert.alert('Reset', 'Any stuck connection attempts have been cleared. Try pairing again.');
    } catch {
      Alert.alert('Could not reset', 'Please try again.');
    } finally {
      setResetting(false);
    }
  };

  // Re-verifies the existing session's WhatsApp socket rather than re-pairing from
  // scratch — /pairing/confirm rebuilds the connection from the session's persisted
  // Redis auth state, so this recovers a connection that dropped without invalidating
  // the pairing (e.g. a transient network blip) instead of forcing the user to link
  // their phone again.
  const handleReconnect = async () => {
    if (!sessionId) return;
    setReconnecting(true);
    try {
      await apiClient.post('/whatsapp/pairing/confirm', { sessionId });
      Alert.alert('Reconnected', 'Your WhatsApp connection is active.');
    } catch {
      Alert.alert('Reconnect failed', 'Could not verify the WhatsApp connection. Try disconnecting and pairing again.');
    } finally {
      setReconnecting(false);
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
                <Pressable style={styles.reconnectButton} onPress={handleReconnect} disabled={reconnecting}>
                  {reconnecting ? (
                    <ActivityIndicator color={Colors.onPrimary} size="small" />
                  ) : (
                    <MaterialIcons name="sync" size={16} color={Colors.onPrimary} />
                  )}
                  <Text style={styles.reconnectLabel}>Reconnect</Text>
                </Pressable>
                <Pressable style={styles.disconnectButton} onPress={handleDisconnect}>
                  <MaterialIcons name="logout" size={16} color={Colors.error} />
                  <Text style={styles.disconnectLabel}>Disconnect</Text>
                </Pressable>
              </View>
            </Card>

            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Device Details</Text>
              <DetailRow label="Phone Number" value={phoneNumber || 'Unknown'} />
              <DetailRow label="Last Active" value={formatLastActive(lastActive)} last />
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
                setQrCode(null);
              }}
            />

            {method === 'code' ? (
              <Card style={styles.section}>
                {!pairingCode ? (
                  <View style={styles.formGroup}>
                    <View style={styles.primeBox}>
                      <Text style={styles.primeTitle}>Before you request a code</Text>
                      <Text style={styles.primeBody}>
                        WhatsApp's code expires quickly. Open WhatsApp now and navigate to Settings → Linked Devices → Link a
                        Device → Link with Phone Number instead, so you're ready to type it the instant it appears.
                      </Text>
                      <Pressable style={styles.openWhatsAppButton} onPress={openWhatsApp}>
                        <MaterialIcons name="open-in-new" size={16} color={Colors.primary} />
                        <Text style={styles.openWhatsAppLabel}>Open WhatsApp now</Text>
                      </Pressable>
                    </View>
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
                    <Text style={styles.copiedLabel}>Copied to clipboard — paste it into WhatsApp</Text>
                    <Pressable style={styles.openWhatsAppButton} onPress={openWhatsApp}>
                      <MaterialIcons name="open-in-new" size={16} color={Colors.primary} />
                      <Text style={styles.openWhatsAppLabel}>Open WhatsApp</Text>
                    </Pressable>
                    <View style={styles.waitingRow}>
                      <ActivityIndicator color={Colors.primary} />
                      <Text style={styles.waitingLabel}>Waiting for WhatsApp to confirm the pairing...</Text>
                    </View>
                  </View>
                )}
              </Card>
            ) : (
              <Card style={styles.section}>
                <View style={styles.codeContainer}>
                  <Text style={styles.instructions}>Open WhatsApp → Linked Devices → Scan QR Code</Text>
                  {!qrCode ? (
                    <Pressable style={styles.primaryButton} onPress={handleRequestQr} disabled={loading}>
                      {loading ? (
                        <ActivityIndicator color={Colors.onPrimary} />
                      ) : (
                        <Text style={styles.primaryButtonLabel}>Generate QR Code</Text>
                      )}
                    </Pressable>
                  ) : (
                    <>
                      <View style={styles.qrWrapper}>
                        <Image
                          source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCode)}` }}
                          style={styles.qrImage}
                        />
                      </View>
                      <View style={styles.waitingRow}>
                        <ActivityIndicator color={Colors.primary} />
                        <Text style={styles.waitingLabel}>Waiting for WhatsApp to confirm the pairing...</Text>
                      </View>
                    </>
                  )}
                </View>
              </Card>
            )}

            <Pressable onPress={handleResetStuckSession} disabled={resetting} style={styles.resetLinkRow}>
              {resetting ? (
                <ActivityIndicator color={Colors.error} size="small" />
              ) : (
                <Text style={styles.resetLink}>
                  Getting a "connected account limit" error even though nothing's connected? Reset a stuck connection.
                </Text>
              )}
            </Pressable>
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
  primeBox: {
    backgroundColor: `${Colors.primary}0D`,
    borderWidth: 1,
    borderColor: `${Colors.primary}33`,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  primeTitle: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  primeBody: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  openWhatsAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  openWhatsAppLabel: {
    ...Typography.labelMd,
    color: Colors.primary,
  },
  copiedLabel: {
    ...Typography.bodySm,
    color: Colors.primary,
  },
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
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  waitingLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
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
  resetLinkRow: { alignItems: 'center', marginTop: Spacing.sm },
  resetLink: {
    ...Typography.bodySm,
    color: Colors.error,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
