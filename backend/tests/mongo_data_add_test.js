import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabaseConnection } from '../config/mongodb.js';

async function insertSampleProduct() {
  try {
    console.log('📦 Starting MongoDB insert test...');

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Specify the collection
    const productsCollection = db.collection('products');

    // Create a sample product document
    const sampleProduct = {
      _id: new ObjectId("68234d05b3aecf1e446a2606"),  // ← this line needs the import above!
      product_name: 'Premium Cotton Shirt',
      description: 'A high-quality cotton shirt for everyday wear.',
      price: 1499,
      category: 'Clothing',
      stock_quantity: 100,
      isAvailable: true,
      addedDate: new Date()
    };

    // Insert the product into the collection
    const result = await productsCollection.insertOne(sampleProduct);

    console.log('✅ Product inserted successfully!');
    console.log(`🆔 Inserted ID: ${result.insertedId}`);

  } catch (error) {
    console.error('❌ Error inserting product into MongoDB:', error);
  } finally {
    await closeDatabaseConnection();
  }
}

insertSampleProduct()
  .then(() => console.log('🏁 MongoDB insert test completed'))
  .catch(err => console.error('💥 Insert test failed with error:', err));
