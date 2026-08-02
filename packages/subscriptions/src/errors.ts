import type { PlanSlug } from './plans';

export type SubscriptionErrorCode =
  | 'SCHEDULE_QUOTA_EXCEEDED'
  | 'WHATSAPP_ACCOUNT_LIMIT_REACHED'
  | 'MEDIA_TYPE_NOT_ALLOWED'
  | 'FEATURE_NOT_AVAILABLE'
  | 'TRIAL_EXPIRED'
  | 'PHONE_NUMBER_ALREADY_USED_FOR_TRIAL';

/** A plan that would satisfy the request the caller was just denied for. */
export interface UpgradeSuggestion {
  planSlug: PlanSlug;
  planName: string;
  message: string;
}

export interface SubscriptionErrorOptions {
  upgrade?: UpgradeSuggestion;
  /** ISO timestamp indicating when the caller may retry (used for interval-based quotas). */
  retryAfter?: string;
}

/**
 * Thrown by the feature gate's `assert*` helpers. Carries a machine-readable
 * `code` plus a human-readable `message` suitable for returning directly in
 * an API error response.
 */
export class SubscriptionError extends Error {
  readonly code: SubscriptionErrorCode;
  readonly upgrade?: UpgradeSuggestion;
  readonly retryAfter?: string;

  constructor(code: SubscriptionErrorCode, reason: string, options: SubscriptionErrorOptions = {}) {
    const message = options.upgrade ? `${reason} ${options.upgrade.message}` : reason;
    super(message);
    this.name = 'SubscriptionError';
    this.code = code;
    this.upgrade = options.upgrade;
    this.retryAfter = options.retryAfter;
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      upgrade: this.upgrade,
      retryAfter: this.retryAfter,
    };
  }
}

export function buildUpgradeSuggestion(planSlug: PlanSlug, planName: string, capability: string): UpgradeSuggestion {
  return {
    planSlug,
    planName,
    message: `Upgrade to ${planName} to ${capability}.`,
  };
}
