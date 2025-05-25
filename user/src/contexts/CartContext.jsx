// src/contexts/CartContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_CART':
      return action.payload; // Payload là toàn bộ giỏ hàng từ localStorage
    case 'ADD_TO_CART': {
      const { product, quantity, size, color } = action.payload;
      // Tạo ID duy nhất cho cart item dựa trên product_id, size_id, color_id
      const itemId = `${product.product_id}-${size?.size_id || 'nosize'}-${color?.color_id || 'nocolor'}`;
      const existingItemIndex = state.items.findIndex(item => item.id === itemId);

      let newItems;
      if (existingItemIndex > -1) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [...state.items, {
          id: itemId,
          product_id: product.product_id,
          name: product.name, // Giả sử product.name đã có lang phù hợp
          price: product.product_price,
          image: product.images && product.images.length > 0 ? product.images[0].image_url : '/placeholder.jpg', // Ảnh đại diện
          quantity,
          size, // Lưu cả object size
          color // Lưu cả object color
        }];
      }
      return { ...state, items: newItems };
    }
    case 'REMOVE_FROM_CART': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.itemId),
      };
    }
    case 'UPDATE_QUANTITY': {
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.itemId
            ? { ...item, quantity: Math.max(1, action.payload.quantity) } // Đảm bảo quantity >= 1
            : item
        ),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
};

const initialState = {
  items: [], // Mỗi item: { id, product_id, name, price, image, quantity, size, color }
  // Thêm các thông tin khác nếu cần: itemCount, totalAmount (có thể tính toán động)
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load giỏ hàng từ localStorage khi component mount
  useEffect(() => {
    try {
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        dispatch({ type: 'LOAD_CART', payload: JSON.parse(localCart) });
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
      // Có thể xóa cart bị lỗi khỏi localStorage
      localStorage.removeItem('cart');
    }
  }, []);

  // Lưu giỏ hàng vào localStorage mỗi khi state.items thay đổi
  useEffect(() => {
    if (state.items) { // Chỉ lưu nếu items đã được khởi tạo
        try {
            localStorage.setItem('cart', JSON.stringify(state));
        } catch (error) {
            console.error("Failed to save cart to localStorage:", error);
        }
    }
  }, [state]);

  const addToCart = (product, quantity, size, color) => {
    // product là object product đầy đủ từ query GetProductDetail
    // size, color là object size/color đã chọn
    dispatch({ type: 'ADD_TO_CART', payload: { product, quantity, size, color } });
  };

  const removeFromCart = (itemId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { itemId } });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const cartCount = state.items.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = state.items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems: state.items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === null) { // Kiểm tra null
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};