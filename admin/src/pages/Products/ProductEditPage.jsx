// src/pages/Products/ProductEditPage.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import ProductForm from '../../components/products/ProductForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { GET_ADMIN_PRODUCT_DETAILS_QUERY, GET_ADMIN_PRODUCTS_QUERY } from '../../api/queries/productQueries';
import { UPDATE_PRODUCT_MUTATION } from '../../api/mutations/productMutations';
import logger from '../../utils/logger';

function ProductEditPage() {
    const { id: productId } = useParams(); // Lấy productId từ URL
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [initialFormData, setInitialFormData] = useState(null); // State để giữ initialData cho form

    // Query lấy dữ liệu chi tiết sản phẩm để điền vào form
    const { loading: queryLoading, error: queryError, data: productDataResult, refetch: refetchProductDetails } = useQuery(GET_ADMIN_PRODUCT_DETAILS_QUERY, {
        variables: { id: productId },
        fetchPolicy: 'cache-and-network', // Lấy data mới nhất, nhưng cũng dùng cache
        onError: (err) => logger.error(`Error fetching product details for ID ${productId}:`, err),
        onCompleted: (data) => {
            if (data && data.adminGetProductDetails) {
                setInitialFormData(data.adminGetProductDetails); // Set initial data cho form khi query hoàn tất
            }
        }
    });

    // Mutation cập nhật sản phẩm
    const [updateProductMutation] = useMutation(UPDATE_PRODUCT_MUTATION, {
        // Apollo Client thường tự động cập nhật cache cho item đã sửa dựa trên ID và __typename.
        // Nếu cần cập nhật danh sách (ví dụ: tên sản phẩm thay đổi), có thể refetch query danh sách.
        refetchQueries: [
            { query: GET_ADMIN_PRODUCTS_QUERY, variables: { /* các biến của query list nếu có */ } }
        ],
        onCompleted: (data) => {
            logger.info('Product updated successfully via GraphQL:', data);
            // Cập nhật lại initialFormData để form hiển thị đúng sau khi update (nếu người dùng ở lại trang)
            // Hoặc tốt hơn là refetch lại product details
            refetchProductDetails();
            navigate('/products', { state: { successMessage: `Product "${data.adminUpdateProduct.product_name}" updated successfully!` } });
        },
        onError: (error) => {
            logger.error("Error in updateProductMutation (onError):", error);
            setSubmitError(error.graphQLErrors?.[0]?.message || error.message || "Failed to update product.");
            setIsSubmitting(false);
        }
    });

    const handleSubmit = async (formDataFromForm, selectedImageFile) => {
        setIsSubmitting(true);
        setSubmitError(null);
        let finalImageUrl = formDataFromForm.imageUrl; // Giữ lại ảnh cũ nếu không có ảnh mới

        // Bước 1: Upload ảnh mới (nếu có)
        if (selectedImageFile) {
            logger.info(`Attempting to upload new image: ${selectedImageFile.name}`);
            const imageUploadFormData = new FormData();
            imageUploadFormData.append('productImage', selectedImageFile);
            try {
                const token = localStorage.getItem('admin_token');
                const uploadRes = await fetch(
                     `${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5000'}/api/uploads/image`,
                    {
                        method: 'POST',
                        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
                        body: imageUploadFormData,
                    }
                );
                const uploadData = await uploadRes.json();
                 logger.info("New image upload response data:", uploadData);
                if (!uploadRes.ok || !uploadData.success) {
                    throw new Error(uploadData.message || `New image upload failed with status ${uploadRes.status}`);
                }
                finalImageUrl = uploadData.imageUrl; // URL ảnh mới
            } catch (uploadError) {
                logger.error("New image upload process error:", uploadError);
                setSubmitError(`New image upload failed: ${uploadError.message}. Product data not saved.`);
                setIsSubmitting(false);
                return;
            }
        }

        // Bước 2: Chuẩn bị input cho GraphQL mutation
        // Loại bỏ các trường không cần thiết hoặc __typename nếu có từ initialData
        const { product_id: ignoredProductId,__typename, category, sizes, colors, collections, inventory, createAt,updateAt, ...validFieldsFromInitialData } = initialFormData || {};

        const productInput = {
        product_name: formDataFromForm.product_name,
        product_description: formDataFromForm.product_description,
        product_price: formDataFromForm.product_price, // Đảm bảo đây là số
        categoryId: formDataFromForm.categoryId,
        collectionIds: formDataFromForm.collectionIds,
        imageUrl: finalImageUrl,
        secondaryImageUrl: formDataFromForm.secondaryImageUrl, // Nếu có
        isNewArrival: formDataFromForm.isNewArrival,
        is_active: formDataFromForm.is_active,
        inventoryItems: formDataFromForm.inventoryItems,
        };
        Object.keys(productInput).forEach(key => {
        if (productInput[key] === undefined) {
            delete productInput[key];
        }
        });
        // Xóa các key là object rỗng hoặc không nên gửi nếu không thay đổi
        // Backend resolver nên xử lý việc chỉ cập nhật các trường được cung cấp.
        // Ví dụ: productInput.category_id thay vì productInput.category = { id: ... }

        logger.info("Calling updateProduct mutation with ID:", productId, "Input:", productInput);

        // Bước 3: Gọi GraphQL Mutation
        try {
            await updateProductMutation({ variables: { id: productId, input: productInput } });
            // onCompleted sẽ xử lý việc điều hướng
        } catch (gqlError) {
            logger.error("Error calling updateProductMutation (catch block):", gqlError);
             if (!submitError) {
                setSubmitError(gqlError.message || "An unexpected error occurred while updating the product.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (queryLoading) return <LoadingSpinner message="Loading product details..." />;
    if (queryError) return <Container><AlertMessage variant="danger">Error loading product for editing: {queryError.message}</AlertMessage></Container>;
    if (!initialFormData && !queryLoading) return <Container><AlertMessage variant="warning">Product with ID {productId} not found.</AlertMessage></Container>;

    return (
        <Container fluid className="p-3">
            <Row className="align-items-center mb-3">
                <Col>
                     <h1 className="h3 mb-0">Edit Product: <span className="text-muted">{initialFormData?.product_name || productId}</span></h1>
                </Col>
                 <Col xs="auto">
                    <Link to="/products">
                        <Button variant="outline-secondary" size="sm">
                            <i className="bi bi-arrow-left me-1"></i> Back to Product List
                        </Button>
                    </Link>
                </Col>
            </Row>
            <Card className="shadow-sm">
                <Card.Body>
                    {initialFormData && ( // Chỉ render form khi có initialData
                        <ProductForm
                            initialData={initialFormData}
                            onSubmit={handleSubmit}
                            loading={isSubmitting}
                            error={submitError ? { message: submitError } : null}
                            isEditMode={true}
                        />
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}

export default ProductEditPage;