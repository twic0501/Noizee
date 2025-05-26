import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';

import { useCart } from '../../contexts/CartContext'; // Hook useCart đã tạo
import { formatPrice } from '../../utils/formatters'; // Tiện ích formatPrice
import useDebounce from '../../hooks/useDebounce'; // Hook useDebounce đã tạo
import OptimizedImage from '../common/OptimizedImage'; // Component OptimizedImage đã tạo
import { PRODUCT_IMAGE_PLACEHOLDER } from '../../utils/constants';
import LoadingSpinner from '../common/LoadingSpinner';

const CartItem = ({ item }) => {
  const { t } = useTranslation();
  const { updateCartItem, removeFromCart, isLoading: isCartContextLoading } = useCart();
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false); // Loading state riêng cho item này

  const debouncedQuantity = useDebounce(quantity, 700); // Delay 700ms trước khi cập nhật

  const handleQuantityChange = (newQuantity) => {
    const numQuantity = Number(newQuantity);
    if (numQuantity >= 1 && numQuantity <= (item.product?.stockQuantity || 99)) { // Giới hạn bởi stock hoặc một số max
      setQuantity(numQuantity);
    } else if (numQuantity < 1) {
      setQuantity(1);
    }
  };

  // Effect để gọi API cập nhật số lượng khi debouncedQuantity thay đổi
  const performUpdateCartItem = useCallback(async (currentDebouncedQuantity) => {
    if (currentDebouncedQuantity !== item.quantity) {
      setIsUpdating(true);
      try {
        // Input cho mutation updateCartItem là { cartItemId: ID!, quantity: Int! }
        // item.id ở đây là cartItemId
        await updateCartItem({ cartItemId: item.id, quantity: currentDebouncedQuantity });
      } catch (error) {
        console.error("Failed to update cart item:", error);
        // Nếu lỗi, có thể rollback quantity về giá trị gốc của item
        setQuantity(item.quantity);
      } finally {
        setIsUpdating(false);
      }
    }
  }, [item.id, item.quantity, updateCartItem]);

  useEffect(() => {
    // Chỉ gọi update nếu debouncedQuantity là một số hợp lệ và khác với quantity ban đầu của item
    if (typeof debouncedQuantity === 'number' && debouncedQuantity !== item.quantity) {
        performUpdateCartItem(debouncedQuantity);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuantity]); // Chỉ phụ thuộc vào debouncedQuantity


  // Cập nhật quantity state nếu item.quantity từ context thay đổi (ví dụ, do một tab khác cập nhật)
  useEffect(() => {
    if (item.quantity !== quantity && !isUpdating) { // Chỉ cập nhật nếu không phải đang trong quá trình debounce
      setQuantity(item.quantity);
    }
  }, [item.quantity, quantity, isUpdating]);


  const handleRemoveItem = async () => {
    setIsUpdating(true); // Dùng chung loading state
    try {
      // item.id ở đây là cartItemId
      await removeFromCart(item.id);
    } catch (error) {
      console.error("Failed to remove cart item:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!item || !item.product) {
    // Trường hợp dữ liệu item hoặc product không đầy đủ
    return (
        <tr>
            <td colSpan="5" className="py-4 px-2 text-center text-sm text-gray-500">
                {t('cart.itemDataError', 'Lỗi dữ liệu sản phẩm trong giỏ hàng.')}
            </td>
        </tr>
    );
  }
  
  const productLink = item.product.slug
    ? `/product/${item.product.slug}`
    : (item.product.id ? `/product/${item.product.id}` : '#'); // Fallback nếu không có slug

  const displayPrice = item.product.salePrice || item.product.price; // Ưu tiên giá sale

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50/50">
      {/* Product Details */}
      <td className="p-3 md:p-4">
        <div className="flex items-center space-x-3 md:space-x-4">
          <Link to={productLink} className="flex-shrink-0">
            <OptimizedImage
              src={item.product.images?.[0]?.imageUrl || PRODUCT_IMAGE_PLACEHOLDER}
              alt={item.product.name || 'Product image'}
              containerClassName="w-16 h-16 md:w-20 md:h-20 rounded overflow-hidden bg-gray-100"
              aspectRatio={null} // Để containerClassName quyết định kích thước
              objectFit="object-contain" // Hoặc object-cover tùy thiết kế
              className="w-full h-full"
            />
          </Link>
          <div>
            <Link to={productLink} className="text-sm md:text-base font-medium text-gray-800 hover:text-indigo-600 line-clamp-2">
              {item.product.name || t('cart.unknownProduct', 'Sản phẩm không xác định')}
            </Link>
            {/* Thêm thông tin variant nếu có (ví dụ: Màu, Size) */}
            {/* {item.productVariant && (
              <p className="text-xs text-gray-500 mt-1">
                {item.productVariant.name}
              </p>
            )} */}
            <button
              onClick={handleRemoveItem}
              disabled={isUpdating || isCartContextLoading}
              className="mt-1 md:hidden text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              <FiTrash2 className="inline mr-1" /> {t('common.remove', 'Xóa')}
            </button>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="p-3 md:p-4 text-sm text-gray-700 text-center md:text-left">
        {formatPrice(displayPrice)}
      </td>

      {/* Quantity */}
      <td className="p-3 md:p-4">
        <div className="flex items-center justify-center md:justify-start space-x-1 md:space-x-2 relative">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1 || isUpdating || isCartContextLoading}
            className="p-1.5 border rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label={t('cart.decreaseQuantity', "Giảm số lượng")}
          >
            <FiMinus size={14} />
          </button>
          <input
            type="number"
            min="1"
            max={item.product.stockQuantity || 99}
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            onBlur={() => performUpdateCartItem(quantity)} // Cập nhật ngay khi blur nếu giá trị thay đổi
            disabled={isUpdating || isCartContextLoading}
            className="w-10 md:w-12 text-center border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            aria-label={t('cart.itemQuantity', "Số lượng sản phẩm")}
          />
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= (item.product.stockQuantity || 99) || isUpdating || isCartContextLoading}
            className="p-1.5 border rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label={t('cart.increaseQuantity', "Tăng số lượng")}
          >
            <FiPlus size={14} />
          </button>
          {(isUpdating || (isCartContextLoading && quantity !== item.quantity) ) && (
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
                <LoadingSpinner size="xs" color="text-gray-400" />
            </div>
          )}
        </div>
      </td>

      {/* Total Price */}
      <td className="p-3 md:p-4 text-sm font-semibold text-gray-800 text-right">
        {formatPrice(displayPrice * item.quantity)}
      </td>

      {/* Remove Button (Desktop) */}
      <td className="p-3 md:p-4 text-right hidden md:table-cell">
        <button
          onClick={handleRemoveItem}
          disabled={isUpdating || isCartContextLoading}
          className="text-gray-400 hover:text-red-600 transition-colors duration-150 disabled:opacity-50"
          aria-label={t('cart.removeItem', "Xóa sản phẩm")}
        >
          <FiTrash2 size={18} />
        </button>
      </td>
    </tr>
  );
};

export default CartItem;