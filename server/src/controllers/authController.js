import { z } from 'zod';
import { registerSchema, loginSchema, profileSchema } from '../validators/auth.js';
import {
  registerUser,
  loginUser,
  completeProfile,
  getCurrentUser
} from '../services/authService.js';

export async function register(req, res, next) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    res.status(201).json({ success: true, data: result, message: 'User registered successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues.map((issue) => issue.message) });
    }
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken
      },
      message: 'Login successful'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues.map((issue) => issue.message) });
    }
    return next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token missing', errors: ['Refresh token missing'] });
    }

    const { jwtAccessSecret, jwtRefreshSecret, jwtAccessExpiresIn } = (await import('../config/env.js')).env;
    const payload = (await import('jsonwebtoken')).default.verify(refreshToken, jwtRefreshSecret);
    const user = await (await import('../models/User.js')).default.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token', errors: ['Invalid refresh token'] });
    }

    const accessToken = (await import('jsonwebtoken')).default.sign({ sub: user._id, role: user.role }, jwtAccessSecret, {
      expiresIn: jwtAccessExpiresIn
    });

    return res.status(200).json({
      success: true,
      data: { accessToken },
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res) {
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}

export async function me(req, res, next) {
  try {
    const user = await getCurrentUser(req.user._id);
    return res.status(200).json({ success: true, data: user, message: 'Current user fetched' });
  } catch (error) {
    return next(error);
  }
}

export async function completeProfileController(req, res, next) {
  try {
    const payload = profileSchema.parse(req.body);
    const profile = await completeProfile(req.user._id, payload);
    return res.status(200).json({ success: true, data: profile, message: 'Profile completed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues.map((issue) => issue.message) });
    }
    return next(error);
  }
}
