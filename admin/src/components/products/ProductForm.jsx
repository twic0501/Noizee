// src/components/products/ProductForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Form, Button, Row, Col, Card, Image, InputGroup, FormControl,Spinner } from 'react-bootstrap'; // Bỏ Table nếu không dùng trực tiếp ở đây
import { useQuery } from '@apollo/client';
import { GET_PRODUCT_OPTIONS_QUERY } from '../../api/queries/productQueries';
import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import logger from '../../utils/logger';
import { getFullImageUrl } from '../../utils/formatters';

const DEFAULT_INVENTORY_ITEM = { size_id: '', color_id: '', quantity: 0, sku: '', tempId: null };

// --- InventoryVariantRow Component ---
// (Giả sử bạn đã có component này và nó hoạt động đúng với các props được truyền vào)
// Component này sẽ nhận item, index, onInventoryChange, onRemoveInventoryItem,
// allSizes, allColors, disabled, isOnlyItem.
const InventoryVariantRow = ({
    item,
    index,
    onInventoryChange,
    onRemoveInventoryItem,
    allSizes,
    allColors,
    disabled,
    isOnlyItem
}) => {
    return (
        <Row className="mb-2 g-2 align-items-center inventory-variant-row">
            <Col md={3} xs={6}>
                <Form.Select
                    name="size_id"
                    data-index={index}
                    value={item.size_id || ''}
                    onChange={onInventoryChange}
                    disabled={disabled || !allSizes || allSizes.length === 0}
                    aria-label={`Size for variant ${index + 1}`}
                    size="sm"
                >
                    <option value="">No Size</option>
                    {allSizes.map(s => <option key={s.size_id} value={s.size_id}>{s.size_name}</option>)}
                </Form.Select>
            </Col>
            <Col md={3} xs={6}>
                <Form.Select
                    name="color_id"
                    data-index={index}
                    value={item.color_id || ''}
                    onChange={onInventoryChange}
                    disabled={disabled || !allColors || allColors.length === 0}
                    aria-label={`Color for variant ${index + 1}`}
                    size="sm"
                >
                    <option value="">No Color</option>
                    {allColors.map(c => <option key={c.color_id} value={c.color_id}>{c.color_name}</option>)}
                </Form.Select>
            </Col>
            <Col md={2} xs={6}>
                <Form.Control
                    type="number"
                    name="quantity"
                    data-index={index}
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={onInventoryChange}
                    min="0"
                    required
                    disabled={disabled}
                    aria-label={`Quantity for variant ${index + 1}`}
                    size="sm"
                />
            </Col>
            <Col md={3} xs={6}>
                <Form.Control
                    type="text"
                    name="sku"
                    data-index={index}
                    placeholder="SKU (Optional)"
                    value={item.sku || ''}
                    onChange={onInventoryChange}
                    disabled={disabled}
                    aria-label={`SKU for variant ${index + 1}`}
                    size="sm"
                />
            </Col>
            <Col md={1} xs={12} className="text-md-end text-center mt-2 mt-md-0">
                <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onRemoveInventoryItem(index)}
                    disabled={disabled || isOnlyItem}
                    title="Remove Variant"
                >
                    <i className="bi bi-trash"></i>
                </Button>
            </Col>
        </Row>
    );
};
// --- End InventoryVariantRow ---


function ProductForm({ initialData, onSubmit, loading: formLoading, error: formError, isEditMode }) {
    const [formData, setFormData] = useState(() => {
        const defaultState = {
            product_name: '', product_description: '', product_price: '', categoryId: '',
            collectionIds: [], imageUrl: null, secondaryImageUrl: null,
            isNewArrival: false, is_active: true,
            inventoryItems: [{ ...DEFAULT_INVENTORY_ITEM, tempId: `temp-${Date.now()}` }]
        };
        if (isEditMode && initialData) {
            return {
                product_name: initialData.product_name || '',
                product_description: initialData.product_description || '',
                product_price: initialData.product_price !== undefined ? String(initialData.product_price) : '',
                categoryId: initialData.category?.category_id || '',
                collectionIds: initialData.collections?.map(col => col.collection_id) || [],
                imageUrl: initialData.imageUrl || null,
                secondaryImageUrl: initialData.secondaryImageUrl || null,
                isNewArrival: initialData.isNewArrival || false,
                is_active: initialData.is_active === undefined ? true : initialData.is_active,
                inventoryItems: initialData.inventory && initialData.inventory.length > 0
                    ? initialData.inventory.map((inv, index) => ({
                        inventory_id: inv.inventory_id,
                        size_id: inv.size_id || '',
                        color_id: inv.color_id || '',
                        quantity: inv.quantity !== undefined ? inv.quantity : 0,
                        sku: inv.sku || '',
                        tempId: inv.inventory_id || `temp-${Date.now()}-${index}`
                    }))
                    : [{ ...DEFAULT_INVENTORY_ITEM, tempId: `temp-${Date.now()}` }]
            };
        }
        return defaultState;
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [apiError, setApiError] = useState(null);

    const { loading: optionsLoading, error: optionsError, data: optionsData } = useQuery(GET_PRODUCT_OPTIONS_QUERY, {
        onError: (err) => logger.error("Error loading product options:", err)
    });

    useEffect(() => {
        if (formError) {
            setApiError(formError.message || 'An unknown error occurred during submission.');
            logger.error("ProductForm received error prop from parent:", formError);
        } else {
            setApiError(null); // Xóa lỗi cũ từ parent nếu không còn
        }
    }, [formError]);

    useEffect(() => {
        if (isEditMode && initialData) {
            setFormData({
                product_name: initialData.product_name || '',
                product_description: initialData.product_description || '',
                product_price: initialData.product_price !== undefined ? String(initialData.product_price) : '',
                categoryId: initialData.category?.category_id || '',
                collectionIds: initialData.collections?.map(col => col.collection_id) || [],
                imageUrl: initialData.imageUrl || null,
                secondaryImageUrl: initialData.secondaryImageUrl || null,
                isNewArrival: initialData.isNewArrival || false,
                is_active: initialData.is_active === undefined ? true : initialData.is_active,
                inventoryItems: initialData.inventory && initialData.inventory.length > 0
                    ? initialData.inventory.map((inv, index) => ({
                        inventory_id: inv.inventory_id,
                        size_id: inv.size_id || '',
                        color_id: inv.color_id || '',
                        quantity: inv.quantity !== undefined ? inv.quantity : 0,
                        sku: inv.sku || '',
                        tempId: inv.inventory_id || `temp-${Date.now()}-${index}`
                    }))
                    : [{ ...DEFAULT_INVENTORY_ITEM, tempId: `temp-${Date.now()}` }]
            });
            if (initialData.imageUrl) {
                setImagePreview(getFullImageUrl(initialData.imageUrl));
            } else {
                setImagePreview(null);
            }
            setSelectedFile(null);
        } else if (!isEditMode && !initialData) { // Reset form khi không ở edit mode và không có initial data (ví dụ khi tạo mới)
             setFormData({
                product_name: '', product_description: '', product_price: '', categoryId: '',
                collectionIds: [], imageUrl: null, secondaryImageUrl: null,
                isNewArrival: false, is_active: true,
                inventoryItems: [{ ...DEFAULT_INVENTORY_ITEM, tempId: `temp-${Date.now()}` }]
            });
            setImagePreview(null);
            setSelectedFile(null);
        }
    }, [isEditMode, initialData]);


    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        setApiError(null);

        if (name === "productImage") {
            if (files && files[0]) {
                setSelectedFile(files[0]);
                setImagePreview(URL.createObjectURL(files[0]));
            }
        } else if (type === "checkbox") {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === "select-multiple") {
            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
            setFormData(prev => ({ ...prev, [name]: selectedOptions }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleInventoryChange = useCallback((e) => {
        const { name, value } = e.target;
        const index = parseInt(e.target.dataset.index, 10);
        setApiError(null); // Xóa lỗi validation khi người dùng sửa

        setFormData(prev => {
            const updatedInventory = prev.inventoryItems.map((item, idx) => {
                if (idx === index) {
                    let processedValue = value;
                    if (name === "quantity") {
                        processedValue = value === '' ? '' : parseInt(value, 10); // Cho phép rỗng tạm thời
                        if (isNaN(processedValue) && value !== '') { // Nếu không phải số và không rỗng
                            processedValue = item.quantity; // Giữ giá trị cũ nếu nhập linh tinh
                        } else if (value !== '' && processedValue < 0) {
                            processedValue = 0; // Không cho số âm
                        }
                    } else if (name === "size_id" || name === "color_id") {
                        processedValue = value === "" ? null : value;
                    }
                    return { ...item, [name]: processedValue };
                }
                return item;
            });
            return { ...prev, inventoryItems: updatedInventory };
        });
    }, []);

    const addInventoryItem = useCallback(() => {
        setApiError(null); // Xóa lỗi cũ trước khi thử thêm
        if (formData.inventoryItems.length > 0) {
            const lastItem = formData.inventoryItems[formData.inventoryItems.length - 1];
            const isLastItemEffectivelyEmpty =
                (lastItem.size_id === '' || lastItem.size_id === null) &&
                (lastItem.color_id === '' || lastItem.color_id === null);
            
            // optionsData có thể chưa load xong, nên kiểm tra cẩn thận
            const hasSizes = optionsData?.sizes && optionsData.sizes.length > 0;
            const hasColors = optionsData?.adminGetAllColors && optionsData.adminGetAllColors.length > 0;
            const hasSelectableOptions = hasSizes || hasColors;

            if (isLastItemEffectivelyEmpty && hasSelectableOptions) {
                setApiError("Please specify a size or color for the current variant before adding a new one with default (No Size/No Color) selections.");
                return;
            }
        }

        setFormData(prev => ({
            ...prev,
            inventoryItems: [...prev.inventoryItems, { ...DEFAULT_INVENTORY_ITEM, tempId: `temp-${Date.now()}` }]
        }));
    }, [formData.inventoryItems, optionsData]); // Bỏ DEFAULT_INVENTORY_ITEM vì nó là const ngoài component

    const removeInventoryItem = useCallback((indexToRemove) => {
        setApiError(null);
        if (formData.inventoryItems.length > 1) {
            setFormData(prev => ({
                ...prev,
                inventoryItems: prev.inventoryItems.filter((_, index) => index !== indexToRemove)
            }));
        } else {
            // Không cho xóa item cuối cùng nếu chỉ còn 1
            setApiError("At least one inventory variant is required.");
        }
    }, [formData.inventoryItems.length]);

    const validateForm = () => {
        if (!formData.product_name.trim()) return "Product Name is required.";
        if (formData.product_price === '' || isNaN(parseFloat(formData.product_price)) || parseFloat(formData.product_price) < 0) return "Valid Product Price (non-negative number) is required.";
        if (!formData.categoryId) return "Category is required.";

        if (!formData.inventoryItems || formData.inventoryItems.length === 0) {
            return "At least one inventory variant is required.";
        }

        const variantSignatures = new Set();
        for (let i = 0; i < formData.inventoryItems.length; i++) {
            const item = formData.inventoryItems[i];
            if (item.quantity === undefined || item.quantity === null || String(item.quantity).trim() === '' || isNaN(parseInt(item.quantity)) || parseInt(item.quantity) < 0) {
                return `Quantity for variant ${i + 1} must be a non-negative number.`;
            }
            const signature = `${item.size_id || 'null'}-${item.color_id || 'null'}`;
            if (variantSignatures.has(signature)) {
                const sizeName = optionsData?.sizes?.find(s => s.size_id === item.size_id)?.size_name || 'N/A';
                const colorName = optionsData?.adminGetAllColors?.find(c => c.color_id === item.color_id)?.color_name || 'N/A';
                return `Duplicate inventory variant found for Size: ${sizeName} and Color: ${colorName}. Each variant (Size/Color combination) must be unique.`;
            }
            variantSignatures.add(signature);
        }
        return null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setApiError(validationError);
            logger.warn("ProductForm validation failed:", validationError);
            return;
        }
        setApiError(null);

        const dataToSend = {
            product_name: formData.product_name.trim(),
            product_description: formData.product_description.trim() || null,
            product_price: parseFloat(formData.product_price),
            categoryId: formData.categoryId, // Đã là ID
            collectionIds: formData.collectionIds.length > 0 ? formData.collectionIds : null,
            isNewArrival: formData.isNewArrival,
            is_active: formData.is_active,
            inventoryItems: formData.inventoryItems.map(item => ({
                inventory_id: isEditMode ? item.inventory_id : undefined, // Chỉ gửi inventory_id khi edit
                size_id: item.size_id || null,
                color_id: item.color_id || null,
                quantity: parseInt(item.quantity, 10), // Đảm bảo là số
                sku: item.sku?.trim() || null
            })),
        };
        
        logger.info("ProductForm handleSubmit - Data prepared for parent:", dataToSend, "Selected File:", selectedFile);
        onSubmit(dataToSend, selectedFile);
    };

    if (optionsLoading && !optionsData) return <LoadingSpinner message="Loading product options..." />;
    // Vẫn hiển thị form nếu optionsError, nhưng có cảnh báo

    return (
        <Form onSubmit={handleSubmit}>
            {apiError && <AlertMessage variant="danger" onClose={() => setApiError(null)} dismissible className="mb-3">{apiError}</AlertMessage>}
            {optionsError && <AlertMessage variant="warning" className="mb-3">Could not load all product options (e.g., sizes, colors). Some selections might be unavailable. Error: {optionsError.message}</AlertMessage>}

            <Row>
                <Col md={8}>
                    <Card className="mb-3">
                        <Card.Header>Basic Information</Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3" controlId="productName">
                                <Form.Label>Product Name <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" name="product_name" value={formData.product_name} onChange={handleChange} required disabled={formLoading} />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="productDescription">
                                <Form.Label>Description</Form.Label>
                                <Form.Control as="textarea" rows={3} name="product_description" value={formData.product_description} onChange={handleChange} disabled={formLoading} />
                            </Form.Group>
                        </Card.Body>
                    </Card>

                    <Card className="mb-3">
                        <Card.Header>Pricing</Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3" controlId="productPrice">
                                <Form.Label>Price (VND) <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="number" name="product_price" value={formData.product_price} onChange={handleChange} required min="0" step="any" disabled={formLoading} />
                            </Form.Group>
                        </Card.Body>
                    </Card>

                    <Card className="mb-3">
                        <Card.Header>Inventory Variants</Card.Header>
                        <Card.Body>
                            <div className="mb-2">
                                <small className="text-muted">
                                    Manage stock for each product variant.
                                    If a product has no specific size or color, select "No Size" and "No Color".
                                    Quantity is required for each variant. Each Size/Color combination must be unique.
                                </small>
                            </div>
                            {formData.inventoryItems.map((item, index) => (
                                <InventoryVariantRow
                                    key={item.tempId || item.inventory_id || `variant-${index}`}
                                    item={item}
                                    index={index}
                                    onInventoryChange={handleInventoryChange}
                                    onRemoveInventoryItem={removeInventoryItem}
                                    allSizes={optionsData?.sizes || []}
                                    allColors={optionsData?.adminGetAllColors || []}
                                    disabled={formLoading}
                                    isOnlyItem={formData.inventoryItems.length === 1}
                                />
                            ))}
                            <Button variant="outline-primary" size="sm" onClick={addInventoryItem} disabled={formLoading || optionsLoading} className="mt-2">
                                <i className="bi bi-plus-circle me-1"></i> Add Variant
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="mb-3">
                        <Card.Header>Organize</Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3" controlId="productCategory">
                                <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                                <Form.Select name="categoryId" value={formData.categoryId} onChange={handleChange} required disabled={formLoading || optionsLoading || !optionsData?.categories}>
                                    <option value="">Select Category...</option>
                                    {optionsData?.categories?.map(cat => (
                                        <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="productCollections">
                                <Form.Label>Collections</Form.Label>
                                <Form.Select multiple name="collectionIds" value={formData.collectionIds} onChange={handleChange} disabled={formLoading || optionsLoading || !optionsData?.adminGetAllCollections} style={{ height: '120px' }}>
                                    {optionsData?.adminGetAllCollections?.map(col => (
                                        <option key={col.collection_id} value={col.collection_id}>{col.collection_name}</option>
                                    ))}
                                </Form.Select>
                                <Form.Text muted>Hold Ctrl/Cmd to select multiple.</Form.Text>
                            </Form.Group>
                        </Card.Body>
                    </Card>

                    <Card className="mb-3">
                        <Card.Header>Image</Card.Header>
                        <Card.Body>
                            <Form.Group controlId="productImageFile" className="mb-3">
                                <Form.Label>Main Product Image</Form.Label>
                                <Form.Control type="file" name="productImage" onChange={handleChange} accept="image/*" disabled={formLoading} />
                            </Form.Group>
                            {imagePreview && (
                                <div className="mt-2 text-center">
                                    <Image src={imagePreview} alt="Preview" thumbnail style={{ maxHeight: '150px' }} />
                                </div>
                            )}
                            {isEditMode && formData.imageUrl && !imagePreview && ( // Hiển thị ảnh cũ nếu chưa chọn ảnh mới để preview
                                <div className="mt-2">
                                    <small className="text-muted">Current image:</small>
                                    <Image src={getFullImageUrl(formData.imageUrl)} alt="Current Product" thumbnail style={{ maxHeight: '70px', marginLeft: '10px' }} />
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    <Card className="mb-3">
                        <Card.Header>Status & Visibility</Card.Header>
                        <Card.Body>
                            <Form.Check
                                type="switch"
                                id="isActiveSwitch"
                                label="Product is Active"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="mb-2"
                                disabled={formLoading}
                            />
                            <Form.Check
                                type="switch"
                                id="isNewArrivalSwitch"
                                label="Mark as New Arrival"
                                name="isNewArrival"
                                checked={formData.isNewArrival}
                                onChange={handleChange}
                                disabled={formLoading}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <div className="mt-3 d-flex justify-content-end">
                <Button variant="secondary" type="button" className="me-2" 
                        onClick={() => isEditMode ? navigate(`/products/edit/${initialData?.product_id}`) : navigate('/products')} 
                        disabled={formLoading}>
                    Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={formLoading || optionsLoading}>
                    {formLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" /> : ''}
                    {isEditMode ? 'Update Product' : 'Create Product'}
                </Button>
            </div>
        </Form>
    );
}

export default ProductForm;