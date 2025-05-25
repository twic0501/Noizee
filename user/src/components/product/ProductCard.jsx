// src/components/product/ProductCard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatCurrency, getFullImageUrl } from '../../utils/formatters'; // Import từ file mới
// import { useCart } from '../../contexts/CartContext';

const ProductCard = ({ product }) => {
  const { t, i18n } = useTranslation();
  // const { addToCart } = useCart(); // Sẽ dùng sau

  // State cho ảnh hiển thị
  const [currentImage, setCurrentImage] = useState(getFullImageUrl(null));
  // State cho ảnh sẽ hiển thị khi hover (ảnh thứ 2 không theo màu)
  const [hoverPreviewImage, setHoverPreviewImage] = useState(null);
  // State cho màu đang được active (khi click hoặc hover swatch)
  const [activeColorInfo, setActiveColorInfo] = useState(null); // { id, hex, firstImage, secondImage }

  // Lấy tên sản phẩm đã dịch (GraphQL resolver nên trả về tên đã dịch dựa trên 'lang')
  const productName = useMemo(() => {
    if (!product) return t('productCard.defaultProductName', 'Sản phẩm');
    return product.name || product.product_name_vi; // product.name từ resolver đã có lang
  }, [product, t]);

  const productPriceFormatted = useMemo(() => {
    if (!product || typeof product.product_price !== 'number') return '';
    return formatCurrency(product.product_price, i18n.language);
  }, [product, i18n.language]);

  // Xác định ảnh mặc định và ảnh hover mặc định khi component mount hoặc product thay đổi
  useEffect(() => {
    let defaultMainImg = getFullImageUrl(null);
    let defaultHoverImg = null;

    if (product?.general_images && product.general_images.length > 0) {
      defaultMainImg = getFullImageUrl(product.general_images[0].image_url);
      if (product.general_images.length > 1) {
        defaultHoverImg = getFullImageUrl(product.general_images[1].image_url);
      }
    } else if (product?.all_images && product.all_images.length > 0) {
      // Fallback: nếu không có ảnh chung, lấy ảnh đầu tiên từ all_images
      defaultMainImg = getFullImageUrl(product.all_images[0].image_url);
      if (product.all_images.length > 1) {
        defaultHoverImg = getFullImageUrl(product.all_images[1].image_url);
      }
    }

    setCurrentImage(defaultMainImg);
    setHoverPreviewImage(defaultHoverImg || defaultMainImg); // Nếu không có ảnh hover, dùng ảnh chính
    setActiveColorInfo(null); // Reset màu active
  }, [product]);

  // Lấy danh sách màu duy nhất từ inventoryItems
  const uniqueColors = useMemo(() => {
    if (!product?.inventoryItems) return [];
    const colorsMap = new Map();
    product.inventoryItems.forEach(item => {
      if (item.color && !colorsMap.has(item.color.color_id)) {
        // Tìm ảnh cho màu này
        const colorImages = product.all_images?.filter(img => img.color?.color_id === item.color.color_id) || [];
        colorsMap.set(item.color.color_id, {
            ...item.color,
            firstImage: colorImages.length > 0 ? getFullImageUrl(colorImages[0].image_url) : null,
            secondImage: colorImages.length > 1 ? getFullImageUrl(colorImages[1].image_url) : null
        });
      }
    });
    return Array.from(colorsMap.values());
  }, [product?.inventoryItems, product?.all_images]);

  const handleMouseEnterCard = () => {
    if (!activeColorInfo) { // Nếu không có màu nào đang "ghim"
      setCurrentImage(hoverPreviewImage);
    } else if (activeColorInfo.secondImage) {
        setCurrentImage(activeColorInfo.secondImage);
    }
  };

  const handleMouseLeaveCard = () => {
    if (!activeColorInfo) {
      setCurrentImage(defaultImage); // Quay về ảnh default của sản phẩm
    } else {
        setCurrentImage(activeColorInfo.firstImage || defaultImage); // Quay về ảnh chính của màu active
    }
  };

  const handleColorSwatchInteraction = (colorData, interactionType = 'hover') => {
    // interactionType có thể là 'hover' hoặc 'click'
    const imageToShow = colorData.firstImage || defaultImage;
    const hoverToShow = colorData.secondImage || colorData.firstImage || hoverPreviewImage;

    setCurrentImage(imageToShow);
    // Nếu muốn hiệu ứng hover trên swatch cũng đổi ảnh thứ 2 của màu đó:
    // setHoverPreviewImage(hoverToShow); // Cập nhật cả hoverPreviewImage cho màu đó

    if (interactionType === 'click') {
        setActiveColorInfo(colorData); // "Ghim" màu này
    } else if (interactionType === 'hover_enter' && !activeColorInfo) { // Chỉ set active nếu chưa có màu nào ghim
        setActiveColorInfo(colorData);
    }
  };

  const handleMouseLeaveSwatches = () => {
      if (activeColorInfo && !activeColorInfo.isPinned) { // Giả sử có isPinned nếu click
          setActiveColorInfo(null);
          setCurrentImage(defaultImage);
          setHoverPreviewImage(product?.general_images?.[1]?.image_url ? getFullImageUrl(product.general_images[1].image_url) : defaultImage);
      }
  }


  if (!product) return null;

  return (
    <div
        className="group flex flex-col bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
        onMouseLeave={handleMouseLeaveCard} // Reset về ảnh default (hoặc ảnh màu active) khi rời card
    >
      <Link to={`/${i18n.language}/products/${product.product_id}`} className="block">
        <div
          className="relative w-full aspect-[3/4] overflow-hidden bg-gray-100" // Tỉ lệ 3:4, bạn có thể đổi
          onMouseEnter={handleMouseEnterCard} // Hover vào vùng ảnh
        >
          <img
            src={currentImage}
            alt={productName}
            className="absolute inset-0 w-full h-full object-contain transition-opacity duration-300"
            onError={(e) => { e.target.src = getFullImageUrl(null); }}
          />
          {product.is_new_arrival && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded font-semibold z-10">
              {t('productCard.new', 'Mới')}
            </span>
          )}
           {/* Có thể thêm badge hết hàng sau khi có logic isCompletelyOutOfStock */}
        </div>
      </Link>

      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <h3 className="text-xs sm:text-sm font-medium text-gray-700 truncate hover:text-blue-600 mb-1 min-h-[2.5em] sm:min-h-[2.75em] line-clamp-2">
          <Link to={`/${i18n.language}/products/${product.product_id}`} title={productName}>
            {productName}
          </Link>
        </h3>

        {/* Color Swatches */}
        {uniqueColors && uniqueColors.length > 0 && (
          <div className="flex space-x-1.5 mb-2 items-center min-h-[24px]" onMouseLeave={handleMouseLeaveSwatches}>
            {uniqueColors.slice(0, 5).map(color => (
              <button
                key={color.color_id}
                type="button"
                title={color.name}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border focus:outline-none transition-all duration-150
                            ${activeColorInfo?.color_id === color.color_id ? 'ring-2 ring-offset-1 ring-blue-500 scale-110 border-white' : 'border-gray-300 hover:border-gray-400'}
                            ${color.color_hex === '#FFFFFF' || color.color_hex === '#FFF' ? '!border-gray-400' : ''}`}
                style={{ backgroundColor: color.color_hex || '#DDDDDD' }}
                onMouseEnter={() => handleColorSwatchInteraction(color, 'hover_enter')}
                // onClick={() => handleColorSwatchInteraction(color, 'click')} // Dùng nếu muốn ghim màu khi click
              />
            ))}
            {uniqueColors.length > 5 && (
              <span className="text-xs text-gray-500 ml-1">+{uniqueColors.length - 5}</span>
            )}
          </div>
        )}

        <p className="text-sm sm:text-base font-semibold text-gray-900 mt-auto pt-1">
          {productPriceFormatted}
        </p>

        {/* Nút thêm vào giỏ hàng hoặc xem chi tiết (Tạm ẩn nút Add to Cart) */}
        {/*
        <button
          onClick={() => console.log("Add to cart (logic TBD):", product.product_id)}
          className="mt-2 w-full bg-gray-800 text-white text-center py-2 px-3 rounded-md hover:bg-gray-700 transition-colors text-xs sm:text-sm font-medium"
        >
          {t('productCard.addToCart', 'Thêm vào giỏ')}
        </button>
        */}
      </div>
    </div>
  );
};

export default React.memo(ProductCard);