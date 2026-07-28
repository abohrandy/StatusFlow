# StatusFlow - Android Mobile Production Build & Release Guide

This document outlines the production release workflow, signing configuration, and Google Play Store submission setup for **StatusFlow Android (`com.statusflow.app`)**.

---

## 1. App Icon & Splash Screen Configuration (`app.json`)
The Expo app config is configured with:
- **Package Name**: `com.statusflow.app`
- **Icon**: `assets/icon.png` (512x512 PNG)
- **Adaptive Icon**: `assets/adaptive-icon.png`
- **Splash Screen**: Background `#09090b` (Dark theme matching Stitch design system).

---

## 2. Secure Token Storage & Crash Reporting
- **Token Security**: Native encrypted storage (`expo-secure-store`).
- **Crash Reporting & Telemetry**: Sentry / Bugsnag crash reporting hooks initialized in `apps/mobile/app/_layout.tsx`.

---

## 3. Building Release APK / AAB Bundle with EAS Build

Execute the following commands to generate a signed production `.aab` for Google Play Store release:

```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Log in to Expo account
eas login

# 3. Build signed Android Application Bundle (AAB)
cd apps/mobile
eas build --platform android --profile production
```

---

## 4. Google Play Store Metadata Checklist
- **App Name**: StatusFlow - WhatsApp Status Scheduler
- **Short Description**: Automate and schedule WhatsApp status broadcasts effortlessly.
- **Full Description**: StatusFlow is a WhatsApp Status scheduling platform allowing businesses and marketers to create, preview, schedule, and track image, video, and text status broadcasts.
- **Category**: Productivity / Business
- **Privacy Policy**: `https://statusflow-production.up.railway.app/privacy`
