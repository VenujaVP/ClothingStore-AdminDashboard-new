//controllers/ownerControllers_2_products.js

import sqldb from '../config/sqldb.js';
import { connectToDatabase } from '../config/mongodb.js';
import { ObjectId } from 'mongodb'; // Make sure this is imported

const saltRounds = 10;

export const ownerCreateProduct = async (req, res) => {
  console.log('Received request to create product');
  console.log('Files received:', req.files ? req.files.length : 'No files');
  console.log('Body:', req.body);
  
  try {
    // Parse product_variations from JSON if it's a string
    if (req.body.product_variations && typeof req.body.product_variations === 'string') {
      try {
        req.body.product_variations = JSON.parse(req.body.product_variations);
      } catch (parseError) {
        console.error('Error parsing product_variations JSON:', parseError);
        return res.status(400).json({
          message: 'Invalid product_variations format',
          Status: 'error'
        });
      }
    }

    // Extract form data from req.body
    const {
      product_id,
      product_name,
      product_description,
      unit_price,
      date_added,
      shipping_weight,
      total_units,
      category1,
      category2,
      category3,
      material,
      fabric_type,
      return_policy,
      product_variations,
    } = req.body;

    // Validate product_variations - require at least one variation
    if (!Array.isArray(product_variations) || product_variations.length === 0) {
      return res.status(400).json({ 
        message: 'At least one product variation is required',
        Status: 'error'
      });
    }

    // Validation for empty fields
    if (!product_id || !product_name || !unit_price || !date_added || !category1) {
      return res.status(400).json({ 
        message: 'All required fields are missing',
        Status: 'error'
      });
    }

    // Handle image uploads if files are present
    let uploadedImagesSummary = [];
    if (req.files && req.files.length > 0) {
      try {
        console.log(`Processing ${req.files.length} images for product ID: ${product_id}`);
        
        // Connect to MongoDB
        const { db } = await connectToDatabase();
        const productsCollection = db.collection('products');
        
        // Create image objects for each uploaded file
        const imagesArray = req.files.map((file, index) => ({
          image_name: file.originalname,
          image_data: file.buffer.toString('base64'),
          content_type: file.mimetype,
          uploaded_at: new Date(),
          is_primary: index === 0, // First image is primary by default
          order: index + 1
        }));
        
        // Create metadata for response (without base64 data)
        uploadedImagesSummary = imagesArray.map(img => ({
          name: img.image_name,
          content_type: img.content_type,
          is_primary: img.is_primary,
          order: img.order
        }));
        
        // Create or update product document with ONLY the _id and images array
        const result = await productsCollection.updateOne(
          { _id: product_id },
          {
            $setOnInsert: { created_at: new Date() },
            $set: { updated_at: new Date() },
            $push: { 
              images: { $each: imagesArray } 
            }
          },
          { upsert: true }
        );
        
        console.log(`Successfully stored ${imagesArray.length} images to MongoDB under product ID: ${product_id}`);
      } catch (imgError) {
        console.error('Error uploading images to MongoDB:', imgError);
        // Continue with product creation even if image upload fails
      }
    }

    // Insert product into MySQL product_table
    const insertProductQuery = `
      INSERT INTO product_table 
        (ProductID, ProductName, ProductDescription, UnitPrice, DateAdded, ShippingWeight, 
        Category1, Category2, Category3, Material, FabricType, ReturnPolicy, IsActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const productValues = [
      product_id,
      product_name,
      product_description || null,
      unit_price,
      date_added,
      shipping_weight || null,
      category1,
      category2 || null,
      category3 || null,
      material || null,
      fabric_type || null,
      return_policy || null,
      req.body.isActive !== undefined ? req.body.isActive : true, // Default to true if not provided
    ];

    // Execute SQL product insertion
    sqldb.query(insertProductQuery, productValues, (err, productResult) => {
      if (err) {
        console.error('Error inserting product:', err);
        return res.status(500).json({ 
          message: 'Error inserting product into the database',
          error: err.message,
          Status: 'error'
        });
      }

      console.log('Product base data inserted successfully');
      
      // Create arrays to track variations processing
      let successfulVariations = [];
      let failedVariations = [];
      
      // Process variations recursively to handle async operations properly
      const processVariation = (index) => {
        // Base case: all variations processed
        if (index >= product_variations.length) {
          console.log(`Processed all ${product_variations.length} variations`);
          
          // Check if at least one variation was successful
          if (successfulVariations.length > 0) {
            console.log(`Successfully added ${successfulVariations.length} variations`);
            return res.status(200).json({
              message: 'Product and variations added successfully',
              Status: 'success',
              successCount: successfulVariations.length,
              failCount: failedVariations.length,
              uploadedImages: uploadedImagesSummary.length > 0 ? uploadedImagesSummary : []
            });
          } else {
            // If no variations were successful, consider it a failure
            console.error('No variations were successfully added');
            return res.status(500).json({
              message: 'Product was added but all variations failed',
              errors: failedVariations,
              Status: 'error',
              uploadedImages: uploadedImagesSummary.length > 0 ? uploadedImagesSummary : []
            });
          }
        }

        const { size, color, units } = product_variations[index];
        console.log(`Processing variation ${index + 1}/${product_variations.length}: Size=${size}, Color=${color}, Units=${units}`);

        // Step 1: Get SizeID
        sqldb.query('SELECT SizeID FROM sizes WHERE SizeValue = ?', [size], (sizeErr, sizeResult) => {
          if (sizeErr) {
            console.error('Error fetching SizeID:', sizeErr);
            failedVariations.push({ 
              index: index,
              size: size,
              color: color,
              error: `Error fetching SizeID: ${sizeErr.message}`
            });
            return processVariation(index + 1); // Continue with next variation
          }

          if (!sizeResult || sizeResult.length === 0) {
            console.error(`Size "${size}" not found in database`);
            failedVariations.push({
              index: index,
              size: size,
              color: color,
              error: `Size "${size}" not found in database`
            });
            return processVariation(index + 1); // Continue with next variation
          }

          const SizeID = sizeResult[0].SizeID;
          console.log(`Found SizeID for "${size}": ${SizeID}`);

          // Step 2: Get ColorID
          sqldb.query('SELECT ColorID FROM colors WHERE ColorValue = ?', [color], (colorErr, colorResult) => {
            if (colorErr) {
              console.error('Error fetching ColorID:', colorErr);
              failedVariations.push({
                index: index,
                size: size,
                color: color,
                error: `Error fetching ColorID: ${colorErr.message}`
              });
              return processVariation(index + 1); // Continue with next variation
            }

            if (!colorResult || colorResult.length === 0) {
              console.error(`Color "${color}" not found in database`);
              failedVariations.push({
                index: index,
                size: size,
                color: color,
                error: `Color "${color}" not found in database`
              });
              return processVariation(index + 1); // Continue with next variation
            }

            const ColorID = colorResult[0].ColorID;
            console.log(`Found ColorID for "${color}": ${ColorID}`);

            // Step 3: Insert the variation
            const insertVariationQuery = `
              INSERT INTO product_variations 
                (ProductID, SizeID, ColorID, units)
              VALUES (?, ?, ?, ?)
            `;
            
            sqldb.query(insertVariationQuery, [product_id, SizeID, ColorID, units], (variationErr, variationResult) => {
              if (variationErr) {
                console.error(`Error inserting variation ${index + 1}:`, variationErr);
                failedVariations.push({
                  index: index,
                  size: size,
                  color: color,
                  error: `Error inserting variation: ${variationErr.message}`
                });
              } else {
                console.log(`Variation ${index + 1} added successfully with ID: ${variationResult.insertId}`);
                successfulVariations.push({
                  index: index,
                  size: size,
                  color: color,
                  units: units,
                  id: variationResult.insertId
                });
              }
              
              // Process the next variation regardless of success/failure
              processVariation(index + 1);
            });
          });
        });
      };

      // Start processing from the first variation
      processVariation(0);
    });
  } catch (error) {
    console.error('Error in product creation:', error);
    res.status(500).json({
      message: error.message || 'Error processing product creation',
      error: error.toString(),
      Status: 'error'
    });
  }
};

export const getProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        message: 'Product ID is required',
        Status: 'error'
      });
    }
    
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    // Find the product document by its ID
    const product = await productsCollection.findOne({ _id: productId });
    
    if (!product || !product.images || product.images.length === 0) {
      return res.status(404).json({
        message: 'No images found for this product',
        Status: 'error'
      });
    }
    
    // Return images (with or without image data depending on query param)
    const includeData = req.query.includeData === 'true';
    
    // Map and format the image data
    const formattedImages = product.images.map((img, index) => ({
      index: index,
      image_name: img.image_name,
      content_type: img.content_type,
      uploaded_at: img.uploaded_at,
      is_primary: img.is_primary,
      order: img.order,
      // Only include image data if requested
      ...(includeData && { image_data: img.image_data })
    }));
    
    res.status(200).json({
      status: 'success',
      product_id: productId,
      count: formattedImages.length,
      images: formattedImages
    });
  } catch (error) {
    console.error('Error fetching product images:', error);
    res.status(500).json({
      message: 'Error fetching product images',
      error: error.message,
      Status: 'error'
    });
  }
};

export const getProductWithImages = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        message: 'Product ID is required',
        Status: 'error'
      });
    }
    
    // Step 1: Get product details from SQL database
    const getProductQuery = `
      SELECT p.*,
        (SELECT SUM(units) FROM product_variations WHERE ProductID = p.ProductID) as TotalStock
      FROM product_table p
      WHERE p.ProductID = ?
    `;
    
    sqldb.query(getProductQuery, [productId], async (err, productResult) => {
      if (err) {
        console.error('Error fetching product from SQL:', err);
        return res.status(500).json({
          message: 'Error fetching product details',
          error: err.message,
          Status: 'error'
        });
      }
      
      if (!productResult || productResult.length === 0) {
        return res.status(404).json({
          message: 'Product not found',
          Status: 'error'
        });
      }
      
      const product = productResult[0];
      
      // Step 2: Get product variations
      const getVariationsQuery = `
        SELECT v.*, s.SizeValue, c.ColorValue 
        FROM product_variations v
        JOIN sizes s ON v.SizeID = s.SizeID
        JOIN colors c ON v.ColorID = c.ColorID
        WHERE v.ProductID = ?
      `;
      
      sqldb.query(getVariationsQuery, [productId], async (varErr, variationsResult) => {
        if (varErr) {
          console.error('Error fetching product variations:', varErr);
          return res.status(500).json({
            message: 'Error fetching product variations',
            error: varErr.message,
            Status: 'error'
          });
        }
        
        // Step 3: Get product images from MongoDB (updated for new schema)
        try {
          const { db } = await connectToDatabase();
          const productsCollection = db.collection('products');
          
          // Find the product document
          const productDoc = await productsCollection.findOne({ _id: productId });
          
          let formattedImages = [];
          
          if (productDoc && productDoc.images && productDoc.images.length > 0) {
            console.log(`Found ${productDoc.images.length} images for product ${productId}`);
            
            // Format image data - exclude actual binary data to keep response smaller
            formattedImages = productDoc.images.map((img, index) => ({
              index: index,
              image_name: img.image_name,
              content_type: img.content_type,
              is_primary: img.is_primary,
              order: img.order,
              // Create a URL to access this image
              image_url: `/api/owner/products/${productId}/images/${index}`
            }));
          } else {
            console.log(`No images found for product ${productId}`);
          }
          
          // Combine all data into a single response
          res.status(200).json({
            Status: 'success',
            product: {
              ...product,
              variations: variationsResult || [],
              images: formattedImages
            }
          });
          
        } catch (mongoErr) {
          console.error('Error fetching product images from MongoDB:', mongoErr);
          // Still return product data even if image fetch fails
          res.status(200).json({
            Status: 'success',
            product: {
              ...product,
              variations: variationsResult || [],
              images: [],
              image_error: 'Failed to fetch product images'
            }
          });
        }
      });
    });
    
  } catch (error) {
    console.error('Error in getProductWithImages:', error);
    res.status(500).json({
      message: 'Error fetching product with images',
      error: error.message,
      Status: 'error'
    });
  }
};

export const getProductImageById = async (req, res) => {
  try {
    const { productId, imageIndex } = req.params;
    
    if (!productId || imageIndex === undefined) {
      return res.status(400).json({
        message: 'Product ID and image index are required',
        Status: 'error'
      });
    }
    
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');
    
    // Find the product document
    const product = await productsCollection.findOne({ _id: productId });
    
    if (!product || !product.images || product.images.length === 0) {
      return res.status(404).json({
        message: 'Product or images not found',
        Status: 'error'
      });
    }
    
    const index = parseInt(imageIndex);
    const image = product.images[index];
    
    if (!image) {
      return res.status(404).json({
        message: 'Image not found at specified index',
        Status: 'error'
      });
    }
    
    // Convert the base64 image data to a buffer
    const imageBuffer = Buffer.from(image.image_data, 'base64');
    
    // Set appropriate headers
    res.set('Content-Type', image.content_type);
    res.set('Content-Disposition', `inline; filename="${image.image_name}"`);
    
    // Send the actual image data
    res.send(imageBuffer);
    
  } catch (error) {
    console.error('Error fetching product image:', error);
    res.status(500).json({
      message: 'Error fetching image',
      error: error.message,
      Status: 'error'
    });
  }
};

//--------------------------------------------------------------------

export const getAllProducts = async (req, res) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Get filter parameters
    const { search, category1, category2, category3, minPrice, maxPrice, inStock, status } = req.query;
    
    // Base query to get products with total stock calculated
    let baseQuery = `
      SELECT p.*,
        (SELECT SUM(units) FROM product_variations WHERE ProductID = p.ProductID) as TotalStock
      FROM product_table p
    `;
    
    // Build WHERE clause for filtering
    const whereConditions = [];
    const queryParams = [];
    
    if (search) {
      whereConditions.push('(p.ProductName LIKE ? OR p.ProductID LIKE ? OR p.ProductDescription LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (category1) {
      whereConditions.push('p.Category1 = ?');
      queryParams.push(category1);
    }
    
    if (category2) {
      whereConditions.push('p.Category2 = ?');
      queryParams.push(category2);
    }
    
    if (category3) {
      whereConditions.push('p.Category3 = ?');
      queryParams.push(category3);
    }
    
    if (minPrice) {
      whereConditions.push('p.UnitPrice >= ?');
      queryParams.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      whereConditions.push('p.UnitPrice <= ?');
      queryParams.push(parseFloat(maxPrice));
    }
    
    if (inStock === 'true') {
      whereConditions.push('(SELECT SUM(units) FROM product_variations WHERE ProductID = p.ProductID) > 0');
    } else if (inStock === 'false') {
      whereConditions.push('(SELECT SUM(units) FROM product_variations WHERE ProductID = p.ProductID) = 0');
    }
    
    // Add filter for active/inactive products
    if (status === 'active') {
      whereConditions.push('p.IsActive = TRUE');
    } else if (status === 'inactive') {
      whereConditions.push('p.IsActive = FALSE');
    }
    
    // Combine WHERE clauses if any
    if (whereConditions.length > 0) {
      baseQuery += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    // Add ORDER BY and LIMIT for pagination
    const sortField = req.query.sortField || 'createdAt';
    const sortOrder = req.query.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    baseQuery += ` ORDER BY p.${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
    
    // Execute the query
    sqldb.query(baseQuery, queryParams, async (err, results) => {
      if (err) {
        console.error('Error fetching products:', err);
        return res.status(500).json({
          message: 'Error fetching products',
          error: err.message,
          Status: 'error'
        });
      }
      
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM product_table p
        ${whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : ''}
      `;
      
      sqldb.query(countQuery, queryParams.slice(0, queryParams.length - 2), async (countErr, countResult) => {
        if (countErr) {
          console.error('Error counting products:', countErr);
          return res.status(500).json({
            message: 'Error counting products',
            error: countErr.message,
            Status: 'error'
          });
        }
        
        const totalProducts = countResult[0].total;
        const totalPages = Math.ceil(totalProducts / limit);
        
        // Get all unique categories for filter options (for all 3 levels)
        const categoriesQuery = `
          SELECT 'category1' as level, Category1 as value FROM product_table WHERE Category1 IS NOT NULL AND Category1 != ''
          UNION
          SELECT 'category2' as level, Category2 as value FROM product_table WHERE Category2 IS NOT NULL AND Category2 != ''
          UNION
          SELECT 'category3' as level, Category3 as value FROM product_table WHERE Category3 IS NOT NULL AND Category3 != '';
        `;
        
        sqldb.query(categoriesQuery, async (catErr, categoriesResult) => {
          if (catErr) {
            console.error('Error fetching categories:', catErr);
            // Continue without categories
          }
          
          // Organize categories by level
          const categories = {
            category1: [],
            category2: [],
            category3: []
          };
          
          if (categoriesResult) {
            categoriesResult.forEach(cat => {
              if (cat.level && cat.value) {
                categories[cat.level].push(cat.value);
              }
            });
          }
          
          // Enhance results with image information
          const productsWithImages = await Promise.all(results.map(async (product) => {
            try {
              // Check if product has images in MongoDB
              const { db } = await connectToDatabase();
              const productsCollection = db.collection('products');
              
              const productDoc = await productsCollection.findOne({ _id: product.ProductID });
              
              let primaryImage = null;
              let imageCount = 0;
              
              if (productDoc && productDoc.images && productDoc.images.length > 0) {
                imageCount = productDoc.images.length;
                
                // Find primary image
                const primary = productDoc.images.find(img => img.is_primary) || productDoc.images[0];
                
                primaryImage = {
                  url: `/api/owner/products/${product.ProductID}/images/0`,
                  content_type: primary.content_type
                };
              }
              
              return {
                ...product,
                primaryImage,
                imageCount
              };
              
            } catch (mongoErr) {
              console.error(`Error fetching images for product ${product.ProductID}:`, mongoErr);
              // Return product without image info on error
              return product;
            }
          }));
          
          // Send response with pagination info
          res.status(200).json({
            Status: 'success',
            products: productsWithImages,
            pagination: {
              page,
              limit,
              totalItems: totalProducts,
              totalPages
            },
            filterOptions: categories
          });
        });
      });
    });
    
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({
      message: 'Server error while fetching products',
      error: error.message,
      Status: 'error'
    });
  }
};

// Update the deleteProduct function to toggle IsActive instead of deleting
export const toggleProductStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const { isActive } = req.body;
    
    console.log(`Toggling product ${productId} status to ${isActive}`);
    
    if (productId === undefined || isActive === undefined) {
      return res.status(400).json({
        message: 'Product ID and isActive status are required',
        Status: 'error'
      });
    }
    
    // Convert to boolean if necessary
    const statusValue = typeof isActive === 'boolean' ? isActive : (isActive === 'true');
    
    // Update the IsActive status
    const updateQuery = 'UPDATE product_table SET IsActive = ? WHERE ProductID = ?';
    
    sqldb.query(updateQuery, [statusValue, productId], (err, result) => {
      if (err) {
        console.error('Error updating product status:', err);
        return res.status(500).json({
          message: 'Error updating product status',
          error: err.message,
          Status: 'error'
        });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: 'Product not found',
          Status: 'error'
        });
      }
      
      res.status(200).json({
        message: `Product status updated successfully`,
        Status: 'success'
      });
    });
    
  } catch (error) {
    console.error('Error in toggleProductStatus:', error);
    res.status(500).json({
      message: 'Error toggling product status',
      error: error.message,
      Status: 'error'
    });
  }
};

export const updateProduct = async (req, res) => {
  console.log('Received request to update product');
  console.log('Files received:', req.files ? req.files.length : 'No files');
  
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        message: 'Product ID is required',
        Status: 'error'
      });
    }
    
    // Parse product_variations from JSON if it's a string
    if (req.body.product_variations && typeof req.body.product_variations === 'string') {
      try {
        req.body.product_variations = JSON.parse(req.body.product_variations);
      } catch (parseError) {
        console.error('Error parsing product_variations JSON:', parseError);
        return res.status(400).json({
          message: 'Invalid product_variations format',
          Status: 'error'
        });
      }
    }
    
    // Parse deletedImageIndices if provided
    let deletedImageIndices = [];
    if (req.body.deletedImageIndices) {
      try {
        deletedImageIndices = JSON.parse(req.body.deletedImageIndices);
      } catch (parseError) {
        console.error('Error parsing deletedImageIndices JSON:', parseError);
        // Continue without deleting images if parsing fails
      }
    }
    
    // Extract form data from req.body
    const {
      product_name,
      product_description,
      unit_price,
      date_added,
      shipping_weight,
      category1,
      category2,
      category3,
      material,
      fabric_type,
      return_policy,
      product_variations,
      isActive
    } = req.body;
    
    // Validation for required fields
    if (!product_name || !unit_price || !date_added || !category1) {
      return res.status(400).json({ 
        message: 'All required fields must be provided',
        Status: 'error'
      });
    }
    
    // Step 1: Update product in MySQL
    const updateProductQuery = `
      UPDATE product_table 
      SET 
        ProductName = ?,
        ProductDescription = ?,
        UnitPrice = ?,
        DateAdded = ?,
        ShippingWeight = ?,
        Category1 = ?,
        Category2 = ?,
        Category3 = ?,
        Material = ?,
        FabricType = ?,
        ReturnPolicy = ?,
        IsActive = ?
      WHERE ProductID = ?
    `;
    
    const productValues = [
      product_name,
      product_description || null,
      unit_price,
      date_added,
      shipping_weight || null,
      category1,
      category2 || null,
      category3 || null,
      material || null,
      fabric_type || null,
      return_policy || null,
      isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
      productId
    ];
    
    // Handle image uploads and deletions
    let imageResults = { added: 0, deleted: 0 };
    
    // Process images if needed
    if ((req.files && req.files.length > 0) || deletedImageIndices.length > 0) {
      try {
        const { db } = await connectToDatabase();
        const productsCollection = db.collection('products');
        
        // First, retrieve existing product document
        const productDoc = await productsCollection.findOne({ _id: productId });
        
        if (!productDoc) {
          // Create new document if it doesn't exist
          if (req.files && req.files.length > 0) {
            const imagesArray = req.files.map((file, index) => ({
              image_name: file.originalname,
              image_data: file.buffer.toString('base64'),
              content_type: file.mimetype,
              uploaded_at: new Date(),
              is_primary: index === 0,
              order: index + 1
            }));
            
            await productsCollection.insertOne({
              _id: productId,
              created_at: new Date(),
              updated_at: new Date(),
              images: imagesArray
            });
            
            imageResults.added = imagesArray.length;
          }
        } else {
          // Update existing document
          
          // Handle image deletions
          if (deletedImageIndices.length > 0) {
            // Create a new array without the deleted images
            let updatedImages = [];
            
            if (productDoc.images && productDoc.images.length > 0) {
              updatedImages = productDoc.images.filter((_, index) => !deletedImageIndices.includes(index));
              
              // Update primary image if needed
              if (updatedImages.length > 0 && !updatedImages.some(img => img.is_primary)) {
                updatedImages[0].is_primary = true;
              }
              
              // Update the document with filtered images
              await productsCollection.updateOne(
                { _id: productId },
                { 
                  $set: { 
                    updated_at: new Date(),
                    images: updatedImages 
                  } 
                }
              );
              
              imageResults.deleted = deletedImageIndices.length;
            }
          }
          
          // Handle new image uploads
          if (req.files && req.files.length > 0) {
            const newImages = req.files.map((file) => ({
              image_name: file.originalname,
              image_data: file.buffer.toString('base64'),
              content_type: file.mimetype,
              uploaded_at: new Date(),
              is_primary: false,  // New uploads are not primary by default
              order: (productDoc.images?.length || 0) + 1
            }));
            
            // Add new images to the array
            await productsCollection.updateOne(
              { _id: productId },
              {
                $set: { updated_at: new Date() },
                $push: { 
                  images: { $each: newImages } 
                }
              }
            );
            
            imageResults.added = newImages.length;
          }
        }
      } catch (imgError) {
        console.error('Error processing images:', imgError);
        // Continue with product update even if image processing fails
      }
    }
    
    // Execute SQL product update
    sqldb.query(updateProductQuery, productValues, async (err, productResult) => {
      if (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ 
          message: 'Error updating product in the database',
          error: err.message,
          Status: 'error'
        });
      }
      
      if (productResult.affectedRows === 0) {
        return res.status(404).json({
          message: 'Product not found',
          Status: 'error'
        });
      }
      
      console.log('Product base data updated successfully');
      
      // Process variations - more complex as we need to handle updates, additions, and deletions
      const processVariations = async () => {
        try {
          // Get existing variations
          const getExistingVariationsQuery = `
            SELECT v.VariationID, v.SizeID, v.ColorID, v.units
            FROM product_variations v
            WHERE v.ProductID = ?
          `;
          
          sqldb.query(getExistingVariationsQuery, [productId], async (varErr, existingVariations) => {
            if (varErr) {
              console.error('Error fetching existing variations:', varErr);
              return res.status(500).json({
                message: 'Error processing product variations',
                error: varErr.message,
                Status: 'error',
                productUpdated: true,
                imageResults
              });
            }
            
            // Track variation processing stats
            const variationResults = {
              updated: 0,
              added: 0,
              deleted: 0,
              failed: 0
            };
            
            // Map existing variations by ID
            const existingVariationsMap = {};
            existingVariations.forEach(v => {
              existingVariationsMap[v.VariationID] = v;
            });
            
            // Process each variation
            const processedVariationIds = [];
            
            // Helper function to process one variation
            const processVariation = async (variation, index) => {
              return new Promise((resolve) => {
                const { id, size, color, units, isExisting } = variation;
                
                // Skip invalid variations
                if (!size || !color || units === undefined) {
                  variationResults.failed++;
                  return resolve();
                }
                
                // First get SizeID
                sqldb.query('SELECT SizeID FROM sizes WHERE SizeValue = ?', [size], (sizeErr, sizeResult) => {
                  if (sizeErr || !sizeResult || sizeResult.length === 0) {
                    console.error(`Error finding size "${size}":`, sizeErr || 'Not found');
                    variationResults.failed++;
                    return resolve();
                  }
                  
                  const SizeID = sizeResult[0].SizeID;
                  
                  // Then get ColorID
                  sqldb.query('SELECT ColorID FROM colors WHERE ColorValue = ?', [color], (colorErr, colorResult) => {
                    if (colorErr || !colorResult || colorResult.length === 0) {
                      console.error(`Error finding color "${color}":`, colorErr || 'Not found');
                      variationResults.failed++;
                      return resolve();
                    }
                    
                    const ColorID = colorResult[0].ColorID;
                    
                    // If it's an existing variation, update it
                    if (isExisting && id) {
                      processedVariationIds.push(id);
                      
                      const updateVariationQuery = `
                        UPDATE product_variations 
                        SET SizeID = ?, ColorID = ?, units = ?
                        WHERE VariationID = ? AND ProductID = ?
                      `;
                      
                      sqldb.query(updateVariationQuery, [SizeID, ColorID, units, id, productId], (updateErr) => {
                        if (updateErr) {
                          console.error(`Error updating variation ${id}:`, updateErr);
                          variationResults.failed++;
                        } else {
                          variationResults.updated++;
                        }
                        resolve();
                      });
                    } else {
                      // It's a new variation, insert it
                      const insertVariationQuery = `
                        INSERT INTO product_variations (ProductID, SizeID, ColorID, units)
                        VALUES (?, ?, ?, ?)
                      `;
                      
                      sqldb.query(insertVariationQuery, [productId, SizeID, ColorID, units], (insertErr) => {
                        if (insertErr) {
                          console.error(`Error adding new variation:`, insertErr);
                          variationResults.failed++;
                        } else {
                          variationResults.added++;
                        }
                        resolve();
                      });
                    }
                  });
                });
              });
            };
            
            // Process all variations sequentially
            for (let i = 0; i < product_variations.length; i++) {
              await processVariation(product_variations[i], i);
            }
            
            // Delete variations that weren't in the updated list
            const variationsToDelete = existingVariations.filter(v => !processedVariationIds.includes(v.VariationID));
            
            if (variationsToDelete.length > 0) {
              const deleteIds = variationsToDelete.map(v => v.VariationID);
              
              const deleteVariationsQuery = `
                DELETE FROM product_variations 
                WHERE VariationID IN (?) AND ProductID = ?
              `;
              
              sqldb.query(deleteVariationsQuery, [deleteIds, productId], (deleteErr) => {
                if (deleteErr) {
                  console.error('Error deleting old variations:', deleteErr);
                } else {
                  variationResults.deleted = deleteIds.length;
                }
                
                // Final response after all processing is done
                res.status(200).json({
                  message: 'Product updated successfully',
                  Status: 'success',
                  variationResults,
                  imageResults
                });
              });
            } else {
              // Final response if no variations to delete
              res.status(200).json({
                message: 'Product updated successfully',
                Status: 'success',
                variationResults,
                imageResults
              });
            }
          });
        } catch (varError) {
          console.error('Error processing variations:', varError);
          res.status(500).json({
            message: 'Error processing variations',
            error: varError.message,
            Status: 'error',
            productUpdated: true,
            imageResults
          });
        }
      };
      
      // Start processing variations
      await processVariations();
    });
    
  } catch (error) {
    console.error('Error in product update:', error);
    res.status(500).json({
      message: 'Server error while updating product',
      error: error.message,
      Status: 'error'
    });
  }
};

export const getProductCategories = async (req, res) => {
  try {
    // Get all unique categories for filter options (for all 3 levels)
    const categoriesQuery = `
      SELECT 'category1' as level, Category1 as value FROM product_table WHERE Category1 IS NOT NULL AND Category1 != ''
      UNION
      SELECT 'category2' as level, Category2 as value FROM product_table WHERE Category2 IS NOT NULL AND Category2 != ''
      UNION
      SELECT 'category3' as level, Category3 as value FROM product_table WHERE Category3 IS NOT NULL AND Category3 != '';
    `;
    
    sqldb.query(categoriesQuery, async (err, categoriesResult) => {
      if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).json({
          message: 'Error fetching product categories',
          error: err.message,
          Status: 'error'
        });
      }
      
      // Organize categories by level
      const categories = {
        category1: [],
        category2: [],
        category3: []
      };
      
      if (categoriesResult) {
        categoriesResult.forEach(cat => {
          if (cat.level && cat.value) {
            categories[cat.level].push(cat.value);
          }
        });
      }
      
      res.status(200).json({
        Status: 'success',
        categories
      });
    });
  } catch (error) {
    console.error('Error in getProductCategories:', error);
    res.status(500).json({
      message: 'Server error while fetching product categories',
      error: error.message,
      Status: 'error'
    });
  }
};
