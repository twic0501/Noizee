// user/src/pages/CartPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiShoppingCart, FiTrash2 } from 'react-icons/fi'; // Thêm FiTrash2 nếu có nút xóa tất cả

import { useCart } from '../contexts/CartContext'; // Hook useCart
import CartItem from '../components/cart/CartItem';     // Component CartItem đã tạo
import CartSummary from '../components/cart/CartSummary';   // Component CartSummary đã tạo
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';

const CartPage = () => {
  const { t } = useTranslation();
  const { cart, isLoading, cartError, clearCart } = useCart(); // Thêm clearCart nếu có nút "Xóa tất cả"

  if (isLoading && (!cart || cart.items.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <LoadingSpinner size="lg" message={t('cart.loadingCart', 'Đang tải giỏ hàng...')} />
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <AlertMessage type="error" title={t('cart.errorTitle', 'Lỗi giỏ hàng')} message={cartError} />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <FiShoppingCart className="mx-auto text-gray-300 mb-6 h-24 w-24" />
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">
          {t('cart.emptyTitle', 'Giỏ hàng của bạn đang trống')}
        </h1>
        <p className="text-gray-600 mb-8">
          {t('cart.emptyPrompt', 'Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!')}
        </p>
        <Link
          to="/products"
          className="bg-indigo-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-indigo-700 transition-colors duration-150 text-lg"
        >
          {t('cart.continueShoppingButton', 'Khám phá sản phẩm')}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        <header className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            {t('cart.pageTitle', 'Giỏ hàng của bạn')}
          </h1>
        </header>

        <div className="lg:flex lg:gap-8">
          {/* Cart Items Section */}
          <div className="lg:w-2/3">
            <div className="bg-white shadow-md rounded-lg">
              {/* Header của bảng (desktop) */}
              <div className="hidden md:block border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-6">{t('cart.table.product', 'Sản phẩm')}</div>
                  <div className="col-span-2 text-center">{t('cart.table.price', 'Đơn giá')}</div>
                  <div className="col-span-2 text-center">{t('cart.table.quantity', 'Số lượng')}</div>
                  <div className="col-span-2 text-right">{t('cart.table.total', 'Thành tiền')}</div>
                </div>
              </div>
              {/* Items */}
              <div>
                {cart.items.map((item) => (
                    // CartItem bây giờ nên được thiết kế để là một div hoặc một phần tử không phải là <tr>
                    // để có thể tùy chỉnh layout tốt hơn cho mobile.
                    // Hoặc, CartItem là <tr> và chúng ta sẽ dùng table.
                    // Dưới đây là ví dụ nếu CartItem là một component block.
                    // Nếu CartItem là <tr> thì cần bọc trong <table><tbody>
                  <div key={item.id} className="p-4 border-b border-gray-200 last:border-b-0 md:hidden">
                    {/* Mobile Cart Item Layout - Có thể làm giống desktop hoặc đơn giản hơn */}
                    {/* Ví dụ: */}
                    <div className="flex items-start space-x-4">
                        {/* Image (từ OptimizedImage trong CartItem) */}
                        {/* Name, Price (từ CartItem) */}
                    </div>
                    {/* Quantity, Total (từ CartItem) */}
                    {/* Remove button (từ CartItem) */}
                    <CartItem item={item} /> {/* CartItem component sẽ tự xử lý layout của nó */}
                  </div>
                ))}
              </div>
              {/* Table cho desktop */}
              <table className="min-w-full hidden md:table">
                  <thead className="sr-only"> {/* Header đã hiển thị ở trên */}
                      <tr><th>{t('cart.table.product', 'Sản phẩm')}</th><th>{t('cart.table.price', 'Đơn giá')}</th><th>{t('cart.table.quantity', 'Số lượng')}</th><th>{t('cart.table.total', 'Thành tiền')}</th><th></th></tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cart.items.map(item => (
                        <CartItem key={item.id || item.product?.id} item={item} /> // CartItem đã được thiết kế là <tr>
                    ))}
                  </tbody>
              </table>
            </div>
            {/* Clear cart button */}
            {cart.items.length > 0 && (
                <div className="mt-6 text-right">
                    <button
                        onClick={() => {
                            if(window.confirm(t('cart.confirmClearCart', 'Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?'))) {
                                clearCart();
                            }
                        }}
                        disabled={isLoading}
                        className="text-sm text-red-500 hover:text-red-700 hover:underline disabled:opacity-50 flex items-center justify-end"
                    >
                        <FiTrash2 className="mr-1 h-4 w-4"/>
                        {t('cart.clearCartButton', 'Xóa tất cả giỏ hàng')}
                    </button>
                </div>
            )}
          </div>

          {/* Cart Summary Section */}
          <div className="lg:w-1/3 mt-8 lg:mt-0">
            <div className="sticky top-24"> {/* Để summary cố định khi cuộn */}
              <CartSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;