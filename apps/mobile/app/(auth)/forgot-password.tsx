import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components';
import { Colors, Radius, Spacing, Typography } from '../../theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    setError('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL('auth/reset-password'),
    });
    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Card style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive recovery instructions</Text>

        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {sent ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>Password reset instructions sent to {email}!</Text>
          </View>
        ) : (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                placeholderTextColor={Colors.outline}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Pressable style={styles.button} onPress={handleReset} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.onPrimary} /> : <Text style={styles.buttonLabel}>Send Reset Link</Text>}
            </Pressable>
          </>
        )}

        <Pressable onPress={() => router.push('/(auth)/login')} style={styles.footerRow}>
          <Text style={styles.footerLink}>Back to Sign In</Text>
        </Pressable>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, padding: Spacing.marginMobile, justifyContent: 'center' },
  card: { padding: Spacing.lg, gap: Spacing.sm },
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
    backgroundColor: Colors.errorContainer,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  errorText: {
    ...Typography.labelSm,
    color: Colors.error,
    textAlign: 'center',
  },
  successBanner: {
    backgroundColor: `${Colors.tertiary}1A`,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  successText: {
    ...Typography.bodySm,
    color: Colors.tertiary,
    textAlign: 'center',
  },
  fieldGroup: { gap: 6 },
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
  footerRow: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  footerLink: {
    ...Typography.labelMd,
    color: Colors.primary,
  },
});
