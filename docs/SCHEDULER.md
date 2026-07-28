# Scheduler Engine Specification

## Core Engine: BullMQ & Redis Queue
StatusFlow utilizes **BullMQ** built on top of Redis for scalable, delayed job dispatching with multi-timezone support (`ScheduledQueue.tsx`).

## Scheduler Management Workflows
1. **Timezone Normalization**: Schedules normalized to UTC before storage in `status_posts`.
2. **Schedule Actions**: Edit (`PATCH /api/v1/posts/:id`), Cancel (`DELETE /api/v1/posts/:id`), Duplicate (`POST /api/v1/posts/duplicate`).
3. **Calendar Synchronization**: Visual month view mapping pending scheduled jobs.
