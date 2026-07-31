# StatusFlow Android/Expo App — Design System & Architecture

The app (`apps/mobile`, Expo SDK 51 / React Native 0.74 / Expo Router 3) uses a light,
Material Design 3-inspired design system ("Stitch"), replacing the app's original
dark/WhatsApp-green theme. All screens, navigation, and shared components below were
migrated in one pass — see `docs/CHANGELOG.md` for the date.

## Design tokens (`apps/mobile/theme/`)

| File | Exports | Notes |
|---|---|---|
| `colors.ts` | `Colors` | MD3 roles (`primary` `#004ac6`, `tertiary` `#006242` for success, `error` `#ba1a1a`, a full `surfaceContainer*` scale, plus a non-standard `warning` role for "pending" states). Light theme only — `-fixed`/`inverse-*` MD3 variants are intentionally omitted; see the file's header comment for how to reintroduce them if dark mode is added later. |
| `typography.ts` | `Typography` | Type scale (`displayLg` → `labelSm`) as RN `TextStyle` objects. Weight is encoded via `@expo-google-fonts/inter`'s named font variants (`Inter_400Regular` … `Inter_700Bold`), loaded once in the root layout. |
| `spacing.ts` | `Spacing` | `xs`(4) `sm`(8) `md`(16) `lg`(24) `xl`(32) `xxl`(48) `xxxl`(64), plus `gutter`/`marginMobile` aliases used by the mockups. |
| `radius.ts` | `Radius` | `sm`(4) `md`(8) `lg`(12) `xl`(16) `xxl`(24) `full`(9999) — consolidates the mockups' inline `rounded-xl/2xl/3xl` values into a scale. |

Import everything from `apps/mobile/theme` (barrel export).

## Shared components (`apps/mobile/components/`)

`TopAppBar`, `FAB`, `Card`, `IconButton`, `Badge`, `SegmentedControl`, `StatCard`,
`Avatar`, `EmptyState`, `BottomSheet` (a styled `Modal` wrapper), `PricingCard`. Every
screen is built from these — see any screen under `apps/mobile/app/` for usage examples.
Icons are `@expo/vector-icons`'s `MaterialIcons` set (bundled with Expo, no extra native
config), chosen as the closest match to the mockups' Material Symbols glyphs.

## Navigation

```
app/
  _layout.tsx        Root Stack; loads Inter fonts before rendering (SplashScreen held until ready)
  (tabs)/
    _layout.tsx        Tabs (Dashboard / Scheduled / Media / Settings) + a FAB overlaid
                        outside the Tabs component, pushing /composer on tap
    index.tsx, queue.tsx, media.tsx, settings.tsx
  composer.tsx         Create Status — modal-presented, reached only via the FAB
  calendar.tsx         Full month-grid + day detail, pushed from the Queue tab's
                        List/Calendar segmented control
  history.tsx          Posting History — pushed from Settings
  pairing.tsx          WhatsApp Connection — pushed from Settings; renders either the
                        unconnected pairing flow (phone/QR) or the connected status view
  billing.tsx          Billing & Subscription — pushed from Settings
  notifications.tsx    Pushed from the Dashboard's bell icon
  (auth)/              Own Stack layout (_layout.tsx), no bottom tab bar
```

The FAB lives at the `(tabs)/_layout.tsx` level (not per-screen), so it persists
identically across all 4 tabs and disappears once you navigate outside the tabs group.

## What's still simulated

Every screen except the two auth API calls (`login.tsx`/`register.tsx` call the real
`/auth/login` and `/auth/register` endpoints) is a static mockup with `setTimeout`-faked
actions and hardcoded/local-state data — this was true before the redesign and is
unchanged by it; this pass was visual/structural only. `pairing.tsx`'s QR code image is
a real network call to `api.qrserver.com` and was left untouched.

## Fixed during the redesign

Three pre-existing bugs surfaced while rewriting their files (not separate fixes — a
natural side effect of the rewrite):
- `justifyBetween` isn't a valid React Native style property (should be
  `justifyContent`) — was silently ignored in `composer.tsx` and `history.tsx`, meaning
  those rows never actually spaced their content as intended.
- `pairing.tsx` referenced the `NodeJS.Timeout` type without `@types/node` installed,
  failing `tsc --noEmit`; replaced with `ReturnType<typeof setInterval>`.
- Login/Register/Forgot-password had no way to navigate to each other in-app; added
  "Sign Up" / "Sign In" / "Forgot password?" links using `expo-router`'s `useRouter`.

## Verifying changes

Native Android/iOS is the real target and the only way to confirm native chrome (tab bar
elevation, safe-area insets, Modal slide animation, keyboard avoidance) — use Expo Go or
`expo run:android`. For a fast visual iteration loop only, `npm run web` (via
`expo start --web`) renders the same screens through `react-native-web` in a browser;
this works well here specifically because every screen uses plain `StyleSheet.create`
with no native-only APIs. Treat it as a content/layout/color check, not a substitute for
device testing.
