import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiShoppingCart, FiHeart, FiEye } from 'react-icons/fi'; // Icons

import { useCart } from '../../contexts/CartContext'; // Hook useCart
import { useAuth } from '../../contexts/AuthContext'; // Hook useAuth (nếu cần cho wishlist)
import { formatPrice } from '../../utils/formatters';
import { classNames } from '../../utils/helpers';
import OptimizedImage from '../common/OptimizedImage'; // Component OptimizedImage
import { PRODUCT_IMAGE_PLACEHOLDER } from '../../utils/constants';
// import ProductQuickViewModal from './ProductQuickViewModal'; // Component này sẽ tạo sau nếu cần

const ProductCard = ({ product, className = '' }) => {
  const { t } = useTranslation();
  const { addToCart, isLoading: cartLoading } = useCart();
  // const { authState, addToWishlist, removeFromWishlist, isInWishlist } = useAuth(); // Giả sử AuthContext có logic wishlist
  const navigate = useNavigate();

  // State cho ảnh hover và màu được chọn
  const [currentImage, setCurrentImage] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null); // object màu được chọn

  // Xác định ảnh hiển thị ban đầu và khi chọn màu
  useEffect(() => {
    let primaryImage = PRODUCT_IMAGE_PLACEHOLDER;
    if (selectedColor && selectedColor.images && selectedColor.images.length > 0) {
      primaryImage = selectedColor.images[0]?.imageUrl || PRODUCT_IMAGE_PLACEHOLDER;
    } else if (product.images && product.images.length > 0) {
      primaryImage = product.images[0]?.imageUrl || PRODUCT_IMAGE_PLACEHOLDER;
    }
    setCurrentImage(primaryImage);
  }, [product.images, selectedColor]);

  if (!product) return null;

  const productLink = product.slug ? `/product/${product.slug}` : (product.id ? `/product/${product.id}` : '#');

  const imagesForCurrentSelection = selectedColor?.images?.length > 0 ? selectedColor.images : product.images;
  const mainImage = imagesForCurrentSelection?.[0]?.imageUrl || PRODUCT_IMAGE_PLACEHOLDER;
  const hoverImage = imagesForCurrentSelection?.[1]?.imageUrl; // Ảnh thứ 2 cho hover

  const displayPrice = product.salePrice || product.price;
  const originalPrice = product.price;
  const hasSale = product.salePrice && product.salePrice < product.price;

  const handleAddToCart = (e) => {
    e.preventDefault(); // Ngăn Link điều hướng khi bấm nút Add to Cart
    e.stopPropagation();
    // addToCart cần input: { productId, quantity, productVariantId? }
    // Giả sử chỉ thêm 1 sản phẩm và không có variant phức tạp ở card
    addToCart({ productId: product.id, quantity: 1 });
  };

  const handleColorSelect = (e, color) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColor(color);
  };

  // const handleWishlistToggle = (e) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   if (!authState.isAuthenticated) {
  //     navigate('/login', { state: { from: location } }); // location cần được lấy từ useLocation nếu dùng ở đây
  //     return;
  //   }
  //   // Logic thêm/xóa wishlist
  //   // if (isInWishlist(product.id)) {
  //   //   removeFromWishlist(product.id);
  //   // } else {
  //   //   addToWishlist(product);
  //   // }
  // };

  // const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  // const openQuickView = (e) => {
  //   e.preventDefault(); e.stopPropagation();
  //   setIsQuickViewOpen(true);
  // }
  // const closeQuickView = () => setIsQuickViewOpen(false);


  return (
    <div
      className={classNames(
        "product-card group bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col",
        className
      )}
      onMouseEnter={() => hoverImage && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Link to={productLink} className="block relative">
        <div className="relative w-full aspect-square overflow-hidden"> {/* Giữ tỷ lệ 1:1 hoặc thay đổi tùy ý */}
          <OptimizedImage
            src={isHovering && hoverImage ? hoverImage : currentImage}
            alt={product.name || 'Product image'}
            containerClassName="w-full h-full"
            aspectRatio={null} // Để container quyết định
            objectFit="object-cover" // Hoặc object-contain nếu muốn thấy toàn bộ ảnh
            className="w-full h-full transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
          {/* Lớp phủ cho các action buttons (Quick View, Wishlist) */}
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* <button
              onClick={openQuickView}
              className="p-2 bg-white rounded-full text-gray-700 hover:bg-indigo-500 hover:text-white transition-colors"
              aria-label={t('product.quickView', "Xem nhanh")}
            >
              <FiEye size={18} />
            </button> */}
            {/* <button
              onClick={handleWishlistToggle}
              className="p-2 bg-white rounded-full text-gray-700 hover:bg-pink-500 hover:text-white transition-colors"
              aria-label={t('product.wishlist', "Yêu thích")}
            >
              <FiHeart size={18} className={isInWishlist(product.id) ? "fill-pink-500 text-pink-500" : ""} />
            </button> */}
          </div>
        </div>
        {hasSale && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
            {t('product.sale', 'SALE')} {Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}%
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        {/* Tên sản phẩm */}
        <h3 className="text-sm md:text-base font-medium text-gray-800 mb-1">
          <Link to={productLink} className="hover:text-indigo-600 line-clamp-2">
            {product.name || t('product.untitled', 'Sản phẩm không tên')}
          </Link>
        </h3>

        {/* Màu sắc (nếu có) */}
        {product.colors && product.colors.length > 0 && (
          <div className="mt-1 mb-2 flex items-center space-x-1.5">
            {product.colors.slice(0, 5).map((color) => ( // Hiển thị tối đa 5 màu
              <button
                key={color.id || color.name}
                onClick={(e) => handleColorSelect(e, color)}
                aria-label={t('product.selectColor', 'Chọn màu {{colorName}}', { colorName: color.name })}
                className={classNames(
                  "w-5 h-5 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-1",
                  selectedColor?.id === color.id || (!selectedColor && product.colors[0].id === color.id)
                    ? 'ring-indigo-500 border-indigo-500'
                    : 'border-transparent hover:border-gray-400'
                )}
                style={{ backgroundColor: color.hexCode || color.name.toLowerCase() }} // Sử dụng hexCode hoặc tên màu
              >
                <span className="sr-only">{color.name}</span>
              </button>
            ))}
            {product.colors.length > 5 && (
              <span className="text-xs text-gray-500">+{product.colors.length - 5}</span>
            )}
          </div>
        )}

        {/* Size (hiển thị đơn giản, chi tiết hơn ở trang sản phẩm) */}
        {/* {product.sizes && product.sizes.length > 0 && (
          <p className="text-xs text-gray-500 mb-2 truncate">
            {t('product.sizesAvailable', 'Sizes')}: {product.sizes.map(s => s.name).join(', ')}
          </p>
        )} */}

        {/* Giá */}
        <div className="mt-auto flex items-center justify-between">
          <p className="text-base md:text-lg font-semibold text-indigo-600">
            {formatPrice(displayPrice)}
            {hasSale && originalPrice && (
              <span className="ml-2 text-xs text-gray-500 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </p>
          
          {/* Nút Add to Cart (có thể bỏ nếu muốn user vào trang chi tiết) */}
          <button
            onClick={handleAddToCart}
            disabled={cartLoading || product.stockQuantity === 0} // Disable nếu hết hàng
            className={classNames(
              "p-1.5 sm:p-2 rounded-md text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
              product.stockQuantity === 0 ? "bg-gray-400" : "bg-indigo-500 hover:bg-indigo-600"
            )}
            aria-label={t('product.addToCart', "Thêm vào giỏ")}
          >
            {cartLoading ? <LoadingSpinner size="xs" color="text-white"/> : <FiShoppingCart size={16} />}
          </button>
        </div>
        {product.stockQuantity === 0 && (
            <p className="text-xs text-red-500 mt-1">{t('product.outOfStock', 'Hết hàng')}</p>
        )}
      </div>
      {/* {isQuickViewOpen && (
        <ProductQuickViewModal
          productId={product.id} // Hoặc slug
          isOpen={isQuickViewOpen}
          onClose={closeQuickView}
        />
      )} */}
    </div>
  );
};

export default ProductCard;