// src/components/product/SizeSelector.jsx
import React, { useCallback } from 'react';
import { Button } from 'react-bootstrap';
import './Selectors.css';

function SizeSelector({
  sizes = [],
  selectedSize,
  onSelectSize,
  inventory = [],
  selectedColor,
  disabled = false,
  className = ""
}) {
  const getVariantQuantity = useCallback((sizeId, colorId) => {
    if (disabled) return 0;
    if (!inventory || inventory.length === 0) return sizes.length > 0 ? 1 : 0;

    const variant = inventory.find(inv =>
      inv.size_id === sizeId &&
      inv.color_id === (colorId || null)
    );
    return variant ? variant.quantity : 0;
  }, [inventory, disabled, sizes.length]);

  if (!sizes || sizes.length === 0) {
    return null;
  }

  const handleSelect = (size) => {
    const quantity = getVariantQuantity(size.size_id, selectedColor?.color_id);
    if (!disabled && quantity > 0) {
      onSelectSize(size.size_id === selectedSize?.size_id ? null : size);
    }
  };

  return (
    <div className={`selector-container size-selector ${className}`}>
      {sizes.length > 0 && <span className="selector-label">Size:</span>}
      {sizes.map(size => {
        const quantity = getVariantQuantity(size.size_id, selectedColor?.color_id);
        const isAvailable = quantity > 0;
        const isSelected = selectedSize?.size_id === size.size_id;

        // --- TÁCH LOGIC TẠO TITLE RA ĐÂY ---
        let titleText = size.size_name; // Mặc định là tên size
        if (!isAvailable) {
          titleText = `${size.size_name} (Hết hàng`;
          if (selectedColor) {
            titleText += ` với màu ${selectedColor.color_name}`;
          }
          titleText += ')';
        }
        // --- KẾT THÚC TÁCH LOGIC ---

        return (
          <Button
            key={size.size_id}
            variant={isSelected ? "dark" : "outline-secondary"}
            size="sm"
            className={`selector-badge size-badge ${!isAvailable ? 'out-of-stock' : 'available'} ${isSelected ? 'active' : ''} ${disabled || !isAvailable ? 'disabled' : ''}`}
            onClick={() => handleSelect(size)}
            title={titleText} // <-- SỬ DỤNG BIẾN titleText Ở ĐÂY
            disabled={disabled || !isAvailable}
            aria-pressed={isSelected}
          >
            {size.size_name}
          </Button>
        );
      })}
    </div>
  );
}
export default React.memo(SizeSelector);