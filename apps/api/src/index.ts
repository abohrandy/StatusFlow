import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    name: 'StatusFlow API Gateway',
    status: 'ONLINE',
    version: '2.0.0',
    documentation: '/api/v1/health',
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
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'StatusFlow API Gateway', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`StatusFlow API server running on port ${PORT}`);
});
