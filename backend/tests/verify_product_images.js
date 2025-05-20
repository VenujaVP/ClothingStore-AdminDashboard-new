//node tests/verify_product_images.js 2w2w2w2wwww

import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabaseConnection } from '../config/mongodb.js';
import fs from 'fs/promises';
import path from 'path';

async function verifyProductImages() {
  try {
    console.log('🔍 Starting product image verification...');
    const productId = process.argv[2];
    
    if (!productId) {
      console.error('❌ Please provide a product ID as argument');
      console.log('Usage: node verify_product_images.js PRODUCT_ID');
      return;
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const productImagesCollection = db.collection('product_images');

    // Find images for the specific product
    const images = await productImagesCollection.find({ 
      product_id: productId 
    }).toArray();

    if (images.length === 0) {
      console.log(`⚠️ No images found for product ID: ${productId}`);
      return;
    }

    console.log(`✅ Found ${images.length} images for product ID: ${productId}`);
    
    // Create a directory to save the images if it doesn't exist
    const outputDir = path.join(process.cwd(), 'temp_images');
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (dirErr) {
      console.error('Error creating directory:', dirErr);
    }

    // Extract and save the first image to verify
    const firstImage = images[0];
    console.log(`Image details:
      ID: ${firstImage._id}
      Name: ${firstImage.image_name}
      Content Type: ${firstImage.content_type}
      Is Primary: ${firstImage.is_primary}
      Order: ${firstImage.order}
    `);
    
    // Save the image to disk to verify it's valid
    try {
      const imageBuffer = Buffer.from(firstImage.image_data, 'base64');
      const filePath = path.join(outputDir, `${productId}_${firstImage._id}.jpg`);
      await fs.writeFile(filePath, imageBuffer);
      console.log(`✅ Sample image saved to ${filePath}`);
    } catch (fileErr) {
      console.error('Error saving image to file:', fileErr);
    }

  } catch (error) {
    console.error('❌ Error verifying product images:', error);
  } finally {
    await closeDatabaseConnection();
  }
}

verifyProductImages()
  .then(() => console.log('🏁 Verification process completed'))
  .catch(err => console.error('💥 Verification failed with error:', err));