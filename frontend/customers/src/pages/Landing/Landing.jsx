//page/Landing/Landing.jsx

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Landing.css';
import { 
  FaArrowRight, 
  FaTruck, 
  FaCreditCard, 
  FaHeadset, 
  FaShieldAlt,
  FaStar, 
  FaShoppingCart, 
  FaEye,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { RiHeartLine, RiHeartFill } from 'react-icons/ri'; // Replace FaHeart with these

// Reusable ProductCard Component
const ProductCard = ({ product, isNew }) => {
  const { product_name, unit_price, rating, primary_image, product_id, Category1 } = product;
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false); // Add state for favorite
  
  // Safely format the rating value
  const formattedRating = !isNaN(parseFloat(rating)) ? parseFloat(rating).toFixed(1) : '0.0';
  
  // Determine if this is a watch product for special styling
  const isWatchProduct = Category1 === 'WATCHES';

  // Handle quick view click
  const handleQuickView = (e) => {
    e.stopPropagation(); // Prevent other click handlers
    navigate(`/user-product-view-page/${product_id}`);
  };
  
  // Handle product card click
  const handleProductClick = () => {
    navigate(`/user-product-view-page/${product_id}`);
  };
  
  // Handle favorite toggle
  const handleFavoriteToggle = (e) => {
    e.stopPropagation(); // Prevent card click
    setIsFavorite(!isFavorite);
    // Here you would add API call to add/remove from wishlist
  };
  
  return (
    <div 
      className={`product-card ${isWatchProduct ? 'watch-product' : ''}`} 
      onClick={handleProductClick}
    >
      <div className="product-image">
        {primary_image ? (
          <img 
            src={primary_image.image_url} 
            alt={product_name}
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = "/placeholder-image.jpg";
            }}
          />
        ) : (
          <img src="/placeholder-image.jpg" alt={product_name} />
        )}
        <div className="product-overlay">
          <button className="quick-view-btn" onClick={handleQuickView}>
            Quick View
          </button>
        </div>
        {isNew && <span className="new-tag">NEW</span>}
        <div className="product-wishlist" onClick={handleFavoriteToggle}>
          {isFavorite ? (
            <RiHeartFill className="wishlist-icon filled" />
          ) : (
            <RiHeartLine className="wishlist-icon" />
          )}
        </div>
      </div>
      <div className="product-info">
        <h4>{product_name}</h4>
        <div className="price-container">
          <p className="price">LKR {parseFloat(unit_price).toFixed(2)}</p>
        </div>
        <div className="product-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar 
              key={star} 
              className={star <= Math.round(rating || 0) ? "star-filled" : "star"} 
            />
          ))}
          <span className="rating-count">({formattedRating})</span>
        </div>
      </div>
    </div>
  );
};

// Feature Box Component
const FeatureBox = ({ icon: Icon, title, description }) => (
  <div className="feature-box">
    <div className="feature-icon">
      <Icon />
    </div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const Landing = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState({
    trending: true,
    newArrivals: true
  });
  const [error, setError] = useState({
    trending: null,
    newArrivals: null
  });
  
  const navigate = useNavigate();
  
  const heroContent = {
    heading: "Discover Your Style",
    subheading: "Explore the latest fashion trends and express yourself",
    cta: "Shop Now",
    image: "./1123.png",
  };

  // Fetch trending products
  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        setLoading(prev => ({ ...prev, trending: true }));
        const response = await axios.get('http://localhost:8082/api/user/trending-products');
        console.log('Trending products response:', response);
        
        if (response.data && Array.isArray(response.data.products)) {
          setTrendingProducts(response.data.products);
        } else {
          throw new Error('Invalid response format for trending products');
        }
        setError(prev => ({ ...prev, trending: null }));
      } catch (err) {
        console.error('Error fetching trending products:', err);
        setError(prev => ({ 
          ...prev, 
          trending: 'Failed to load trending products. Please try again.' 
        }));
      } finally {
        setLoading(prev => ({ ...prev, trending: false }));
      }
    };

    fetchTrendingProducts();
  }, []);

  // Fetch new arrivals
  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setLoading(prev => ({ ...prev, newArrivals: true }));
        const response = await axios.get('http://localhost:8082/api/user/new-arrivals');
        
        if (response.data && Array.isArray(response.data.products)) {
          setNewArrivals(response.data.products);
        } else {
          throw new Error('Invalid response format for new arrivals');
        }
        setError(prev => ({ ...prev, newArrivals: null }));
      } catch (err) {
        console.error('Error fetching new arrivals:', err);
        setError(prev => ({ 
          ...prev, 
          newArrivals: 'Failed to load new arrivals. Please try again.' 
        }));
      } finally {
        setLoading(prev => ({ ...prev, newArrivals: false }));
      }
    };

    fetchNewArrivals();
  }, []);

  // Category click handler
  const handleCategoryClick = async (category) => {
    try {
      const response = await axios.post('http://localhost:8082/api/user/category-filter-simple', {
        category: category
      });
      
      console.log('Category filter response:', response);
      
      if (!response.data || !Array.isArray(response.data.products)) {
        throw new Error('Invalid response from the server');
      }
      
      navigate('/user-viewpage', {
        state: { 
          searchResults: response.data.products,
          categoryName: category 
        }
      });
    } catch (err) {
      console.error('Error filtering by category:', err);
      alert('An error occurred while filtering products. Please try again.');
      
      navigate('/user-viewpage', {
        state: { searchResults: [], categoryName: category }
      });
    }
  };

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content-left">
            <span className="hero-tagline">New Collection</span>
            <h1 className="hero-heading">{heroContent.heading}</h1>
            <p className="hero-subheading">{heroContent.subheading}</p>
            <div className="hero-buttons">
              <Link to="/shop" className="cta-button primary">
                {heroContent.cta} <FaArrowRight className="arrow-icon" />
              </Link>
              <Link to="/collections" className="cta-button secondary">
                View Lookbook
              </Link>
            </div>
          </div>
          <div className="hero-image-right">
            <img src={heroContent.image} alt={heroContent.heading} />
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="categories-section">
        <div className="section-header">
          <h2>Featured Categories</h2>
          <p>Explore our wide range of collections</p>
        </div>
        
        <div className="category-grid">
          <div 
            className="category-card" 
            data-category="MEN"
            onClick={() => handleCategoryClick('MEN')}
          >
            <img src="men-category.jpg" alt="Men's Fashion" />
            <div className="category-content">
              <h3>MEN</h3>
              <p>Stylish & comfortable clothing for men</p>
              <div className="category-link">
                Explore <FaArrowRight />
              </div>
            </div>
          </div>
          
          <div 
            className="category-card" 
            data-category="WOMEN"
            onClick={() => handleCategoryClick('WOMEN')}
          >
            <img src="women-category.png" alt="Women's Fashion" />
            <div className="category-content">
              <h3>WOMEN</h3>
              <p>Elegant designs for every occasion</p>
              <div className="category-link">
                Explore <FaArrowRight />
              </div>
            </div>
          </div>
          
          <div className="category-card" onClick={() => handleCategoryClick('KIDS & BABY')}>
            <img src="kids-category.jpg" alt="Kids & Baby" />
            <div className="category-content">
              <h3>KIDS & BABY</h3>
              <p>Colorful & fun outfits for children</p>
              <div className="category-link">
                Explore <FaArrowRight />
              </div>
            </div>
          </div>
          
          <div 
            className="category-card" 
            data-category="WATCHES"
            onClick={() => handleCategoryClick('WATCHES')}
          >
            <img src="watches-category.jpg" alt="Watches" />
            <div className="category-content">
              <h3>WATCHES</h3>
              <p>Premium timepieces for every style</p>
              <div className="category-link">
                Explore <FaArrowRight />
              </div>
            </div>
          </div>
          
          <div className="category-card" onClick={() => handleCategoryClick('FOOTWEAR')}>
            <img src="footwear-category.jpg" alt="Footwear" />
            <div className="category-content">
              <h3>FOOTWEAR</h3>
              <p>Step out in style with our collection</p>
              <div className="category-link">
                Explore <FaArrowRight />
              </div>
            </div>
          </div>
          
          <div className="category-card" onClick={() => handleCategoryClick('ACCESSORIES')}>
            <img src="accessories-category.jpg" alt="Accessories" />
            <div className="category-content">
              <h3>ACCESSORIES</h3>
              <p>Complete your look with our accessories</p>
              <div className="category-link">
                Explore <FaArrowRight />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Now Section */}
      <section className="trending-section">
        <div className="section-header">
          <h2>Trending Now</h2>
          <p>Most popular choices based on customer ratings</p>
        </div>
        
        {loading.trending ? (
          <div className="loading-container">
            <p>Loading trending products...</p>
          </div>
        ) : error.trending ? (
          <div className="error-container">
            <p>{error.trending}</p>
          </div>
        ) : (
          <div className="product-grid">
            {trendingProducts.map(product => (
              <ProductCard 
                key={product.product_id} 
                product={product} 
                isNew={false} 
              />
            ))}
          </div>
        )}
        
        <div className="view-all-container">
          <div 
            className="view-all-button" 
            onClick={() => navigate('/user-viewpage', { 
              state: { searchResults: trendingProducts, categoryName: 'Trending Products' } 
            })}
          >
            View All Trending Products <FaArrowRight />
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="trending-section new-arrivals-section">
        <div className="section-header">
          <h2>New Arrivals</h2>
          <p>Check out our latest products</p>
        </div>
        
        {loading.newArrivals ? (
          <div className="loading-container">
            <p>Loading new arrivals...</p>
          </div>
        ) : error.newArrivals ? (
          <div className="error-container">
            <p>{error.newArrivals}</p>
          </div>
        ) : (
          <div className="product-grid">
            {newArrivals.map(product => (
              <ProductCard 
                key={product.product_id} 
                product={product}
                isNew={true} 
              />
            ))}
          </div>
        )}
        
        <div className="view-all-container">
          <div 
            className="view-all-button" 
            onClick={() => navigate('/user-viewpage', { 
              state: { searchResults: newArrivals, categoryName: 'New Arrivals' } 
            })}
          >
            View All New Arrivals <FaArrowRight />
          </div>
        </div>
      </section>

      {/* Why Shop With Us */}
      <section className="why-shop-section top-section">
        <div className="section-header">
          <h2>Why Shop With Us</h2>
          <p>We provide the best experience for our customers</p>
        </div>
        
        <div className="why-shop-grid">
          <div className="why-shop-item">
            <div className="why-shop-icon">
              <FaShieldAlt />
            </div>
            <h3>100% Secure Transactions</h3>
            <p>All payments are processed securely</p>
          </div>
          
          <div className="why-shop-item">
            <div className="why-shop-icon">
              <FaTruck />
            </div>
            <h3>Fast Delivery</h3>
            <p>Get your order delivered quickly</p>
          </div>
          
          <div className="why-shop-item">
            <div className="why-shop-icon">
              <FaCreditCard />
            </div>
            <h3>Easy Returns</h3>
            <p>30-day hassle-free return policy</p>
          </div>
          
          <div className="why-shop-item">
            <div className="why-shop-icon">
              <FaHeadset />
            </div>
            <h3>24/7 Support</h3>
            <p>Get support whenever you need it</p>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <h2>Subscribe to Our Newsletter</h2>
          <p>Get the latest updates on new products and upcoming sales</p>
          <form className="newsletter-form">
            <input type="email" placeholder="Enter your email" required />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </section>
 </div>
  );
};

export default Landing;
