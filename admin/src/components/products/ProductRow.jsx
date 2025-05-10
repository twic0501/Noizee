// apps/admin-frontend/src/components/products/ProductRow.jsx (Tạo file mới nếu chưa có)
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, Image, Badge } from 'react-bootstrap';
import { formatCurrency, getFullImageUrl } from '../../utils/formatters';
import { PLACEHOLDER_IMAGE_PATH } from '../../utils/constants';

const calculateTotalStock = (inventory) => {
    if (!inventory || inventory.length === 0) return 0;
    return inventory.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
};

function ProductRow({ product, onDeleteClick, onToggleActiveClick }) {
    const totalStock = useMemo(() => calculateTotalStock(product.inventory), [product.inventory]);
    const variantCount = product.inventory?.length || 0;

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = PLACEHOLDER_IMAGE_PATH;
    };

    if (!product) return null; // Tránh lỗi nếu product không có

    return (
        <tr> 
            <td>
                <Image
                    src={getFullImageUrl(product.imageUrl)}
                    alt={product.product_name}
                    thumbnail
                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                    onError={handleImageError}
                />
            </td>
            <td>
                <Link to={`/products/edit/${product.product_id}`}>{product.product_name}</Link>
                {product.isNewArrival && <Badge bg="info" className="ms-2" pill>New</Badge>}
            </td>
            <td>{product.category?.category_name || <span className="text-muted">-</span>}</td>
            <td className="text-end">{formatCurrency(product.product_price)}</td>
            <td className="text-center align-middle">
                {totalStock <= 0 && variantCount > 0 ? (
                    <Badge bg="danger">Out of Stock</Badge>
                ) : totalStock < 10 && totalStock > 0 ? (
                    <Badge bg="warning" text="dark">Low ({totalStock})</Badge>
                ) : totalStock >= 10 ? (
                    totalStock
                ) : (
                    <Badge bg="secondary">N/A</Badge>
                )}
                <br />
                <small className="text-muted">{variantCount} variant(s)</small>
            </td>
            <td className="text-center align-middle">
                {onToggleActiveClick ? (
                    <Button
                        variant={product.is_active ? "outline-success" : "outline-secondary"}
                        size="sm"
                        onClick={() => onToggleActiveClick(product.product_id, !product.is_active)}
                        title={product.is_active ? "Deactivate" : "Activate"}
                        style={{ width: '80px' }}
                    >
                        {product.is_active ? "Active" : "Inactive"}
                    </Button>
                ) : (
                    product.is_active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>
                )}
            </td>
            <td className="text-center align-middle">
                <Link to={`/products/edit/${product.product_id}`} className="btn btn-sm btn-outline-primary me-2" title="Edit">
                    <i className="bi bi-pencil-fill"></i>
                </Link>
                <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDeleteClick(product)} // Truyền product object
                    title="Delete"
                >
                    <i className="bi bi-trash-fill"></i>
                </Button>
            </td>
        </tr>
    );
}

export default ProductRow;