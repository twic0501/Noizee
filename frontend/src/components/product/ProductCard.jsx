import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from 'react-bootstrap';
import { formatCurrency, getFullImageUrl } from '@noizee/shared-utils';
import { useCart } from '../../hooks/useCart';
import SizeSelector from './SizeSelector';
import ColorSelector from './ColorSelector';
import './ProductCard.css';

const PLACEHOLDER_IMAGE = '/images/placeholder.png';

function ProductCard({ product }) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [hovered, setHovered] = useState(false);

  if (!product || !product.product_id) return null; // Thêm check product_id

  const inventoryData = product.inventory || [];
  const availableSizes = product.sizes || [];
  const availableColors = product.colors || [];

  const imageUrl = getFullImageUrl(product.imageUrl);
  const hoverImageUrl = product.secondaryImageUrl ? getFullImageUrl(product.secondaryImageUrl) : imageUrl;

  const selectedVariantStock = useMemo(() => {
    // Nếu SP không yêu cầu size/color, coi như còn hàng (backend sẽ check lại)
    if (availableSizes.length === 0 && availableColors.length === 0) return Infinity;
    // Nếu có inventory data nhưng mảng rỗng, tức là chưa nhập kho -> hết hàng
    if (inventoryData.length === 0 && (availableSizes.length > 0 || availableColors.length > 0)) return 0;

    const variant = inventoryData.find(inv =>
       inv.size_id === (selectedSize?.size_id || null) &&
       inv.color_id === (selectedColor?.color_id || null)
     );
    return variant ? variant.quantity : 0; // Hết hàng nếu không tìm thấy variant khớp
  }, [inventoryData, selectedSize, selectedColor, availableSizes, availableColors]);

  const isCompletelyOutOfStock = useMemo(() => {
       if (!inventoryData) return true; // Đang load hoặc lỗi
       // Nếu SP có định nghĩa size/color nhưng inventory rỗng -> Hết hàng
       if (inventoryData.length === 0 && (availableSizes.length > 0 || availableColors.length > 0)) return true;
       // Nếu không có size/color -> Không thể hết hàng theo kiểu này
       if (availableSizes.length === 0 && availableColors.length === 0) return false;
       // Hết hàng nếu mọi variant trong inventory đều có quantity <= 0
       return inventoryData.every(inv => inv.quantity <= 0);
   }, [inventoryData, availableSizes, availableColors]);

  const handleAddToCart = () => {
    if (availableSizes.length > 0 && !selectedSize) { alert("Vui lòng chọn size."); return; }
    if (availableColors.length > 0 && !selectedColor) { alert("Vui lòng chọn màu."); return; }
    if (selectedVariantStock < 1) { alert("Lựa chọn này hiện đã hết hàng."); return; }

    addItem(product, 1, selectedSize, selectedColor);
    alert(`${product.product_name} đã được thêm vào giỏ!`);
  };

  const handleImageError = (e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE; };

  // Điều kiện để enable nút Add to Cart
  const canAddToCart = !isCompletelyOutOfStock &&
                       (availableSizes.length === 0 || selectedSize) &&
                       (availableColors.length === 0 || selectedColor) &&
                       selectedVariantStock >= 1;

  return (
    <Card className="product-card h-100 shadow-sm border-0">
      <Link to={`/products/${product.product_id}`} className="product-card-link">
        <div
            className="product-image-wrapper"
            onMouseEnter={() => product.secondaryImageUrl && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Card.Img
                variant="top"
                src={hovered ? hoverImageUrl : imageUrl}
                alt={product.product_name}
                className="product-card-img"
                onError={handleImageError}
            />
            {isCompletelyOutOfStock && <Badge bg="dark" className="sold-out-badge">Sold Out</Badge>}
            {product.isNewArrival && !isCompletelyOutOfStock && <Badge bg="danger" className="new-arrival-badge">New</Badge>}
         </div>
       </Link>
       <Card.Body className="d-flex flex-column p-3">
         <Card.Title className="product-card-title mb-1">
           <Link to={`/products/${product.product_id}`} className="text-dark text-decoration-none">
             {product.product_name}
           </Link>
         </Card.Title>

         <p className="product-card-price mb-2">
           {formatCurrency(product.product_price)}
         </p>

         {availableSizes.length > 0 && (
             <SizeSelector
                 sizes={availableSizes}
                 selectedSize={selectedSize}
                 onSelectSize={setSelectedSize}
                 inventory={inventoryData}
                 selectedColor={selectedColor}
                 disabled={isCompletelyOutOfStock} // Disable nếu hết sạch hàng
             />
         )}

         <div className={`d-flex align-items-center ${availableSizes.length > 0 ? 'mt-2' : 'mt-auto'}`}>
             <Button
                 variant="dark"
                 size="sm"
                 onClick={handleAddToCart}
                 disabled={!canAddToCart} // Dùng biến đã tính toán
                 className="add-to-cart-btn me-2"
                 title={canAddToCart ? "Add to Cart" : (isCompletelyOutOfStock ? "Sold Out" : "Please select size/color")}
             >
                 <i className="bi bi-cart-plus"></i>
             </Button>

              {availableColors.length > 0 && (
                 <ColorSelector
                     colors={availableColors}
                     selectedColor={selectedColor}
                     onSelectColor={setSelectedColor}
                     inventory={inventoryData}
                     selectedSize={selectedSize}
                     className="ms-auto"
                     disabled={isCompletelyOutOfStock} // Disable nếu hết sạch hàng
                 />
              )}
         </div>
       </Card.Body>
     </Card>
   );
 }
 export default ProductCard;