import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { Avatar, Card, TopAppBar } from '../../components';
import { Colors, Radius, Spacing, Typography } from '../../theme';

interface SettingsRowProps {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  sublabel?: string;
  onPress: () => void;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ icon, label, sublabel, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
    <View style={styles.rowIcon}>
      <MaterialIcons name={icon} size={20} color={Colors.primary} />
    </View>
    <View style={styles.rowText}>
      <Text style={styles.rowLabel}>{label}</Text>
      {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
    </View>
    <MaterialIcons name="chevron-right" size={22} color={Colors.outline} />
  </Pressable>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [fullName, setFullName] = useState('Randy Aboh');
  const [timezone, setTimezone] = useState('WAT (UTC+1)');
  const [notifyDisconnect, setNotifyDisconnect] = useState(true);
  const [notifyFailure, setNotifyFailure] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSaveProfile = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    }, 600);
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Your account data JSON file download link has been sent to your email address.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your StatusFlow account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: () => logout() },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <TopAppBar title="Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        {message && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{message}</Text>
          </View>
        )}

        {/* Profile */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.profileRow}>
            <Avatar fallbackLabel={fullName} size={56} />
            <View style={styles.profileFields}>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full name" />
              <TextInput style={[styles.input, styles.inputDisabled]} value={user?.email || 'user@company.com'} editable={false} />
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>TIMEZONE</Text>
            <TextInput style={styles.input} value={timezone} onChangeText={setTimezone} />
          </View>
          <Pressable style={styles.saveButton} onPress={handleSaveProfile} disabled={saving}>
            <Text style={styles.saveButtonLabel}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </Pressable>
        </Card>

        {/* App navigation rows */}
        <Card padding="none" style={styles.section}>
          <SettingsRow icon="devices" label="WhatsApp Connection" sublabel="Manage your linked device" onPress={() => router.push('/pairing')} />
          <View style={styles.divider} />
          <SettingsRow icon="credit-card" label="Billing & Subscription" sublabel="Plan, payments, invoices" onPress={() => router.push('/billing')} />
          <View style={styles.divider} />
          <SettingsRow icon="history" label="Posting History" sublabel="Past scheduled statuses" onPress={() => router.push('/history')} />
          <View style={styles.divider} />
          <SettingsRow icon="notifications" label="Notifications" sublabel="Alerts and updates" onPress={() => router.push('/notifications')} />
        </Card>

        {/* Notification preferences */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchLabel}>Disconnection alerts</Text>
              <Text style={styles.switchSublabel}>Notify when the WhatsApp session drops</Text>
            </View>
            <Switch
              value={notifyDisconnect}
              onValueChange={setNotifyDisconnect}
              trackColor={{ false: Colors.surfaceContainerHigh, true: Colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchLabel}>Status failure alerts</Text>
              <Text style={styles.switchSublabel}>Notify when a scheduled post fails</Text>
            </View>
            <Switch
              value={notifyFailure}
              onValueChange={setNotifyFailure}
              trackColor={{ false: Colors.surfaceContainerHigh, true: Colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </Card>

        {/* Danger zone */}
        <Card style={[styles.section, styles.dangerCard]}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Account</Text>
          <Pressable style={styles.actionItem} onPress={handleExportData}>
            <MaterialIcons name="download" size={18} color={Colors.onSurface} />
            <Text style={styles.actionLabel}>Export account data</Text>
          </Pressable>
          <Pressable style={styles.actionItem} onPress={logout}>
            <MaterialIcons name="logout" size={18} color={Colors.onSurface} />
            <Text style={styles.actionLabel}>Sign out</Text>
          </Pressable>
          <Pressable style={styles.deleteItem} onPress={handleDeleteAccount}>
            <MaterialIcons name="delete-forever" size={18} color={Colors.error} />
            <Text style={styles.deleteLabel}>Delete account permanently</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.marginMobile, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  banner: {
    backgroundColor: `${Colors.tertiary}1A`,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  bannerText: {
    ...Typography.labelMd,
    color: Colors.tertiary,
    textAlign: 'center',
  },
  section: { gap: Spacing.md },
  sectionTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
  },
  profileRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  profileFields: { flex: 1, gap: Spacing.sm },
  fieldGroup: { gap: 6 },
  label: {
    ...Typography.labelSm,
    color: Colors.outline,
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
  inputDisabled: { color: Colors.outline },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  saveButtonLabel: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  rowPressed: { backgroundColor: Colors.surfaceContainerLow },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: `${Colors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  rowSublabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    marginLeft: Spacing.md + 36 + Spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchText: { flex: 1, paddingRight: Spacing.md },
  switchLabel: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  switchSublabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  dangerCard: {
    borderColor: `${Colors.error}33`,
    backgroundColor: `${Colors.errorContainer}33`,
  },
  dangerTitle: { color: Colors.error },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
  },
  actionLabel: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  deleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.errorContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  deleteLabel: {
    ...Typography.labelMd,
    color: Colors.error,
  },
});
