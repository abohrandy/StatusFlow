import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Service-role client for Storage only — never used for anything auth-related. Uploads
 * are gated entirely by our own `requireAuth` middleware (see routes/media.ts), not
 * Supabase RLS, so this intentionally bypasses RLS. Must never be sent to a client.
 */
const storageClient = createClient(supabaseUrl, serviceRoleKey);

export const MEDIA_BUCKET = 'status-media';

export interface UploadedMedia {
  path: string;
  url: string;
}

/** Requires a public Supabase Storage bucket named `status-media` — see docs/SUPABASE_SETUP.md. */
export async function uploadMediaFile(userId: string, buffer: Buffer, fileName: string, mimeType: string): Promise<UploadedMedia> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${randomUUID()}-${safeName}`;

  const { error } = await storageClient.storage.from(MEDIA_BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw new Error(`Media upload failed: ${error.message}`);

  const { data } = storageClient.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function deleteMediaFileObject(path: string): Promise<void> {
  await storageClient.storage.from(MEDIA_BUCKET).remove([path]);
}
