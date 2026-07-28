# StatusFlow - System Requirements

## Functional Requirements
1. **Account Management**: User register, login, password reset, and organization tenancy.
2. **WhatsApp Gateway**: Multi-device socket lifecycle management powered by Baileys library.
3. **Session Persistence**: Encrypted session auth state stored in Redis / PostgreSQL database.
4. **Queue Worker Engine**: Distributed Redis BullMQ queue processing jobs with millisecond precision.
5. **Media Storage**: S3-compatible cloud object storage (AWS S3 or Cloudflare R2) for media assets.
6. **Payment Gateway**: Paystack integration for monthly/annual recurring plan billing via webhooks.

## Hardware & Infrastructure Requirements
- **Web App Server**: Node.js v20+ / Next.js / TypeScript.
- **Worker Process**: Node.js service dedicated to Redis queue consumption and Baileys socket execution.
- **Database**: PostgreSQL 15+ for relational state & Redis 7+ for queue management and session locks.
- **Bandwidth**: High egress capacity for multimedia status media uploads.
