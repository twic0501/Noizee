// src/contexts/CartContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useLazyQuery, useMutation, useApolloClient } from '@apollo/client';
import {
  GET_CART_QUERY,
  ADD_TO_CART_MUTATION,
  UPDATE_CART_ITEM_MUTATION,
  REMOVE_FROM_CART_MUTATION,
  CLEAR_CART_MUTATION,
} from '../api/graphql/cartMutation';
import { useAuth } from './AuthContext';
import logger from '../utils/logger'; // Import logger

const CartContext = createContext();

const initialCartState = {
  id: null,
  items: [],
  itemCount: 0,
  subtotal: 0,
  total: 0,
  discountAmount: 0,
  // appliedCoupons: [],
};

export const CartProvider = ({ children }) => {
  const { authState } = useAuth();
  const client = useApolloClient();

  const [cart, setCart] = useState(initialCartState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [fetchCartQuery, { loading: fetchCartLoading }] = useLazyQuery(GET_CART_QUERY, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data.getCart) {
        setCart(data.getCart);
        localStorage.setItem('userCart', JSON.stringify(data.getCart));
      } else {
        setCart(initialCartState);
        localStorage.removeItem('userCart');
      }
      setError(null);
    },
    onError: (err) => {
      logger.error("Error fetching cart:", err); // Use logger
      setError(err.message);
    },
  });

  const handleCartMutationCompleted = (data, mutationName) => {
    const updatedCart = data[mutationName];
    if (updatedCart) {
      setCart(updatedCart);
      localStorage.setItem('userCart', JSON.stringify(updatedCart));
      setError(null);
      try {
        client.writeQuery({
          query: GET_CART_QUERY,
          data: { getCart: updatedCart },
        });
      } catch (cacheError) {
        logger.warn("Could not write cart to Apollo cache:", cacheError); // Use logger
      }
    }
  };

  const [addToCartMutation, { loading: addToCartLoading }] = useMutation(ADD_TO_CART_MUTATION, {
    onCompleted: (data) => handleCartMutationCompleted(data, 'addToCart'),
    onError: (err) => { logger.error("Error adding to cart:", err); setError(err.message); },
  });

  const [updateCartItemMutation, { loading: updateCartItemLoading }] = useMutation(UPDATE_CART_ITEM_MUTATION, {
    onCompleted: (data) => handleCartMutationCompleted(data, 'updateCartItem'),
    onError: (err) => { logger.error("Error updating cart item:", err); setError(err.message); },
  });

  const [removeFromCartMutation, { loading: removeFromCartLoading }] = useMutation(REMOVE_FROM_CART_MUTATION, {
    onCompleted: (data) => handleCartMutationCompleted(data, 'removeFromCart'),
    onError: (err) => { logger.error("Error removing from cart:", err); setError(err.message); },
  });

  const [clearCartMutation, { loading: clearCartLoading }] = useMutation(CLEAR_CART_MUTATION, {
    onCompleted: (data) => handleCartMutationCompleted(data, 'clearCart'),
    onError: (err) => { logger.error("Error clearing cart:", err); setError(err.message); },
  });

  useEffect(() => {
    if (authState.isAuthenticated && authState.token) {
      // logger.debug("User authenticated, fetching server cart..."); // Use logger
      fetchCartQuery();
    } else if (!authState.isAuthenticated && !authState.loading) {
      // logger.debug("User is guest, loading cart from localStorage..."); // Use logger
      const localCartData = localStorage.getItem('userCart');
      if (localCartData) {
        try {
          const parsedCart = JSON.parse(localCartData);
          if (parsedCart && Array.isArray(parsedCart.items)) {
             setCart(parsedCart);
          } else {
            localStorage.removeItem('userCart');
            setCart(initialCartState);
          }
        } catch (e) {
          logger.error("Error parsing local cart data:", e); // Use logger
          localStorage.removeItem('userCart');
          setCart(initialCartState);
        }
      } else {
        setCart(initialCartState);
      }
    }
  }, [authState.isAuthenticated, authState.token, authState.loading, fetchCartQuery]);


  const fetchCart = useCallback(() => {
    if (authState.isAuthenticated) {
      fetchCartQuery();
    } else {
      // logger.debug("Guest cart is loaded from localStorage."); // Use logger
    }
  }, [fetchCartQuery, authState.isAuthenticated]);

  // Updated addToCart to accept productVariantId
  const addToCart = useCallback(async (itemInput) => {
    // itemInput is expected to be: { productId: ID!, productVariantId: ID, quantity: Int! }
    // as per AddToCartInput typeDef.
    if (!itemInput.productId || !itemInput.quantity) {
        logger.error("addToCart: productId and quantity are required.", itemInput);
        setError("Thông tin sản phẩm không đủ để thêm vào giỏ.");
        return;
    }
    // productVariantId can be null if the product doesn't have variants or if it's a general add.
    // The backend resolver for addToCart should handle cases where productVariantId is null.
    // Typically, if a product has variants (e.g., based on color/size), a productVariantId (like inventory_id) IS required.

    setLoading(true); setError(null);
    try {
      await addToCartMutation({ variables: { input: itemInput } });
    } catch (e) {
      logger.error("Add to cart context function error:", e); // Use logger
      setError("Lỗi khi thêm sản phẩm vào giỏ."); // Consider more specific error from e.message
    } finally {
      setLoading(false);
    }
  }, [addToCartMutation]);

  const updateCartItem = useCallback(async (input) => {
    setLoading(true); setError(null);
    try {
      await updateCartItemMutation({ variables: { input } });
    } catch (e) {
      logger.error("Update cart item context function error:", e); // Use logger
      setError("Lỗi khi cập nhật giỏ hàng.");
    } finally {
      setLoading(false);
    }
  }, [updateCartItemMutation]);

  const removeFromCart = useCallback(async (cartItemId) => {
    setLoading(true); setError(null);
    try {
      await removeFromCartMutation({ variables: { cartItemId } });
    } catch (e) {
      logger.error("Remove from cart context function error:", e); // Use logger
      setError("Lỗi khi xóa sản phẩm khỏi giỏ.");
    } finally {
      setLoading(false);
    }
  }, [removeFromCartMutation]);

  const clearCartLocalAndState = useCallback(() => {
    setCart(initialCartState);
    localStorage.removeItem('userCart');
  }, []);
  
  const clearServerCart = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      await clearCartMutation();
    } catch (e) {
      logger.error("Clear cart context function error:", e); // Use logger
      setError("Lỗi khi xóa giỏ hàng.");
    } finally {
      setLoading(false);
    }
  }, [clearCartMutation]);

  const clearUserCart = useCallback(() => {
    if(authState.isAuthenticated) {
      clearServerCart();
    } else {
      clearCartLocalAndState();
    }
  }, [authState.isAuthenticated, clearServerCart, clearCartLocalAndState]);

  const contextValue = {
    cart,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart: clearUserCart,
    isLoading: loading || fetchCartLoading || addToCartLoading || updateCartItemLoading || removeFromCartLoading || clearCartLoading,
    cartError: error,
    clearCartError: () => setError(null),
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
