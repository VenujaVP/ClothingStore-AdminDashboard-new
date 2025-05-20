/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */

//import assets from '../../assets/Assets';

import React, { useState, useEffect } from 'react';
import './Homepage.css';
import withAuth from '../withAuth';
import assets from '../../assets/Assets';

const Homepage = () => {
  // Sample data for hero carousel images
  const heroImages = [
    assets.a,
    assets.a,
    assets.a,
    assets.a,
    assets.a,
  ];

  // Sample data for new arrivals
  const newArrivals = [
    {
      id: 1,
      name: 'New Product 1',
      price: 200,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 2,
      name: 'New Product 2',
      price: 300,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 3,
      name: 'New Product 3',
      price: 250,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 4,
      name: 'New Product 4',
      price: 400,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 5,
      name: 'New Product 5',
      price: 500,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 6,
      name: 'New Product 6',
      price: 350,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 7,
      name: 'New Product 7',
      price: 450,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 8,
      name: 'New Product 8',
      price: 550,
      image: 'https://via.placeholder.com/200',
    },
  ];

  // Sample data for featured products
  const featuredProducts = [
    {
      id: 1,
      name: 'Featured Product 1',
      price: 200,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 2,
      name: 'Featured Product 2',
      price: 300,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 3,
      name: 'Featured Product 3',
      price: 250,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 4,
      name: 'Featured Product 4',
      price: 400,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 5,
      name: 'Featured Product 5',
      price: 500,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 6,
      name: 'Featured Product 6',
      price: 350,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 7,
      name: 'Featured Product 7',
      price: 450,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 8,
      name: 'Featured Product 8',
      price: 550,
      image: 'https://via.placeholder.com/200',
    },
  ];

  // Sample data for featured categories
  const featuredCategories = [
    { id: 1, name: 'Men', image: 'https://via.placeholder.com/300' },
    { id: 2, name: 'Women', image: 'https://via.placeholder.com/300' },
    { id: 3, name: 'Kids', image: 'https://via.placeholder.com/300' },
    { id: 4, name: 'Accessories', image: 'https://via.placeholder.com/300' },
    { id: 5, name: 'Shoes', image: 'https://via.placeholder.com/300' },
    { id: 6, name: 'Bags', image: 'https://via.placeholder.com/300' },
  ];

  // Sample data for recommendations
  const recommendations = [
    {
      id: 1,
      name: 'Recommended Product 1',
      price: 200,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 2,
      name: 'Recommended Product 2',
      price: 300,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 3,
      name: 'Recommended Product 3',
      price: 250,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 4,
      name: 'Recommended Product 4',
      price: 400,
      image: 'https://via.placeholder.com/200',
    },
  ];

  // State for hero carousel
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide hero carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Add these new functions for carousel control
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="homepage">
      {/* Updated Hero Section with Carousel */}
      <section className="hero-section">
        <div className="hero-carousel-container">
          <div
            className="hero-carousel"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {heroImages.map((image, index) => (
              <div key={index} className="hero-slide">
                <img 
                  src={image} 
                  alt={`Hero Slide ${index + 1}`}
                  style={{ width: '100%' }}
                />
              </div>
            ))}
          </div>
          
          {/* Navigation Buttons */}
          <button className="carousel-button prev" onClick={prevSlide}>
            &#10094;
          </button>
          <button className="carousel-button next" onClick={nextSlide}>
            &#10095;
          </button>

          {/* Slide Indicators */}
          <div className="carousel-indicators">
            {heroImages.map((_, index) => (
              <button
                key={index}
                className={`indicator ${currentSlide === index ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="new-arrivals">
        <h2>New Arrivals</h2>
        <div className="product-grid">
          {newArrivals.map((product) => (
            <div key={product.id} className="product-card">
              <img src={product.image} alt={product.name} className="product-image" />
              <div className="product-details">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-price">LKR {product.price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-products">
        <h2>Featured Products</h2>
        <div className="product-grid">
          {featuredProducts.map((product) => (
            <div key={product.id} className="product-card">
              <img src={product.image} alt={product.name} className="product-image" />
              <div className="product-details">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-price">LKR {product.price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Categories Section */}
      <section className="featured-categories">
        <h2>Featured Categories</h2>
        <div className="categories-carousel">
          {featuredCategories.map((category) => (
            <div key={category.id} className="category-card">
              <img src={category.image} alt={category.name} className="category-image" />
              <h3 className="category-name">{category.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendation Section */}
      <section className="recommendations">
        <h2>Recommended for You</h2>
        <div className="product-grid">
          {recommendations.map((product) => (
            <div key={product.id} className="product-card">
              <img src={product.image} alt={product.name} className="product-image" />
              <div className="product-details">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-price">LKR {product.price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const AuthenticatedHomepage = withAuth(Homepage);
export default AuthenticatedHomepage;