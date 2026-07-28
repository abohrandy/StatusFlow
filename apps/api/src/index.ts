import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`StatusFlow API server running on port ${PORT}`);
});
