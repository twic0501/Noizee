// src/contexts/CartContext.jsx
import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'noizee_cart_v2'; // Cân nhắc đổi key nếu cấu trúc cartItem thay đổi nhiều

export const CartProvider = ({ children }) => {
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

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error("Could not save cart to localStorage", e);
    }
  }, [cartItems]);

  const addItem = useCallback((product, quantity = 1, selectedSize, selectedColor) => {
    if (!product || !product.product_id) {
      console.warn("Cannot add item to cart: Missing product info.");
      return; // Hoặc hiển thị lỗi cho người dùng
    }
    // Nếu sản phẩm yêu cầu size/color mà chưa chọn -> báo lỗi
    if ((product.sizes?.length > 0 && !selectedSize) || (product.colors?.length > 0 && !selectedColor)) {
        console.warn("Please select size and color before adding to cart.");
        // TODO: Hiển thị thông báo cho người dùng (ví dụ dùng toast)
        alert("Vui lòng chọn size và màu sắc (nếu có).");
        return;
    }

    // Tạo ID duy nhất cho item trong giỏ hàng dựa trên sp, size, màu
    // Đảm bảo sizeId và colorId là null nếu không được chọn (cho sản phẩm không có biến thể)
    const sizeId = selectedSize ? selectedSize.size_id : null;
    const colorId = selectedColor ? selectedColor.color_id : null;
    const cartItemId = `${product.product_id}-${sizeId || 'no-size'}-${colorId || 'no-color'}`;

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.cartItemId === cartItemId);

      // TODO: Kiểm tra tồn kho của variant này trước khi thêm/tăng số lượng
      // const variantStock = getVariantStock(product.inventory, sizeId, colorId);
      // if (variantStock === 0 || (existingItem && existingItem.quantity + quantity > variantStock)) {
      //   alert("Sản phẩm hoặc lựa chọn này đã hết hàng hoặc không đủ số lượng.");
      //   return prevItems;
      // }

      if (existingItem) {
        return prevItems.map(item =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            cartItemId,
            productId: product.product_id,
            name: product.product_name,
            price: product.product_price,
            imageUrl: product.imageUrl, // hoặc secondaryImageUrl nếu có logic hover
            size: selectedSize || null,     // Lưu cả object size
            color: selectedColor || null,   // Lưu cả object color
            sizeId: sizeId,                 // Lưu ID để dễ gửi lên API
            colorId: colorId,               // Lưu ID để dễ gửi lên API
            quantity: quantity,
            // inventory: product.inventory // Có thể lưu inventory của SP để check sau
          }
        ];
      }
    });
  }, []);

  const removeItem = useCallback((cartItemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId, newQuantity) => {
    const quantity = Math.max(1, parseInt(newQuantity, 10) || 1);
    // TODO: Kiểm tra tồn kho của variant này trước khi cập nhật
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const totalItems = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
  const totalPrice = useMemo(() => cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cartItems]);

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