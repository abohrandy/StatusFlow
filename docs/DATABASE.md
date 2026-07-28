# StatusFlow - Database Schema & Design

## Media Files Table Specs (`media_files`)
- `id`: UUID Primary Key
- `user_id`: UUID Foreign Key -> `users.id`
- `file_name`: String
- `file_url`: S3 Public / Presigned URL
- `file_size`: Integer (bytes)
- `mime_type`: String (`image/jpeg`, `video/mp4`)
- `created_at`: Timestamp
