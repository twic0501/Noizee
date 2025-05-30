import React from 'react';

const OrderHistoryTable = ({ orders }) => {
    if (!orders || orders.length === 0) return <p className="small text-muted">You have no orders yet.</p>;
    return (
        <div className="card shadow-sm">
            <div className="card-body p-4">
                <h5 className="card-title mb-3">Order History</h5>
                {/* Logic table từ code mẫu của bạn */}
                <p>Order list placeholder</p>
            </div>
        </div>
    );
};
export default OrderHistoryTable;