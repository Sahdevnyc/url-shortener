const express = require('express');
const cors = require('cors');
const urlRoutes = require('./routes/urlRoutes');
const { redirectToLongUrl } = require('./controllers/urlController');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
}));

const rateLimit = require('express-rate-limit');
app.use(express.json({ limit: '10kb' }));

const createUrlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many URLs created. Please try again later!' },
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/v1/urls', createUrlLimiter);
app.use('/api/v1', urlRoutes);

app.get('/:shortCode', redirectToLongUrl);

app.use(errorHandler);

module.exports = app;
