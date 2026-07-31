import React, { useEffect, useState } from 'react';
import { formatPrice, type PlanSlug } from '@statusflow/subscriptions';
import { apiClient } from '../lib/apiClient';

const FREE_FEATURES = [
  'Schedule one status every seven days',
  'One WhatsApp account',
  'Text',
  'Image',
  'Video',
  'Calendar scheduling',
  'Limited posting history',
];

const WEEKLY_FEATURES = [
  'Schedule unlimited statuses',
  'Schedule weeks ahead',
  'Drafts',
  'Calendar',
  'Posting history',
  'Priority publishing',
  'Email support',
];

const MONTHLY_FEATURES = ['Everything in Weekly Pro', 'Priority support', 'Early access to new features'];

interface BillingSubscription {
  status: 'active' | 'past_due' | 'cancelled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  nextBillingAt: string | null;
  renewedAt: string | null;
  cancelAtPeriodEnd: boolean;
  consecutiveRenewals: number;
}

interface SubscriptionResponse {
  plan: { slug: PlanSlug; name: string };
  subscription: BillingSubscription | null;
  smartPrompts: { renewalSavings: boolean; expiryWarning: boolean };
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
}

export const SubscriptionBilling: React.FC = () => {
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanSlug | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [sub, pay, inv] = await Promise.all([
        apiClient.getSubscription(),
        apiClient.getPaymentHistory(),
        apiClient.getInvoices(),
      ]);
      setData(sub as SubscriptionResponse);
      setPayments(pay.payments);
      setInvoices(inv.invoices);
    } catch (err: any) {
      setBanner(err.message || 'Failed to load billing information.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference');
    if (!reference) {
      loadAll();
      return;
    }

    apiClient
      .verifyPayment(reference)
      .then((res) => setBanner(res.message))
      .catch((err: any) => setBanner(err.message || 'Could not verify payment with Paystack.'))
      .finally(() => {
        window.history.replaceState({}, '', window.location.pathname);
        loadAll();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPlanSlug: PlanSlug = data?.plan.slug ?? 'free';

  async function handleUpgrade(planSlug: PlanSlug) {
    setCheckoutLoading(planSlug);
    try {
      const { authorizationUrl } = await apiClient.initializeCheckout(planSlug);
      window.location.href = authorizationUrl;
    } catch (err: any) {
      setBanner(err.message || 'Could not start Paystack checkout.');
      setCheckoutLoading(null);
    }
  }

  async function handleCancel() {
    try {
      const res = await apiClient.cancelSubscription();
      setBanner(res.message);
      setShowCancelModal(false);
      loadAll();
    } catch (err: any) {
      setBanner(err.message || 'Could not cancel subscription.');
    }
  }

  const sub = data?.subscription;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Subscription & Billing</h2>
          <p className="text-sm text-zinc-400 mt-1">Manage your plan, Paystack billing, and payment history.</p>
        </div>

        {sub && currentPlanSlug !== 'free' && !sub.cancelAtPeriodEnd && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium text-xs border border-red-500/20 transition-all"
          >
            Cancel Subscription
          </button>
        )}
      </div>

      {banner && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium text-center">
          {banner}
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Starter */}
        <PricingCard
          name="Free Starter"
          price={formatPrice('free')}
          cadence="forever"
          description="Perfect for trying StatusFlow."
          features={FREE_FEATURES}
          isCurrent={currentPlanSlug === 'free'}
          button={
            <button
              disabled
              className="w-full py-2.5 rounded-xl font-semibold text-xs bg-zinc-800 text-zinc-500 cursor-default"
            >
              Current Plan
            </button>
          }
        />

        {/* Weekly Pro */}
        <PricingCard
          name="Weekly Pro"
          price={formatPrice('weekly-pro')}
          cadence="week"
          badge="MOST POPULAR"
          description="Perfect for everyday business owners."
          features={WEEKLY_FEATURES}
          isCurrent={currentPlanSlug === 'weekly-pro'}
          button={
            currentPlanSlug === 'weekly-pro' ? (
              <button disabled className="w-full py-2.5 rounded-xl font-semibold text-xs bg-zinc-800 text-zinc-500 cursor-default">
                Current Plan
              </button>
            ) : (
              <button
                disabled={checkoutLoading === 'weekly-pro'}
                onClick={() => handleUpgrade('weekly-pro')}
                className="w-full py-2.5 rounded-xl font-semibold text-xs bg-emerald-500 hover:bg-emerald-600 text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-60"
              >
                {checkoutLoading === 'weekly-pro' ? 'Redirecting to Paystack...' : 'Upgrade with Paystack'}
              </button>
            )
          }
        />

        {/* Monthly Business */}
        <PricingCard
          name="Monthly Business"
          price={formatPrice('monthly-business')}
          cadence="month"
          badge="BEST VALUE"
          description="Save money compared to paying weekly."
          features={MONTHLY_FEATURES}
          isCurrent={currentPlanSlug === 'monthly-business'}
          button={
            currentPlanSlug === 'monthly-business' ? (
              <button disabled className="w-full py-2.5 rounded-xl font-semibold text-xs bg-zinc-800 text-zinc-500 cursor-default">
                Current Plan
              </button>
            ) : (
              <button
                disabled={checkoutLoading === 'monthly-business'}
                onClick={() => handleUpgrade('monthly-business')}
                className="w-full py-2.5 rounded-xl font-semibold text-xs bg-emerald-500 hover:bg-emerald-600 text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-60"
              >
                {checkoutLoading === 'monthly-business' ? 'Redirecting to Paystack...' : 'Upgrade with Paystack'}
              </button>
            )
          }
        />
      </div>

      {/* Subscription Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Subscription Status" value={sub ? sub.status.replace('_', ' ').toUpperCase() : 'FREE'} />
        <StatCard label="Renewal Date" value={sub?.renewedAt ? formatDate(sub.renewedAt) : '—'} />
        <StatCard label="Next Billing" value={sub?.nextBillingAt ? formatDate(sub.nextBillingAt) : '—'} />
      </div>

      {/* Payment History */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="font-semibold text-base text-white mb-2">Payment History</h3>
        {loading ? (
          <div className="py-8 text-center text-xs text-zinc-500">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No payment history recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((tx) => (
              <div key={tx.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-sm text-white capitalize">{tx.plan_slug.replace('-', ' ')}</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Ref: <span className="font-mono text-zinc-300">{tx.reference}</span> • {formatDate(tx.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-white text-sm">₦{Number(tx.amount).toLocaleString()}</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono border ${
                      tx.status === 'successful'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : tx.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    {tx.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Invoices */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="font-semibold text-base text-white mb-2">Recent Invoices</h3>
        {invoices.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No invoices yet.
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-semibold text-white">{inv.invoice_number}</div>
                  <div className="text-zinc-400 mt-0.5">
                    {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white text-sm">₦{Number(inv.amount).toLocaleString()}</div>
                  <div className="text-zinc-500 uppercase">{inv.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-white">Cancel Subscription</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your subscription will remain active until the end of the current billing period, then move to the Free
              Starter plan.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium">
                Keep Subscription
              </button>
              <button onClick={handleCancel} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-xs">
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PricingCard: React.FC<{
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  badge?: string;
  isCurrent: boolean;
  button: React.ReactNode;
}> = ({ name, price, cadence, description, features, badge, isCurrent, button }) => (
  <div
    className={`relative p-6 rounded-2xl bg-zinc-900 border flex flex-col justify-between space-y-6 transition-all ${
      isCurrent ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-zinc-800'
    }`}
  >
    {badge && (
      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/30">
        {badge}
      </span>
    )}
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg text-white">{name}</h3>
        {isCurrent && (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
            Current Plan
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-emerald-400">
        {price}
        <span className="text-xs font-normal text-zinc-500"> / {cadence}</span>
      </div>
      <p className="text-xs text-zinc-400">{description}</p>
      <ul className="space-y-2 text-xs text-zinc-300">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span> {f}
          </li>
        ))}
      </ul>
    </div>
    {button}
  </div>
);

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
    <div className="text-xs text-zinc-400">{label}</div>
    <div className="text-lg font-bold text-white">{value}</div>
  </div>
);
