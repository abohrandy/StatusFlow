# Railway.app Unified Deployment Architecture

Railway allow you to host **all backend infrastructure components inside a single Railway Project canvas** using our pre-configured `docker-compose.yml` or mono-repo services.

```mermaid
graph TD
    subgraph Railway Project Canvas
        Database[(PostgreSQL Database Plugin)]
        Redis[(Redis Key-Value Plugin)]
        API[apps/api Web Service]
        Worker[apps/worker Background Worker Service]
        
        API -->|Internal URL| Database
        API -->|Internal URL| Redis
        Worker -->|Internal URL| Database
        Worker -->|Internal URL| Redis
    </ul>

    UserBrowser[User Web Browser / Web Dashboard] -->|Public HTTPS| API
    UserBrowser -->|Public Web Vercel/Railway| WebDash[apps/web Frontend]
```

## What Railway Hosts

| Component | Railway Service Type | Notes |
|---|---|---|
| **PostgreSQL Database** | Railway Postgres Plugin | Auto-provisions Postgres database with 1-click. |
| **Redis Cache & Queue** | Railway Redis Plugin | Auto-provisions Redis for BullMQ queue management. |
| **API Gateway (`apps/api`)** | Railway Docker / Node Service | Exposes public domain (e.g. `statusflow-api.up.railway.app`). |
| **Queue Worker (`apps/worker`)** | Railway Worker Service | Runs continuously in the background to post statuses. |
| **Web Dashboard (`apps/web`)** *(Optional)* | Railway Static / Node Service | Can be hosted on Railway too, or kept on Vercel. |

---

## 3-Step Setup Guide on Railway

1. **Deploy Repository on Railway**:
   - Go to [Railway.app](https://railway.app) -> **New Project** -> **Deploy from GitHub repo**.
   - Connect your `StatusFlow` repository.

2. **Add Database & Redis Plugins**:
   - In your Railway project canvas, click **+ New** -> **Database** -> **Add PostgreSQL**.
   - Click **+ New** -> **Database** -> **Add Redis**.

3. **Configure Environment Variable References**:
   Railway automatically links internal services using variable references:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `REDIS_URL` = `${{Redis.REDIS_URL}}`
