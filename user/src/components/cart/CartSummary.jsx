// user/src/components/cart/CartSummary.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/formatters';
import { FiShoppingCart, FiArrowRight } from 'react-icons/fi';

const CartSummary = () => {
  const { t } = useTranslation();
  const { cart } = useCart();
  const { authState } = useAuth();
  const navigate = useNavigate();

  if (!cart || cart.items.length === 0) {
    return null; // Không hiển thị summary nếu giỏ hàng rỗng
  }

  const handleCheckout = () => {
    if (authState.isAuthenticated) {
      navigate('/checkout');
    } else {
      // Chuyển hướng đến trang đăng nhập, lưu lại trang checkout để quay lại
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    }
  };

  // Các giá trị này nên được tính toán và cung cấp bởi CartContext hoặc trực tiếp từ `cart` object
  // mà backend trả về (bao gồm subtotal, discountAmount, total).
  const subtotal = cart.subtotal || 0;
  const discount = cart.discountAmount || 0; // Giả sử cart object có discountAmount
  const shipping = cart.shippingCost || 0;   // Giả sử cart object có shippingCost (có thể tính sau)
  const total = cart.total || 0;

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">
        {t('cart.summaryTitle', 'Tóm tắt đơn hàng')}
      </h2>

      <div className="space-y-3 text-sm mb-6">
        <div className="flex justify-between text-gray-600">
          <span>{t('cart.subtotal', 'Tạm tính')} ({cart.itemCount || 0} {t('cart.items', 'sản phẩm')})</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {/* Optional: Discount */}
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>{t('cart.discount', 'Giảm giá')}</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}

        {/* Optional: Shipping - có thể hiển thị "Tính toán ở bước tiếp theo" */}
        <div className="flex justify-between text-gray-600">
          <span>{t('cart.shipping', 'Phí vận chuyển')}</span>
          {shipping > 0 ? (
            <span>{formatPrice(shipping)}</span>
          ) : (
            <span className="text-xs">{t('cart.shippingCalculatedLater', 'Tính ở bước thanh toán')}</span>
          )}
        </div>
      </div>

      {/* Coupon Code Input (Optional) */}
      {/* <div className="mb-6">
        <label htmlFor="couponCode" className="block text-sm font-medium text-gray-700 mb-1">
          {t('cart.couponCodeLabel', 'Mã giảm giá')}
        </label>
        <div className="flex">
          <input
            type="text"
            id="couponCode"
            name="couponCode"
            placeholder={t('cart.couponCodePlaceholder', 'Nhập mã tại đây')}
            className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="button"
            // onClick={handleApplyCoupon}
            className="bg-gray-200 text-gray-700 px-4 py-2 text-sm font-medium rounded-r-md hover:bg-gray-300"
          >
            {t('cart.applyCouponButton', 'Áp dụng')}
          </button>
        </div>
      </div> */}

      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center text-lg font-semibold text-gray-900 mb-6">
          <span>{t('cart.total', 'Tổng cộng')}</span>
          <span>{formatPrice(total)}</span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={cart.items.length === 0} // Disable nếu giỏ hàng rỗng
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-indigo-700 transition-colors duration-150 flex items-center justify-center text-base disabled:opacity-50"
        >
          <FiShoppingCart className="mr-2 h-5 w-5" />
          {authState.isAuthenticated 
            ? t('cart.proceedToCheckout', 'Tiến hành thanh toán')
            : t('cart.loginToCheckout', 'Đăng nhập để thanh toán')
          }
        </button>

        <Link
          to="/products"
          className="mt-4 block text-center text-sm text-indigo-600 hover:text-indigo-500 font-medium"
        >
          <FiArrowRight className="inline mr-1 h-4 w-4 transform rotate-180" />
          {t('cart.continueShopping', 'Tiếp tục mua sắm')}
        </Link>
      </div>
    </div>
  );
};

export default CartSummary;