# Troubleshooting & Common Issues

## 1. Baileys Disconnection (`Stream Errored / 401 Unauthorized`)
- **Cause**: Session auth keys invalidated on mobile device.
- **Solution**: Trigger re-pairing flow from dashboard to regenerate pairing code.

## 2. Queue Stuck in `DELAYED` State
- **Cause**: Redis worker node down or disconnected.
- **Solution**: Verify Redis container connectivity and restart worker process.
