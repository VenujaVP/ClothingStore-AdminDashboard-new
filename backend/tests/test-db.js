//node tests/test-db.js

import { connectToDatabase } from '../config/mongodb.js';

async function testMongoConnection() {
  try {
    await connectToDatabase();
    console.log('MongoDB connection test passed ✅');
  } catch (err) {
    console.error('MongoDB connection test failed ❌', err);
  }
}

testMongoConnection();
