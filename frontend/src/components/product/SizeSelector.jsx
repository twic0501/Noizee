import React from 'react';
import { Badge } from 'react-bootstrap';
import './Selectors.css';

function SizeSelector({ sizes = [], selectedSize, onSelectSize, inventory = [], selectedColor, disabled = false }) {

  const getVariantQuantity = (sizeId, colorId) => {
    if (!inventory || inventory.length === 0 && sizes?.length > 0) return 1; // Assume stock if no inventory provided but sizes exist
    const variant = inventory.find(inv =>
      inv.size_id === sizeId &&
      inv.color_id === (colorId || null)
    );
    return variant ? variant.quantity : 0;
  };

  if (!sizes || sizes.length === 0) {
    // If product has no sizes, maybe don't render anything or a specific message if needed elsewhere
    // return <small className="text-muted d-block mb-2">One Size</small>; // Or return null
     return null;
  }

  const handleSelect = (size) => {
      const quantity = getVariantQuantity(size.size_id, selectedColor?.color_id);
      if (!disabled && quantity > 0) {
          onSelectSize(size);
      }
  };


  return (
    <div className="selector-container mb-2">
      <span className="selector-label">Size:</span>
      {sizes.map(size => {
        const quantity = getVariantQuantity(size.size_id, selectedColor?.color_id);
        const isAvailable = quantity > 0;
        const isSelected = selectedSize?.size_id === size.size_id;

        return (
          <Badge
            key={size.size_id}
            pill
            bg={isSelected ? "dark" : "light"}
            text={isSelected ? "light" : "dark"}
            className={`selector-badge size-badge ${!isAvailable ? 'out-of-stock' : 'available'} ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => handleSelect(size)}
            title={!isAvailable ? `${size.size_name} (Hết hàng${selectedColor ? ` cho màu ${selectedColor.color_name}`:''})` : size.size_name}
            style={{ cursor: isAvailable && !disabled ? 'pointer' : 'not-allowed' }}
          >
            {size.size_name}
          </Badge>
        );
      })}
    </div>
  );
}

export default SizeSelector;