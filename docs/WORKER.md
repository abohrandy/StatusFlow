# Queue Worker Architecture

## Worker Engine Core Features (`WorkerProcessor.ts`)
1. **BullMQ Queue Consumption**: Consumes delayed jobs from Redis `whatsapp-status-queue`.
2. **Baileys Broadcast Publishing**: Connects encrypted session sockets and broadcasts media to `status@broadcast`.
3. **Exponential Retry & Backoff**: Retries failed socket publish attempts up to 3 times before routing to DLQ.
4. **Dead-Letter Queue (DLQ)**: Holds permanently failed status jobs for inspection.
5. **Restart Recovery**: Restores delayed jobs from Redis memory on container restart.
6. **Duplicate Job Prevention**: Deduplication locks prevent double-posting.
