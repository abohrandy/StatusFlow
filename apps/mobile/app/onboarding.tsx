import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../components';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { apiClient } from '../lib/apiClient';

export default function OnboardingScreen() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState('');
  const [companyName, setCompanyName] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async () => {
    if (!fullName || !companyName) return;
    setSaving(true);
    setError('');
    try {
      await apiClient.put('/profile', { fullName, companyName });
      router.replace('/');
    } catch {
      setError('Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Card style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>1</Text>
          </View>
          <Text style={styles.title}>Welcome to StatusFlow</Text>
          <Text style={styles.subtitle}>Complete your profile to customize your scheduling workspace</Text>

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
              placeholderTextColor={Colors.outline}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>COMPANY / BRAND NAME</Text>
            <TextInput
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Acme Inc."
              placeholderTextColor={Colors.outline}
            />
          </View>

          <Pressable style={styles.button} onPress={handleSubmit} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.onPrimary} /> : <Text style={styles.buttonLabel}>Continue to Dashboard</Text>}
          </Pressable>
        </Card>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  screen: { flex: 1, padding: Spacing.marginMobile, justifyContent: 'center' },
  card: { padding: Spacing.lg, gap: Spacing.sm, alignItems: 'center' },
  badge: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: `${Colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${Colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  badgeLabel: {
    ...Typography.headlineMd,
    color: Colors.primary,
  },
  title: {
    ...Typography.headlineLg,
    color: Colors.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorBanner: {
    width: '100%',
    backgroundColor: Colors.errorContainer,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  errorText: {
    ...Typography.labelSm,
    color: Colors.error,
    textAlign: 'center',
  },
  fieldGroup: { width: '100%', gap: 6 },
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
  button: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  buttonLabel: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
  },
});
