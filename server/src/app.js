import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import authRoutes from './routes/authRoutes.js';
import phase2Routes from './routes/phase2Routes.js';
import apiRoutes from './routes/apiRoutes.js';

const app = express();
const clientDistPath = fileURLToPath(new URL('../../dist/', import.meta.url));

const apiLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    errors: ['Too many requests, please try again later.']
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait a bit and try again.',
    errors: ['Too many authentication attempts. Please wait a bit and try again.']
  }
});

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(apiLimiter);
app.use(requestLogger);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'postpartum-tracker-server',
      environment: env.nodeEnv,
      uptime: process.uptime()
    },
    message: 'Server is healthy'
  });
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api', phase2Routes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'postpartum-tracker-api',
      version: '1.0.0',
      docs: '/api/docs'
    },
    message: 'API ready'
  });
});

app.use(express.static(clientDistPath, { index: false }));
app.get('*', (req, res, next) => {
  if (req.path === '/api' || req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDistPath, 'index.html'), (error) => {
    if (error) next(error);
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
