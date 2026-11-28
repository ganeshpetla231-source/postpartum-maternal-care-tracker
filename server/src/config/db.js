import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectMongo() {
  try {
    if (!env.mongoUri) {
      throw new Error('MONGODB_URI is required');
    }

    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000
    });

    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.error(`MongoDB connection failed (${error.name}): ${error.message}`);
    throw error;
  }
}

export async function connectMongoTest() {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  return mongod;
}
