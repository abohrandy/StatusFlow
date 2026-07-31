// @supabase/supabase-js optionally traces requests via a dynamic
// `import('@opentelemetry/api')`, wrapped in `.catch(() => null)` so it no-ops
// when the package isn't installed. Vite/webpack/turbopack recognize the
// bundler-ignore comments on that import and leave it fully dynamic; Metro
// does not, so it tries to statically resolve the module and fails the whole
// bundle. This stub satisfies that resolution — supabase-js's own guard
// (`if (!otel || !otel.propagation || !otel.context) return null`) treats a
// module missing those exports the same as the package not being installed.
module.exports = {};
