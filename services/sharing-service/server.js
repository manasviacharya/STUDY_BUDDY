require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3004;

console.log('[BOOT] Sharing Service', {
  SERVICE_PORT: PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
  USER_SERVICE_URL: process.env.USER_SERVICE_URL,
  DB_NAME: process.env.DB_NAME,
  NODE_ENV: process.env.NODE_ENV
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.use('/api/sharing', require('./routes/sharing'));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err, _req, res, _next) => {
  console.error('[SHARING SERVICE ERROR]', err);
  res.status(500).json({ error: { message: 'Internal server error' } });
});

app.listen(PORT, () => console.log(`Sharing Service running on port ${PORT}`));
