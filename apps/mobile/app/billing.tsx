import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Card, EmptyState, PricingCard, TopAppBar } from '../components';
import { Colors, Spacing, Typography } from '../theme';
import { apiClient } from '../lib/apiClient';

type PlanSlug = 'free' | 'weekly-pro' | 'monthly-business';

interface Payment {
  id: string;
  plan_slug: string;
  reference: string;
  amount: number;
  status: string;
  created_at: string;
}

const PLAN_NAMES: Record<PlanSlug, string> = {
  free: 'Free Starter',
  'weekly-pro': 'Weekly Pro',
  'monthly-business': 'Monthly Business',
};

export default function BillingScreen() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<PlanSlug>('free');
  const [loadingPlan, setLoadingPlan] = useState<PlanSlug | null>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);

  /** Returns the freshly-fetched plan slug — callers that need it right away can't rely on
   * `currentPlan` since setState doesn't update the value visible in the same closure. */
  const refresh = useCallback(async (): Promise<PlanSlug> => {
    try {
      const [{ data: sub }, { data: history }] = await Promise.all([
        apiClient.get('/billing/subscription'),
        apiClient.get('/billing/payments'),
      ]);
      const slug = (sub?.plan?.slug as PlanSlug) ?? 'free';
      setCurrentPlan(slug);
      setPayments(history?.payments ?? []);
      return slug;
    } catch {
      // Leave whatever we last had — a transient failure shouldn't blank the screen.
      return currentPlan;
    } finally {
      setLoading(false);
    }
  }, [currentPlan]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckout = async (plan: PlanSlug) => {
    setLoadingPlan(plan);
    try {
      const { data } = await apiClient.post('/billing/initialize', { planSlug: plan });
      // Activation only ever happens server-side once Paystack's webhook fires with a
      // verified signature (see apps/api/src/routes/billing.ts) — opening the checkout and
      // refetching afterward is the correct client behavior, not a client-side "success".
      await WebBrowser.openBrowserAsync(data.authorizationUrl);
      // Give the webhook a moment to land, then re-check a few times before giving up.
      for (let attempt = 0; attempt < 3; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const slug = await refresh();
        if (slug === plan) break;
      }
      Alert.alert('Checkout complete', "If your payment succeeded, your plan will update within a few seconds. Pull down to refresh if it hasn't yet.");
    } catch (err: any) {
      Alert.alert('Could not start checkout', err?.response?.data?.error ?? 'Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert('Cancel Subscription', 'Are you sure you want to cancel your paid subscription?', [
      { text: 'Keep Subscription', style: 'cancel' },
      {
        text: 'Confirm Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.post('/billing/cancel');
            await refresh();
          } catch {
            Alert.alert('Could not cancel', 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <TopAppBar title="Billing & Subscription" leftMode="back" onLeftPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.statusCard}>
          <Text style={styles.statusLabel}>CURRENT PLAN</Text>
          <Text style={styles.statusValue}>{loading ? '...' : PLAN_NAMES[currentPlan]}</Text>
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
            ctaLabel={currentPlan === 'weekly-pro' ? 'Current Plan' : loadingPlan === 'weekly-pro' ? 'Processing...' : 'Upgrade with Paystack'}
            ctaDisabled={currentPlan === 'weekly-pro' || loadingPlan !== null}
            onPressCta={() => handleCheckout('weekly-pro')}
            highlighted={currentPlan === 'weekly-pro'}
          />

          <PricingCard
            planName="Monthly Business"
            price="₦6,000"
            cadence="month"
            badge="BEST VALUE"
            description="Save money compared to paying weekly."
            features={['Everything in Weekly Pro', 'Priority support', 'Early access to new features']}
            ctaLabel={currentPlan === 'monthly-business' ? 'Current Plan' : loadingPlan === 'monthly-business' ? 'Processing...' : 'Upgrade with Paystack'}
            ctaDisabled={currentPlan === 'monthly-business' || loadingPlan !== null}
            onPressCta={() => handleCheckout('monthly-business')}
            highlighted={currentPlan === 'monthly-business'}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {loading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : payments.length === 0 ? (
            <EmptyState icon="receipt-long" title="No payments yet" subtitle="Your Paystack payment history will appear here." />
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {payments.map((p) => (
                <Card key={p.id} padding="sm">
                  <Text style={styles.paymentPlan}>{p.plan_slug.replace('-', ' ')}</Text>
                  <Text style={styles.paymentMeta}>₦{Number(p.amount).toLocaleString()} • {p.status} • {new Date(p.created_at).toLocaleDateString()}</Text>
                </Card>
              ))}
            </View>
          )}
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
  paymentPlan: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    textTransform: 'capitalize',
  },
  paymentMeta: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
});
