import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authenticate } from './middlewares/auth.middleware.js';
import authRoutes from './routes/auth.routes.js';
import reportRoutes from './routes/reports.routes.js';
import usersRoutes from './routes/users.routes.js';
import auditRoutes from './routes/audit.routes.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe configurarse con al menos 32 caracteres aleatorios');
}

const app = express();
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.status(426).json({ error: 'Se requiere una conexión HTTPS' });
  }
  return next();
});
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',').map((value) => value.trim()) || false }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }), authRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/users', authenticate, usersRoutes);
app.use('/api/audit-logs', authenticate, auditRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
