//conrrollers/userControllersNew.js
import sqldb from '../config/sqldb.js';
import { connectToDatabase } from '../config/mongodb.js';

// Add wishlist item
export const addToWishlist = async (req, res) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID and Product ID are required' 
    });
  }

  try {
    // Check if product already exists in wishlist
    sqldb.query(
      'SELECT * FROM wishlists WHERE customer_id = ? AND product_id = ?',
      [userId, productId],
      (error, existingItem) => {
        if (error) {
          console.error('Error checking wishlist:', error);
          return res.status(500).json({ success: false, message: 'Failed to check wishlist' });
        }

        // If product already in wishlist, return success without changes
        if (existingItem.length > 0) {
          return res.json({ 
            success: true, 
            message: 'Product is already in wishlist',
            isInWishlist: true
          });
        }

        // Add product to wishlist
        sqldb.query(
          'INSERT INTO wishlists (customer_id, product_id) VALUES (?, ?)',
          [userId, productId],
          (error) => {
            if (error) {
              console.error('Error adding to wishlist:', error);
              return res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
            }

            // Calculate actual wishlist count for this product
            sqldb.query(
              'SELECT COUNT(*) as totalWishlists FROM wishlists WHERE product_id = ?',
              [productId],
              (error, countResult) => {
                if (error) {
                  console.error('Error counting wishlists:', error);
                  return res.status(500).json({ success: false, message: 'Failed to count wishlists' });
                }

                const totalWishlists = countResult[0].totalWishlists;

                // Update wishlist count in product_table with the accurate count
                sqldb.query(
                  'UPDATE product_table SET WishlistCount = ? WHERE ProductID = ?',
                  [totalWishlists, productId],
                  (error) => {
                    if (error) {
                      console.error('Error updating wishlist count:', error);
                      return res.status(500).json({ success: false, message: 'Failed to update wishlist count' });
                    }

                    res.json({ 
                      success: true, 
                      message: 'Product added to wishlist successfully',
                      isInWishlist: true
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in wishlist operation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add to wishlist' 
    });
  }
};

// Remove wishlist item
export const removeFromWishlist = async (req, res) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID and Product ID are required' 
    });
  }

  try {
    // Check if product exists in wishlist
    sqldb.query(
      'SELECT * FROM wishlists WHERE customer_id = ? AND product_id = ?',
      [userId, productId],
      (error, existingItem) => {
        if (error) {
          console.error('Error checking wishlist:', error);
          return res.status(500).json({ success: false, message: 'Failed to check wishlist' });
        }

        // If product not in wishlist, return early
        if (existingItem.length === 0) {
          return res.json({ 
            success: true, 
            message: 'Product was not in wishlist',
            isInWishlist: false
          });
        }

        // Remove product from wishlist
        sqldb.query(
          'DELETE FROM wishlists WHERE customer_id = ? AND product_id = ?',
          [userId, productId],
          (error) => {
            if (error) {
              console.error('Error removing from wishlist:', error);
              return res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
            }

            // Calculate actual wishlist count for this product
            sqldb.query(
              'SELECT COUNT(*) as totalWishlists FROM wishlists WHERE product_id = ?',
              [productId],
              (error, countResult) => {
                if (error) {
                  console.error('Error counting wishlists:', error);
                  return res.status(500).json({ success: false, message: 'Failed to count wishlists' });
                }

                const totalWishlists = countResult[0].totalWishlists;

                // Update wishlist count in product_table with the accurate count
                sqldb.query(
                  'UPDATE product_table SET WishlistCount = ? WHERE ProductID = ?',
                  [totalWishlists, productId],
                  (error) => {
                    if (error) {
                      console.error('Error updating wishlist count:', error);
                      return res.status(500).json({ success: false, message: 'Failed to update wishlist count' });
                    }

                    res.json({ 
                      success: true, 
                      message: 'Product removed from wishlist successfully',
                      isInWishlist: false
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in wishlist operation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove from wishlist' 
    });
  }
};

// Check if product is in user's wishlist
export const checkWishlistStatus = async (req, res) => {
  const { userId, productId } = req.params;

  if (!userId || !productId) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID and Product ID are required' 
    });
  }

  try {
    sqldb.query(
      'SELECT * FROM wishlists WHERE customer_id = ? AND product_id = ?',
      [userId, productId],
      (error, result) => {
        if (error) {
          console.error('Error checking wishlist status:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to check wishlist status' 
          });
        }

        res.json({ 
          success: true, 
          isInWishlist: result.length > 0 
        });
      }
    );
  } catch (error) {
    console.error('Error in wishlist operation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check wishlist status' 
    });
  }
};

// Get user's wishlist
export const getUserWishlist = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID is required' 
    });
  }

  try {
    sqldb.query(
      `SELECT w.wishlist_id, w.customer_id, w.product_id, w.added_at,
              p.ProductName, p.UnitPrice, p.ProductDescription, 
              p.Category1, p.Category2, p.Category3
       FROM wishlists w
       JOIN product_table p ON w.product_id = p.ProductID
       WHERE w.customer_id = ?`,
      [userId],
      async (error, wishlistItems) => {
        if (error) {
          console.error('Error fetching wishlist:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch wishlist' 
          });
        }

        try {
          // Connect to MongoDB to get product images
          const { db } = await connectToDatabase();
          const productsCollection = db.collection('products');
          
          // Extract product IDs for image lookup
          const productIds = wishlistItems.map(item => item.product_id);
          
          // Fetch images for all products in one query
          const productsWithImages = await productsCollection.find(
            { _id: { $in: productIds } },
            { projection: { _id: 1, images: 1 } }
          ).toArray();
          
          // Create a map for quick image lookup
          const imagesMap = new Map();
          productsWithImages.forEach(product => {
            if (product.images && product.images.length > 0) {
              // Find the primary image or use the first one
              const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
              imagesMap.set(product._id.toString(), `data:${primaryImage.content_type};base64,${primaryImage.image_data}`);
            }
          });
          
          // Add image URLs to wishlist items
          const enrichedWishlistItems = wishlistItems.map(item => ({
            ...item,
            image_url: imagesMap.get(item.product_id) || null
          }));
          
          res.json({ 
            success: true, 
            wishlist: enrichedWishlistItems 
          });
        } catch (mongoError) {
          console.error('Error fetching product images:', mongoError);
          // If image fetch fails, return wishlist items without images
          res.json({ 
            success: true, 
            wishlist: wishlistItems,
            image_error: 'Could not load product images'
          });
        }
      }
    );
  } catch (error) {
    console.error('Error in wishlist operation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch wishlist' 
    });
  }
};

