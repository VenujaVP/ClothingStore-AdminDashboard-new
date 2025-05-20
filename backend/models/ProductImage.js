// import { connectToDatabase } from '../config/mongodb';

// const productImageSchema = {
//   product_id: { type: String, required: true },
//   image_name: { type: String, required: true },
//   image_data: { type: String, required: true }, // Base64 encoded
//   content_type: { type: String, required: true },
//   uploaded_at: { type: Date, default: Date.now },
//   is_primary: { type: Boolean, default: false },
//   order: { type: Number, required: true }
// };

// // Create collection with schema validation
// export async function createProductImagesCollection() {
//   try {
//     const { db } = await connectToDatabase();
    
//     await db.createCollection('product_images', {
//       validator: {
//         $jsonSchema: {
//           bsonType: 'object',
//           required: Object.keys(productImageSchema).filter(field => productImageSchema[field].required),
//           properties: productImageSchema
//         }
//       }
//     });
    
//     console.log('✅ Product images collection created with schema validation');
//   } catch (error) {
//     if (error.codeName === 'NamespaceExists') {
//       console.log('Product images collection already exists');
//     } else {
//       console.error('Error creating product images collection:', error);
//       throw error;
//     }
//   }
// }

// // Call this function when your application starts
// createProductImagesCollection();