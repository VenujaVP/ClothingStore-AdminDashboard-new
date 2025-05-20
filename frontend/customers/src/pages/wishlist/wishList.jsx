// pages/wishlist/wishList.jsx

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaRegHeart, FaHeart, FaTrash, FaEye, FaSpinner } from 'react-icons/fa';
import './wishList.css';
import withAuth from '../withAuth';

const WishList = ({ userId }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removing, setRemoving] = useState({});
  const navigate = useNavigate();

  // Fetch wishlist items once userId is available
  useEffect(() => {
    if (userId) {
      fetchWishlistItems();
    }
  }, [userId]);

  const fetchWishlistItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8082/api/user/wishlist/${userId}`);
      
      if (response.data.success) {
        // Add placeholder image if no image URL is provided
        const itemsWithImages = response.data.wishlist.map(item => ({
          ...item,
          image_url: item.image_url || "https://via.placeholder.com/150?text=No+Image"
        }));
        setWishlistItems(itemsWithImages);
      } else {
        setError('Failed to load wishlist items');
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setError('Failed to fetch your wishlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      setRemoving(prev => ({ ...prev, [productId]: true }));
      
      const response = await axios.post('http://localhost:8082/api/user/wishlist/remove', {
        userId,
        productId
      });
      
      if (response.data.success) {
        // Update the local state to remove the item
        setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
        toast.success('Item removed from wishlist');
      } else {
        toast.error('Failed to remove item from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('An error occurred while removing the item');
    } finally {
      setRemoving(prev => ({ ...prev, [productId]: false }));
    }
  };

  const addToCart = async (item) => {
    try {
      // Implementation similar to ShoppingCart's addToCart
      const cartItem = {
        productId: item.product_id,
        variationId: item.variation_id || null, // You might need to handle this differently
        quantity: 1
      };
      
      // Check if variationId is available, if not, show error
      if (!cartItem.variationId) {
        toast.warning('Please select product options on the product page');
        navigate(`/product/${item.product_id}`);
        return;
      }
      
      const response = await axios.post('http://localhost:8082/api/user/add-to-cart', {
        userId,
        item: cartItem
      });
      
      if (response.data.success) {
        toast.success('Added to cart successfully');
      } else {
        toast.error(response.data.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/user-product-view-page/${productId}`);
  };

  if (loading) {
    return (
      <div className="wishlist-container">
        <h1>Your Wishlist</h1>
        <div className="loading-spinner">
          <FaSpinner className="spinner-icon" />
          <span>Loading your wishlist...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wishlist-container">
        <h1>Your Wishlist</h1>
        <div className="error-message">{error}</div>
        <button className="retry-button" onClick={fetchWishlistItems}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <h1>Your Wishlist</h1>
      
      {wishlistItems.length === 0 ? (
        <div className="empty-wishlist">
          <div className="empty-wishlist-icon">
            <FaRegHeart size={60} />
          </div>
          <h2>Your wishlist is empty</h2>
          <p>Add items you love to your wishlist. Review them anytime and easily move them to the cart.</p>
          <Link to="/" className="shop-now-btn">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="wishlist-items">
          {wishlistItems.map((item) => (
            <div key={item.wishlist_id || item.product_id} className="wishlist-item">
              <div className="wishlist-item-image">
                <img 
                  src={item.image_url} 
                  alt={item.ProductName} 
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://via.placeholder.com/150?text=No+Image"
                  }}
                />
              </div>
              
              <div className="wishlist-item-details">
                <h3>
                  <Link to={`/user-product-view-page/${item.product_id}`}>{item.ProductName}</Link>
                </h3>
                <p className="item-price">LKR {(Number(item.UnitPrice) || 0).toFixed(2)}</p>
                
                <div className="item-categories">
                  {item.Category1 && <span className="category-tag">{item.Category1}</span>}
                </div>
              </div>
              
              <div className="wishlist-item-actions">
                <button 
                  className="add-to-cart-btn"
                  onClick={() => handleProductClick(item.product_id)}
                >
                  <FaEye /> View
                </button>
                
                <button 
                  className={`remove-from-wishlist-btn ${removing[item.product_id] ? 'removing' : ''}`}
                  onClick={() => removeFromWishlist(item.product_id)}
                  disabled={removing[item.product_id]}
                >
                  {removing[item.product_id] ? (
                    <span className="removing-spinner"></span>
                  ) : (
                    <FaTrash />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Apply the withAuth HOC to the WishList component
const AuthenticatedWishList = withAuth(WishList);
export default AuthenticatedWishList;