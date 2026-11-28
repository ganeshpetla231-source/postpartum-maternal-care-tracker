import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import MotherProfile from '../models/MotherProfile.js';
import { env } from '../config/env.js';

export async function registerUser(input) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    const error = new Error('User already exists');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone,
    passwordHash,
    role: 'mother'
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('User is inactive');
    error.statusCode = 403;
    throw error;
  }

  const accessToken = jwt.sign({ sub: user._id, role: user.role }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn
  });

  const refreshToken = jwt.sign({ sub: user._id, type: 'refresh' }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn
  });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    accessToken,
    refreshToken
  };
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId).lean();
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const profile = await MotherProfile.findOne({ user: userId }).lean();
  return {
    ...user,
    passwordHash: undefined,
    profile
  };
}

export async function completeProfile(userId, profileInput) {
  const cleanInput = { ...profileInput };

  if (cleanInput.doctorId) {
    const doctor = await User.findById(cleanInput.doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      const error = new Error('Doctor not found');
      error.statusCode = 400;
      throw error;
    }
  }

  const profile = await MotherProfile.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      deliveryDate: cleanInput.deliveryDate || undefined,
      deliveryType: cleanInput.deliveryType || 'normal',
      complications: cleanInput.complications || [],
      doctor: cleanInput.doctorId || undefined,
      emergencyContact: cleanInput.emergencyContact || {}
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return profile;
}
