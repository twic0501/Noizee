// src/components/product/SizeSelector.jsx
import React, { useCallback } from 'react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
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
  const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK

  const getVariantQuantity = useCallback((sizeId, colorId) => {
    if (disabled) return 0;
    if (!inventory || inventory.length === 0) return sizes.length > 0 ? 1 : 0; // Assume 1 if no inventory but sizes exist (e.g. for display)

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

  // Giả định selectedColor.color_name đã được dịch hoặc không cần dịch
  const selectedColorName = selectedColor?.name || (i18n.language === 'en' && selectedColor?.color_name_en ? selectedColor.color_name_en : selectedColor?.color_name_vi) || selectedColor?.color_name;


  return (
    <div className={`selector-container size-selector ${className}`}>
      {sizes.length > 0 && <span className="selector-label">{t('sizeSelector.label')}</span>}
      {sizes.map(size => {
        const quantity = getVariantQuantity(size.size_id, selectedColor?.color_id);
        const isAvailable = quantity > 0;
        const isSelected = selectedSize?.size_id === size.size_id;
        
        // Giả định size.size_name không cần dịch ở đây (thường là 'S', 'M', 'L')
        // Nếu cần dịch, logic tương tự productName trong ProductCard
        const sizeName = size.size_name;

        let titleText = sizeName;
        if (!isAvailable) {
          if (selectedColorName) {
            titleText = t('sizeSelector.outOfStockWithColor', { sizeName: sizeName, colorName: selectedColorName });
          } else {
            titleText = t('sizeSelector.outOfStockSimple', { sizeName: sizeName });
          }
        } else {
          titleText = t('sizeSelector.selectTitle', {sizeName: sizeName});
        }

        return (
          <Button
            key={size.size_id}
            variant={isSelected ? "dark" : "outline-secondary"}
            size="sm"
            className={`selector-badge size-badge ${!isAvailable ? 'out-of-stock' : 'available'} ${isSelected ? 'active' : ''} ${disabled || !isAvailable ? 'disabled' : ''}`}
            onClick={() => handleSelect(size)}
            title={titleText}
            disabled={disabled || !isAvailable}
            aria-pressed={isSelected}
            aria-label={t('sizeSelector.selectAriaLabel', {sizeName: sizeName})}
          >
            {sizeName}
          </Button>
        );
      })}
    </div>
  );
}
export default React.memo(SizeSelector);
