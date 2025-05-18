    // admin-frontend/src/components/products/ProductTable.jsx
    import React from 'react';
    import { Table } from 'react-bootstrap';
    import ProductRow from './ProductRow';
    import LoadingSpinner from '../common/LoadingSpinner';
    import { ADMIN_LANGUAGE_KEY } from '../../utils/constants';
    import logger from '../../utils/logger'; 
    
    function ProductTable({ products = [], onDelete, isLoading, onToggleActive }) {
        const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';
    
        if (isLoading && (!products || products.length === 0)) {
            return <LoadingSpinner message="Đang tải sản phẩm..." />;
        }
    
        if (!products || products.length === 0) {
            return <p className="text-center text-muted my-3">Không tìm thấy sản phẩm nào.</p>;
        }
    
        // Hàm nội bộ này đảm bảo toàn bộ đối tượng product được truyền cho prop onDelete
        // (prop này đến từ ProductListPage).
        const handleDeleteClickInternal = (product) => {
            logger.info('ProductTable: handleDeleteClickInternal called with product:', product);
            if (onDelete && typeof onDelete === 'function') {
                onDelete(product); // Truyền toàn bộ đối tượng product
            } else {
                logger.warn('ProductTable: onDelete prop is not a function or not provided.');
            }
        };
    
        return (
            <Table striped bordered hover responsive="lg" size="sm" className="product-admin-table shadow-sm">
                <thead className="table-light">
                    <tr>
                        <th style={{ width: '80px' }} className="text-center">Ảnh</th>
                        <th>Tên ({currentAdminLang.toUpperCase()})</th>
                        <th>Loại ({currentAdminLang.toUpperCase()})</th>
                        <th className="text-end">Giá</th>
                        <th className="text-center">Kho / Biến thể</th>
                        <th className="text-center">Trạng thái</th>
                        <th style={{ width: '120px' }} className="text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <ProductRow
                            key={product.product_id}
                            product={product}
                            // onDeleteClick của ProductRow sẽ gọi hàm nội bộ này
                            onDeleteClick={handleDeleteClickInternal} 
                            onToggleActiveClick={onToggleActive}
                            displayLang={currentAdminLang}
                        />
                    ))}
                </tbody>
            </Table>
        );
    }
    
    export default ProductTable;