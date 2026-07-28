#!/bin/bash
# StatusFlow Database Automated Backup Script

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/statusflow"
BACKUP_FILE="$BACKUP_DIR/statusflow_db_$TIMESTAMP.sql.gz"

echo "[StatusFlow Backup] Starting PostgreSQL database backup..."

mkdir -p $BACKUP_DIR

# Execute pg_dump and compress
pg_dump -h $DATABASE_HOST -U $DATABASE_USER $DATABASE_NAME | gzip > $BACKUP_FILE

echo "[StatusFlow Backup] Database dumped to $BACKUP_FILE successfully."

# Sync to S3 Offsite Bucket
aws s3 cp $BACKUP_FILE s3://statusflow-backups-vault/postgresql/

echo "[StatusFlow Backup] Offsite S3 backup completed."
