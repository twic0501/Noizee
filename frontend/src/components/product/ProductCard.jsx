// src/components/product/ProductCard.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from 'react-bootstrap';
import { formatCurrency, getFullImageUrl } from '../../utils/formatters';
import { useCart } from '../../hooks/useCart';
import SizeSelector from './SizeSelector';
import ColorSelector from './ColorSelector';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../../utils/constants';
import './ProductCard.css';

function ProductCard({ product }) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(PLACEHOLDER_PRODUCT_IMAGE); // Khởi tạo với placeholder
  const [variantMessage, setVariantMessage] = useState('');

  const inventoryData = useMemo(() => product?.inventory || [], [product?.inventory]);
  const availableSizes = useMemo(() => product?.sizes || [], [product?.sizes]);
  const availableColors = useMemo(() => product?.colors || [], [product?.colors]);

  const primaryImageUrl = useMemo(() => getFullImageUrl(product?.imageUrl), [product?.imageUrl]);
  const secondaryImageUrl = useMemo(() => product?.secondaryImageUrl ? getFullImageUrl(product.secondaryImageUrl) : null, [product?.secondaryImageUrl]);

  // Cập nhật ảnh khi product prop thay đổi hoặc ảnh chính thay đổi
  useEffect(() => {
    const mainImg = getFullImageUrl(product?.imageUrl);
    setCurrentImageUrl(mainImg); // Luôn set ảnh chính trước
    setSelectedSize(null); // Reset lựa chọn khi sản phẩm thay đổi
    setSelectedColor(null);
    setVariantMessage('');
  }, [product]);


  const getVariantStock = useCallback((sizeId, colorId) => {
    // ... (logic getVariantStock giữ nguyên)
    if (!inventoryData || inventoryData.length === 0) {
      return (availableSizes.length > 0 || availableColors.length > 0) ? 0 : Infinity;
    }
    const variant = inventoryData.find(inv =>
      inv.size_id === (sizeId || null) &&
      inv.color_id === (colorId || null)
    );
    return variant ? variant.quantity : 0;
  }, [inventoryData, availableSizes, availableColors]);

  const selectedVariantStock = useMemo(() => {
    // ... (logic selectedVariantStock giữ nguyên) ...
    if (!product) return 0;
    if (availableSizes.length === 0 && availableColors.length === 0) {
      const simpleInventory = inventoryData.find(inv => inv.size_id === null && inv.color_id === null);
      return simpleInventory ? simpleInventory.quantity : (inventoryData.length === 0 && product.product_id ? Infinity : 0);
    }
    if ((availableSizes.length > 0 && !selectedSize) || (availableColors.length > 0 && !selectedColor)) {
        return 0;
    }
    return getVariantStock(selectedSize?.size_id, selectedColor?.color_id);
  }, [product, selectedSize, selectedColor, inventoryData, availableSizes, availableColors, getVariantStock]);

  const isCompletelyOutOfStock = useMemo(() => {
    // ... (logic isCompletelyOutOfStock giữ nguyên) ...
    if (!inventoryData || !product) return true;
    if (availableSizes.length === 0 && availableColors.length === 0) {
      const simpleInventory = inventoryData.find(inv => inv.size_id === null && inv.color_id === null);
      return simpleInventory ? simpleInventory.quantity <= 0 : (inventoryData.length > 0 ? true: false);
    }
    return inventoryData.length > 0 && inventoryData.every(inv => inv.quantity <= 0);
  }, [inventoryData, product, availableSizes, availableColors]);


  const handleSelectSize = useCallback((size) => {
    // ... (logic handleSelectSize giữ nguyên) ...
    const newSelectedSize = size?.size_id === selectedSize?.size_id ? null : size;
    setSelectedSize(newSelectedSize);
    setVariantMessage('');
    const stock = getVariantStock(newSelectedSize?.size_id, selectedColor?.color_id);
    if (availableColors.length > 0 && selectedColor && newSelectedSize && stock <= 0) {
        setVariantMessage(`Size ${newSelectedSize.size_name} hết hàng với màu ${selectedColor.color_name}.`);
    }
  }, [selectedColor, getVariantStock, availableColors.length, selectedSize?.size_id]);

  const handleSelectColor = useCallback((color) => {
    // ... (logic handleSelectColor giữ nguyên) ...
    const newSelectedColor = color?.color_id === selectedColor?.color_id ? null : color;
    setSelectedColor(newSelectedColor);
    setVariantMessage('');
    const stock = getVariantStock(selectedSize?.size_id, newSelectedColor?.color_id);
    if (availableSizes.length > 0 && selectedSize && newSelectedColor && stock <= 0) {
        setVariantMessage(`Màu ${newSelectedColor.color_name} hết hàng với size ${selectedSize.size_name}.`);
    }
  }, [selectedSize, getVariantStock, availableSizes.length, selectedColor?.color_id]);

  const canAddToCart = useMemo(() => {
    // ... (logic canAddToCart giữ nguyên) ...
    if (isCompletelyOutOfStock) return false;
    const sizeRequirementMet = availableSizes.length === 0 || !!selectedSize;
    const colorRequirementMet = availableColors.length === 0 || !!selectedColor;
    return sizeRequirementMet && colorRequirementMet && selectedVariantStock > 0 && selectedVariantStock !== Infinity;
  }, [isCompletelyOutOfStock, availableSizes, availableColors, selectedSize, selectedColor, selectedVariantStock]);

  const handleAddToCart = () => {
    // ... (logic handleAddToCart giữ nguyên) ...
    if (!canAddToCart) {
        let message = "Vui lòng chọn đầy đủ thuộc tính sản phẩm.";
        if (availableSizes.length > 0 && !selectedSize) message = "Vui lòng chọn size.";
        else if (availableColors.length > 0 && !selectedColor) message = "Vui lòng chọn màu sắc.";
        else if (selectedVariantStock <= 0 && !isCompletelyOutOfStock) message = "Lựa chọn này hiện đã hết hàng.";
        else if (isCompletelyOutOfStock) message = "Sản phẩm này đã hết hàng.";
        setVariantMessage(message);
        return;
    }
    addItem(product, 1, selectedSize, selectedColor);
    setVariantMessage(`${product.product_name} đã được thêm vào giỏ!`);
    setTimeout(() => setVariantMessage(''), 3000);
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = PLACEHOLDER_PRODUCT_IMAGE; // Sử dụng placeholder đã import
    setCurrentImageUrl(PLACEHOLDER_PRODUCT_IMAGE); // Cập nhật state để không thử load lại ảnh lỗi
  };

  const handleMouseEnter = () => {
    if (secondaryImageUrl && secondaryImageUrl !== PLACEHOLDER_PRODUCT_IMAGE) setCurrentImageUrl(secondaryImageUrl);
  };
  const handleMouseLeave = () => {
    // Chỉ quay lại ảnh chính nếu nó không phải là placeholder (trừ khi ảnh chính cũng lỗi)
    if (primaryImageUrl !== PLACEHOLDER_PRODUCT_IMAGE || currentImageUrl === PLACEHOLDER_PRODUCT_IMAGE) {
        setCurrentImageUrl(primaryImageUrl);
    }
  };


  if (!product || !product.product_id) {
      return null;
  }

  return (
    <Card className="product-card h-100 shadow-sm border-0">
      <Link to={`/products/${product.product_id}`} className="product-card-link d-block">
        <div
          className="product-image-wrapper" // CSS: Thêm class này và style cho tỉ lệ 1:1
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Card.Img
            variant="top"
            src={currentImageUrl} // Sử dụng state currentImageUrl
            alt={product.product_name}
            className="product-card-img" // CSS: object-fit: cover
            onError={handleImageError} // Xử lý lỗi tải ảnh
          />
          {isCompletelyOutOfStock && <Badge bg="dark" className="product-badge out-of-stock-badge">Hết hàng</Badge>}
          {(product.isNewArrival === true) && !isCompletelyOutOfStock && <Badge bg="danger" className="product-badge new-arrival-badge">Mới</Badge>}
        </div>
      </Link>
      <Card.Body className="d-flex flex-column p-3 product-card-body">
        {/* THỨ TỰ MỚI: Tên -> Size/Color (nếu có) -> Giá */}
        <Card.Title className="product-card-title mb-2 order-1"> {/* order-1 */}
          <Link to={`/products/${product.product_id}`} className="text-dark text-decoration-none">
            {product.product_name || "Unnamed Product"}
          </Link>
        </Card.Title>

        {(availableSizes.length > 0 || availableColors.length > 0) && (
            <div className="product-card-selectors mb-2 order-2"> {/* order-2 */}
                {availableSizes.length > 0 && (
                <SizeSelector
                    sizes={availableSizes}
                    selectedSize={selectedSize}
                    onSelectSize={handleSelectSize}
                    inventory={inventoryData}
                    selectedColor={selectedColor}
                    disabled={isCompletelyOutOfStock}
                    className="mb-1" // Thêm margin bottom nếu có cả color selector
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

        <p className="product-card-price mb-2 order-3"> {/* order-3 */}
          {formatCurrency(parseFloat(product.product_price))}
        </p>

        {/* Thông báo lỗi/thành công cho biến thể */}
        {variantMessage && (
            <small className={`d-block mb-2 variant-message order-4 ${canAddToCart && variantMessage.includes("thêm vào giỏ") ? 'text-success' : 'text-danger'}`}>
                {variantMessage}
            </small>
        )}

        {/* Nút Add to Cart sẽ ở cuối cùng nhờ flex-grow-1 của parent hoặc mt-auto */}
        <div className={`d-flex align-items-center mt-auto order-5`}> {/* order-5, mt-auto để đẩy xuống */}
          <Button
            variant="dark"
            size="sm"
            onClick={handleAddToCart}
            disabled={!canAddToCart || isCompletelyOutOfStock}
            className="add-to-cart-btn flex-grow-1"
            title={canAddToCart ? "Thêm vào giỏ" : (isCompletelyOutOfStock ? "Hết hàng" : "Chọn size/màu")}
          >
            <i className="bi bi-cart-plus me-1"></i>
            {isCompletelyOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default React.memo(ProductCard);