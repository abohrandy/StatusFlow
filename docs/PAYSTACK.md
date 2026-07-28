# Paystack Integration Architecture

StatusFlow processes subscriptions via **Paystack Inline Checkout** and **Webhooks**.

## Paystack Webhook Handler (`/api/v1/webhooks/paystack`)

### Supported Webhook Events
1. `charge.success`: Triggered on successful plan charge. Provisions subscription and resets quota counters.
2. `subscription.create`: Logged on new recurring schedule creation.
3. `subscription.disable`: Fired on user cancellation or card charge failure. Downgrades account to Free tier.

```typescript
// Webhook signature verification snippet
const hash = crypto.createHmac('sha512', secretKey).update(JSON.stringify(req.body)).digest('hex');
if (hash === req.headers['x-paystack-signature']) {
  // Process event payload...
}
```
