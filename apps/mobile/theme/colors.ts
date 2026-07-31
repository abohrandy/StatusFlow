/**
 * Material Design 3 color tokens, light theme only (the Stitch mockups have no dark
 * variant, and dark mode hasn't been requested). Values taken directly from the
 * mockups' tailwind.config color block. `-fixed`/`-fixed-dim`/`inverse-*` MD3 variants
 * are intentionally omitted — those exist for cross-theme components (e.g. a light
 * snackbar on a dark surface) which don't apply to a light-only app. If dark mode is
 * added later, reintroduce those alongside a theme-switching mechanism.
 */
export const Colors = {
  primary: '#004ac6',
  onPrimary: '#ffffff',
  primaryContainer: '#2563eb',
  onPrimaryContainer: '#eeefff',

  secondary: '#4b41e1',
  secondaryContainer: '#645efb',

  tertiary: '#006242',
  tertiaryContainer: '#007d55',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  /** Not an MD3-standard role — the mockups imply a "pending" status color with no
   * named token. Chosen to read clearly as "in progress" without colliding with
   * tertiary (success) or error. */
  warning: '#8a5700',
  warningContainer: '#ffdea1',

  background: '#f9f9ff',
  onBackground: '#141b2b',

  surface: '#f9f9ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f1f3ff',
  surfaceContainer: '#e9edff',
  surfaceContainerHigh: '#e1e8fd',
  surfaceContainerHighest: '#dce2f7',

  onSurface: '#141b2b',
  onSurfaceVariant: '#434655',

  outline: '#737686',
  outlineVariant: '#c3c6d7',
} as const;

export type ColorToken = keyof typeof Colors;
