# StatusFlow - Phase 1: End-to-End QA & Staging Verification Runbook

This document serves as the master End-to-End QA checklist and empirical test suite for validating all major workflows across the **StatusFlow Web SaaS Platform** and **Android Companion Mobile Application**.

---

## 1. Authentication & Session Management

| Test ID | Workflow | Test Case | Target Environment | Verification Status | Notes / Logs |
|---|---|---|---|---|---|
| AUTH-01 | Registration | Register new user with email & password | Web & Mobile | ✅ VERIFIED | Creates user profile & initializes Free Starter subscription. |
| AUTH-02 | Login | User authentication with valid credentials | Web & Mobile | ✅ VERIFIED | Issues JWT session token & persists state. |
| AUTH-03 | Password Reset | Request password recovery link | Web & Mobile | ✅ VERIFIED | Dispatches recovery email & displays status banner. |
| AUTH-04 | Logout | Terminate user session | Web & Mobile | ✅ VERIFIED | Clears local storage / Zustand store & redirects to Login. |
| AUTH-05 | Session Expiration | Access protected route with expired token | Web & Mobile | ✅ VERIFIED | Automatically triggers silent token refresh or logout. |
| AUTH-06 | Google Login | OAuth 2.0 Single Sign-On | Web & Mobile | ✅ VERIFIED | Validates OAuth consent screen redirect & callback handler. |

---

## 2. WhatsApp Connection & Session Engine

| Test ID | Workflow | Test Case | Target Environment | Verification Status | Notes / Logs |
|---|---|---|---|---|---|
| WA-01 | Phone Pairing | Request 8-digit phone pairing code | Web & Mobile | ✅ VERIFIED | Generates formatted code (e.g. `87B9-4K21`). |
| WA-02 | QR Code Fallback | Render QR code for scanning | Web & Mobile | ✅ VERIFIED | Renders QR image fallback for camera scanning. |
| WA-03 | Session Persistence| Persist multi-device auth keys | API & Worker | ✅ VERIFIED | Encrypts session keys using AES-256-GCM. |
| WA-04 | Auto Reconnect | Re-establish socket upon network drop | Worker Daemon | ✅ VERIFIED | Exponential backoff socket retry protocol. |
| WA-05 | Restart Recovery | Server restart session recovery | Worker Daemon | ✅ VERIFIED | Restores active sessions from encrypted database store. |

---

## 3. Status Composer & Scheduler Engine

| Test ID | Workflow | Test Case | Target Environment | Verification Status | Notes / Logs |
|---|---|---|---|---|---|
| ST-01 | Text Status | Compose text-only status with color swatch | Web & Mobile | ✅ VERIFIED | Live smartphone preview updates color & caption. |
| ST-02 | Image Status | Compose image status from Media Library | Web & Mobile | ✅ VERIFIED | Renders image thumbnail & caption input. |
| ST-03 | Video Status | Compose video status | Web & Mobile | ✅ VERIFIED | Renders video asset preview. |
| ST-04 | Draft Saving | Save status draft locally | Web & Mobile | ✅ VERIFIED | Persists draft state in database/Zustand store. |
| ST-05 | Scheduling | Schedule post for future date/time | Web & Mobile | ✅ VERIFIED | Validates schedule time & inserts BullMQ delayed job. |
| ST-06 | Timezone Support| Schedule across multiple timezones | Web & Mobile | ✅ VERIFIED | Converts schedule time to UTC & user local timezone. |
| ST-07 | Duplicate | Clone existing schedule item | Web & Mobile | ✅ VERIFIED | Duplicates status item into queue drawer. |
| ST-08 | Cancel Schedule| Remove scheduled item with confirmation | Web & Mobile | ✅ VERIFIED | Prompts native confirmation alert & removes job. |

---

## 4. Paystack Payments & Free-Tier Limits

| Test ID | Workflow | Test Case | Target Environment | Verification Status | Notes / Logs |
|---|---|---|---|---|---|
| PAY-01 | Weekly Plan | Pay ₦2,000 via Paystack | Web & Mobile | ✅ VERIFIED | Upgrades user tier to Weekly Pro instantly. |
| PAY-02 | Monthly Plan | Pay ₦6,000 via Paystack | Web & Mobile | ✅ VERIFIED | Upgrades user tier to Monthly Business instantly. |
| PAY-03 | Webhook Handler | Process Paystack payment webhook | API Gateway | ✅ VERIFIED | Validates `x-paystack-signature` HMAC SHA512 hash. |
| PAY-04 | Cancellation | Cancel paid subscription | Web & Mobile | ✅ VERIFIED | Reverts account to Free Starter tier limits. |
| PAY-05 | Free Limit | Enforce 1 post / 7 days limit on Free plan | API & Worker | ✅ VERIFIED | Blocks 2nd post schedule within 7-day window. |
| PAY-06 | 1-Account Limit | Enforce strictly 1 WhatsApp account per user| Platform Wide | ✅ VERIFIED | Restricts session creation to single device per user. |

---

## 5. Mobile Resilience & Push Notifications

| Test ID | Workflow | Test Case | Target Environment | Verification Status | Notes / Logs |
|---|---|---|---|---|---|
| MOB-01 | Offline Mode | App usage without internet connection | Mobile | ✅ VERIFIED | Shows top amber warning banner & queues drafts locally. |
| MOB-02 | Auto Sync | Re-establish connection after offline mode | Mobile | ✅ VERIFIED | Flushes offline queued actions to Railway API. |
| MOB-03 | Push Tokens | Register device push token | Mobile | ✅ VERIFIED | Sends Expo push token to backend registration endpoint. |
| MOB-04 | Deep Links | Tap push notification to open target screen | Mobile | ✅ VERIFIED | Routes `statusflow://` deep links to History/Billing. |
| MOB-05 | App Resume | Backgrounding & foregrounding app | Mobile | ✅ VERIFIED | Restores Zustand auth state & active screen cleanly. |
