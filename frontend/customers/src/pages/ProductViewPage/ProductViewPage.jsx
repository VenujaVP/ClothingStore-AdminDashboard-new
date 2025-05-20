//pages/Viewpage/ProductViewPage.jsx

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RiHeartLine, RiHeartFill } from 'react-icons/ri';
import { FaShoppingCart, FaStar, FaRegStar, FaChevronLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ProductViewPage.css';

const ProductViewPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [processingWishlist, setProcessingWishlist] = useState(false);
  
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');

  const noImagePlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='24' font-weight='bold' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ENO IMAGE%3C/text%3E%3C/svg%3E";

  useEffect(() => {
    axios.get('http://localhost:8082/tokenverification', { withCredentials: true })
      .then(res => {
        if (res.data.Status === "Success") {
          setIsLoggedIn(true);
          const newUserId = res.data.id;
          setUserId(newUserId);
          console.log("Current user ID:", newUserId);
        } else {
          setIsLoggedIn(false);
          setUserId('');
        }
      })
      .catch(err => {
        console.error("Authentication check error:", err);
        setIsLoggedIn(false);
        setUserId('');
      });
  }, []);

  // Check wishlist status when user id or product id changes
  useEffect(() => {
    if (isLoggedIn && userId && productId) {
      checkWishlistStatus();
    }
  }, [userId, productId, isLoggedIn]);

  const checkWishlistStatus = async () => {
    try {
      const response = await axios.get(`http://localhost:8082/api/user/wishlist/check/${userId}/${productId}`);
      if (response.data.success) {
        setIsFavorite(response.data.isInWishlist);
      }
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8082/api/user/fetch-product-details/${productId}`);   

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch product');
        }

        const productData = response.data.product;
        console.log('Product data received:', productData);
        
        const sizes = [...new Set(productData.variations.map(v => v.size))];
        const colors = [...new Set(productData.variations.map(v => v.color))];
        
        const totalUnits = productData.variations.reduce((sum, variation) => sum + variation.quantity, 0);
        
        setProduct({
          ...productData,
          sizes,
          colors,
          total_units: totalUnits,
          mainImage: productData.image_urls?.[0] || noImagePlaceholder,
          images: productData.image_urls?.length ? productData.image_urls : [noImagePlaceholder]
        });
        
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!product || !selectedSize || !selectedColor) {
      setSelectedVariation(null);
      setAvailableQuantity(0);
      return;
    }

    const variation = product.variations.find(
      v => v.size === selectedSize && v.color === selectedColor && v.in_stock === 1
    );

    if (variation) {
      setSelectedVariation(variation);
      setAvailableQuantity(variation.quantity);
      setQuantity(prev => Math.min(prev, variation.quantity));
    } else {
      setSelectedVariation(null);
      setAvailableQuantity(0);
      setQuantity(1);
    }
  }, [selectedSize, selectedColor, product]);

  const handleQuantityChange = (e) => {
    const value = Math.max(1, Math.min(availableQuantity, parseInt(e.target.value) || 1));
    setQuantity(value);
  };

  const incrementQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, availableQuantity));
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const checkAuth = () => {
    if (!isLoggedIn) {
      setShowLoginPopup(true);
      return false;
    }
    return true;
  };

  const navigateToLogin = () => {
    const currentPath = window.location.pathname;
    navigate('/user-login', { state: { from: currentPath } });
  };

  const buyNow = () => {
    if (!checkAuth()) {
      return;
    }

    try {
      if (!selectedVariation || availableQuantity <= 0) {
        toast.error('Please select a valid size and color combination');
        return;
      }
  
      if (quantity > availableQuantity) {
        toast.error('Selected quantity exceeds available stock');
        return;
      }
  
      const unitPrice = parseFloat(product.unit_price);
      const totalPrice = unitPrice * quantity;
  
      if (isNaN(unitPrice) || isNaN(totalPrice)) {
        throw new Error('Invalid price values');
      }
  
      const cartItem = {
        cartItemId: `direct-${Date.now()}`,
        productId: product.product_id,
        productName: product.product_name,
        variationId: selectedVariation.VariationID,
        size: selectedSize,
        color: selectedColor,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        imageUrl: product.images[0] !== noImagePlaceholder ? product.images[0] : null,
      };
  
      console.log('Navigating with cart item:', cartItem);
      
      navigate('/user-pre-payment-page', { 
        state: {
          cart: [cartItem],
          fromBuyNow: true
        }
      });
    } catch (error) {
      console.error('Error in buyNow:', error);
      toast.error('Failed to proceed to checkout');
    }
  };

  const addToCart = async () => {
    if (!checkAuth()) {
      return;
    }

    console.log("[1] Add to cart initiated");
    
    if (!selectedVariation) {
      console.log("[2] Missing variation - Size:", selectedSize, "Color:", selectedColor);
      toast.error('Please select size and color');
      return;
    }
  
    if (availableQuantity <= 0) {
      console.log("[3] Out of stock - Available:", availableQuantity);
      toast.error('This combination is out of stock');
      return;
    }
  
    if (quantity > availableQuantity) {
      console.log("[4] Quantity exceeds stock - Qty:", quantity, "Available:", availableQuantity);
      toast.error(`Only ${availableQuantity} units available`);
      return;
    }
  
    console.log("[5] Attempting to add to cart", {
      userId,
      productId: product.product_id,
      variationId: selectedVariation.VariationID,
      quantity
    });
  
    try {
      setAddingToCart(true);
      console.log("[6] Making API call");
      
      const response = await axios.post('http://localhost:8082/api/user/add-to-cart', {
        userId,
        item: {
          productId: product.product_id,
          variationId: selectedVariation.VariationID,
          quantity: quantity
        }
      });
  
      console.log("[7] API Response:", response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to add to cart');
      }
  
      toast.success(`${quantity} × ${product.product_name} added to cart!`);
      
    } catch (error) {
      console.error('[8] Cart error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to update cart';
      toast.error(errorMessage);
    } finally {
      setAddingToCart(false);
      console.log("[9] Finished add to cart attempt");
    }
  };

  const toggleFavorite = async () => {
    if (!checkAuth()) {
      return;
    }

    if (processingWishlist) return; // Prevent multiple clicks
    
    try {
      setProcessingWishlist(true);
      
      if (isFavorite) {
        // Remove from wishlist
        const response = await axios.post('http://localhost:8082/api/user/wishlist/remove', {
          userId,
          productId
        });
        
        if (response.data.success) {
          setIsFavorite(false);
          // Update local wishlist count to show immediate feedback
          if (product) {
            setProduct({
              ...product,
              wishlist_count: Math.max((product.wishlist_count || 0) - 1, 0)
            });
          }
          toast.success('Removed from wishlist');
        }
      } else {
        // Add to wishlist
        const response = await axios.post('http://localhost:8082/api/user/wishlist/add', {
          userId,
          productId
        });
        
        if (response.data.success) {
          setIsFavorite(true);
          // Update local wishlist count to show immediate feedback
          if (product) {
            setProduct({
              ...product,
              wishlist_count: (product.wishlist_count || 0) + 1
            });
          }
          toast.success('Added to wishlist');
        }
      }
    } catch (error) {
      console.error('Wishlist operation failed:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setProcessingWishlist(false);
    }
  };

  const changeImage = (index) => {
    setCurrentImage(index);
  };

  const renderStars = (rating) => {
    const numericRating = typeof rating === 'number' ? rating : parseFloat(rating || 0);
    
    return Array(5).fill(0).map((_, i) => (
      i < Math.floor(numericRating) ? 
        <FaStar key={i} className="star-filled" /> : 
        <FaRegStar key={i} className="star-empty" />
    ));
  };

  const renderAvailabilityStatus = () => {
    if (!selectedSize || !selectedColor) {
      return (
        <div className="availability-status">
          <span className="select-options">Please select size and color</span>
        </div>
      );
    }

    if (!selectedVariation) {
      return (
        <div className="availability-status">
          <span className="out-of-stock">This combination is not available</span>
        </div>
      );
    }

    return (
      <div className="availability-status">
        <span className="in-stock">In Stock</span>
        <span className="available-quantity">({availableQuantity} available)</span>
      </div>
    );
  };

  const LoginPopup = () => (
    <div className="login-popup-overlay">
      <div className="login-popup">
        <h3>Login Required</h3>
        <p>Please login to continue with this action.</p>
        <div className="login-popup-buttons">
          <button className="login-now-btn" onClick={navigateToLogin}>
            Login Now
          </button>
          <button className="close-popup-btn" onClick={() => setShowLoginPopup(false)}>
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="back-button">
          <FaChevronLeft /> Go Back
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="error-container">
        <p>Product not found</p>
        <button onClick={() => navigate(-1)} className="back-button">
          <FaChevronLeft /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="product-view-page">
      {showLoginPopup && <LoginPopup />}
      
      <button onClick={() => navigate(-1)} className="back-button-1">
        <FaChevronLeft /> Back to Products
      </button>

      <div className="product-view-container">
        <div className="product-images">
          <img 
            src={product.images[currentImage]} 
            alt={product.product_name} 
            className="main-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = noImagePlaceholder;
            }}
          />
          <div className="thumbnail-images">
            {product.images.map((img, index) => (
              <img 
                key={index}
                src={img} 
                alt={`Thumbnail ${index + 1}`}
                className={index === currentImage ? 'thumbnail active' : 'thumbnail'}
                onClick={() => changeImage(index)}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = noImagePlaceholder;
                }}
              />
            ))}
          </div>
        </div>

        <div className="product-details">
          <h1 className="product-name">{product.product_name}</h1>
          <div className="product-description" dangerouslySetInnerHTML={{ __html: product.product_description }} />
          
          <div className="stock-status">
            {product.total_units > 0 ? (
              <span className="in-stock">{product.total_units} available in total</span>
            ) : (
              <span className="out-of-stock">Out of stock</span>
            )}
          </div>
          
          <div className="product-meta">
            <div className="product-rating">
              {renderStars(product.rating)} 
              <span className="rating-value">
                ({typeof product.rating === 'number' 
                  ? product.rating.toFixed(1) 
                  : parseFloat(product.rating || 0).toFixed(1)})
              </span>
              <span className="review-count">{product.review_count || 0} reviews</span>
            </div>
          </div>

          <div className="product-price">
            LKR {Number(product.unit_price)?.toFixed(2)}
            {product.original_price && product.original_price > product.unit_price && (
              <span className="original-price">LKR {Number(product.original_price).toFixed(2)}</span>
            )}
          </div>

          <div className="product-variations">
            {product.sizes?.length > 0 && (
              <div className="variation-group">
                <label>Size:</label>
                <div className="size-options">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors?.length > 0 && (
              <div className="variation-group">
                <label>Color:</label>
                <div className="color-text-options">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      className={`color-text-option ${selectedColor === color ? 'selected' : ''}`}
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {renderAvailabilityStatus()}

          <div className="product-actions">
            {selectedVariation && availableQuantity > 0 && (
              <div className="quantity-group">
                <label>Quantity:</label>
                <div className="quantity-selector">
                  <button onClick={decrementQuantity}>-</button>
                  <input 
                    type="number" 
                    min="1" 
                    max={availableQuantity}
                    value={quantity}
                    onChange={handleQuantityChange}
                  />
                  <button onClick={incrementQuantity}>+</button>
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button 
                className={`add-to-cart ${addingToCart ? 'loading' : ''}`} 
                onClick={addToCart}
                disabled={!selectedVariation || availableQuantity <= 0 || addingToCart}
              >
                {addingToCart ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    <FaShoppingCart /> Add to Cart
                  </>
                )}
              </button>

              <button 
                className="buy-now" 
                onClick={buyNow}
                disabled={!selectedVariation || availableQuantity <= 0}
              >
                Buy Now
              </button>
              <div className="wishlist-section">
                <button 
                  className={`favorite-button ${isFavorite ? 'favorited' : ''} ${processingWishlist ? 'processing' : ''}`}
                  onClick={toggleFavorite}
                  disabled={processingWishlist}
                >
                  {processingWishlist ? (
                    <span className="wishlist-spinner"></span>
                  ) : isFavorite ? (
                    <RiHeartFill />
                  ) : (
                    <RiHeartLine />
                  )}
                </button>
                <span className="wishlist-count">{product.wishlist_count || 0}</span>
              </div>
            </div>
          </div>

          <div className="product-description-section">
            <h2>Product Details</h2>            
            <div className="product-specs">
              {product.material && (
                <div className="spec-row">
                  <span className="spec-label">Material:</span>
                  <span className="spec-value">{product.material}</span>
                </div>
              )}
              {product.fabric_type && (
                <div className="spec-row">
                  <span className="spec-label">Fabric Type:</span>
                  <span className="spec-value">{product.fabric_type}</span>
                </div>
              )}
              {product.shipping_weight && (
                <div className="spec-row">
                  <span className="spec-label">Shipping Weight:</span>
                  <span className="spec-value">{product.shipping_weight} kg</span>
                </div>
              )}
              {product.return_policy && (
                <div className="spec-row">
                  <span className="spec-label">Return Policy:</span>
                  <span className="spec-value">{product.return_policy}</span>
                </div>
              )}
            </div>
          </div>

          {product.Category1 && (
            <div className="product-categories">
              <h2>Categories</h2>
              <div className="category-breadcrumbs">
                {[product.Category1, product.Category2, product.Category3]
                  .filter(Boolean)
                  .map((category, index) => (
                    <React.Fragment key={category}>
                      {index > 0 && <span className="breadcrumb-separator">/</span>}
                      <span className="breadcrumb-item">{category}</span>
                    </React.Fragment>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="customer-reviews-section">
        <h2>Customer Reviews {product.reviews?.length > 0 && `(${product.reviews.length})`}</h2>
        
        {product.reviews?.length > 0 ? (
          <div className="reviews-container">
            {product.reviews.map((review) => (
              <div key={review._id} className="review">
                <div className="review-header">
                  <div className="review-author">{review.userName || 'Anonymous'}</div>
                  <div className="review-rating">{renderStars(review.rating)}</div>
                  <div className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <h4 className="review-title">{review.title}</h4>
                <div className="review-text">{review.comment}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
        )}
      </div>
    </div>
  );
};

export default ProductViewPage;