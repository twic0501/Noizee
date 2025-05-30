import React from 'react';
// import AddressCard from './AddressCard';

const AddressList = ({ addresses /*, onAddAddress, onEditAddress, onDeleteAddress */ }) => {
     return (
        <div className="card shadow-sm">
            <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">Your Addresses</h5>
                    <button className="btn btn-dark btn-sm" /*onClick={onAddAddress}*/>Add New Address</button>
                </div>
                {/* Logic hiển thị danh sách addresses từ code mẫu */}
                <p>Address list placeholder</p>
            </div>
        </div>
    );
};
export default AddressList;