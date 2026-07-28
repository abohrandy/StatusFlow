# StatusFlow - Security & Encryption Architecture

## Production Security Hardening
1. **Rate Limiting**: Express IP-based rate limiting (`rateLimiter.ts`) blocking brute-force authentication attacks.
2. **Encrypted Baileys Session Storage**: Multi-device auth keys encrypted via AES-256-GCM prior to database persistence.
3. **Paystack Signature Verification**: Webhook payloads validated via `x-paystack-signature` HMAC SHA512 hashing.
4. **React Production Error Boundary**: Catches unhandled React component runtime errors without leaking stack traces.
