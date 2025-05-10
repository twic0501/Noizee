import React from 'react';
import './Selectors.css';

function ColorSelector({ colors = [], selectedColor, onSelectColor, inventory = [], selectedSize, className = '', disabled = false }) {

   const getVariantQuantity = (colorId, sizeId) => {
     if (!inventory || inventory.length === 0 && colors?.length > 0) return 1; // Assume stock if no inventory provided but colors exist
     const variant = inventory.find(inv =>
       inv.color_id === colorId &&
       inv.size_id === (sizeId || null)
     );
     return variant ? variant.quantity : 0;
   };

   if (!colors || colors.length === 0) {
       return null; // Không hiển thị nếu không có màu
   }

   const handleSelect = (color) => {
        const quantity = getVariantQuantity(color.color_id, selectedSize?.size_id);
        if (!disabled && quantity > 0) {
           onSelectColor(color);
       }
   };


   return (
     <div className={`selector-container color-selector ${className}`}>
       {colors.length > 0 && <span className="selector-label">Màu:</span>}
       {colors.map(color => {
         const quantity = getVariantQuantity(color.color_id, selectedSize?.size_id);
         const isAvailable = quantity > 0;
         const isSelected = selectedColor?.color_id === color.color_id;

         return (
           <div
             key={color.color_id}
             className={`color-swatch-selectable ${!isAvailable ? 'out-of-stock' : 'available'} ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
             style={{
               backgroundColor: color.color_hex || '#ccc',
               cursor: isAvailable && !disabled ? 'pointer' : 'not-allowed',
             }}
             title={!isAvailable ? `${color.color_name} (Hết hàng${selectedSize ? ` cho size ${selectedSize.size_name}`:''})`: color.color_name}
             onClick={() => handleSelect(color)}
           >
              {isSelected && <i className="bi bi-check color-selected-check"></i>}
           </div>
         );
       })}
     </div>
   );
 }

 export default ColorSelector;