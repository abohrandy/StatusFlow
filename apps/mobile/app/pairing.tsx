import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView } from 'react-native';

export default function MobileWhatsAppPairing() {
  const [method, setMethod] = useState<'PAIRING_CODE' | 'QR_CODE'>('PAIRING_CODE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pollingActive && !isConnected) {
      interval = setInterval(() => {
        // Polling simulation checking connection status
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [pollingActive, isConnected]);

  const handleRequestCode = () => {
    if (!phoneNumber) return;
    setLoading(true);
    setTimeout(() => {
      setPairingCode('87B9-4K21');
      setLoading(false);
      setPollingActive(true);
    }, 600);
  };

  const handleSimulatePair = () => {
    setIsConnected(true);
    setPairingCode(null);
    setPollingActive(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>WhatsApp Account</Text>
      <Text style={styles.subtitle}>Connect your single WhatsApp account using Baileys pairing protocol</Text>

      {/* Main Card */}
      <View style={styles.card}>
        {/* Connection State Badge */}
        <View style={styles.statusBox}>
          <View style={styles.statusLeft}>
            <View style={[styles.dot, { backgroundColor: isConnected ? '#25D366' : '#f59e0b' }]} />
            <View>
              <Text style={styles.statusLabel}>Connection Status</Text>
              <Text style={styles.statusValue}>{isConnected ? 'CONNECTED' : 'WAITING FOR PAIRING'}</Text>
            </View>
          </View>
          {isConnected && (
            <TouchableOpacity style={styles.disconnectBtn} onPress={() => setIsConnected(false)}>
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isConnected && (
          <>
            {/* Method Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, method === 'PAIRING_CODE' && styles.activeTab]}
                onPress={() => { setMethod('PAIRING_CODE'); setPairingCode(null); }}
              >
                <Text style={[styles.tabText, method === 'PAIRING_CODE' && styles.activeTabText]}>1. Phone Pairing Code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, method === 'QR_CODE' && styles.activeTab]}
                onPress={() => { setMethod('QR_CODE'); setPairingCode(null); }}
              >
                <Text style={[styles.tabText, method === 'QR_CODE' && styles.activeTabText]}>2. QR Code Fallback</Text>
              </TouchableOpacity>
            </View>

            {/* Method 1: Pairing Code */}
            {method === 'PAIRING_CODE' && (
              <View style={styles.methodContent}>
                {!pairingCode ? (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>WhatsApp Phone Number (with Country Code)</Text>
                    <TextInput
                      style={styles.input}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="+2348123456789"
                      placeholderTextColor="#71717a"
                      keyboardType="phone-pad"
                    />
                    <TouchableOpacity style={styles.actionBtn} onPress={handleRequestCode} disabled={loading}>
                      {loading ? <ActivityIndicator color="#09090b" /> : <Text style={styles.actionBtnText}>Request 8-Digit Pairing Code</Text>}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.codeContainer}>
                    <Text style={styles.instructions}>Open WhatsApp → Linked Devices → Link with Phone Number</Text>
                    <View style={styles.codeBox}>
                      <Text style={styles.codeText}>{pairingCode}</Text>
                    </View>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleSimulatePair}>
                      <Text style={styles.actionBtnText}>Simulate Pairing Complete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Method 2: QR Code */}
            {method === 'QR_CODE' && (
              <View style={styles.codeContainer}>
                <Text style={styles.instructions}>Open WhatsApp → Linked Devices → Scan QR Code</Text>
                <View style={styles.qrWrapper}>
                  <Image
                    source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=STATUSFLOW-MOBILE-PAIR' }}
                    style={styles.qrImage}
                  />
                </View>
                <TouchableOpacity style={styles.actionBtn} onPress={handleSimulatePair}>
                  <Text style={styles.actionBtnText}>Simulate QR Scan Complete</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Live Logs */}
        <View style={styles.logsBox}>
          <Text style={styles.logsTitle}>Live Socket Event Logs</Text>
          <Text style={styles.logLine}>[INFO]: Baileys mobile socket ready.</Text>
          {isConnected && <Text style={styles.logLineSuccess}>[SUCCESS]: Socket state connected.</Text>}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  contentContainer: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#a1a1aa', textAlign: 'center', marginBottom: 20, marginTop: 4 },
  card: { backgroundColor: '#18181b', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#27272a' },
  statusBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#09090b', padding: 14, borderRadius: 14, marginBottom: 16 },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 11, color: '#71717a' },
  statusValue: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },
  disconnectBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  disconnectText: { color: '#f87171', fontSize: 11, fontWeight: '600' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#09090b', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#25D366' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#a1a1aa' },
  activeTabText: { color: '#09090b' },
  methodContent: { marginBottom: 16 },
  formGroup: { gap: 8 },
  label: { fontSize: 12, color: '#a1a1aa' },
  input: { backgroundColor: '#09090b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#ffffff', fontSize: 14, borderWidth: 1, borderColor: '#27272a' },
  actionBtn: { backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  actionBtnText: { color: '#09090b', fontWeight: 'bold', fontSize: 13 },
  codeContainer: { alignItems: 'center', gap: 12, marginVertical: 8 },
  instructions: { fontSize: 12, color: '#a1a1aa', textAlign: 'center' },
  codeBox: { backgroundColor: '#09090b', borderWidth: 1, borderColor: 'rgba(37, 211, 102, 0.3)', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 16, marginVertical: 8 },
  codeText: { fontSize: 28, fontWeight: 'bold', color: '#25D366', letterSpacing: 4 },
  qrWrapper: { backgroundColor: '#ffffff', padding: 12, borderRadius: 16, marginVertical: 8 },
  qrImage: { width: 160, height: 160 },
  logsBox: { backgroundColor: '#09090b', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#27272a', marginTop: 8 },
  logsTitle: { fontSize: 11, fontWeight: '600', color: '#a1a1aa', marginBottom: 6 },
  logLine: { fontSize: 11, fontFamily: 'monospace', color: '#71717a' },
  logLineSuccess: { fontSize: 11, fontFamily: 'monospace', color: '#25D366', marginTop: 2 },
});
