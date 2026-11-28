import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';

export async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required', errors: ['Authentication required'] });
    }

    const payload = jwt.verify(token, env.jwtAccessSecret);
    const user = await User.findById(payload.sub).lean();

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User is not active', errors: ['User is not active'] });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', errors: ['Invalid or expired token'] });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required', errors: ['Authentication required'] });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden', errors: ['Forbidden'] });
    }

    return next();
  };
}

export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    const user = await User.findById(payload.sub).lean();
    if (user?.isActive && !user.isDeleted) req.user = user;
  } catch {
    req.user = undefined;
  }
  return next();
}
