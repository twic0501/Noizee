// admin-frontend/src/components/products/ProductRow.jsx
    import React, { useMemo } from 'react';
    import { Link } from 'react-router-dom';
    import { Button, Image, Badge } from 'react-bootstrap';
    import { formatCurrency, getFullImageUrl, truncateString } from '../../utils/formatters';
    import { PLACEHOLDER_IMAGE_PATH, ADMIN_LANGUAGE_KEY } from '../../utils/constants';
    import logger from '../../utils/logger'; 
    
    const calculateTotalStock = (inventory) => {
        if (!inventory || inventory.length === 0) return 0;
        return inventory.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    };
    
    function ProductRow({ product, onDeleteClick, onToggleActiveClick, displayLang }) {
        const currentAdminLang = displayLang || localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';
    
        const totalStock = useMemo(() => calculateTotalStock(product.inventoryItems || product.inventory), [product.inventoryItems, product.inventory]);
        const variantCount = product.inventoryItems?.length || product.inventory?.length || 0;
    
        const productName = (currentAdminLang === 'en' && product.product_name_en)
            ? product.product_name_en
            : product.product_name_vi;
    
        // MODIFIED: Use product.category.name which is the localized name from GraphQL
        const categoryName = product.category?.name 
            ? product.category.name 
            : <span className="text-muted">-</span>;
    
        let displayImageUrl = PLACEHOLDER_IMAGE_PATH;
        let displayImageAltText = productName || 'Product image';
    
        if (product.images && product.images.length > 0) {
            const sortedImages = [...product.images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
            const firstImage = sortedImages.find(img => img.display_order === 0 && !img.color_id) || sortedImages[0];
    
            if (firstImage && firstImage.image_url) {
                displayImageUrl = getFullImageUrl(firstImage.image_url);
                const altTextForLang = (currentAdminLang === 'en' && firstImage.alt_text_en) ? firstImage.alt_text_en : firstImage.alt_text_vi;
                displayImageAltText = altTextForLang || productName;
            }
        }
    
        const handleImageError = (e) => {
            e.target.onerror = null; 
            e.target.src = PLACEHOLDER_IMAGE_PATH;
        };
    
        if (!product) return null;
    
        const handleDelete = () => {
            logger.info('ProductRow: Delete button clicked for product:', product);
            if (typeof onDeleteClick === 'function') {
                onDeleteClick(product); 
            } else {
                logger.warn('ProductRow: onDeleteClick is not a function or not provided.');
            }
        };
    
        return (
            <tr>
                <td className="text-center align-middle">
                    <Image
                        src={displayImageUrl}
                        alt={displayImageAltText}
                        thumbnail
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                        onError={handleImageError}
                    />
                </td>
                <td className="align-middle">
                    <Link to={`/products/edit/${product.product_id}`} title={productName}>
                        {truncateString(productName, 50)}
                    </Link>
                    {product.is_new_arrival && <Badge bg="info" className="ms-2" pill>Mới</Badge>}
                </td>
                {/* Hiển thị tên loại sản phẩm đã được bản địa hóa */}
                <td className="align-middle">{categoryName}</td>
                <td className="text-end align-middle">{formatCurrency(product.product_price)}</td>
                <td className="text-center align-middle">
                    {totalStock <= 0 && variantCount > 0 ? (
                        <Badge bg="danger">Hết hàng</Badge>
                    ) : totalStock < 10 && totalStock > 0 ? (
                        <Badge bg="warning" text="dark">Sắp hết ({totalStock})</Badge>
                    ) : totalStock >= 10 ? (
                        totalStock
                    ) : (
                        variantCount === 0 ? <Badge bg="light" text="dark">Chưa có biến thể</Badge> : <Badge bg="secondary">N/A</Badge>
                    )}
                    <br />
                    <small className="text-muted">{variantCount} biến thể</small>
                </td>
                <td className="text-center align-middle">
                    {onToggleActiveClick ? (
                        <Button
                            variant={product.is_active ? "outline-success" : "outline-secondary"}
                            size="sm"
                            onClick={() => onToggleActiveClick(product.product_id, !product.is_active)}
                            title={product.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                            style={{ width: '95px' }}
                        >
                            {product.is_active ? "Đang hoạt động" : "Ngừng hoạt động"}
                        </Button>
                    ) : (
                        product.is_active ? <Badge bg="success">Đang hoạt động</Badge> : <Badge bg="secondary">Ngừng hoạt động</Badge>
                    )}
                </td>
                <td className="text-center align-middle">
                    <Button
                        as={Link}
                        to={`/products/edit/${product.product_id}`}
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        title="Sửa"
                    >
                        <i className="bi bi-pencil-fill"></i>
                    </Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={handleDelete}
                        title="Xóa"
                    >
                        <i className="bi bi-trash-fill"></i>
                    </Button>
                </td>
            </tr>
        );
    }
    
    export default ProductRow;