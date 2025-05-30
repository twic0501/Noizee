import React from 'react';

const CartSummary = ({ subtotal /*, tax, shipping, total */ }) => {
    return (
        <div>
            <div className="d-flex justify-content-between small mb-1">
                <span>Subtotal</span>
                <span className="fw-medium">${(subtotal || 0).toFixed(2)}</span>
            </div>
            {/* Tax, Shipping, Total */}
        </div>
    );
};
export default CartSummary;