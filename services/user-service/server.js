require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors = require('cors');

const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('[BOOT] User Service:', {
  PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
  DB_NAME: process.env.DB_NAME,
  NODE_ENV: process.env.NODE_ENV,
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.use(session({
  name: 'sb.sid',                           
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,           
  },
}));

app.use('/api/users', usersRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, _req, res, _next) => {
  console.error('[USER SERVICE ERROR]', err);
  res.status(500).json({ error: { message: 'Internal server error' } });
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
