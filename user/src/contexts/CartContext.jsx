import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useLazyQuery, useMutation, useApolloClient } from '@apollo/client';
import {
  GET_CART_QUERY,
  ADD_TO_CART_MUTATION,
  UPDATE_CART_ITEM_MUTATION,
  REMOVE_FROM_CART_MUTATION,
  CLEAR_CART_MUTATION,
} from '../api/graphql/cartMutation'; // Đã tạo ở bước trước
import { useAuth } from './AuthContext'; // Để biết trạng thái đăng nhập

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
  const { authState } = useAuth(); // Lấy trạng thái xác thực
  const client = useApolloClient(); // Để đọc/ghi cache trực tiếp nếu cần

  const [cart, setCart] = useState(initialCartState);
  const [loading, setLoading] = useState(false); // Loading chung cho các operation của cart
  const [error, setError] = useState(null);

  // --- GraphQL Hooks ---
  const [fetchCartQuery, { loading: fetchCartLoading }] = useLazyQuery(GET_CART_QUERY, {
    fetchPolicy: 'network-only', // Luôn lấy giỏ hàng mới nhất từ server
    onCompleted: (data) => {
      if (data.getCart) {
        setCart(data.getCart);
        localStorage.setItem('userCart', JSON.stringify(data.getCart)); // Lưu vào local nếu muốn
      } else {
        setCart(initialCartState); // Nếu không có giỏ hàng từ server
        localStorage.removeItem('userCart');
      }
      setError(null);
    },
    onError: (err) => {
      console.error("Error fetching cart:", err);
      setError(err.message);
      // Có thể không xóa giỏ hàng local ở đây, giữ lại cho offline/retry
    },
  });

  // Helper function để cập nhật state và localStorage sau mutation
  const handleCartMutationCompleted = (data, mutationName) => {
    const updatedCart = data[mutationName];
    if (updatedCart) {
      setCart(updatedCart);
      localStorage.setItem('userCart', JSON.stringify(updatedCart));
      setError(null);

      // Cập nhật cache Apollo Client cho GET_CART_QUERY
      // Cách này giúp các component khác sử dụng GET_CART_QUERY tự động cập nhật
      // mà không cần refetch nếu cache policy cho phép.
      try {
        client.writeQuery({
          query: GET_CART_QUERY,
          data: { getCart: updatedCart },
        });
      } catch (cacheError) {
        console.warn("Could not write cart to Apollo cache:", cacheError);
      }

    }
  };

  const [addToCartMutation, { loading: addToCartLoading }] = useMutation(ADD_TO_CART_MUTATION, {
    onCompleted: (data) => handleCartMutationCompleted(data, 'addToCart'),
    onError: (err) => { console.error("Error adding to cart:", err); setError(err.message); },
    // refetchQueries: [{ query: GET_CART_QUERY }], // Hoặc dùng writeQuery như trên
  });

  const [updateCartItemMutation, { loading: updateCartItemLoading }] = useMutation(UPDATE_CART_ITEM_MUTATION, {
    onCompleted: (data) => handleCartMutationCompleted(data, 'updateCartItem'),
    onError: (err) => { console.error("Error updating cart item:", err); setError(err.message); },
  });

  const [removeFromCartMutation, { loading: removeFromCartLoading }] = useMutation(REMOVE_FROM_CART_MUTATION, {
    onCompleted: (data) => handleCartMutationCompleted(data, 'removeFromCart'),
    onError: (err) => { console.error("Error removing from cart:", err); setError(err.message); },
  });

  const [clearCartMutation, { loading: clearCartLoading }] = useMutation(CLEAR_CART_MUTATION, {
    onCompleted: (data) => handleCartMutationCompleted(data, 'clearCart'),
    onError: (err) => { console.error("Error clearing cart:", err); setError(err.message); },
  });


  // --- Effects ---
  // Load giỏ hàng từ localStorage (cho khách) hoặc fetch từ server (cho user đã login)
  useEffect(() => {
    if (authState.isAuthenticated && authState.token) {
      // Người dùng đã đăng nhập, fetch giỏ hàng từ server
      console.log("User authenticated, fetching server cart...");
      fetchCartQuery();
    } else if (!authState.isAuthenticated && !authState.loading) {
      // Người dùng là khách hoặc đã logout, thử load giỏ hàng từ localStorage
      console.log("User is guest, loading cart from localStorage...");
      const localCartData = localStorage.getItem('userCart');
      if (localCartData) {
        try {
          const parsedCart = JSON.parse(localCartData);
          // Kiểm tra sơ bộ cấu trúc cart local có hợp lệ không
          if (parsedCart && Array.isArray(parsedCart.items)) {
             setCart(parsedCart);
          } else {
            localStorage.removeItem('userCart'); // Xóa nếu không hợp lệ
            setCart(initialCartState);
          }
        } catch (e) {
          console.error("Error parsing local cart data:", e);
          localStorage.removeItem('userCart');
          setCart(initialCartState);
        }
      } else {
        setCart(initialCartState);
      }
    }
  }, [authState.isAuthenticated, authState.token, authState.loading, fetchCartQuery]);

  // Xử lý khi người dùng logout: xóa giỏ hàng local nếu không muốn giữ lại
  useEffect(() => {
    if (!authState.isAuthenticated && !authState.loading) { // Đã xác định là guest/logout
      // Nếu bạn không muốn giữ giỏ hàng của khách sau khi họ từng đăng nhập rồi logout,
      // bạn có thể thêm logic xóa localStorage cart ở đây.
      // Tuy nhiên, thường thì giỏ hàng của khách sẽ được giữ lại.
      // Nếu giỏ hàng trên server khác với giỏ hàng local, cần có cơ chế merge khi login.
    }
  }, [authState.isAuthenticated, authState.loading]);


  // --- Context Actions ---
  const fetchCart = useCallback(() => {
    if (authState.isAuthenticated) { // Chỉ fetch từ server nếu đã đăng nhập
      fetchCartQuery();
    } else {
      // Với guest, giỏ hàng đã được load từ localStorage ở useEffect
      console.log("Guest cart is loaded from localStorage.");
    }
  }, [fetchCartQuery, authState.isAuthenticated]);

  const addToCart = useCallback(async (input) => { // input: { productId, quantity, productVariantId? }
    setLoading(true); setError(null);
    try {
      // TODO: Nếu là guest, có thể cần lưu vào localStorage trước và đồng bộ sau khi login
      // Hiện tại, giả sử backend xử lý được việc tạo/cập nhật giỏ hàng cho cả guest (dùng session) và user.
      await addToCartMutation({ variables: { input } });
    } catch (e) {
      console.error("Add to cart context function error:", e);
      setError("Lỗi khi thêm sản phẩm vào giỏ.");
    } finally {
      setLoading(false);
    }
  }, [addToCartMutation]);

  const updateCartItem = useCallback(async (input) => { // input: { cartItemId, quantity }
    setLoading(true); setError(null);
    try {
      await updateCartItemMutation({ variables: { input } });
    } catch (e) {
      console.error("Update cart item context function error:", e);
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
      console.error("Remove from cart context function error:", e);
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
      await clearCartMutation(); // onCompleted sẽ cập nhật state
    } catch (e) {
      console.error("Clear cart context function error:", e);
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

  // Value của context
  const contextValue = {
    cart,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart: clearUserCart, // Đổi tên để dễ hiểu hơn
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

// Hook để sử dụng CartContext
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};