import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectMongo() {
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000
    });

    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.warn('MongoDB connection skipped:', error.message);
    return false;
  }
}

export async function connectMongoTest() {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  return mongod;
}
