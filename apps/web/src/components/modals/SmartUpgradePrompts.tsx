import React from 'react';

interface PromptProps {
  onPrimary: () => void;
  onDismiss: () => void;
}

/**
 * Scenario 1: a Weekly Pro user has renewed four consecutive weeks
 * (`subscription.consecutiveRenewals === 4`, computed in
 * apps/api/src/routes/billing.ts `buildSmartPrompts`). Suggests switching to Monthly
 * Business, which is strictly cheaper over the same four weeks (₦8,000 vs ₦6,000).
 */
export const RenewalSavingsModal: React.FC<PromptProps> = ({ onPrimary, onDismiss }) => (
  <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-2xl shadow-emerald-500/5">
      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
        💰
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-base text-white">You're spending ₦8,000 every four weeks.</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">Switch to Monthly Business and save ₦2,000 every month.</p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onDismiss} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-all">
          Dismiss
        </button>
        <button
          onClick={onPrimary}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all"
        >
          Upgrade
        </button>
      </div>
    </div>
  </div>
);

/**
 * Scenario 2: fires within 3 days of a Weekly Pro subscription's period end while it's
 * cancelled or past-due (see `buildSmartPrompts`) — i.e. it's actually heading toward
 * expiration, not just due for its normal auto-renewal.
 */
export const ExpiryWarningModal: React.FC<PromptProps> = ({ onPrimary, onDismiss }) => (
  <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-2xl shadow-emerald-500/5">
      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl">
        ⏳
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-base text-white">Your Weekly Pro subscription expires in 3 days.</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">Renew now or switch to Monthly Business to save money.</p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onDismiss} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-all">
          Maybe Later
        </button>
        <button
          onClick={onPrimary}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all"
        >
          Renew Now
        </button>
      </div>
    </div>
  </div>
);
