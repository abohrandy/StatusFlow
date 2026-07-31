import React from 'react';

interface FreeQuotaModalProps {
  onUpgrade: () => void;
  onDismiss: () => void;
}

/**
 * Shown when a Free-plan user hits their 7-day scheduling quota (see
 * apps/api/src/routes/billing.ts `/schedule-check`, backed by
 * @statusflow/subscriptions `canScheduleStatus`). Uses the app's own modal system —
 * never a browser `alert()` — and the existing zinc/emerald dark design language.
 */
export const FreeQuotaModal: React.FC<FreeQuotaModalProps> = ({ onUpgrade, onDismiss }) => (
  <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-2xl shadow-emerald-500/5">
      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
        🚀
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-base text-white">You've used your free scheduled status this week.</h3>
        <p className="text-sm text-zinc-300 font-medium">Ready to automate your entire WhatsApp marketing?</p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Upgrade to Weekly Pro for only ₦2,000/week and schedule as many statuses as you like.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onDismiss} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-all">
          Maybe Later
        </button>
        <button
          onClick={onUpgrade}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all"
        >
          Upgrade Now
        </button>
      </div>
    </div>
  </div>
);
