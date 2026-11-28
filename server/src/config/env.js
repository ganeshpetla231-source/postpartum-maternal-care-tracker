import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../../.env', import.meta.url) });
dotenv.config({ path: new URL('../../.env', import.meta.url) });

const clientUrls = (process.env.CLIENT_URL ||
  'http://localhost:5173,https://postpartum-maternal-care-tracker-1.onrender.com,https://postpartum-maternal-care-tracker.onrender.com')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);
const nodeEnv = process.env.NODE_ENV || 'development';

export const env = {
  port: Number(process.env.PORT || 5003),
  nodeEnv,
  mongoUri: process.env.MONGODB_URI || (nodeEnv === 'production' ? '' : 'mongodb://127.0.0.1:27017/postpartum-tracker'),
  clientUrls,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  swaggerTitle: process.env.SWAGGER_TITLE || 'Postpartum & Maternal Care Tracker API',
  swaggerVersion: process.env.SWAGGER_VERSION || '1.0.0',
  swaggerDescription:
    process.env.SWAGGER_DESCRIPTION ||
    'API for postpartum care tracking.'
};
