# StatusFlow - REST & WebSocket API Specification

## Admin Management Endpoints (`/api/v1/admin`)
- `GET /api/v1/admin/users` - Fetch all platform users with subscription details
- `PATCH /api/v1/admin/users/:id/tier` - Override user subscription tier (`FREE`, `WEEKLY`, `MONTHLY`)
- `GET /api/v1/admin/workers` - Monitor BullMQ queue depth and background worker node health
- `GET /api/v1/admin/payments` - Retrieve platform Paystack transaction ledger
- `GET /api/v1/admin/audit-logs` - Inspect platform security and administrative audit logs

## User Settings Endpoints
- `GET /api/v1/users/profile` - Retrieve user profile
