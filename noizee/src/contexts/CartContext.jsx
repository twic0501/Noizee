import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CART_STORAGE_KEY = 'noizeeCart';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const localData = localStorage.getItem(CART_STORAGE_KEY);
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Error parsing cart from localStorage", error);
            return [];
        }
    });
    const [isCartPanelOpen, setIsCartPanelOpen] = useState(false);

    // Lưu giỏ hàng vào localStorage mỗi khi cartItems thay đổi
    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        } catch (error) {
            console.error("Error saving cart to localStorage", error);
        }
    }, [cartItems]);

    const addToCart = useCallback((product, selectedColor, selectedSize, quantity = 1) => {
        if (!product || !selectedColor || !selectedSize) {
            console.error("Product, color, or size information is missing.", { product, selectedColor, selectedSize });
            // Có thể hiển thị thông báo lỗi cho người dùng ở đây
            return;
        }

        setCartItems(prevItems => {
            // Tạo ID duy nhất cho mỗi mục trong giỏ hàng dựa trên sản phẩm, màu, và size
            const cartItemId = `${product.id}_${selectedColor.id}_${selectedSize.id}`;
            const existingItemIndex = prevItems.findIndex(item => item.id === cartItemId);

            if (existingItemIndex > -1) {
                // Sản phẩm đã có trong giỏ, cập nhật số lượng
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex].quantity += quantity;
                return updatedItems;
            } else {
                // Thêm sản phẩm mới vào giỏ
                const newItem = {
                    id: cartItemId,
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category?.name, // Giả sử category là object có name
                    selectedColor, // Lưu cả object màu
                    selectedSize,  // Lưu cả object size
                    quantity,
                    imageUrl: selectedColor.images?.main || product.availableColors?.[0]?.images?.main || 'https://placehold.co/80x100?text=N/A',
                };
                return [...prevItems, newItem];
            }
        });
        setIsCartPanelOpen(true); // Mở panel giỏ hàng khi thêm sản phẩm
    }, []);

    const updateQuantity = useCallback((cartItemId, newQuantity) => {
        setCartItems(prevItems =>
            prevItems
                .map(item => (item.id === cartItemId ? { ...item, quantity: Math.max(1, newQuantity) } : item))
            // Không filter item có quantity = 0 ở đây, để user có thể giảm về 0 rồi xóa nếu muốn, hoặc xóa trực tiếp
            // Nếu muốn xóa khi quantity <= 0: .filter(item => item.quantity > 0)
        );
    }, []);

    const removeFromCart = useCallback((cartItemId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
        setIsCartPanelOpen(false); // Đóng panel sau khi xóa hết
    }, []);

    const toggleCartPanel = useCallback(() => {
        setIsCartPanelOpen(prev => !prev);
    }, []);

    const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const value = {
        cartItems,
        isCartPanelOpen,
        setIsCartPanelOpen, // Cung cấp để có thể đóng từ bên ngoài (ví dụ Header)
        toggleCartPanel,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCartItems,
        subtotal,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined && context === null) { // Sửa điều kiện kiểm tra context
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};