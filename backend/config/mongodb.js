// config/mongodb.js

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Replace with your actual credentials
const username = process.env.MONGODB_USERNAME;
const password = encodeURIComponent(process.env.MONGODB_PASSWORD); // Always encode passwords
const cluster = process.env.MONGODB_CLUSTER;
const dbName = process.env.MONGODB_NAME;

// ✅ Now it's safe to log
// console.log(process.env.MONGODB_USERNAME, process.env.MONGODB_CLUSTER, process.env.MONGODB_NAME);

// Construct URI
const uri = `mongodb+srv://${username}:${password}@${cluster}/${dbName}?retryWrites=true&w=majority&appName=Cluster0`;

// Connection caching
let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(uri, {
      maxPoolSize: 50,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();

    const db = client.db(dbName);

    await db.command({ ping: 1 });
    console.log('✅ Successfully connected to MongoDB Atlas');

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error);
    throw new Error('Failed to connect to MongoDB Atlas');
  }
}

export async function closeDatabaseConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('🛑 MongoDB Atlas connection closed');
  }
}
