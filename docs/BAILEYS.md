# Baileys Integration Guide

StatusFlow uses `@whiskeysockets/baileys` to connect to the WhatsApp Web multi-device network without requiring official Cloud API BSP verification.

## Primary Pairing Protocol: 8-Digit Pairing Code
1. User provides phone number with international country code.
2. `BaileysManager.requestPairingCode(phoneNumber)` triggers WhatsApp pairing.
3. Formatted code (e.g. `87B9-4K21`) is presented on user UI.
4. User completes pairing in WhatsApp -> Linked Devices -> Link with Phone Number.

## Secondary Pairing Protocol: QR Code Fallback
- `requestQrCode()` generates SVG/PNG fallback QR code data stream.

## Connection & Event Logging
- BaileysManager emits `log` events recording socket state transitions (`UNINITIALIZED` -> `PAIRING` -> `CONNECTED` -> `DISCONNECTED`).
- AES-256 encrypted multi-device state persisted in PostgreSQL `whatsapp_sessions`.
