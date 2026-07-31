/** Consolidated border-radius scale — the mockups use `rounded-xl`(12)/`rounded-2xl`(16)/
 * `rounded-3xl`(24) inline in various places; this collapses them into named steps. */
export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;
