import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';

export default function MobileSubscriptionBilling() {
  const [currentPlan, setCurrentPlan] = useState<'FREE' | 'WEEKLY' | 'MONTHLY'>('FREE');
  const [loadingPaystack, setLoadingPaystack] = useState<string | null>(null);

  const handlePaystackCheckout = (plan: 'WEEKLY' | 'MONTHLY', amount: number) => {
    setLoadingPaystack(plan);
    setTimeout(() => {
      setLoadingPaystack(null);
      setCurrentPlan(plan);
      Alert.alert('Paystack Success', `Payment of ₦${amount.toLocaleString()} successful! Subscribed to ${plan} Plan.`);
    }, 1200);
  };

  const handleCancelSubscription = () => {
    Alert.alert('Cancel Subscription', 'Are you sure you want to cancel your paid subscription?', [
      { text: 'Keep Subscription', style: 'cancel' },
      { text: 'Confirm Cancel', style: 'destructive', onPress: () => setCurrentPlan('FREE') },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Subscription & Billing</Text>
      <Text style={styles.subtitle}>Manage your plan tier and Paystack payments</Text>

      {/* Current Active Plan Card */}
      <View style={styles.activeCard}>
        <View style={styles.activeHeader}>
          <Text style={styles.activeLabel}>Current Plan Tier</Text>
          <Text style={styles.activeValue}>{currentPlan} TIER</Text>
        </View>
        <Text style={styles.activeDesc}>
          {currentPlan === 'FREE' ? '1 scheduled status every 7 days • 1 connected WhatsApp account' : 'Unlimited status scheduling • 1 connected WhatsApp account'}
        </Text>
        {currentPlan !== 'FREE' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelSubscription}>
            <Text style={styles.cancelBtnText}>Cancel Subscription</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Plan Tier Cards */}
      <View style={styles.plansContainer}>
        {/* Free Starter */}
        <View style={[styles.planCard, currentPlan === 'FREE' && styles.selectedPlanCard]}>
          <Text style={styles.planTitle}>Free Starter</Text>
          <Text style={styles.planPrice}>₦0 <Text style={styles.planPriceSub}>/ forever</Text></Text>
          <Text style={styles.planFeature}>✓ 1 scheduled status every 7 days</Text>
          <Text style={styles.planFeature}>✓ 1 connected WhatsApp account</Text>
          <TouchableOpacity style={styles.planBtnDisabled} disabled>
            <Text style={styles.planBtnDisabledText}>{currentPlan === 'FREE' ? 'Active Tier' : 'Free Tier'}</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Pro (₦2,000) */}
        <View style={[styles.planCard, currentPlan === 'WEEKLY' && styles.selectedPlanCard]}>
          <Text style={styles.planTitle}>Weekly Pro</Text>
          <Text style={styles.planPrice}>₦2,000 <Text style={styles.planPriceSub}>/ week</Text></Text>
          <Text style={styles.planFeature}>✓ Unlimited status scheduling</Text>
          <Text style={styles.planFeature}>✓ 1 connected WhatsApp account</Text>
          <Text style={styles.planFeature}>✓ Weekly Paystack auto-renewal</Text>
          <TouchableOpacity
            style={styles.paystackBtn}
            onPress={() => handlePaystackCheckout('WEEKLY', 2000)}
            disabled={currentPlan === 'WEEKLY' || loadingPaystack === 'WEEKLY'}
          >
            {loadingPaystack === 'WEEKLY' ? (
              <ActivityIndicator color="#09090b" />
            ) : (
              <Text style={styles.paystackBtnText}>{currentPlan === 'WEEKLY' ? 'Active Tier' : 'Pay ₦2,000 with Paystack'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Monthly Business (₦6,000) */}
        <View style={[styles.planCard, currentPlan === 'MONTHLY' && styles.selectedPlanCard]}>
          <Text style={styles.planTitle}>Monthly Business</Text>
          <Text style={styles.planPrice}>₦6,000 <Text style={styles.planPriceSub}>/ month</Text></Text>
          <Text style={styles.planFeature}>✓ Unlimited status scheduling</Text>
          <Text style={styles.planFeature}>✓ 1 connected WhatsApp account</Text>
          <Text style={styles.planFeature}>✓ Priority queue processing</Text>
          <TouchableOpacity
            style={styles.paystackBtn}
            onPress={() => handlePaystackCheckout('MONTHLY', 6000)}
            disabled={currentPlan === 'MONTHLY' || loadingPaystack === 'MONTHLY'}
          >
            {loadingPaystack === 'MONTHLY' ? (
              <ActivityIndicator color="#09090b" />
            ) : (
              <Text style={styles.paystackBtnText}>{currentPlan === 'MONTHLY' ? 'Active Tier' : 'Pay ₦6,000 with Paystack'}</Text>
            )}
          </TouchableOpacity>
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
  activeCard: { backgroundColor: '#18181b', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#27272a', marginBottom: 20 },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  activeLabel: { fontSize: 12, color: '#a1a1aa' },
  activeValue: { fontSize: 13, fontWeight: 'bold', color: '#25D366' },
  activeDesc: { fontSize: 12, color: '#ffffff', lineHeight: 18 },
  cancelBtn: { marginTop: 14, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  cancelBtnText: { color: '#f87171', fontSize: 12, fontWeight: '600' },
  plansContainer: { gap: 16 },
  planCard: { backgroundColor: '#18181b', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#27272a' },
  selectedPlanCard: { borderColor: '#25D366' },
  planTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  planPrice: { fontSize: 22, fontWeight: 'bold', color: '#25D366', marginVertical: 8 },
  planPriceSub: { fontSize: 12, color: '#71717a', fontWeight: 'normal' },
  planFeature: { fontSize: 12, color: '#a1a1aa', marginVertical: 3 },
  planBtnDisabled: { backgroundColor: '#27272a', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  planBtnDisabledText: { color: '#71717a', fontWeight: 'bold', fontSize: 12 },
  paystackBtn: { backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  paystackBtnText: { color: '#09090b', fontWeight: 'bold', fontSize: 12 },
});
