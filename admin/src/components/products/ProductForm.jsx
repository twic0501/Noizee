// admin-frontend/src/components/products/ProductForm.jsx
    import React, { useState, useEffect, useCallback } from 'react';
    import { Form, Button, Row, Col, Card, Image, Spinner, ListGroup, CloseButton, Accordion, FloatingLabel, Tabs, Tab, InputGroup, Container} from 'react-bootstrap';
    import { useQuery } from '@apollo/client';
    import { useNavigate } from 'react-router-dom';
    import { v4 as uuidv4 } from 'uuid';

    import { GET_PRODUCT_OPTIONS_QUERY } from '../../api/queries/productQueries';
    import AlertMessage from '../common/AlertMessage';
    import LoadingSpinner from '../common/LoadingSpinner';
    import logger from '../../utils/logger';
    import { getFullImageUrl } from '../../utils/formatters';
    import { PLACEHOLDER_IMAGE_PATH, ADMIN_TOKEN_KEY, ADMIN_LANGUAGE_KEY } from '../../utils/constants';

    const PRODUCT_IMAGES_UPLOAD_ENDPOINT = `${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5000'}/api/uploads/product-images`;

    const createNewColorVariant = () => ({
        tempId: uuidv4(),
        color_id: '',
        variant_specific_images: [],
        inventory_entries: [{ tempId: uuidv4(), size_id: '', quantity: 0, sku: '' }],
    });

    const createNewImageState = (fileOrUploadedInfo, displayOrder = 0, existingImageId = null) => {
        const isFileObject = fileOrUploadedInfo instanceof File;
        const originalName = isFileObject ? fileOrUploadedInfo.name : (fileOrUploadedInfo.originalName || `image-${Date.now()}`);
        const altTextGuess = originalName ? originalName.split('.').slice(0, -1).join('.') || `Product Image ${displayOrder + 1}` : `Product Image ${displayOrder + 1}`;

        return {
            tempId: uuidv4(),
            file: isFileObject ? fileOrUploadedInfo : null,
            uploadedUrl: isFileObject ? null : fileOrUploadedInfo.url,
            previewUrl: isFileObject ? URL.createObjectURL(fileOrUploadedInfo) : getFullImageUrl(fileOrUploadedInfo.url),
            alt_text_vi: isFileObject ? altTextGuess : (fileOrUploadedInfo.alt_text_vi || altTextGuess),
            alt_text_en: isFileObject ? '' : (fileOrUploadedInfo.alt_text_en || ''),
            display_order: displayOrder,
            image_id: existingImageId || (isFileObject ? null : fileOrUploadedInfo.image_id),
            isUploading: false,
        };
    };


    function ProductForm({ initialData, onSubmit, loading: formLoadingProp, error: formErrorProp, isEditMode }) {
        const navigate = useNavigate();
        const [activeLangTab, setActiveLangTab] = useState(localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi');

        const [formData, setFormData] = useState({
            product_name_vi: '', product_name_en: '',
            product_description_vi: '', product_description_en: '',
            product_price: '', category_id: '',
            collection_ids: [], is_new_arrival: false, is_active: true,
        });
        const [colorVariants, setColorVariants] = useState([createNewColorVariant()]);
        const [generalGalleryImages, setGeneralGalleryImages] = useState([]);
        const [imageUploadStates, setImageUploadStates] = useState({});
        const [formSubmissionError, setFormSubmissionError] = useState(null);


        const { loading: optionsLoading, error: optionsError, data: optionsData } = useQuery(GET_PRODUCT_OPTIONS_QUERY, {
            variables: { lang: activeLangTab }
        });

        const categories = optionsData?.adminGetAllCategories || [];
        const colors = optionsData?.adminGetAllColors || [];
        const collections = optionsData?.adminGetAllCollections || [];
        const sizes = optionsData?.adminGetAllSizes || [];

        const isLoadingOverall = formLoadingProp || optionsLoading || Object.values(imageUploadStates).some(s => s === true);

        useEffect(() => {
            if (formErrorProp) setFormSubmissionError(formErrorProp.message || 'An unknown error occurred during submission.');
            else setFormSubmissionError(null);
        }, [formErrorProp]);

        useEffect(() => {
            if (isEditMode && initialData && optionsData) {
                setFormData({
                    product_name_vi: initialData.product_name_vi || '',
                    product_name_en: initialData.product_name_en || '',
                    product_description_vi: initialData.product_description_vi || '',
                    product_description_en: initialData.product_description_en || '',
                    product_price: initialData.product_price !== undefined ? String(initialData.product_price) : '',
                    category_id: initialData.category?.category_id ? String(initialData.category.category_id) : '',
                    collection_ids: initialData.collections?.map(col => String(col.collection_id)) || [],
                    is_new_arrival: initialData.is_new_arrival || false,
                    is_active: initialData.is_active !== undefined ? initialData.is_active : true,
                });

                const variantMap = new Map();
                const generalImages = [];

                if (initialData.images) {
                    initialData.images.forEach(img => {
                        const imgState = createNewImageState(
                            { url: img.image_url, alt_text_vi: img.alt_text_vi, alt_text_en: img.alt_text_en, image_id: img.image_id, originalName: img.image_url ? img.image_url.split('/').pop() : `image-${Date.now()}` },
                            img.display_order,
                            img.image_id
                        );
                        if (img.color?.color_id) {
                            const colorIdStr = String(img.color.color_id);
                            if (!variantMap.has(colorIdStr)) {
                                variantMap.set(colorIdStr, {
                                    tempId: uuidv4(), color_id: colorIdStr,
                                    variant_specific_images: [], inventory_entries: []
                                });
                            }
                            variantMap.get(colorIdStr).variant_specific_images.push(imgState);
                        } else {
                            generalImages.push(imgState);
                        }
                    });
                }

                if (initialData.inventory) {
                    initialData.inventory.forEach(inv => {
                        const colorIdStr = inv.color?.color_id ? String(inv.color.color_id) : null;
                        if (colorIdStr) {
                            if (!variantMap.has(colorIdStr)) {
                                logger.warn(`Inventory item found for color_id ${colorIdStr} but no matching image variant. Creating new variant.`);
                                variantMap.set(colorIdStr, {
                                    tempId: uuidv4(), color_id: colorIdStr,
                                    variant_specific_images: [], inventory_entries: []
                                });
                            }
                            variantMap.get(colorIdStr).inventory_entries.push({
                                tempId: inv.inventory_id || uuidv4(),
                                inventory_id: inv.inventory_id,
                                size_id: inv.size?.size_id ? String(inv.size.size_id) : (inv.size_id ? String(inv.size_id) : ''),
                                quantity: inv.quantity !== undefined ? inv.quantity : 0,
                                sku: inv.sku || ''
                            });
                        }
                    });
                }

                variantMap.forEach(variant => {
                    variant.variant_specific_images.sort((a, b) => a.display_order - b.display_order);
                    if (variant.inventory_entries.length === 0) {
                        variant.inventory_entries.push({ tempId: uuidv4(), size_id: '', quantity: 0, sku: '' });
                    }
                });

                setColorVariants(variantMap.size > 0 ? Array.from(variantMap.values()) : [createNewColorVariant()]);
                setGeneralGalleryImages(generalImages.sort((a, b) => a.display_order - b.display_order));

            } else if (!isEditMode) {
                setFormData({ product_name_vi: '', product_name_en: '', product_description_vi: '', product_description_en: '', product_price: '', category_id: '', collection_ids: [], is_new_arrival: false, is_active: true });
                setColorVariants([createNewColorVariant()]);
                setGeneralGalleryImages([]);
            }
        }, [isEditMode, initialData, optionsData]);


        const handleChange = (e) => {
            const { name, value, type, checked } = e.target;
            setFormSubmissionError(null);
            if (type === "checkbox") {
                setFormData(prev => ({ ...prev, [name]: checked }));
            } else if (type === "select-multiple") {
                const selectedOptions = Array.from(e.target.selectedOptions, option => String(option.value));
                setFormData(prev => ({ ...prev, [name]: selectedOptions }));
            } else {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        };

        const handleFileUpload = async (filesToUpload, contextId = 'general') => {
            if (!filesToUpload || filesToUpload.length === 0) return [];
            setImageUploadStates(prev => ({ ...prev, [contextId]: true }));
            setFormSubmissionError(null);

            const uploadFormData = new FormData();
            Array.from(filesToUpload).forEach(file => uploadFormData.append('productImages', file));

            try {
                const token = localStorage.getItem(ADMIN_TOKEN_KEY);
                const response = await fetch(PRODUCT_IMAGES_UPLOAD_ENDPOINT, {
                    method: 'POST',
                    body: uploadFormData,
                    headers: { ...(token && { 'Authorization': `Bearer ${token}` }) }
                });
                const result = await response.json();
                if (!response.ok || !result.success || !Array.isArray(result.images)) {
                    throw new Error(result.message || `Upload failed for context ${contextId}. Server response invalid.`);
                }
                return result.images;
            } catch (err) {
                logger.error(`Image upload error for context ${contextId}:`, err);
                setFormSubmissionError(`Lỗi tải ảnh: ${err.message}`);
                return [];
            } finally {
                setImageUploadStates(prev => ({ ...prev, [contextId]: false }));
            }
        };

        const handleAddColorVariant = () => setColorVariants(prev => [...prev, createNewColorVariant()]);

        const handleRemoveColorVariant = (variantTempId) => {
            if (colorVariants.length <= 1 && generalGalleryImages.length === 0 && !isEditMode && !initialData) {
                setFormSubmissionError("Sản phẩm phải có ít nhất một biến thể màu đã chọn màu hoặc một ảnh chung.");
                return;
            }
            setColorVariants(prev => prev.filter(v => v.tempId !== variantTempId));
        };

        const handleColorVariantFieldChange = (variantTempId, field, value) => {
            setColorVariants(prev => prev.map(v =>
                v.tempId === variantTempId ? { ...v, [field]: String(value) } : v
            ));
        };

        const handleVariantImageUpload = async (variantTempId, selectedFiles) => {
            const uploadedImageInfos = await handleFileUpload(selectedFiles, variantTempId);
            if (uploadedImageInfos.length > 0) {
                setColorVariants(prev => prev.map(v => {
                    if (v.tempId === variantTempId) {
                        const baseOrder = v.variant_specific_images.reduce((max, img) => Math.max(max, img.display_order), -1) + 1;
                        const newImages = uploadedImageInfos.map((info, idx) =>
                            createNewImageState({ url: info.url, originalName: info.originalName }, baseOrder + idx)
                        );
                        const updatedImages = [...v.variant_specific_images, ...newImages]
                            .sort((a, b) => a.display_order - b.display_order)
                            .map((img, idx) => ({ ...img, display_order: idx }));
                        return { ...v, variant_specific_images: updatedImages };
                    }
                    return v;
                }));
            }
        };

        const handleRemoveVariantImage = (variantTempId, imageTempId) => {
            setColorVariants(prev => prev.map(variant => {
                if (variant.tempId === variantTempId) {
                    return {
                        ...variant,
                        variant_specific_images: variant.variant_specific_images
                            .filter(img => img.tempId !== imageTempId)
                            .map((img, idx) => ({ ...img, display_order: idx }))
                    };
                }
                return variant;
            }));
        };

        const handleVariantImageDetailChange = (variantTempId, imageTempId, field, value, lang = null) => {
            setColorVariants(prev => prev.map(variant => {
                if (variant.tempId === variantTempId) {
                    let newVariantImages = variant.variant_specific_images.map(img => {
                        if (img.tempId === imageTempId) {
                            const fieldName = lang ? `${field}_${lang}` : field;
                            return { ...img, [fieldName]: field === 'display_order' ? (parseInt(value, 10) || 0) : value };
                        }
                        return img;
                    });
                    if (field === 'display_order') {
                        newVariantImages.sort((a, b) => a.display_order - b.display_order)
                            .forEach((img, idx) => img.display_order = idx);
                    }
                    return { ...variant, variant_specific_images: newVariantImages };
                }
                return variant;
            }));
        };

        const handleAddInventoryEntry = (variantTempId) => {
            setColorVariants(prev => prev.map(v =>
                v.tempId === variantTempId ? { ...v, inventory_entries: [...v.inventory_entries, { tempId: uuidv4(), size_id: '', quantity: 0, sku: '' }] } : v
            ));
        };

        const handleRemoveInventoryEntry = (variantTempId, entryTempId) => {
            setColorVariants(prev => prev.map(variant => {
                if (variant.tempId === variantTempId) {
                    if (variant.inventory_entries.length <= 1) {
                        setFormSubmissionError("Mỗi biến thể màu phải có ít nhất một mục tồn kho.");
                        return variant;
                    }
                    return { ...variant, inventory_entries: variant.inventory_entries.filter(entry => entry.tempId !== entryTempId) };
                }
                return variant;
            }));
        };

        const handleInventoryEntryChange = (variantTempId, entryTempId, field, value) => {
            setColorVariants(prev => prev.map(variant => {
                if (variant.tempId === variantTempId) {
                    return {
                        ...variant,
                        inventory_entries: variant.inventory_entries.map(entry => {
                            if (entry.tempId === entryTempId) {
                                let processedValue = value;
                                if (field === 'quantity') {
                                    processedValue = value === '' ? '' : parseInt(value, 10);
                                    if (value !== '' && (isNaN(processedValue) || processedValue < 0)) processedValue = 0;
                                } else if (field === "size_id") {
                                    processedValue = value === "" ? null : String(value);
                                }
                                return { ...entry, [field]: processedValue };
                            }
                            return entry;
                        })
                    };
                }
                return variant;
            }));
        };

        const handleGeneralGalleryImageUpload = async (selectedFiles) => {
            const uploadedImageInfos = await handleFileUpload(selectedFiles, 'general_gallery');
            if (uploadedImageInfos.length > 0) {
                setGeneralGalleryImages(prev => {
                    const baseOrder = prev.reduce((max, img) => Math.max(max, img.display_order), -1) + 1;
                    const newImages = uploadedImageInfos.map((info, idx) =>
                        createNewImageState({ url: info.url, originalName: info.originalName }, baseOrder + idx)
                    );
                    const updatedImages = [...prev, ...newImages]
                        .sort((a,b) => a.display_order - b.display_order)
                        .map((img, idx) => ({...img, display_order: idx}));
                    return updatedImages;
                });
            }
        };

        const handleRemoveGeneralGalleryImage = (imageTempId) => {
            setGeneralGalleryImages(prev => prev.filter(img => img.tempId !== imageTempId)
                .map((img, idx) => ({ ...img, display_order: idx }))
            );
        };

        const handleGeneralGalleryImageDetailChange = (imageTempId, field, value, lang = null) => {
            setGeneralGalleryImages(prev => {
                let newImages = prev.map(img => {
                    if (img.tempId === imageTempId) {
                        const fieldName = lang ? `${field}_${lang}` : field;
                        return { ...img, [fieldName]: field === 'display_order' ? (parseInt(value, 10) || 0) : value };
                    }
                    return img;
                });
                if (field === 'display_order') {
                    newImages.sort((a,b) => a.display_order - b.display_order)
                        .forEach((img, idx) => img.display_order = idx);
                }
                return newImages;
            });
        };

        const validateForm = () => {
            if (!formData.product_name_vi.trim()) return "Tên sản phẩm (Tiếng Việt) là bắt buộc.";
            if (formData.product_price === '' || isNaN(parseFloat(formData.product_price)) || parseFloat(formData.product_price) < 0) return "Giá sản phẩm hợp lệ là bắt buộc.";

            const activeColorVariants = colorVariants.filter(v => v.color_id && v.color_id !== '');

            if (activeColorVariants.length === 0 && generalGalleryImages.length === 0) {
                 return "Sản phẩm phải có ít nhất một biến thể màu đã chọn màu hoặc một ảnh chung trong thư viện.";
            }

            for (const [index, variant] of activeColorVariants.entries()) {
                if (variant.inventory_entries.length === 0) {
                    return `Biến thể màu #${index + 1} (Màu: ${colors.find(c=>String(c.color_id) === variant.color_id)?.name || variant.color_id}) phải có ít nhất một mục tồn kho.`;
                }
                for (const [invIdx, inv] of variant.inventory_entries.entries()) {
                    if (String(inv.quantity).trim() === '' || isNaN(parseInt(inv.quantity)) || parseInt(inv.quantity) < 0) {
                        const colorName = colors.find(c => String(c.color_id) === String(variant.color_id))?.name || `Biến thể #${index + 1}`;
                        return `Mục tồn kho #${invIdx + 1} cho màu "${colorName}" phải có số lượng hợp lệ (số không âm).`;
                    }
                }
                const variantSizeIds = variant.inventory_entries
                    .map(inv => inv.size_id)
                    .filter(sid => sid && sid !== '');

                if (new Set(variantSizeIds).size !== variantSizeIds.length && variantSizeIds.length > 0) {
                     const colorName = colors.find(c => String(c.color_id) === String(variant.color_id))?.name || `Biến thể #${index + 1}`;
                     return `Tìm thấy kích thước trùng lặp trong các mục tồn kho cho màu "${colorName}". Mỗi kích thước phải là duy nhất cho mỗi màu.`;
                }
            }
            return null;
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            const validationError = validateForm();
            if (validationError) { setFormSubmissionError(validationError); return; }
            setFormSubmissionError(null);

            const dataToSend = {
                product_name_vi: formData.product_name_vi.trim(),
                product_name_en: formData.product_name_en?.trim() || null,
                product_description_vi: formData.product_description_vi?.trim() || null,
                product_description_en: formData.product_description_en?.trim() || null,
                product_price: parseFloat(formData.product_price),
                category_id: formData.category_id ? String(formData.category_id) : null,
                collection_ids: formData.collection_ids.map(id => String(id)),
                is_new_arrival: formData.is_new_arrival,
                is_active: formData.is_active,
                color_variants_data: colorVariants
                    .filter(v => v.color_id && v.color_id !== '')
                    .map(variant => ({
                        color_id: String(variant.color_id),
                        variant_specific_images: variant.variant_specific_images.map(img => ({
                            image_url: img.uploadedUrl || img.previewUrl,
                            alt_text_vi: img.alt_text_vi || null,
                            alt_text_en: img.alt_text_en || null,
                            display_order: parseInt(img.display_order) || 0,
                        })),
                        inventory_entries: variant.inventory_entries.map(inv => ({
                            size_id: inv.size_id ? String(inv.size_id) : null,
                            quantity: parseInt(inv.quantity, 10) || 0,
                            sku: inv.sku?.trim() || null,
                        })),
                    })),
                general_gallery_images: generalGalleryImages.map(img => ({
                    image_url: img.uploadedUrl || img.previewUrl,
                    alt_text_vi: img.alt_text_vi || null,
                    alt_text_en: img.alt_text_en || null,
                    display_order: parseInt(img.display_order) || 0,
                    // DÒNG NÀY ĐÃ ĐƯỢC XÓA TRONG PHIÊN BẢN TRƯỚC: color_id: null,
                })),
            };

            if (isEditMode && initialData?.product_id) {
                dataToSend.id = String(initialData.product_id);
            }

            logger.info("ProductForm handleSubmit - Data to send to onSubmit:", JSON.stringify(dataToSend, null, 2));
            onSubmit(dataToSend);
        };

        if (optionsLoading && !isEditMode && !initialData) return <Container className="mt-5"><LoadingSpinner message="Đang tải tùy chọn sản phẩm..." /></Container>;
        if (isEditMode && (optionsLoading || (!initialData && formLoadingProp))) return <Container className="mt-5"><LoadingSpinner message="Đang tải dữ liệu sản phẩm..." /></Container>;


        return (
            <Form onSubmit={handleSubmit}>
                {formSubmissionError && <AlertMessage variant="danger" onClose={() => setFormSubmissionError(null)} dismissible>{formSubmissionError}</AlertMessage>}
                {optionsError && <AlertMessage variant="warning">Lỗi tải tùy chọn sản phẩm: {optionsError.message}</AlertMessage>}

                <Tabs activeKey={activeLangTab} onSelect={(k) => {localStorage.setItem(ADMIN_LANGUAGE_KEY, k); setActiveLangTab(k);}} id="product-language-tabs" className="mb-3 nav-pills-custom">
                    <Tab eventKey="vi" title={<><span className="fi fi-vn me-2"></span> Tiếng Việt (VI)</>}>
                        <Form.Group className="mb-3" controlId="productNameFormVi">
                            <FloatingLabel label={<>Tên sản phẩm (VI) <span className="text-danger">*</span></>}>
                                <Form.Control type="text" name="product_name_vi" value={formData.product_name_vi} onChange={handleChange} required disabled={isLoadingOverall} placeholder="Nhập tên sản phẩm (Tiếng Việt)" />
                            </FloatingLabel>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="productDescriptionFormVi">
                             <FloatingLabel label="Mô tả (VI)">
                                <Form.Control as="textarea" rows={4} name="product_description_vi" value={formData.product_description_vi} onChange={handleChange} disabled={isLoadingOverall} placeholder="Nhập mô tả sản phẩm (Tiếng Việt)" style={{ minHeight: '100px' }}/>
                             </FloatingLabel>
                        </Form.Group>
                    </Tab>
                    <Tab eventKey="en" title={<><span className="fi fi-gb me-2"></span> English (EN)</>}>
                        <Form.Group className="mb-3" controlId="productNameFormEn">
                            <FloatingLabel label="Product Name (EN)">
                                <Form.Control type="text" name="product_name_en" value={formData.product_name_en} onChange={handleChange} disabled={isLoadingOverall} placeholder="Enter product name (English)" />
                            </FloatingLabel>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="productDescriptionFormEn">
                             <FloatingLabel label="Description (EN)">
                                <Form.Control as="textarea" rows={4} name="product_description_en" value={formData.product_description_en} onChange={handleChange} disabled={isLoadingOverall} placeholder="Enter product description (English)" style={{ minHeight: '100px' }}/>
                             </FloatingLabel>
                        </Form.Group>
                    </Tab>
                </Tabs>

                <Row>
                    <Col md={8}>
                        <Card className="mb-3 shadow-sm">
                            <Card.Header className="bg-light py-2"><i className="bi bi-cash-coin me-2"></i>Thông tin cơ bản</Card.Header>
                            <Card.Body>
                                <Form.Group className="mb-3" controlId="productPriceForm">
                                    <FloatingLabel label={<>Giá (VNĐ) <span className="text-danger">*</span></>}>
                                    <Form.Control type="number" name="product_price" value={formData.product_price} onChange={handleChange} required min="0" step="1000" disabled={isLoadingOverall} placeholder="Nhập giá sản phẩm" />
                                    </FloatingLabel>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        <Accordion defaultActiveKey={['0']} alwaysOpen className="mb-3">
                            <Accordion.Item eventKey="0">
                                <Accordion.Header><i className="bi bi-palette-fill me-2"></i>Biến thể màu & Tồn kho <span className="text-danger">*</span></Accordion.Header>
                                <Accordion.Body>
                                    {colorVariants.map((variant, variantIndex) => (
                                        <Card key={variant.tempId} className="mb-3 shadow-sm variant-card">
                                            <Card.Header className="d-flex justify-content-between align-items-center bg-light py-2">
                                                <Form.Group controlId={`variantColorSelect-${variant.tempId}`} className="flex-grow-1 me-2">
                                                    <FloatingLabel label={<>Màu cho biến thể #{variantIndex + 1} <span className="text-danger">*</span></>} size="sm">
                                                        <Form.Select
                                                            size="sm"
                                                            value={variant.color_id}
                                                            onChange={(e) => handleColorVariantFieldChange(variant.tempId, 'color_id', e.target.value)}
                                                            disabled={isLoadingOverall || !colors || colors.length === 0}
                                                        >
                                                            <option value="">-- Chọn một màu --</option>
                                                            {colors?.map(color => (
                                                                <option key={color.color_id} value={String(color.color_id)}>{color.name}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </FloatingLabel>
                                                </Form.Group>
                                                <Button variant="outline-danger" size="sm" onClick={() => handleRemoveColorVariant(variant.tempId)} disabled={isLoadingOverall || (colorVariants.length <= 1 && generalGalleryImages.length === 0 && !isEditMode && !initialData)} title="Xóa biến thể màu này">
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            </Card.Header>
                                            <Card.Body>
                                                <div className="mb-3 p-3 border rounded bg-white">
                                                    <h6 className="mb-2"><i className="bi bi-images me-1"></i>Ảnh cho màu này</h6>
                                                    <Form.Group controlId={`variantImagesUpload-${variant.tempId}`} className="mb-2">
                                                        <Form.Control type="file" multiple accept="image/*"
                                                            onChange={(e) => handleVariantImageUpload(variant.tempId, e.target.files)}
                                                            disabled={isLoadingOverall || !variant.color_id || imageUploadStates[variant.tempId]}
                                                            size="sm"
                                                        />
                                                        {imageUploadStates[variant.tempId] && <Spinner animation="border" size="sm" className="ms-2 mt-1" />}
                                                    </Form.Group>
                                                    <ListGroup variant="flush">
                                                        {variant.variant_specific_images.map((img) => (
                                                            <ListGroup.Item key={img.tempId} className="px-0 py-2">
                                                                <Row className="align-items-center g-2">
                                                                    <Col xs="auto" style={{ width: '70px' }}><Image src={img.previewUrl || PLACEHOLDER_IMAGE_PATH} onError={(e) => e.target.src = PLACEHOLDER_IMAGE_PATH} thumbnail style={{ width: '60px', height: '60px', objectFit: 'cover' }} /></Col>
                                                                    <Col>
                                                                        <Tabs defaultActiveKey={`alt-vi-${img.tempId}`} id={`alt-text-tabs-${img.tempId}`} className="nav-pills-sm mb-1">
                                                                            <Tab eventKey={`alt-vi-${img.tempId}`} title="Alt VI">
                                                                                <FloatingLabel controlId={`alt-vi-${img.tempId}-input`} label="Alt Text (VI)" className="mb-1">
                                                                                    <Form.Control size="sm" type="text" placeholder="Alt Text (VI)" value={img.alt_text_vi} onChange={(e) => handleVariantImageDetailChange(variant.tempId, img.tempId, 'alt_text', e.target.value, 'vi')} />
                                                                                </FloatingLabel>
                                                                            </Tab>
                                                                            <Tab eventKey={`alt-en-${img.tempId}`} title="Alt EN">
                                                                                <FloatingLabel controlId={`alt-en-${img.tempId}-input`} label="Alt Text (EN)" className="mb-1">
                                                                                    <Form.Control size="sm" type="text" placeholder="Alt Text (EN)" value={img.alt_text_en} onChange={(e) => handleVariantImageDetailChange(variant.tempId, img.tempId, 'alt_text', e.target.value, 'en')} />
                                                                                </FloatingLabel>
                                                                            </Tab>
                                                                        </Tabs>
                                                                        <FloatingLabel controlId={`order-${img.tempId}`} label="Thứ tự">
                                                                            <Form.Control size="sm" type="number" placeholder="Thứ tự hiển thị" value={img.display_order} onChange={(e) => handleVariantImageDetailChange(variant.tempId, img.tempId, 'display_order', e.target.value)} min="0"/>
                                                                        </FloatingLabel>
                                                                    </Col>
                                                                    <Col xs="auto"><CloseButton onClick={() => handleRemoveVariantImage(variant.tempId, img.tempId)} disabled={isLoadingOverall} /></Col>
                                                                </Row>
                                                            </ListGroup.Item>
                                                        ))}
                                                        {variant.variant_specific_images.length === 0 && <p className="text-muted small text-center">Chưa có ảnh cho màu này.</p>}
                                                    </ListGroup>
                                                </div>

                                                <div className="p-3 border rounded bg-white">
                                                    <h6 className="mb-3"><i className="bi bi-box-seam me-1"></i>Tồn kho cho màu này (theo Size) <span className="text-danger">*</span></h6>
                                                    {variant.inventory_entries.map((entry, entryIndex) => (
                                                        <Row key={entry.tempId} className="g-2 mb-2 align-items-center p-2 border-bottom inventory-entry-row">
                                                            <Col md={4} xs={12} className="mb-2 mb-md-0">
                                                                 <FloatingLabel controlId={`inv-size-${entry.tempId}`} label="Size">
                                                                    <Form.Select size="sm" value={entry.size_id || ''} onChange={(e) => handleInventoryEntryChange(variant.tempId, entry.tempId, 'size_id', e.target.value)} disabled={isLoadingOverall || !sizes || sizes.length === 0}>
                                                                        <option value="">Không có Size / Mặc định</option>
                                                                        {sizes?.map(s => <option key={s.size_id} value={String(s.size_id)}>{s.size_name}</option>)}
                                                                    </Form.Select>
                                                                 </FloatingLabel>
                                                            </Col>
                                                            <Col md={3} xs={5} className="mb-2 mb-md-0">
                                                                 <FloatingLabel controlId={`inv-qty-${entry.tempId}`} label={<>Số lượng <span className="text-danger">*</span></>}>
                                                                    <Form.Control size="sm" type="number" placeholder="Số lượng" value={entry.quantity} onChange={(e) => handleInventoryEntryChange(variant.tempId, entry.tempId, 'quantity', e.target.value)} required min="0" />
                                                                 </FloatingLabel>
                                                            </Col>
                                                            <Col md={4} xs={5} className="mb-2 mb-md-0">
                                                                 <FloatingLabel controlId={`inv-sku-${entry.tempId}`} label="SKU">
                                                                    <Form.Control size="sm" type="text" placeholder="SKU (Tùy chọn)" value={entry.sku} onChange={(e) => handleInventoryEntryChange(variant.tempId, entry.tempId, 'sku', e.target.value)} />
                                                                 </FloatingLabel>
                                                            </Col>
                                                            <Col md={1} xs={2} className="text-end">
                                                                <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleRemoveInventoryEntry(variant.tempId, entry.tempId)} disabled={isLoadingOverall || variant.inventory_entries.length <= 1} title="Xóa mục tồn kho">
                                                                    <i className="bi bi-x-lg"></i>
                                                                </Button>
                                                            </Col>
                                                        </Row>
                                                    ))}
                                                    <Button variant="outline-primary" size="sm" onClick={() => handleAddInventoryEntry(variant.tempId)} className="mt-2" disabled={isLoadingOverall || !variant.color_id}>
                                                        <i className="bi bi-plus-circle me-1"></i> Thêm mục tồn kho
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                    <Button variant="success" onClick={handleAddColorVariant} className="mt-2 w-100" disabled={isLoadingOverall}>
                                        <i className="bi bi-plus-lg me-1"></i> Thêm biến thể màu mới
                                    </Button>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>

                        <Accordion defaultActiveKey="0" className="mb-3">
                            <Accordion.Item eventKey="0">
                                <Accordion.Header><i className="bi bi-images me-2"></i>Ảnh chung cho sản phẩm</Accordion.Header>
                                <Accordion.Body>
                                    <Form.Group controlId="generalGalleryImagesUploadForm" className="mb-3">
                                        <Form.Label>Tải lên ảnh chung (không theo màu cụ thể)</Form.Label>
                                        <Form.Control type="file" multiple accept="image/*"
                                            onChange={(e) => handleGeneralGalleryImageUpload(e.target.files)}
                                            disabled={isLoadingOverall || imageUploadStates['general_gallery']}
                                            size="sm"
                                        />
                                        {imageUploadStates['general_gallery'] && <Spinner animation="border" size="sm" className="ms-2 mt-1" />}
                                    </Form.Group>
                                    <ListGroup variant="flush">
                                        {generalGalleryImages.map((img) => (
                                            <ListGroup.Item key={img.tempId} className="px-0 py-2">
                                                <Row className="align-items-center g-2">
                                                    <Col xs="auto" style={{ width: '70px' }}><Image src={img.previewUrl || PLACEHOLDER_IMAGE_PATH} onError={(e) => e.target.src = PLACEHOLDER_IMAGE_PATH} thumbnail style={{ width: '60px', height: '60px', objectFit: 'cover' }} /></Col>
                                                    <Col>
                                                        <Tabs defaultActiveKey={`gen-alt-vi-${img.tempId}`} id={`gen-alt-text-tabs-${img.tempId}`} className="nav-pills-sm mb-1">
                                                            <Tab eventKey={`gen-alt-vi-${img.tempId}`} title="Alt VI">
                                                                <FloatingLabel controlId={`gen-alt-vi-${img.tempId}-input`} label="Alt Text (VI)" className="mb-1">
                                                                    <Form.Control size="sm" type="text" placeholder="Alt Text (VI)" value={img.alt_text_vi} onChange={(e) => handleGeneralGalleryImageDetailChange(img.tempId, 'alt_text', e.target.value, 'vi')} />
                                                                </FloatingLabel>
                                                            </Tab>
                                                            <Tab eventKey={`gen-alt-en-${img.tempId}`} title="Alt EN">
                                                                 <FloatingLabel controlId={`gen-alt-en-${img.tempId}-input`} label="Alt Text (EN)" className="mb-1">
                                                                    <Form.Control size="sm" type="text" placeholder="Alt Text (EN)" value={img.alt_text_en} onChange={(e) => handleGeneralGalleryImageDetailChange(img.tempId, 'alt_text', e.target.value, 'en')} />
                                                                 </FloatingLabel>
                                                            </Tab>
                                                        </Tabs>
                                                        <FloatingLabel controlId={`gen-order-${img.tempId}`} label="Thứ tự">
                                                            <Form.Control size="sm" type="number" placeholder="Thứ tự hiển thị" value={img.display_order} onChange={(e) => handleGeneralGalleryImageDetailChange(img.tempId, 'display_order', e.target.value)} min="0"/>
                                                        </FloatingLabel>
                                                    </Col>
                                                    <Col xs="auto"><CloseButton onClick={() => handleRemoveGeneralGalleryImage(img.tempId)} disabled={isLoadingOverall}/></Col>
                                                </Row>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                     {generalGalleryImages.length === 0 && <p className="text-muted small text-center">Chưa có ảnh chung nào.</p>}
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </Col>

                    <Col md={4}>
                        <Card className="mb-3 shadow-sm">
                            <Card.Header className="bg-light py-2"><i className="bi bi-diagram-3-fill me-2"></i>Tổ chức</Card.Header>
                            <Card.Body>
                                <Form.Group className="mb-3" controlId="productCategoryForm">
                                    <FloatingLabel label="Loại sản phẩm">
                                        <Form.Select name="category_id" value={formData.category_id} onChange={handleChange} disabled={isLoadingOverall || !categories || categories.length === 0}>
                                            <option value="">-- Chọn loại sản phẩm --</option>
                                            {categories?.map(cat => (
                                                <option key={cat.category_id} value={String(cat.category_id)}>{cat.name}</option>
                                            ))}
                                        </Form.Select>
                                    </FloatingLabel>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="productCollectionsForm">
                                    <FloatingLabel label="Bộ sưu tập">
                                    <Form.Select multiple name="collection_ids" value={formData.collection_ids} onChange={handleChange} disabled={isLoadingOverall || !collections || collections.length === 0} style={{ height: '150px' }}>
                                        {collections?.map(col => (
                                            <option key={col.collection_id} value={String(col.collection_id)}>{col.name}</option>
                                        ))}
                                    </Form.Select>
                                    </FloatingLabel>
                                    <Form.Text muted>Giữ Ctrl/Cmd để chọn nhiều.</Form.Text>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        <Card className="mb-3 shadow-sm">
                            <Card.Header className="bg-light py-2"><i className="bi bi-eye-fill me-2"></i>Trạng thái & Hiển thị</Card.Header>
                            <Card.Body>
                                <Form.Check type="switch" id="isActiveSwitchForm" label="Kích hoạt sản phẩm (hiển thị cho khách hàng)" name="is_active" checked={formData.is_active} onChange={handleChange} className="mb-3" disabled={isLoadingOverall} />
                                <Form.Check type="switch" id="isNewArrivalSwitchForm" label="Đánh dấu là hàng mới về" name="is_new_arrival" checked={formData.is_new_arrival} onChange={handleChange} disabled={isLoadingOverall} />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <div className="mt-4 d-flex justify-content-end border-top pt-3 bg-light p-3 sticky-bottom footer-actions">
                    <Button variant="outline-secondary" type="button" className="me-2 px-4" onClick={() => navigate(isEditMode && initialData?.product_id ? `/products` : '/products')} disabled={isLoadingOverall}>
                        Hủy
                    </Button>
                    <Button variant="primary" type="submit" disabled={isLoadingOverall || Object.values(imageUploadStates).some(s => s === true)} className="px-4">
                        {(formLoadingProp || Object.values(imageUploadStates).some(s => s === true)) && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />}
                        {isEditMode ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                    </Button>
                </div>
            </Form>
        );
    }

    export default ProductForm;
