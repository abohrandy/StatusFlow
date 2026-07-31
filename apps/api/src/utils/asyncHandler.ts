import { NextFunction, Request, Response } from 'express';

/**
 * Wraps an async Express route handler so a rejected promise is forwarded to `next(err)`
 * instead of becoming an unhandled rejection. Express 4 (used here) does not do this
 * automatically — without this wrapper, a transient failure (e.g. a dropped DB
 * connection) inside any `async (req, res) => {...}` handler can crash the entire
 * process rather than just failing that one request.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}
