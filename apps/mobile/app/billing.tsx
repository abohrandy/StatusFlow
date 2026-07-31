import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, EmptyState, PricingCard, TopAppBar } from '../components';
import { Colors, Spacing, Typography } from '../theme';

type PlanTier = 'free' | 'weekly' | 'monthly';

export default function BillingScreen() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('free');
  const [loadingPlan, setLoadingPlan] = useState<PlanTier | null>(null);

  const handleCheckout = (plan: PlanTier, amount: number) => {
    setLoadingPlan(plan);
    setTimeout(() => {
      setLoadingPlan(null);
      setCurrentPlan(plan);
      Alert.alert('Payment successful', `₦${amount.toLocaleString()} charged via Paystack. You're now on the ${plan} plan.`);
    }, 1200);
  };

  const handleCancelSubscription = () => {
    Alert.alert('Cancel Subscription', 'Are you sure you want to cancel your paid subscription?', [
      { text: 'Keep Subscription', style: 'cancel' },
      { text: 'Confirm Cancel', style: 'destructive', onPress: () => setCurrentPlan('free') },
    ]);
  };

  return (
    <View style={styles.screen}>
      <TopAppBar title="Billing & Subscription" leftMode="back" onLeftPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.statusCard}>
          <Text style={styles.statusLabel}>CURRENT PLAN</Text>
          <Text style={styles.statusValue}>
            {currentPlan === 'free' ? 'Free Starter' : currentPlan === 'weekly' ? 'Weekly Pro' : 'Monthly Business'}
          </Text>
          <Text style={styles.statusDescription}>
            {currentPlan === 'free'
              ? '1 scheduled status every 7 days • 1 connected WhatsApp account'
              : 'Unlimited status scheduling • 1 connected WhatsApp account'}
          </Text>
          {currentPlan !== 'free' && (
            <Text style={styles.cancelLink} onPress={handleCancelSubscription}>
              Cancel Subscription
            </Text>
          )}
        </Card>

        <View style={styles.plans}>
          <PricingCard
            planName="Free Starter"
            price="₦0"
            cadence="forever"
            description="Perfect for trying StatusFlow."
            features={['1 scheduled status every 7 days', '1 connected WhatsApp account', 'Text, image, video']}
            ctaLabel="Current Plan"
            ctaDisabled={currentPlan === 'free'}
            onPressCta={() => {}}
            highlighted={currentPlan === 'free'}
          />

          <PricingCard
            planName="Weekly Pro"
            price="₦2,000"
            cadence="week"
            badge="MOST POPULAR"
            description="Perfect for everyday business owners."
            features={['Unlimited scheduled statuses', 'Schedule weeks ahead', 'Drafts & calendar', 'Priority publishing']}
            ctaLabel={currentPlan === 'weekly' ? 'Current Plan' : loadingPlan === 'weekly' ? 'Processing...' : 'Upgrade with Paystack'}
            ctaDisabled={currentPlan === 'weekly' || loadingPlan === 'weekly'}
            onPressCta={() => handleCheckout('weekly', 2000)}
            highlighted={currentPlan === 'weekly'}
          />

          <PricingCard
            planName="Monthly Business"
            price="₦6,000"
            cadence="month"
            badge="BEST VALUE"
            description="Save money compared to paying weekly."
            features={['Everything in Weekly Pro', 'Priority support', 'Early access to new features']}
            ctaLabel={currentPlan === 'monthly' ? 'Current Plan' : loadingPlan === 'monthly' ? 'Processing...' : 'Upgrade with Paystack'}
            ctaDisabled={currentPlan === 'monthly' || loadingPlan === 'monthly'}
            onPressCta={() => handleCheckout('monthly', 6000)}
            highlighted={currentPlan === 'monthly'}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          <EmptyState icon="receipt-long" title="No payments yet" subtitle="Your Paystack payment history will appear here." />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.marginMobile, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  statusCard: { gap: 4 },
  statusLabel: {
    ...Typography.labelSm,
    color: Colors.outline,
  },
  statusValue: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
  },
  statusDescription: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  cancelLink: {
    ...Typography.labelMd,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
  plans: { gap: Spacing.md },
  section: { gap: Spacing.sm },
  sectionTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
  },
});
