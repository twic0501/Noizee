// src/components/product/ColorSelector.jsx
import React, { useCallback } from 'react';
import './Selectors.css';

function ColorSelector({
  colors = [],
  selectedColor,
  onSelectColor,
  inventory = [],
  selectedSize,
  className = "",
  disabled = false
}) {
  const getVariantQuantity = useCallback((colorId, sizeId) => {
    if (disabled) return 0;
    if (!inventory || inventory.length === 0) return colors.length > 0 ? 1 : 0;

    const variant = inventory.find(inv =>
      inv.color_id === colorId &&
      inv.size_id === (sizeId || null)
    );
    return variant ? variant.quantity : 0;
  }, [inventory, disabled, colors.length]);

  if (!colors || colors.length === 0) {
    return null;
  }

  const handleSelect = (color) => {
    const quantity = getVariantQuantity(color.color_id, selectedSize?.size_id);
    if (!disabled && quantity > 0) {
      onSelectColor(color.color_id === selectedColor?.color_id ? null : color);
    }
  };

  return (
    <div className={`selector-container color-selector ${className}`}>
      {colors.length > 0 && <span className="selector-label">Màu:</span>}
      {colors.map(color => {
        const quantity = getVariantQuantity(color.color_id, selectedSize?.size_id);
        const isAvailable = quantity > 0;
        const isSelected = selectedColor?.color_id === color.color_id;

        // --- TÁCH LOGIC TẠO TITLE RA ĐÂY ---
        let titleText = color.color_name; // Mặc định là tên màu
        if (!isAvailable) {
          titleText = `${color.color_name} (Hết hàng`;
          if (selectedSize) {
            titleText += ` với size ${selectedSize.size_name}`;
          }
          titleText += ')';
        }
        // --- KẾT THÚC TÁCH LOGIC ---

        return (
          <div
            key={color.color_id}
            className={`color-swatch-selectable ${!isAvailable ? 'out-of-stock' : 'available'} ${isSelected ? 'selected' : ''} ${disabled || !isAvailable ? 'disabled' : ''}`}
            style={{
              backgroundColor: color.color_hex || '#ccc',
            }}
            title={titleText} // <-- SỬ DỤNG BIẾN titleText Ở ĐÂY
            onClick={() => handleSelect(color)}
            role="button"
            tabIndex={disabled || !isAvailable ? -1 : 0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(color);}}
            aria-pressed={isSelected}
            aria-label={`Select color ${color.color_name}`}
          >
            {isSelected && isAvailable && <i className="bi bi-check color-selected-check"></i>}
            {!isAvailable && (
                <i className="bi bi-slash-circle-fill color-outofstock-indicator"></i>
            )}
          </div>
        );
      })}
    </div>
  );
}
export default React.memo(ColorSelector);