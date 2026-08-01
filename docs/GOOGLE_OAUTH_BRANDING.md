# StatusFlow - Custom Domain & Branding Guide

How to display **StatusFlow** (or `statusflow.reelas.com.ng`) instead of `uqritaeteygddlroulov.supabase.co` on the Google Sign-In prompt.

---

## 1. Customize App Name in Google OAuth Consent Screen
1. Go to [Google Cloud OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent).
2. Under **App Information**:
   - **App name**: Change to `StatusFlow`
   - **User support email**: Select your email (`abohrandy@gmail.com`)
   - **Developer contact information**: Enter your email.
3. Click **SAVE AND CONTINUE**.

---

## 2. Option A: Custom Domain in Supabase Pro (Instant Branding)
In Supabase Dashboard -> **Project Settings** -> **Custom Domains**:
- Attach your custom domain (e.g. `auth.statusflow.app`).
- The Google prompt will say: *"Sign in to auth.statusflow.app"*.

---

## 3. Option B: Custom Domain in Google Cloud Console
In Google Cloud Console -> **Branding**:
- Upload your **StatusFlow Logo**.
- Set **App logo** and **App Domain** (`https://statusflow.reelas.com.ng`).
