import type { TextStyle } from 'react-native';

/**
 * Type scale from the Stitch mockups, translated to RN `TextStyle` objects.
 * Weight is encoded in `fontFamily` (via `@expo-google-fonts/inter`'s named weighted
 * variants) rather than a separate `fontWeight` prop, so make sure the corresponding
 * `Inter_*` font is loaded via `useFonts` before these are used — see `app/_layout.tsx`.
 * `letterSpacing` is converted from the mockups' em values to RN's point-based unit
 * (em * fontSize).
 */
export const Typography: Record<string, TextStyle> = {
  displayLg: {
    fontFamily: 'Inter_700Bold',
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -0.96,
  },
  headlineLg: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.64,
  },
  headlineLgMobile: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.24,
  },
  headlineMd: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.24,
  },
  headlineSm: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  bodyLg: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodySm: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  labelMd: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.14,
  },
  labelSm: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
  },
};

/** Fonts to pass to `useFonts()` in the root layout. */
export const REQUIRED_FONT_WEIGHTS = [
  'Inter_400Regular',
  'Inter_500Medium',
  'Inter_600SemiBold',
  'Inter_700Bold',
] as const;
