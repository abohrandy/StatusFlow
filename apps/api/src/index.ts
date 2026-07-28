import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'StatusFlow API Gateway', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`StatusFlow API server running on port ${PORT}`);
});
