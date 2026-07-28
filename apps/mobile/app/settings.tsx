import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Alert } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

export default function MobileUserSettings() {
  const { user, logout } = useAuthStore();
  const [fullName, setFullName] = useState('Randy Aboh');
  const [timezone, setTimezone] = useState('WAT (UTC+1)');
  const [notifyDisconnect, setNotifyDisconnect] = useState(true);
  const [notifyFailure, setNotifyFailure] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSaveProfile = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMsg('Profile settings updated successfully!');
      setTimeout(() => setMsg(null), 3000);
    }, 600);
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Your account data JSON file download link has been sent to your email address.');
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure you want to permanently delete your StatusFlow account? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Account',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Manage profile, security, and notification preferences</Text>

      {msg ? <Text style={styles.successBanner}>{msg}</Text> : null}

      {/* 1. Profile Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Profile Details</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput style={[styles.input, styles.disabledInput]} value={user?.email || 'user@company.com'} editable={false} />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Timezone</Text>
          <TextInput style={styles.input} value={timezone} onChangeText={setTimezone} />
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Profile Changes'}</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Notification Preferences */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchTextGroup}>
            <Text style={styles.switchLabel}>WhatsApp Disconnection Alerts</Text>
            <Text style={styles.switchSub}>Notify when socket session drops</Text>
          </View>
          <Switch value={notifyDisconnect} onValueChange={setNotifyDisconnect} trackColor={{ false: '#27272a', true: '#25D366' }} />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchTextGroup}>
            <Text style={styles.switchLabel}>Status Failure Alerts</Text>
            <Text style={styles.switchSub}>Notify when a scheduled post fails</Text>
          </View>
          <Switch value={notifyFailure} onValueChange={setNotifyFailure} trackColor={{ false: '#27272a', true: '#25D366' }} />
        </View>
      </View>

      {/* 3. Account Actions */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account & Privacy Actions</Text>
        <TouchableOpacity style={styles.actionItem} onPress={handleExportData}>
          <Text style={styles.actionItemText}>📥 Export Account Data (JSON)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={logout}>
          <Text style={styles.actionItemText}>🚪 Sign Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteItem} onPress={handleDeleteAccount}>
          <Text style={styles.deleteItemText}>⚠️ Delete Account Permanently</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  contentContainer: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#a1a1aa', textAlign: 'center', marginBottom: 20, marginTop: 4 },
  successBanner: { color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', padding: 12, borderRadius: 12, textAlign: 'center', marginBottom: 16, fontSize: 12, fontWeight: '600' },
  sectionCard: { backgroundColor: '#18181b', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#27272a', gap: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 12, color: '#a1a1aa' },
  input: { backgroundColor: '#09090b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#ffffff', fontSize: 14, borderWidth: 1, borderColor: '#27272a' },
  disabledInput: { color: '#71717a' },
  saveBtn: { backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  saveBtnText: { color: '#09090b', fontWeight: 'bold', fontSize: 13 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  switchTextGroup: { flex: 1, paddingRight: 10 },
  switchLabel: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  switchSub: { fontSize: 11, color: '#71717a', marginTop: 2 },
  actionItem: { backgroundColor: '#09090b', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#27272a' },
  actionItemText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  deleteItem: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  deleteItemText: { color: '#f87171', fontSize: 13, fontWeight: 'bold' },
});
