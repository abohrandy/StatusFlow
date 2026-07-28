import React, { useState } from 'react';

export interface BillingTransaction {
  id: string;
  reference: string;
  amountNgn: number;
  planName: string;
  date: string;
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
}

const INITIAL_TRANSACTIONS: BillingTransaction[] = [
  { id: 'tx_1', reference: 'pstk_ref_9821a', amountNgn: 6000, planName: 'Monthly Plan', date: '2026-07-28', status: 'SUCCESSFUL' },
  { id: 'tx_2', reference: 'pstk_ref_4102b', amountNgn: 2000, planName: 'Weekly Plan', date: '2026-07-21', status: 'SUCCESSFUL' }
];

export const SubscriptionBilling: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<'FREE' | 'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [transactions, setTransactions] = useState<BillingTransaction[]>(INITIAL_TRANSACTIONS);
  const [loadingPaystack, setLoadingPaystack] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handlePaystackCheckout = (plan: 'WEEKLY' | 'MONTHLY', amount: number) => {
    setLoadingPaystack(plan);
    setTimeout(() => {
      setLoadingPaystack(null);
      setCurrentPlan(plan);
      const newTx: BillingTransaction = {
        id: `tx_${Date.now()}`,
        reference: `pstk_ref_${Math.random().toString(36).substring(2, 7)}`,
        amountNgn: amount,
        planName: plan === 'WEEKLY' ? 'Weekly Plan' : 'Monthly Plan',
        date: new Date().toISOString().split('T')[0],
        status: 'SUCCESSFUL'
      };
      setTransactions([newTx, ...transactions]);
      setMessage(`Paystack payment successful! Subscribed to ${plan} Plan.`);
      setTimeout(() => setMessage(null), 4000);
    }, 1200);
  };

  const handleCancelSubscription = () => {
    setCurrentPlan('FREE');
    setShowCancelModal(false);
    setMessage('Subscription cancelled. Reverted to Free Tier plan limits.');
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Subscription & Paystack Billing</h2>
          <p className="text-sm text-zinc-400 mt-1">Manage your plan subscription tier, Paystack payment methods, and billing history.</p>
        </div>

        {currentPlan !== 'FREE' && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium text-xs border border-red-500/20 transition-all"
          >
            Cancel Subscription
          </button>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium text-center animate-bounce">
          {message}
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div className={`p-6 rounded-2xl bg-zinc-900 border flex flex-col justify-between space-y-6 transition-all ${
          currentPlan === 'FREE' ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-zinc-800'
        }`}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">Free Starter</h3>
              {currentPlan === 'FREE' && <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">Current Plan</span>}
            </div>
            <div className="text-3xl font-bold text-white">₦0 <span className="text-xs font-normal text-zinc-500">/ forever</span></div>
            <p className="text-xs text-zinc-400">Basic status scheduling for personal users.</p>
            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex items-center gap-2"><span>✓</span> 1 scheduled status every 7 days</li>
              <li className="flex items-center gap-2"><span>✓</span> 1 connected WhatsApp account</li>
              <li className="flex items-center gap-2 text-zinc-500"><span>✕</span> Priority support</li>
            </ul>
          </div>
          <button
            disabled={currentPlan === 'FREE'}
            onClick={() => setCurrentPlan('FREE')}
            className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all ${
              currentPlan === 'FREE' ? 'bg-zinc-800 text-zinc-500 cursor-default' : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            {currentPlan === 'FREE' ? 'Active Tier' : 'Downgrade to Free'}
          </button>
        </div>

        {/* Weekly Plan (₦2,000) */}
        <div className={`p-6 rounded-2xl bg-zinc-900 border flex flex-col justify-between space-y-6 transition-all ${
          currentPlan === 'WEEKLY' ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-zinc-800'
        }`}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">Weekly Pro</h3>
              {currentPlan === 'WEEKLY' && <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">Current Plan</span>}
            </div>
            <div className="text-3xl font-bold text-emerald-400">₦2,000 <span className="text-xs font-normal text-zinc-500">/ week</span></div>
            <p className="text-xs text-zinc-400">Perfect for short marketing campaigns and events.</p>
            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex items-center gap-2"><span>✓</span> <strong>Unlimited</strong> status scheduling</li>
              <li className="flex items-center gap-2"><span>✓</span> Multiple WhatsApp accounts</li>
              <li className="flex items-center gap-2"><span>✓</span> Automated Paystack weekly renewal</li>
            </ul>
          </div>
          <button
            disabled={currentPlan === 'WEEKLY' || loadingPaystack === 'WEEKLY'}
            onClick={() => handlePaystackCheckout('WEEKLY', 2000)}
            className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all ${
              currentPlan === 'WEEKLY' ? 'bg-zinc-800 text-zinc-500 cursor-default' : 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 shadow-lg shadow-emerald-500/20'
            }`}
          >
            {loadingPaystack === 'WEEKLY' ? 'Initializing Paystack...' : currentPlan === 'WEEKLY' ? 'Active Tier' : 'Pay ₦2,000 with Paystack'}
          </button>
        </div>

        {/* Monthly Plan (₦6,000) */}
        <div className={`p-6 rounded-2xl bg-zinc-900 border flex flex-col justify-between space-y-6 relative overflow-hidden transition-all ${
          currentPlan === 'MONTHLY' ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-zinc-800'
        }`}>
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/30">Most Popular</span>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">Monthly Business</h3>
              {currentPlan === 'MONTHLY' && <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">Current Plan</span>}
            </div>
            <div className="text-3xl font-bold text-emerald-400">₦6,000 <span className="text-xs font-normal text-zinc-500">/ month</span></div>
            <p className="text-xs text-zinc-400">Full business automation with priority queue workers.</p>
            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex items-center gap-2"><span>✓</span> <strong>Unlimited</strong> status scheduling</li>
              <li className="flex items-center gap-2"><span>✓</span> Unlimited WhatsApp accounts</li>
              <li className="flex items-center gap-2"><span>✓</span> Priority queue processing</li>
            </ul>
          </div>
          <button
            disabled={currentPlan === 'MONTHLY' || loadingPaystack === 'MONTHLY'}
            onClick={() => handlePaystackCheckout('MONTHLY', 6000)}
            className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all ${
              currentPlan === 'MONTHLY' ? 'bg-zinc-800 text-zinc-500 cursor-default' : 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 shadow-lg shadow-emerald-500/20'
            }`}
          >
            {loadingPaystack === 'MONTHLY' ? 'Initializing Paystack...' : currentPlan === 'MONTHLY' ? 'Active Tier' : 'Pay ₦6,000 with Paystack'}
          </button>
        </div>
      </div>

      {/* Paystack Billing Transaction History Table */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="font-semibold text-base text-white mb-2">Paystack Payment History</h3>

        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-sm text-white">{tx.planName}</div>
                <div className="text-xs text-zinc-400 mt-1">Ref: <span className="font-mono text-zinc-300">{tx.reference}</span> • Date: {tx.date}</div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-bold text-white text-sm">₦{tx.amountNgn.toLocaleString()}</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-white">Cancel Subscription</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to cancel your paid subscription? Your account will revert to the Free Starter tier (limited to 1 status schedule every 7 days).
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium">
                Keep Subscription
              </button>
              <button onClick={handleCancelSubscription} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-xs">
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
