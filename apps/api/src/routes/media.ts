import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { describeError } from '../utils/describeError';
import { deleteMediaFileObject, uploadMediaFile } from '../storage';
import { createMediaFile, deleteMediaFile, listMediaFilesForUser, type MediaFileRow } from '../repositories/mediaRepository';

export const mediaRouter = Router();
mediaRouter.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB — comfortably covers a status image or short video clip
});

/** Wraps multer so a too-large/malformed upload reaches the client as 400, not the global 500 handler. */
function handleUpload(req: Request, res: Response, next: NextFunction) {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof multer.MulterError ? err.message : 'Upload failed.';
      return res.status(400).json({ error: message });
    }
    next();
  });
}

function mapMedia(row: MediaFileRow) {
  return {
    id: row.id,
    fileName: row.file_name,
    fileUrl: row.file_url,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    createdAt: row.created_at,
  };
}

mediaRouter.post('/', handleUpload, asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded — send multipart/form-data with a "file" field.' });
  }

  let path: string;
  let url: string;
  try {
    ({ path, url } = await uploadMediaFile(req.user!.id, req.file.buffer, req.file.originalname, req.file.mimetype));
  } catch (err) {
    console.error('[Media] Upload failed:', describeError(err));
    return res.status(502).json({ error: `Media upload failed: ${describeError(err)}` });
  }
  const media = await createMediaFile({
    userId: req.user!.id,
    fileName: req.file.originalname,
    fileUrl: url,
    storagePath: path,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
  });

  res.status(201).json({ media: mapMedia(media) });
}));

mediaRouter.get('/', asyncHandler(async (req, res) => {
  const media = await listMediaFilesForUser(req.user!.id);
  res.json({ media: media.map(mapMedia) });
}));

mediaRouter.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await deleteMediaFile(req.params.id, req.user!.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Media file not found.' });
  }
  if (deleted.storage_path) {
    await deleteMediaFileObject(deleted.storage_path);
  }
  res.json({ ok: true });
}));
