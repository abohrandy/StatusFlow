# StatusFlow - Changelog

All notable changes to the StatusFlow platform will be documented in this file.

## [2.0.0] - 2026-07-28
### Added
- Layer 15: Production Readiness & Release Candidate.
- React global `<ErrorBoundary>` component wrapper.
- Express API Rate Limiting middleware (`rateLimiter.ts`).
- Automated CI/CD GitHub Actions Workflow (`.github/workflows/ci-cd.yml`).
- Automated PostgreSQL & S3 Database Backup Script (`scripts/backup_database.sh`).
- Final documentation audit across ARCHITECTURE.md, DEPLOYMENT.md, SECURITY.md, TESTING.md.

## [1.5.0] - 2026-07-28
### Added
- Layer 14: Administrator Dashboard (`AdminPanel.tsx`).

## [1.4.0] - 2026-07-28
### Added
- Layer 13: Settings Module (`UserSettings.tsx`).

## [1.3.0] - 2026-07-28
### Added
- Layer 12: Billing & Subscriptions with Paystack integration (`SubscriptionBilling.tsx`).

## [1.1.0] - 2026-07-28
### Added
- Layer 10: History & Calendar View (`HistoryAndCalendar.tsx`).

## [1.0.0] - 2026-07-28
### Added
- Layer 9: BullMQ Worker Engine Service (`WorkerProcessor.ts`).

## [0.9.0] - 2026-07-28
### Added
- Layer 8: Scheduling Engine (`ScheduledQueue.tsx`).

## [0.8.0] - 2026-07-28
### Added
- Layer 7: Status Composer module (`StatusComposer.tsx`).

## [0.7.0] - 2026-07-28
### Added
- Layer 6: Media Library asset management module (`MediaLibrary.tsx`).

## [0.6.0] - 2026-07-28
### Added
- Layer 5: WhatsApp Connection & Baileys Engine (`@statusflow/baileys-engine`).

## [0.5.0] - 2026-07-28
### Added
- Layer 4: Dashboard Experience implementation (`DashboardOverview.tsx`).

## [0.4.0] - 2026-07-28
### Added
- Layer 3: Full PostgreSQL relational database schema with 16 tables.

## [0.3.0] - 2026-07-28
### Added
- Layer 2: Complete Authentication using Supabase Auth.

## [0.2.0] - 2026-07-28
### Added
- Layer 1: Monorepo workspace creation using pnpm (`apps/web`, `apps/api`, `apps/worker`, `apps/mobile`, `packages/ui`, `packages/types`, `packages/utils`, `packages/validation`, `packages/api-client`).

## [0.1.0] - 2026-07-28
### Added
- Layer 0: Project planning, architecture documentation, schema models, and project folder hierarchy.
