# Subscription Tiers & Billing Rules

## Pricing Plans & Quota Limits

| Plan Tier | Billing Frequency | Price (NGN) | Max WhatsApp Accounts | Schedule Posting Quota |
|---|---|---|---|---|
| **Free Starter** | Lifetime | ₦0 | 1 Account | 1 Status every 7 days |
| **Weekly Pro** | Weekly | ₦2,000 / week | Multiple | **Unlimited** Statuses |
| **Monthly Business** | Monthly | ₦6,000 / month | Unlimited | **Unlimited** Statuses |

## Quota Enforcement Strategy
- **Free Plan Rules**: Rate limiter checks user schedule history in `status_posts`. If `scheduled_at` timestamp is within 7 days of previous post, scheduler rejects creation with plan upgrade prompt.
- **Paid Tier Rules**: Unlimited posting allowed. Subscriptions auto-renew via Paystack.
