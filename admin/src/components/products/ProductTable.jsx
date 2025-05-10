// apps/admin-frontend/src/components/products/ProductTable.jsx
import React, { useState } from 'react'; // Bỏ useMemo
import { Link } from 'react-router-dom';
import { Table, Button, Image, Badge } from 'react-bootstrap';
import { formatCurrency, getFullImageUrl } from '../../utils/formatters';
import ModalConfirm from '../common/ModalConfirm';
import { PLACEHOLDER_IMAGE_PATH } from '../../utils/constants';
import ProductRow from './ProductRow'; // <<<< IMPORT COMPONENT CON ProductRow

// Bỏ hàm calculateTotalStock ở đây nếu nó đã được chuyển vào ProductRow hoặc là một util riêng
// const calculateTotalStock = (inventory) => { ... };

function ProductTable({ products = [], onDelete, isLoading, onToggleActive }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    const openDeleteConfirm = (product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setProductToDelete(null);
        setShowDeleteModal(false);
    };

    const confirmDelete = () => {
        if (productToDelete && onDelete) {
            // onDelete bây giờ nên nhận product_id từ component cha (ProductListPage)
            // ProductListPage sẽ gọi mutation xóa.
            // ProductTable chỉ chịu trách nhiệm hiển thị và kích hoạt việc mở modal.
            onDelete(productToDelete.product_id, productToDelete.product_name);
        }
        closeDeleteModal();
    };

    // handleImageError không còn cần ở đây nếu ProductRow xử lý
    // const handleImageError = (e) => { ... };

    if (isLoading && (!products || products.length === 0)) {
        return <p className="text-center my-3">Loading products...</p>;
    }

    if (!products || products.length === 0) {
        return <p className="text-center text-muted my-3">No products found matching your criteria.</p>;
    }

    return (
        <>
            <Table striped bordered hover responsive="lg" size="sm" className="product-admin-table">
                <thead>
                    <tr>
                        <th style={{ width: '80px' }}>Image</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th className="text-end">Price</th>
                        <th className="text-center">Stock / Variants</th>
                        <th className="text-center">Status</th>
                        <th style={{ width: '120px' }} className="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        // Sử dụng component ProductRow cho mỗi sản phẩm
                        <ProductRow
                            key={product.product_id}
                            product={product}
                            // Truyền các hàm xử lý sự kiện xuống ProductRow
                            // onEditClick đã được xử lý bằng Link trong ProductRow nếu bạn làm vậy
                            onDeleteClick={openDeleteConfirm} // openDeleteConfirm sẽ được gọi từ ProductRow
                            onToggleActiveClick={onToggleActive}
                        />
                    ))}
                </tbody>
            </Table>

            <ModalConfirm
                show={showDeleteModal}
                handleClose={closeDeleteModal}
                handleConfirm={confirmDelete}
                title="Confirm Product Deletion"
                body={`Are you sure you want to delete "${productToDelete?.product_name || 'this product'}"? This action will also delete all its inventory data and cannot be undone.`}
                confirmButtonText="Delete"
                confirmButtonVariant="danger"
                // confirmDisabled={/* Biến loading của mutation xóa từ component cha (ProductListPage) */}
            />
        </>
    );
}

export default ProductTable;