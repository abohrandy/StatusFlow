import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../components';
import { Colors, Radius, Spacing, Typography } from '../../theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);

  const handleReset = () => {
    if (email) setSent(true);
  };

  return (
    <View style={styles.screen}>
      <Card style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive recovery instructions</Text>

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

            <Pressable style={styles.button} onPress={handleReset}>
              <Text style={styles.buttonLabel}>Send Reset Link</Text>
            </Pressable>
          </>
        )}

        <Pressable onPress={() => router.push('/(auth)/login')} style={styles.footerRow}>
          <Text style={styles.footerLink}>Back to Sign In</Text>
        </Pressable>
      </Card>
    </View>
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
