//conrrollers/userControllers.js
import sqldb from '../config/sqldb.js';
import { connectToDatabase } from '../config/mongodb.js';

// Add this new function to your userControllers.js file

export const filterByFirstLevelCategory = async (req, res) => {
  const { category } = req.body; // Get the category from request body

  if (!category) {
    return res.status(400).json({ 
      message: 'Category parameter is required',
      status: 'error'
    });
  }

  try {
    // Simple query to filter products by first level category only
    const filterQuery = `
      SELECT 
        p.ProductID AS product_id,
        p.ProductName AS product_name,
        p.ProductDescription AS product_description,
        p.UnitPrice AS unit_price,
        p.FinalRating AS rating,
        p.WishlistCount AS wishlist_count,
        SUM(v.units) AS total_units
      FROM product_table p
      LEFT JOIN product_variations v ON p.ProductID = v.ProductID
      WHERE p.Category1 = ?
      GROUP BY p.ProductID
      LIMIT 50
    `;

    // Execute the query
    sqldb.query(
      filterQuery,
      [category],
      async (err, results) => {
        if (err) {
          console.error('Error filtering products by category:', err);
          return res.status(500).json({ 
            message: 'Error filtering products in the database',
            status: 'error',
            error: err.message
          });
        }

        if (results.length === 0) {
          return res.status(200).json({ 
            message: 'No products found in this category', 
            products: [],
            status: 'success'
          });
        }

        // Extract product IDs for image fetching
        const productIds = results.map(row => row.product_id);

        try {
          // Connect to MongoDB to fetch images
          const { db } = await connectToDatabase();
          const productsCollection = db.collection('products');
          
          // Fetch images for all products in one query
          const productsWithImages = await productsCollection.find(
            { _id: { $in: productIds } },
            { projection: { images: 1 } } // Only fetch images field
          ).toArray();

          // Create a map of productId to its images for quick lookup
          const imagesMap = new Map();
          productsWithImages.forEach(product => {
            imagesMap.set(product._id.toString(), product.images || []);
          });

          // Format the final response with product details and images
          const products = results.map((product) => {
            const productImages = imagesMap.get(product.product_id) || [];
            
            // Format images to include only necessary data
            const formattedImages = productImages.map(img => ({
              image_name: img.image_name,
              image_url: `data:${img.content_type};base64,${img.image_data}`,
              content_type: img.content_type,
              is_primary: img.is_primary,
              order: img.order
            })).sort((a, b) => a.order - b.order); // Sort by order field
            
            // Find primary image (or first image if none marked as primary)
            const primaryImage = formattedImages.find(img => img.is_primary) || 
                              (formattedImages.length > 0 ? formattedImages[0] : null);
            
            return {
              product_id: product.product_id,
              product_name: product.product_name,
              product_description: product.product_description,
              unit_price: product.unit_price,
              rating: product.rating || 0,
              wishlist_count: product.wishlist_count || 0,
              total_units: product.total_units || 0,
              images: formattedImages,
              primary_image: primaryImage,
              has_images: formattedImages.length > 0
            };
          });

          // Send the successful response
          res.status(200).json({ 
            message: 'Category products fetched successfully', 
            products: products,
            status: 'success',
            count: products.length,
            category: category
          });
        } catch (mongoError) {
          console.error('Error fetching product images:', mongoError);
          // If image fetch fails, return products without images
          const products = results.map((product) => ({
            product_id: product.product_id,
            product_name: product.product_name,
            product_description: product.product_description,
            unit_price: product.unit_price,
            rating: product.rating || 0,
            wishlist_count: product.wishlist_count || 0,
            total_units: product.total_units || 0,
            images: [],
            primary_image: null,
            has_images: false
          }));
          
          res.status(200).json({ 
            message: 'Products fetched but images could not be loaded', 
            products: products,
            status: 'partial_success',
            warning: 'Product images could not be loaded',
            error: mongoError.message
          });
        }
      }
    );
  } catch (err) {
    console.error('Error in filterByFirstLevelCategory:', err);
    res.status(500).json({ 
      message: 'Internal server error',
      status: 'error',
      error: err.message 
    });
  }
};

// Get trending products (sorted by highest rating)
export const getTrendingProducts = async (req, res) => {
  try {
    const limit = req.query.limit || 8; // Default to 8 products or use query parameter
    
    // Query to get trending products based on ratings
    const trendingQuery = `
      SELECT 
        p.ProductID AS product_id,
        p.ProductName AS product_name,
        p.ProductDescription AS product_description,
        p.UnitPrice AS unit_price,
        p.FinalRating AS rating,
        p.WishlistCount AS wishlist_count,
        SUM(v.units) AS total_units
      FROM product_table p
      LEFT JOIN product_variations v ON p.ProductID = v.ProductID
      GROUP BY p.ProductID
      ORDER BY p.FinalRating DESC, p.WishlistCount DESC
      LIMIT ?
    `;

    // Execute the query
    sqldb.query(trendingQuery, [parseInt(limit)], async (err, results) => {
      if (err) {
        console.error('Error fetching trending products:', err);
        return res.status(500).json({ 
          message: 'Error fetching trending products',
          status: 'error',
          error: err.message
        });
      }

      if (results.length === 0) {
        return res.status(200).json({ 
          message: 'No trending products found', 
          products: [],
          status: 'success'
        });
      }

      // Extract product IDs for image fetching
      const productIds = results.map(row => row.product_id);

      try {
        // Connect to MongoDB to fetch images
        const { db } = await connectToDatabase();
        const productsCollection = db.collection('products');
        
        // Fetch images for all products in one query
        const productsWithImages = await productsCollection.find(
          { _id: { $in: productIds } },
          { projection: { images: 1 } }
        ).toArray();

        // Create a map of productId to its images for quick lookup
        const imagesMap = new Map();
        productsWithImages.forEach(product => {
          imagesMap.set(product._id.toString(), product.images || []);
        });

        // Format the final response with product details and images
        const products = results.map((product) => {
          const productImages = imagesMap.get(product.product_id) || [];
          
          // Format images
          const formattedImages = productImages.map(img => ({
            image_name: img.image_name,
            image_url: `data:${img.content_type};base64,${img.image_data}`,
            content_type: img.content_type,
            is_primary: img.is_primary,
            order: img.order
          })).sort((a, b) => a.order - b.order);
          
          // Find primary image
          const primaryImage = formattedImages.find(img => img.is_primary) || 
                            (formattedImages.length > 0 ? formattedImages[0] : null);
          
          return {
            product_id: product.product_id,
            product_name: product.product_name,
            product_description: product.product_description,
            unit_price: product.unit_price,
            rating: product.rating || 0,
            wishlist_count: product.wishlist_count || 0,
            total_units: product.total_units || 0,
            images: formattedImages,
            primary_image: primaryImage,
            has_images: formattedImages.length > 0
          };
        });

        // Send the successful response
        res.status(200).json({ 
          message: 'Trending products fetched successfully', 
          products: products,
          status: 'success'
        });
      } catch (mongoError) {
        console.error('Error fetching product images:', mongoError);
        // If image fetch fails, return products without images
        const products = results.map((product) => ({
          product_id: product.product_id,
          product_name: product.product_name,
          product_description: product.product_description,
          unit_price: product.unit_price,
          rating: product.rating || 0,
          wishlist_count: product.wishlist_count || 0,
          total_units: product.total_units || 0,
          images: [],
          primary_image: null,
          has_images: false
        }));
        
        res.status(200).json({ 
          message: 'Trending products fetched but images could not be loaded', 
          products: products,
          status: 'partial_success'
        });
      }
    });
  } catch (err) {
    console.error('Error in getTrendingProducts:', err);
    res.status(500).json({ 
      message: 'Internal server error',
      status: 'error',
      error: err.message 
    });
  }
};

// Get new arrivals (sorted by most recently added)
export const getNewArrivals = async (req, res) => {
  try {
    const limit = req.query.limit || 8; // Default to 8 products or use query parameter
    
    // Query to get new arrivals based on DateAdded
    const newArrivalsQuery = `
      SELECT 
        p.ProductID AS product_id,
        p.ProductName AS product_name,
        p.ProductDescription AS product_description,
        p.UnitPrice AS unit_price,
        p.DateAdded AS date_added,
        p.FinalRating AS rating,
        p.WishlistCount AS wishlist_count,
        SUM(v.units) AS total_units
      FROM product_table p
      LEFT JOIN product_variations v ON p.ProductID = v.ProductID
      GROUP BY p.ProductID
      ORDER BY p.DateAdded DESC, p.createdAt DESC
      LIMIT ?
    `;

    // Execute the query
    sqldb.query(newArrivalsQuery, [parseInt(limit)], async (err, results) => {
      if (err) {
        console.error('Error fetching new arrivals:', err);
        return res.status(500).json({ 
          message: 'Error fetching new arrivals',
          status: 'error',
          error: err.message
        });
      }

      if (results.length === 0) {
        return res.status(200).json({ 
          message: 'No new arrivals found', 
          products: [],
          status: 'success'
        });
      }

      // Extract product IDs for image fetching
      const productIds = results.map(row => row.product_id);

      try {
        // Connect to MongoDB to fetch images
        const { db } = await connectToDatabase();
        const productsCollection = db.collection('products');
        
        // Fetch images for all products in one query
        const productsWithImages = await productsCollection.find(
          { _id: { $in: productIds } },
          { projection: { images: 1 } }
        ).toArray();

        // Create a map of productId to its images for quick lookup
        const imagesMap = new Map();
        productsWithImages.forEach(product => {
          imagesMap.set(product._id.toString(), product.images || []);
        });

        // Format the final response with product details and images
        const products = results.map((product) => {
          const productImages = imagesMap.get(product.product_id) || [];
          
          // Format images
          const formattedImages = productImages.map(img => ({
            image_name: img.image_name,
            image_url: `data:${img.content_type};base64,${img.image_data}`,
            content_type: img.content_type,
            is_primary: img.is_primary,
            order: img.order
          })).sort((a, b) => a.order - b.order);
          
          // Find primary image
          const primaryImage = formattedImages.find(img => img.is_primary) || 
                            (formattedImages.length > 0 ? formattedImages[0] : null);
          
          return {
            product_id: product.product_id,
            product_name: product.product_name,
            product_description: product.product_description,
            unit_price: product.unit_price,
            date_added: product.date_added,
            rating: product.rating || 0,
            wishlist_count: product.wishlist_count || 0,
            total_units: product.total_units || 0,
            images: formattedImages,
            primary_image: primaryImage,
            has_images: formattedImages.length > 0
          };
        });

        // Send the successful response
        res.status(200).json({ 
          message: 'New arrivals fetched successfully', 
          products: products,
          status: 'success'
        });
      } catch (mongoError) {
        console.error('Error fetching product images:', mongoError);
        // If image fetch fails, return products without images
        const products = results.map((product) => ({
          product_id: product.product_id,
          product_name: product.product_name,
          product_description: product.product_description,
          unit_price: product.unit_price,
          date_added: product.date_added,
          rating: product.rating || 0,
          wishlist_count: product.wishlist_count || 0,
          total_units: product.total_units || 0,
          images: [],
          primary_image: null,
          has_images: false
        }));
        
        res.status(200).json({ 
          message: 'New arrivals fetched but images could not be loaded', 
          products: products,
          status: 'partial_success'
        });
      }
    });
  } catch (err) {
    console.error('Error in getNewArrivals:', err);
    res.status(500).json({ 
      message: 'Internal server error',
      status: 'error',
      error: err.message 
    });
  }
};
