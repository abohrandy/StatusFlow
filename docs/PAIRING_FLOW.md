# WhatsApp Pairing Flow Architecture

StatusFlow supports dual pairing methods:

## Method 1: 8-Digit Pairing Code (Primary)
- User enters phone number in `WhatsAppPairing.tsx`.
- Worker invokes `BaileysManager.requestPairingCode(phoneNumber)`.
- Dashboard renders 8-digit code (`87B9-4K21`).
- User confirms code on WhatsApp app -> Linked Devices.

## Method 2: QR Code Scan (Fallback)
- Rendered in tab fallback mode using `requestQrCode()`.
