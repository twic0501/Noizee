import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useCart } from '../contexts/CartContext';
// import { useAuth } from '../contexts/AuthContext';
// import AddressFormCheckout from '../components/checkout/AddressFormCheckout';
// import ShippingOptions from '../components/checkout/ShippingOptions';
// import PaymentOptions from '../components/checkout/PaymentOptions';
// import OrderSummaryCheckout from '../components/checkout/OrderSummaryCheckout';
// import { useMutation } from '@apollo/client';
// import { CREATE_ORDER } from '../api/graphql/mutations/orderMutations';
// import { useTranslation } from 'react-i18next';

const CheckoutPage = () => {
    // const { t } = useTranslation();
    // State cho địa chỉ, phương thức vận chuyển, thanh toán
    // Logic xử lý đặt hàng, gọi mutation CREATE_ORDER

    return (
        <div className="container py-4 py-md-5">
            <h1 className="h4 text-uppercase fw-bold mb-4 text-center">Thanh Toán (CheckoutPage Placeholder)</h1>
            {/* Layout nhiều bước hoặc một form dài: Địa chỉ, Vận chuyển, Thanh toán, Tóm tắt đơn hàng */}
            <p className="text-center">Form nhập địa chỉ, chọn vận chuyển, thanh toán sẽ ở đây.</p>
        </div>
    );
};

export default CheckoutPage;