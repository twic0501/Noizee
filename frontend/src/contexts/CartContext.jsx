import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'noizee_cart';

export const CartProvider = ({ children }) => {
  // Load giỏ hàng từ localStorage khi khởi tạo
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
      console.error("Failed to parse cart from localStorage", e);
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
  });

  // Lưu giỏ hàng vào localStorage mỗi khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
        console.error("Could not save cart to localStorage", e);
    }
  }, [cartItems]);

  const addItem = useCallback((product, quantity = 1, selectedSize, selectedColor) => {
      if (!product || !product.product_id || !selectedSize || !selectedColor) {
          console.warn("Cannot add item to cart: Missing product, size, or color info.");
          return; // Hoặc hiển thị lỗi cho người dùng
      }
      // Tạo ID duy nhất cho item trong giỏ hàng dựa trên sp, size, màu
      const cartItemId = `<span class="math-inline">{product.product_id}-</span>{selectedSize.size_id}-${selectedColor.color_id}`;

      setCartItems(prevItems => {
          const existingItem = prevItems.find(item => item.cartItemId === cartItemId);
          if (existingItem) {
              // Cập nhật số lượng nếu item đã tồn tại
              // TODO: Kiểm tra tồn kho trước khi tăng số lượng
              return prevItems.map(item =>
                  item.cartItemId === cartItemId
                      ? { ...item, quantity: item.quantity + quantity }
                      : item
              );
          } else {
              // Thêm item mới
              // TODO: Kiểm tra tồn kho trước khi thêm
              return [
                  ...prevItems,
                  {
                      cartItemId, // ID duy nhất trong giỏ hàng
                      productId: product.product_id,
                      name: product.product_name,
                      price: product.product_price,
                      imageUrl: product.imageUrl,
                      size: selectedSize,     // Lưu cả object size
                      color: selectedColor,   // Lưu cả object color
                      quantity: quantity,
                      // Lưu thêm stock nếu cần để kiểm tra sau này
                      // stock: product.product_stock
                  }
              ];
          }
      });
      // TODO: Hiển thị thông báo thành công?
  }, []);

  const removeItem = useCallback((cartItemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId, newQuantity) => {
    // Đảm bảo số lượng là số dương
    const quantity = Math.max(1, parseInt(newQuantity, 10) || 1);
    // TODO: Kiểm tra tồn kho trước khi cập nhật
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    // localStorage cũng sẽ tự động cập nhật nhờ useEffect
  }, []);

  // Tính toán các giá trị phụ thuộc (tổng số lượng, tổng tiền)
  const totalItems = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
  const totalPrice = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);

  // Giá trị cung cấp cho context
  const contextValue = useMemo(() => ({
    cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  }), [cartItems, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;