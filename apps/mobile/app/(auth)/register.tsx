import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components';
import { Colors, Radius, Spacing, Typography } from '../../theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [confirmationSent, setConfirmationSent] = React.useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
    } else if (!data.session) {
      // Email confirmation is required before a session is issued.
      setConfirmationSent(true);
    }
    // If a session was returned immediately, onAuthStateChange in the root
    // layout picks it up and the auth gate redirects to the dashboard.
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Card style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start scheduling WhatsApp statuses</Text>

        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {confirmationSent ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>
              Check {email} for a confirmation link to finish creating your account.
            </Text>
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

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.outline}
                secureTextEntry
              />
            </View>

            <Pressable style={styles.button} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.onPrimary} /> : <Text style={styles.buttonLabel}>Create Account</Text>}
            </Pressable>
          </>
        )}

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </Pressable>
        </View>
      </Card>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  screen: { flex: 1, padding: Spacing.marginMobile, justifyContent: 'center' },
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
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  footerText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  footerLink: {
    ...Typography.labelMd,
    color: Colors.primary,
  },
});
