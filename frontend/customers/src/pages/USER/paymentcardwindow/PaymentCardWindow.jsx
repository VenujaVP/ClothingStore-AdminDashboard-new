

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState } from 'react';
import './PaymentCardWindow.css';
import withAuth from '../../withAuth';

const PaymentCardWindow = () => {
  const [cards, setCards] = useState([
    { id: 1, cardNumber: '**** **** **** 1234', expiryDate: '12/25', cardType: 'Visa' },
    { id: 2, cardNumber: '**** **** **** 5678', expiryDate: '06/24', cardType: 'MasterCard' },
  ]);

  const [showAddCardPopup, setShowAddCardPopup] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: '',
  });

  const handleAddCardClick = () => {
    setShowAddCardPopup(true);
  };

  const handleClosePopup = () => {
    setShowAddCardPopup(false);
    setNewCard({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardHolderName: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCard({
      ...newCard,
      [name]: value,
    });
  };

  const handleAddCardSubmit = (e) => {
    e.preventDefault();
    const newCardData = {
      id: cards.length + 1,
      cardNumber: `**** **** **** ${newCard.cardNumber.slice(-4)}`,
      expiryDate: newCard.expiryDate,
      cardType: 'Visa', // You can add logic to detect card type
    };
    setCards([...cards, newCardData]);
    handleClosePopup();
  };

  return (
    <div className="payment-card-window">
      <h2>Payment Methods</h2>
      <div className="card-list">
        {cards.map((card) => (
          <div key={card.id} className="card-item">
            <div className="card-icon">{card.cardType}</div>
            <div className="card-details">
              <p>{card.cardNumber}</p>
              <p>Expires: {card.expiryDate}</p>
            </div>
          </div>
        ))}
        <div className="add-card" onClick={handleAddCardClick}>
          <div className="add-card-icon">+</div>
          <p>Add New Card</p>
        </div>
      </div>

      {showAddCardPopup && (
        <div className="popup-overlay">
          <div className="add-card-popup">
            <h3>Add New Card</h3>
            <form onSubmit={handleAddCardSubmit}>

            <div className="form-group">
                <label htmlFor="cardHolderName">Cardholder Name</label>
                <input
                  type="text"
                  id="cardHolderName"
                  name="cardHolderName"
                  value={newCard.cardHolderName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cardNumber">Card Number</label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={newCard.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expiryDate">Expiry Date</label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    value={newCard.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cvv">CVV</label>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    value={newCard.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={handleClosePopup}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AuthenticatedPaymentCardWindow = withAuth(PaymentCardWindow);  
export default AuthenticatedPaymentCardWindow;