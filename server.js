require('dotenv').config();
process.env.TZ = process.env.TZ || 'Asia/Manila';  // Philippine date
const crypto = require('crypto');
const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');

const { requireLogin } = require('./middleware/auth');
const securityHeaders = require('./middleware/securityHeaders');
const sameOrigin = require('./middleware/sameOrigin');
const errorHandler = require('./middleware/errorHandler');

const isProduction = process.env.NODE_ENV === 'production';

// Session secret
let secret = process.env.SESSION_SECRET;
if (!secret) {
  secret = crypto.randomBytes(32).toString('hex');
  console.warn('Warning: SESSION_SECRET is not set. Using a temporary secret (everyone is logged out when the server restarts).');
} else if (secret.length < 16 || ['change-this-secret', 'change-this-to-long-random-text', 'gym-secret-key'].includes(secret)) {
  console.error('SESSION_SECRET is too weak. Use at least 16 random characters.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
if (isProduction) app.set('trust proxy', 1);

// Health check (Render)
app.get('/healthz', (req, res) => res.type('text').send('ok'));

// Middleware
app.use(securityHeaders);
app.use(express.json({ limit: '10kb' }));
app.use(cookieSession({
  name: 'dangal_session',
  keys: [secret],
  maxAge: 60 * 60 * 1000,  // 60 minutes idle
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction
}));
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use('/api', sameOrigin);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));  // public
app.use('/api', requireLogin, require('./routes'));  // login required

// Frontend
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.redirect('/login.html'));

// Error handler
app.use(errorHandler);
process.on('unhandledRejection', err => console.error('Unhandled error:', err.message));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Dangal Fitness System running at http://localhost:' + PORT));
