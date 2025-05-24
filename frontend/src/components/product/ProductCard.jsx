// src/components/product/ProductCard.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom'; // Thêm useParams
import { Card, Button, Badge } from 'react-bootstrap';
import { formatCurrency, getFullImageUrl } from '../../utils/formatters';
import { useCart } from '../../hooks/useCart';
import SizeSelector from './SizeSelector';
import ColorSelector from './ColorSelector';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../../utils/constants';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
import './ProductCard.css';

function ProductCard({ product }) {
  const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
  const { addItem } = useCart();
  const params = useParams(); // Để lấy lang từ URL cho link sản phẩm
  const currentLang = params.lang || i18n.language || 'vi';

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(PLACEHOLDER_PRODUCT_IMAGE);
  const [variantMessage, setVariantMessage] = useState('');

  // Lấy tên sản phẩm đã được dịch dựa trên ngôn ngữ hiện tại
  // Giả định product object từ API có product.name (resolver ảo) hoặc product.product_name_vi và product.product_name_en
  const productName = useMemo(() => {
    if (!product) return t('productCard.defaultProductName', 'Sản phẩm'); // Fallback name
    if (i18n.language === 'en' && product.product_name_en) {
      return product.product_name_en;
    }
    return product.product_name_vi || product.product_name || t('productCard.defaultProductName', 'Sản phẩm');
  }, [product, i18n.language, t]);

  const inventoryData = useMemo(() => product?.inventory || [], [product?.inventory]);
  // Giả định product.sizes và product.colors đã chứa tên đã được dịch (nếu cần)
  // Hoặc chúng ta sẽ dịch chúng trong SizeSelector/ColorSelector nếu cần
  const availableSizes = useMemo(() => product?.sizes || [], [product?.sizes]);
  const availableColors = useMemo(() => product?.colors || [], [product?.colors]);

  // Sử dụng ảnh chính từ product.images nếu có, ưu tiên display_order = 0 và không có color_id
  // Hoặc fallback về product.imageUrl (nếu là cấu trúc cũ)
  const getMainProductImage = useCallback(() => {
    if (product?.images && product.images.length > 0) {
      const generalMainImage = product.images.find(img => img.display_order === 0 && !img.color_id);
      if (generalMainImage) return getFullImageUrl(generalMainImage.image_url);
      // Nếu không có ảnh chính chung, lấy ảnh đầu tiên
      return getFullImageUrl(product.images[0].image_url);
    }
    // Fallback cho cấu trúc cũ hoặc nếu không có mảng images
    return getFullImageUrl(product?.imageUrl || product?.images?.[0]?.image_url);
  }, [product]);

  const primaryImageUrl = useMemo(() => getMainProductImage(), [getMainProductImage]);

  // Ảnh hover: lấy ảnh có display_order = 1 và không có color_id, hoặc ảnh thứ hai nếu có
  const getSecondaryProductImage = useCallback(() => {
    if (product?.images && product.images.length > 1) {
      const generalHoverImage = product.images.find(img => img.display_order === 1 && !img.color_id);
      if (generalHoverImage) return getFullImageUrl(generalHoverImage.image_url);
      // Fallback: nếu không có hover image cụ thể, có thể lấy ảnh thứ 2 (nếu khác ảnh chính)
      // Hoặc logic phức tạp hơn dựa trên màu đã chọn
    }
    // Fallback cho cấu trúc cũ
    return product?.secondaryImageUrl ? getFullImageUrl(product.secondaryImageUrl) : null;
  }, [product]);

  const secondaryImageUrl = useMemo(() => getSecondaryProductImage(), [getSecondaryProductImage]);

  useEffect(() => {
    setCurrentImageUrl(primaryImageUrl || PLACEHOLDER_PRODUCT_IMAGE);
    setSelectedSize(null);
    setSelectedColor(null);
    setVariantMessage('');
  }, [product, primaryImageUrl]);


  const getVariantStock = useCallback((sizeId, colorId) => {
    if (!inventoryData || inventoryData.length === 0) {
      return (availableSizes.length > 0 || availableColors.length > 0) ? 0 : Infinity; // No variants defined, but product exists = infinite (for non-variant products)
    }
    const variant = inventoryData.find(inv =>
      inv.size_id === (sizeId || null) && // Handle null sizeId
      inv.color_id === (colorId || null)  // Handle null colorId
    );
    return variant ? variant.quantity : 0;
  }, [inventoryData, availableSizes, availableColors]);

  const selectedVariantStock = useMemo(() => {
    if (!product) return 0;
    // Trường hợp sản phẩm không có size và không có màu (sản phẩm đơn giản)
    if (availableSizes.length === 0 && availableColors.length === 0) {
      const simpleInventory = inventoryData.find(inv => inv.size_id === null && inv.color_id === null);
      return simpleInventory ? simpleInventory.quantity : (inventoryData.length === 0 ? Infinity : 0); // Infinity if no inventory records for a simple product (assumed always in stock)
    }
    // Nếu sản phẩm có size nhưng chưa chọn size
    if (availableSizes.length > 0 && !selectedSize) {
        return 0; // Hoặc một giá trị khác để chỉ thị "chưa chọn"
    }
    // Nếu sản phẩm có màu nhưng chưa chọn màu
    if (availableColors.length > 0 && !selectedColor) {
        return 0; // Hoặc một giá trị khác
    }
    return getVariantStock(selectedSize?.size_id, selectedColor?.color_id);
  }, [product, selectedSize, selectedColor, inventoryData, availableSizes, availableColors, getVariantStock]);

  const isCompletelyOutOfStock = useMemo(() => {
    if (!inventoryData || !product) return true; // No product or no inventory data
    if (inventoryData.length === 0 && (availableSizes.length > 0 || availableColors.length > 0)) return true; // Variants defined but no stock records
    if (inventoryData.length === 0 && availableSizes.length === 0 && availableColors.length === 0) return false; // Simple product, assume in stock if no inventory (or handle differently)
    return inventoryData.every(inv => inv.quantity <= 0);
  }, [inventoryData, product, availableSizes, availableColors]);


  const handleSelectSize = useCallback((size) => {
    const newSelectedSize = size?.size_id === selectedSize?.size_id ? null : size;
    setSelectedSize(newSelectedSize);
    setVariantMessage('');
    const stock = getVariantStock(newSelectedSize?.size_id, selectedColor?.color_id);
    if (availableColors.length > 0 && selectedColor && newSelectedSize && stock <= 0) {
        setVariantMessage(t('productCard.variantOutOfStockDetailed.sizeWithColor', {sizeName: newSelectedSize.size_name, colorName: selectedColor.color_name}));
    }
  }, [selectedColor, getVariantStock, availableColors.length, selectedSize?.size_id, t]);

  const handleSelectColor = useCallback((color) => {
    const newSelectedColor = color?.color_id === selectedColor?.color_id ? null : color;
    setSelectedColor(newSelectedColor);
    setVariantMessage('');

    // Cập nhật ảnh hiển thị dựa trên màu đã chọn (nếu có ảnh riêng cho màu đó)
    if (newSelectedColor && product?.images) {
        const colorSpecificImage = product.images.find(img => img.color_id === newSelectedColor.color_id && img.display_order === 0);
        if (colorSpecificImage) {
            setCurrentImageUrl(getFullImageUrl(colorSpecificImage.image_url));
        } else {
            setCurrentImageUrl(primaryImageUrl || PLACEHOLDER_PRODUCT_IMAGE); // Fallback về ảnh chính nếu màu không có ảnh riêng
        }
    } else {
        setCurrentImageUrl(primaryImageUrl || PLACEHOLDER_PRODUCT_IMAGE); // Quay về ảnh chính nếu bỏ chọn màu
    }

    const stock = getVariantStock(selectedSize?.size_id, newSelectedColor?.color_id);
    if (availableSizes.length > 0 && selectedSize && newSelectedColor && stock <= 0) {
        setVariantMessage(t('productCard.variantOutOfStockDetailed.colorWithSize', {colorName: newSelectedColor.color_name, sizeName: selectedSize.size_name}));
    }
  }, [selectedSize, getVariantStock, availableSizes.length, selectedColor?.color_id, t, product?.images, primaryImageUrl]);

  const canAddToCart = useMemo(() => {
    if (isCompletelyOutOfStock) return false;
    const sizeRequirementMet = availableSizes.length === 0 || !!selectedSize;
    const colorRequirementMet = availableColors.length === 0 || !!selectedColor;
    // For simple products (no variants), stock is Infinity or actual if one record.
    if (availableSizes.length === 0 && availableColors.length === 0) {
        return selectedVariantStock > 0; // True if Infinity or > 0
    }
    return sizeRequirementMet && colorRequirementMet && selectedVariantStock > 0;
  }, [isCompletelyOutOfStock, availableSizes, availableColors, selectedSize, selectedColor, selectedVariantStock]);

  const handleAddToCart = () => {
    if (!canAddToCart) {
        let messageKey = "productCard.pleaseSelectAllAttributes";
        if (availableSizes.length > 0 && !selectedSize) messageKey = "productCard.pleaseSelectSize";
        else if (availableColors.length > 0 && !selectedColor) messageKey = "productCard.pleaseSelectColor";
        else if (selectedVariantStock <= 0 && !isCompletelyOutOfStock) messageKey = "productCard.variantOutOfStock";
        else if (isCompletelyOutOfStock) messageKey = "productCard.outOfStock";
        setVariantMessage(t(messageKey));
        return;
    }
    addItem(product, 1, selectedSize, selectedColor); // product ở đây nên là object đầy đủ với các trường ngôn ngữ
    setVariantMessage(t('productCard.addedToCart', { productName: productName }));
    setTimeout(() => setVariantMessage(''), 3000);
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = PLACEHOLDER_PRODUCT_IMAGE;
    setCurrentImageUrl(PLACEHOLDER_PRODUCT_IMAGE);
  };

  const handleMouseEnter = () => {
    if (secondaryImageUrl && secondaryImageUrl !== PLACEHOLDER_PRODUCT_IMAGE) setCurrentImageUrl(secondaryImageUrl);
  };
  const handleMouseLeave = () => {
    // Nếu có màu đang được chọn và có ảnh riêng cho màu đó, giữ ảnh đó
    if (selectedColor && product?.images) {
        const colorSpecificImage = product.images.find(img => img.color_id === selectedColor.color_id && img.display_order === 0);
        if (colorSpecificImage) {
            setCurrentImageUrl(getFullImageUrl(colorSpecificImage.image_url));
            return;
        }
    }
    // Ngược lại, quay về ảnh chính
    setCurrentImageUrl(primaryImageUrl || PLACEHOLDER_PRODUCT_IMAGE);
  };


  if (!product || !product.product_id) {
      return null;
  }

  return (
    <Card className="product-card h-100 shadow-sm border-0">
      <Link to={langPath(`products/${product.product_id}`)} className="product-card-link d-block">
        <div
          className="product-image-wrapper"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Card.Img
            variant="top"
            src={currentImageUrl}
            alt={productName} // Sử dụng tên sản phẩm đã dịch
            className="product-card-img"
            onError={handleImageError}
          />
          {isCompletelyOutOfStock && <Badge bg="dark" className="product-badge out-of-stock-badge">{t('productCard.outOfStock')}</Badge>}
          {(product.is_new_arrival === true) && !isCompletelyOutOfStock && <Badge bg="danger" className="product-badge new-arrival-badge">{t('productCard.new')}</Badge>}
        </div>
      </Link>
      <Card.Body className="d-flex flex-column p-3 product-card-body">
        <Card.Title className="product-card-title mb-2 order-1">
          <Link to={langPath(`products/${product.product_id}`)} className="text-dark text-decoration-none">
            {productName}
          </Link>
        </Card.Title>

        {(availableSizes.length > 0 || availableColors.length > 0) && (
            <div className="product-card-selectors mb-2 order-2">
                {availableSizes.length > 0 && (
                <SizeSelector
                    sizes={availableSizes}
                    selectedSize={selectedSize}
                    onSelectSize={handleSelectSize}
                    inventory={inventoryData}
                    selectedColor={selectedColor}
                    disabled={isCompletelyOutOfStock}
                    className="mb-1"
                />
                )}
                {availableColors.length > 0 && (
                <ColorSelector
                    colors={availableColors}
                    selectedColor={selectedColor}
                    onSelectColor={handleSelectColor}
                    inventory={inventoryData}
                    selectedSize={selectedSize}
                    disabled={isCompletelyOutOfStock}
                />
                )}
            </div>
        )}

        <p className="product-card-price mb-2 order-3">
          {formatCurrency(parseFloat(product.product_price), i18n.language)}
        </p>

        {variantMessage && (
            <small className={`d-block mb-2 variant-message order-4 ${canAddToCart && variantMessage === t('productCard.addedToCart', { productName: productName }) ? 'text-success' : 'text-danger'}`}>
                {variantMessage}
            </small>
        )}

        <div className={`d-flex align-items-center mt-auto order-5`}>
          <Button
            variant="dark"
            size="sm"
            onClick={handleAddToCart}
            disabled={!canAddToCart || isCompletelyOutOfStock}
            className="add-to-cart-btn flex-grow-1"
            title={canAddToCart ? t('productCard.addToCart') : (isCompletelyOutOfStock ? t('productCard.outOfStock') : t('productCard.selectVariant'))}
          >
            <i className="bi bi-cart-plus me-1"></i>
            {isCompletelyOutOfStock ? t('productCard.outOfStock') : t('productCard.addToCart')}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
// Helper để tạo link với prefix ngôn ngữ
const langPath = (path, currentLangParam) => {
    const lang = currentLangParam || 'vi'; // Fallback nếu không có lang
    return `/${lang}/${path}`.replace(/\/+/g, '/');
};

export default React.memo(ProductCard);
