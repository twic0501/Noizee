import React from 'react';
// import { Plus, Minus, X } from 'lucide-react';

const CartItem = ({ item /*, onUpdateQuantity, onRemoveItem */ }) => {
    return (
        <div className="d-flex py-2 border-bottom">
            {/* <img src={item?.imageUrl || 'https://placehold.co/60x75'} alt={item?.name} style={{width: '60px', height: '75px', objectFit: 'cover'}} className="me-2"/> */}
            <div className="flex-grow-1">
                <h6 className="small mb-0">{item?.name || 'Product Name'}</h6>
                <p className="small text-muted mb-1">Color: {item?.selectedColor?.name || 'N/A'} / Size: {item?.selectedSize?.name || 'N/A'}</p>
                <p className="small fw-bold mb-0">${(item?.price || 0).toFixed(2)} x {item?.quantity || 0}</p>
            </div>
            {/* Quantity controls and remove button */}
        </div>
    );
};
export default CartItem;