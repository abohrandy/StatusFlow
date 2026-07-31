import express from 'express';
import path from 'path';
import { webhooksRouter } from './routes/webhooks';
import { billingRouter } from './routes/billing';
import { referralsRouter } from './routes/referrals';
import { adminRouter } from './routes/admin';
import { notificationsRouter } from './routes/notifications';

const app = express();
const PORT = process.env.PORT || 5000;

// Mounted BEFORE express.json(): the Paystack webhook route parses its own raw body
// (see routes/webhooks.ts) so it can verify the HMAC signature against the exact bytes
// Paystack sent. If express.json() ran first, the body stream would already be consumed
// and parsed, and the raw bytes needed for signature verification would be gone.
app.use('/api/v1/webhooks', webhooksRouter);

app.use(express.json());

app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/referrals', referralsRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/notifications', notificationsRouter);

// Serve static frontend dashboard assets if available
const webDistPath = path.join(__dirname, '../../web/dist');
app.use(express.static(webDistPath));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'StatusFlow API Gateway', timestamp: new Date().toISOString() });
});

// Fallback: Catch-all route to serve Web Dashboard single-page app or API spec JSON
app.get('*', (req, res) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(webDistPath, 'index.html'), (err) => {
      if (err) {
        res.json({
          name: 'StatusFlow API Gateway',
          status: 'ONLINE',
          version: '2.0.0',
          message: 'Frontend dashboard can be served here or deployed to Vercel/Railway static.',
          endpoints: [
            '/api/v1/health',
            '/api/v1/auth',
            '/api/v1/whatsapp',
            '/api/v1/posts',
            '/api/v1/media',
            '/api/v1/billing',
            '/api/v1/referrals',
            '/api/v1/webhooks/paystack',
            '/api/v1/notifications',
            '/api/v1/admin'
          ]
        });
      }
    });
  } else {
    res.json({ status: 'ONLINE', version: '2.0.0' });
  }
});

// Final safety net: catches anything forwarded via next(err) by the asyncHandler-wrapped
// routes above (see utils/asyncHandler.ts). Must be registered last and take exactly 4
// params for Express to recognize it as error-handling middleware. Without this, an
// uncaught rejection in any route would otherwise crash the whole process instead of
// just failing that one request.
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API] Unhandled route error:', err instanceof Error ? err.message : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`StatusFlow API server running on port ${PORT}`);
});
