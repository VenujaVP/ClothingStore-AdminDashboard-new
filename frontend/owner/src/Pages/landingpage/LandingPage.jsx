/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaStore, 
  FaChartLine, 
  FaTshirt, 
  FaTruck, 
  FaUsers, 
  FaShieldAlt, 
  FaUserCog,
  FaUserAlt,
  FaBoxOpen,
  FaTag,
  FaPalette,
  FaCreditCard,
  FaDesktop,
  FaSignInAlt,
  FaArrowRight,
  FaCheckCircle,
  FaLightbulb,
  FaHandshake,
  FaCog,
  FaClipboardCheck
} from 'react-icons/fa';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <div className="brand-header">
        <div className="brand-logo">
          <FaTshirt className="brand-icon" />
          <h1>PLOCITY</h1>
        </div>
        <p className="brand-tagline">Clothing Management System</p>
      </div>
      
      <div className="landing-content">
        <div className="landing-header">
          <h1>Welcome to PLOCITY Portal</h1>
          <p className="subtitle">Streamline your clothing business operations with our comprehensive management system</p>
        </div>

        <div className="hero-section">
          <div className="hero-content">
            <h2>Manage Your Clothing Business with Confidence</h2>
            <p>PLOCITY provides a complete solution for inventory management, order processing, and sales tracking designed specifically for clothing retailers.</p>
            <ul className="hero-benefits">
              <li><FaCheckCircle className="benefit-icon" /> Streamlined inventory management</li>
              <li><FaCheckCircle className="benefit-icon" /> Simplified order processing</li>
              <li><FaCheckCircle className="benefit-icon" /> Real-time sales analytics</li>
              <li><FaCheckCircle className="benefit-icon" /> Secure user management</li>
            </ul>
          </div>
          <div className="login-card">
            <div className="login-card-content">
              <FaSignInAlt className="login-icon" />
              <h2>Portal Login</h2>
              <p>Access your dashboard to manage inventory, track sales, and process orders</p>
              <Link to="/owner-login" className="login-button">
                Sign In <FaArrowRight className="arrow-icon" />
              </Link>
              <div className="login-help">
                <p>Need assistance? <a href="mailto:support@plocity.com">Contact Support</a></p>
              </div>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>About POLOCITY</h2>
          <p>POLOCITY is a premier clothing management system designed to help clothing retailers streamline their operations, from inventory management to sales tracking. Our platform offers comprehensive tools for administrators and staff members to ensure a seamless experience from product creation to order fulfillment.</p>
        </div>

        <div className="how-it-works">
          <h2>How PLOCITY Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Inventory Management</h3>
                <p>Add and organize your clothing products with detailed information about sizes, colors, and materials</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Order Processing</h3>
                <p>Receive and process customer orders efficiently with our streamlined workflow</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Sales Tracking</h3>
                <p>Monitor your business performance with detailed analytics and reports</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Business Growth</h3>
                <p>Make data-driven decisions to grow your clothing business based on accurate insights</p>
              </div>
            </div>
          </div>
        </div>

        <div className="features-section">
          <h2>Powerful Management Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <FaTshirt className="feature-icon" />
              <h3>Apparel Inventory</h3>
              <p>Track and manage your clothing inventory with detailed categorization by type, size, and color. Set up low stock alerts and automated reordering to ensure you never run out of popular items.</p>
            </div>
            <div className="feature-card">
              <FaPalette className="feature-icon" />
              <h3>Style Management</h3>
              <p>Organize products by collections, seasons, and trends to keep your inventory current. Create lookbooks and outfit combinations to enhance customer experience and drive more sales.</p>
            </div>
            <div className="feature-card">
              <FaTag className="feature-icon" />
              <h3>Dynamic Pricing</h3>
              <p>Set regular prices, discounts, and special promotions for different product categories. Implement time-based discounts and bundle deals to optimize your pricing strategy and maximize revenue.</p>
            </div>
            <div className="feature-card">
              <FaChartLine className="feature-icon" />
              <h3>Sales Analytics</h3>
              <p>Monitor sales performance with detailed analytics on best-selling items and revenue trends. Generate custom reports to identify growth opportunities and track performance against your business goals.</p>
            </div>
            <div className="feature-card">
              <FaTruck className="feature-icon" />
              <h3>Order Management</h3>
              <p>Track orders from placement to delivery with real-time status updates. Manage different delivery options, print shipping labels, and provide customers with accurate tracking information.</p>
            </div>
            <div className="feature-card">
              <FaCreditCard className="feature-icon" />
              <h3>Payment Processing</h3>
              <p>Manage multiple payment methods and track transaction history securely. Process refunds, create custom invoices, and maintain detailed financial records for accounting purposes.</p>
            </div>
          </div>
        </div>

        <div className="dashboard-preview">
          <h2>Powerful Dashboard at Your Fingertips</h2>
          <div className="dashboard-content">
            <div className="dashboard-text">
              <p>The PLOCITY dashboard provides a comprehensive overview of your business at a glance:</p>
              <ul className="dashboard-features">
                <li><FaDesktop className="feature-list-icon" /> <strong>Intuitive Interface:</strong> User-friendly design that's easy to navigate</li>
                <li><FaChartLine className="feature-list-icon" /> <strong>Real-time Data:</strong> Up-to-the-minute information on sales and inventory</li>
                <li><FaClipboardCheck className="feature-list-icon" /> <strong>Task Management:</strong> Track pending orders and tasks</li>
                <li><FaUsers className="feature-list-icon" /> <strong>Team Collaboration:</strong> Role-based access for your entire team</li>
                <li><FaCog className="feature-list-icon" /> <strong>Customizable Views:</strong> Personalize your dashboard to focus on what matters most</li>
              </ul>
              <p className="dashboard-note">All business metrics are presented in easy-to-understand visual formats, helping you make informed decisions quickly.</p>
            </div>
            <div className="dashboard-visual">
              <div className="dashboard-mockup">
                <div className="mockup-header">
                  <div className="mockup-title">PLOCITY Dashboard</div>
                </div>
                <div className="mockup-content">
                  <div className="mockup-widget sales">
                    <div className="widget-title">Sales Overview</div>
                    <div className="widget-chart"></div>
                  </div>
                  <div className="mockup-widget inventory">
                    <div className="widget-title">Inventory Status</div>
                    <div className="widget-data"></div>
                  </div>
                  <div className="mockup-widget orders">
                    <div className="widget-title">Recent Orders</div>
                    <div className="widget-list"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="benefits-section">
          <h2>Why Choose PLOCITY?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <FaLightbulb className="benefit-card-icon" />
              <h3>Intuitive Design</h3>
              <p>Our user-friendly interface requires minimal training, allowing your team to quickly adapt and maximize productivity.</p>
            </div>
            <div className="benefit-card">
              <FaTshirt className="benefit-card-icon" />
              <h3>Industry Specific</h3>
              <p>Built specifically for clothing retailers with features tailored to apparel inventory and fashion seasonality.</p>
            </div>
            <div className="benefit-card">
              <FaHandshake className="benefit-card-icon" />
              <h3>Exceptional Support</h3>
              <p>Our dedicated support team is always ready to assist with any questions or technical issues you might encounter.</p>
            </div>
          </div>
        </div>

        <div className="security-note">
          <FaShieldAlt className="security-icon" />
          <div className="security-text">
            <h3>Secure Access</h3>
            <p>PLOCITY ensures the security of your business data with encrypted connections and role-based access controls. All users must authenticate with their credentials to access the system, with permissions tailored to their specific roles in your organization.</p>
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <FaTshirt className="footer-icon" />
            <span>PLOCITY</span>
          </div>
          <div className="footer-links">
            <a href="#">About Us</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact</a>
            <a href="#">Support</a>
            <a href="#">FAQ</a>
          </div>
          <div className="footer-info">
            <p>&copy; {new Date().getFullYear()} PLOCITY. All rights reserved.</p>
            <p>For support: <a href="mailto:support@plocity.com">support@plocity.com</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
