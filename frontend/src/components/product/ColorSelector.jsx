// src/components/product/ColorSelector.jsx
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
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
  const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK

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
  
  // Giả định selectedSize.size_name không cần dịch
  const selectedSizeName = selectedSize?.size_name;

  return (
    <div className={`selector-container color-selector ${className}`}>
      {colors.length > 0 && <span className="selector-label">{t('colorSelector.label')}</span>}
      {colors.map(color => {
        const quantity = getVariantQuantity(color.color_id, selectedSize?.size_id);
        const isAvailable = quantity > 0;
        const isSelected = selectedColor?.color_id === color.color_id;

        // Lấy tên màu đã dịch
        const colorName = useMemo(() => {
            if (!color) return '';
            return (i18n.language === 'en' && color.color_name_en) ? color.color_name_en : (color.color_name_vi || color.color_name);
        }, [color, i18n.language]);


        let titleText = colorName;
        if (!isAvailable) {
          if (selectedSizeName) {
            titleText = t('colorSelector.outOfStockWithSize', { colorName: colorName, sizeName: selectedSizeName });
          } else {
            titleText = t('colorSelector.outOfStockSimple', { colorName: colorName });
          }
        } else {
            titleText = t('colorSelector.selectTitle', {colorName: colorName});
        }
        

        return (
          <div
            key={color.color_id}
            className={`color-swatch-selectable ${!isAvailable ? 'out-of-stock' : 'available'} ${isSelected ? 'selected' : ''} ${disabled || !isAvailable ? 'disabled' : ''}`}
            style={{
              backgroundColor: color.color_hex || '#ccc',
              // Thêm border trắng nếu màu quá nhạt để dễ thấy trên nền trắng
              border: (color.color_hex && color.color_hex.toLowerCase() === '#ffffff') ? '1px solid #ddd' : undefined
            }}
            title={titleText}
            onClick={() => handleSelect(color)}
            role="button"
            tabIndex={disabled || !isAvailable ? -1 : 0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(color);}}
            aria-pressed={isSelected}
            aria-label={t('colorSelector.selectAriaLabel', {colorName: colorName})}
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