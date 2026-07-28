# StatusFlow - Phase 5: Privacy-Preserving Aggregate Analytics

This document specifies the privacy-focused event telemetry strategy for tracking aggregate product usage without storing sensitive PII (Personally Identifiable Information).

---

## 1. Tracked Product Telemetry Events

| Event Name | Trigger Condition | Payload Properties (Non-PII) | Business Purpose |
|---|---|---|---|
| `account_created` | User completes onboarding | `planTier` | Measure acquisition conversion. |
| `whatsapp_connected` | Socket session transitions to `CONNECTED` | `method` (`PAIRING_CODE` / `QR`) | Measure onboarding activation. |
| `status_scheduled` | Status schedule created | `mediaType` (`TEXT`/`IMAGE`/`VIDEO`) | Track core feature engagement. |
| `status_published` | Worker successfully delivers status | `mediaType` | Track platform utility & reliability. |
| `status_failed` | Worker execution fails | `errorReason` | Detect infrastructure failures. |
| `subscription_purchased` | Paystack webhook payment success | `planTier` (`WEEKLY`/`MONTHLY`) | Track MRR / ARR revenue growth. |
| `subscription_cancelled` | User cancels subscription | `planTier` | Track churn rate. |
| `draft_saved` | Draft status saved | `mediaType` | Track composer drop-off. |
| `media_uploaded` | Asset uploaded to Media Library | `mimeType`, `fileSizeMb` | Track storage infrastructure usage. |
