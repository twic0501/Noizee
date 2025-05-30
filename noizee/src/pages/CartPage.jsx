import React from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useCart } from '../contexts/CartContext';
// import CartItem from '../components/cart/CartItem';
// import CartSummary from '../components/cart/CartSummary';
// import { ArrowLeft, ShoppingCart as CartIcon } from 'lucide-react';
// import { useTranslation } from 'react-i18next';

const CartPage = () => {
    // const { t } = useTranslation();
    // const { cartItems, updateQuantity, removeFromCart, subtotal } = useCart();
    // const navigate = useNavigate();

    return (
        <div className="container py-4 py-md-5">
            <h1 className="h4 text-uppercase fw-bold mb-4 text-center">
                {/* {t('cart.title', 'Shopping Cart')} */}
                Giỏ Hàng (CartPage Placeholder)
            </h1>
            {/* Logic hiển thị cartItems hoặc thông báo giỏ hàng trống */}
            {/* CartSummary và nút Checkout */}
            <p className="text-center">Danh sách sản phẩm trong giỏ, tổng tiền, nút thanh toán sẽ ở đây.</p>
        </div>
    );
};

export default CartPage;