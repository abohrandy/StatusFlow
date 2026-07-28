import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function MobileForgotPassword() {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);

  const handleReset = () => {
    if (email) setSent(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive recovery instructions</Text>

        {sent ? (
          <Text style={styles.successText}>Password reset instructions sent to {email}!</Text>
        ) : (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                placeholderTextColor="#71717a"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleReset}>
              <Text style={styles.buttonText}>Send Reset Link</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  successText: {
    color: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    padding: 14,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 13,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#09090b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  button: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#09090b',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
