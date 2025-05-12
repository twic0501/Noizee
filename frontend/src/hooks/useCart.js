// src/hooks/useCart.js
import { useContext } from 'react';
import CartContext from '../contexts/CartContext'; // Đường dẫn tới CartContext

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};