//pages/Viewpage/Viewpage.jsx

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RiHeartLine, RiHeartFill } from 'react-icons/ri'; // Heart icons from react-icons/ri
import { FaShoppingCart } from 'react-icons/fa'; // Shopping cart icon from react-icons/fa
import './Viewpage.css';
import placeholderImage from '../../assets/placeholder.png'; // Adjust the path as needed

const Viewpage = () => {
  const [products, setProducts] = useState([]); // State to store product data
  const [loading, setLoading] = useState(true); // State to handle loading state
  const [error, setError] = useState(null); // State to handle errors
  const [currentPage, setCurrentPage] = useState(1); // State for pagination
  const [favorites, setFavorites] = useState({}); // State to track favorite products
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track authentication status
  const [userId, setUserId] = useState(''); // State to store user ID if logged in
  const productsPerPage = 60; // Number of products per page

  // Get the search results from React Router's state
  const location = useLocation();
  const navigate = useNavigate();
  const searchResults = location.state?.searchResults;

  // Check if user is logged in
  useEffect(() => {
    axios.get('http://localhost:8082/tokenverification', { withCredentials: true })
      .then(res => {
        if (res.data.Status === "Success") {
          setIsLoggedIn(true);
          const newUserId = res.data.id;
          setUserId(newUserId);
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(err => {
        console.error("Authentication check error:", err);
        setIsLoggedIn(false);
      });
  }, []);

  const handleProductClick = (productId) => {
    navigate(`/user-product-view-page/${productId}`);
  };

  // Fetch product details from the backend only if search results are passed
  useEffect(() => {
    if (searchResults) {
      setProducts(searchResults); // Use search results from state
      setLoading(false);
    } else {
      // If no search results are passed, show a message
      setError('No search results found. Please try again.');
      setLoading(false);
    }
  }, [searchResults]);

  // Calculate total pages
  const totalPages = Math.ceil(products.length / productsPerPage);

  // Get current products for the current page
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Toggle favorite status for a product
  const toggleFavorite = (productId) => {
    if (!isLoggedIn) {
      // Redirect to login if user is not authenticated
      navigate('/user-login', { state: { from: location.pathname } });
      return;
    }
    setFavorites((prevFavorites) => ({
      ...prevFavorites,
      [productId]: !prevFavorites[productId],
    }));
    // Here you would also implement the API call to save the favorite status
  };

  // Function to render star ratings
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<span key={i} className="vp-star vp-star-filled">★</span>); // Filled star
      } else {
        stars.push(<span key={i} className="vp-star">☆</span>); // Empty star
      }
    }
    return stars;
  };

  if (loading) {
    return <div className="vp-loading">Loading...</div>; // Show loading message
  }

  if (error) {
    return <div className="vp-error">{error}</div>; // Show error message
  }

  if (products.length === 0) {
    return <div className="vp-error">No products found. Please try a different search.</div>; // Show no products message
  }

  return (
    <div className="vp-dashboard">
      <div className="vp-product-grid">
        {currentProducts.map((product) => (
          <div key={product.product_id} 
               className="vp-product-card"
               onClick={() => handleProductClick(product.product_id)} // Handle product click
          >
            <div className="vp-square-image-container">
              <img 
                src={product.primary_image ? product.primary_image.image_url : placeholderImage} 
                alt={product.product_name} 
                className="vp-product-image" 
                onError={(e) => {
                  e.target.onerror = null; // Prevent infinite loop
                  e.target.src = placeholderImage;
                }}
              />
              {/* Favorite (heart) icon */}
              <div 
                className="vp-favorite-icon" 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering parent click
                  toggleFavorite(product.product_id);
                }}
              >
                {favorites[product.product_id] ? (
                  <RiHeartFill className="vp-heart-icon vp-heart-icon-filled" />
                ) : (
                  <RiHeartLine className="vp-heart-icon" />
                )}
              </div>
              {/* Shopping cart icon */}
              <div 
                className="vp-cart-icon"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering parent click
                  // Add shopping cart functionality here
                  if (!isLoggedIn) {
                    navigate('/user-login', { state: { from: location.pathname } });
                  }
                }}
              >
              </div>
            </div>
            <div className="vp-product-details">
              <h2 className="vp-product-name">{product.product_name}</h2>
              <p className="vp-product-description">
                {product.product_description.length > 100
                  ? `${product.product_description.substring(0, 100)}...`
                  : product.product_description}
              </p>
              <div className="vp-product-price">LKR {product.unit_price}</div>
              <div className="vp-product-rating">
                {renderStars(product.rating)} ({product.rating})
              </div>

              <div className="vp-product-stock">
                {product.total_units > 0 ? (
                  <span className="vp-in-stock">In Stock </span>
                ) : (
                  <span className="vp-sold-out">Sold Out </span>
                )}
                {product.total_units > 0 && product.total_units < 10 && (
                  <span className="vp-low-stock">
                    (Only {product.total_units} {product.total_units === 1 ? 'item' : 'items'} left)
                  </span>
                )}
              </div>

              <div className="vp-wishlist-count">Wishlist: {product.wishlist_count}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="vp-pagination">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            className={`vp-page-button ${currentPage === index + 1 ? 'vp-active' : ''}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Viewpage; // Export the component directly without withAuth