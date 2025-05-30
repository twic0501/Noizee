import React from 'react';
// import { Edit3, Trash2 } from 'lucide-react'; // Hoặc Edit

const AddressCard = ({ address, isPrimary /*, onEdit, onDelete */ }) => {
    return (
        <div className={`card h-100 ${isPrimary ? 'border-dark bg-light' : ''}`}>
            <div className="card-body small p-3">
                {isPrimary && <p className="fw-bold text-dark mb-1 small">Default Address</p>}
                <p className="fw-medium text-dark mb-0">{address?.name}</p>
                <p className="text-muted mb-0">{address?.address}</p>
                <p className="text-muted mb-0">{address?.city}, {address?.country}</p>
                {/* Edit/Delete buttons */}
            </div>
        </div>
    );
};
export default AddressCard;