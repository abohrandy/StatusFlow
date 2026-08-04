# WhatsApp Session Management Strategy

## Lifecycle States
1. **UNINITIALIZED**: No session exists for user.
2. **PAIRING**: Pairing Code generated or QR code rendered, awaiting WhatsApp user scan.
3. **CONNECTED**: Socket online, authenticated, and ready to process scheduled posts.
4. **DISCONNECTED**: Connection temporarily lost; auto-reconnection loop activated (5s interval).
5. **EXPIRED / LOGGED_OUT**: Session terminated by user on phone or keys revoked.

## Security & Storage
- Session state auth credentials encrypted using AES-256-GCM (`packages/baileys-engine/src/sessionEncryption.ts`), persisted in Redis (`redisAuthState.ts`) — not Postgres.
- Managed by `packages/baileys-engine/src/WhatsAppConnection.ts`.
