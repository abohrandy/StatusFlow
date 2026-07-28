# StatusFlow - Deployment & Infrastructure Architecture

## CI/CD & Deployment Configuration
- **GitHub Workflow**: `.github/workflows/ci-cd.yml`
- **Environment Management**: Secrets passed securely via CI variables (`DATABASE_URL`, `SUPABASE_ANON_KEY`, `PAYSTACK_SECRET_KEY`, `REDIS_URL`).
- **Database Backup Strategy**: Nightly cron executing `scripts/backup_database.sh` to archive PostgreSQL dumps to `s3://statusflow-backups-vault/postgresql/`.
- **Health Checks**: `/api/v1/health` verifying API, Database connection, and Redis ping.
