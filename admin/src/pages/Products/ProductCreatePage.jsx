// src/pages/Products/ProductCreatePage.jsx
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Container, Card,Row,Col } from 'react-bootstrap';
import ProductForm from '../../components/products/ProductForm';
import { CREATE_PRODUCT_MUTATION } from '../../api/mutations/productMutations';
import { GET_ADMIN_PRODUCTS_QUERY } from '../../api/queries/productQueries'; // Để refetch hoặc cập nhật cache
//import AlertMessage from '../../components/common/AlertMessage';
import logger from '../../utils/logger';
import { DEFAULT_PAGE_LIMIT } from '../../utils/constants';
function ProductCreatePage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const [createProductMutation] = useMutation(CREATE_PRODUCT_MUTATION, {
        // Cập nhật cache của Apollo Client sau khi tạo thành công
        // Cách 1: Refetch query danh sách sản phẩm
        //refetchQueries: [
           // {
         //       query: GET_ADMIN_PRODUCTS_QUERY,
          //      variables: { limit: DEFAULT_LIMIT /*Hoặc limit bạn dùng ở ProductListPage*/, offset: 0, filter: {} }
          //  }
       // ],
        // Cách 2: Cập nhật cache thủ công (phức tạp hơn nhưng hiệu quả hơn nếu danh sách lớn)
        update: (cache, { data: { adminCreateProduct: newProduct } }) => {
         try {
               const existingData = cache.readQuery({
                     query: GET_ADMIN_PRODUCTS_QUERY,
                    variables: { limit: DEFAULT_PAGE_LIMIT, offset: 0, filter: {} },
                 });
        
                 if (existingData && newProduct) {
                     cache.writeQuery({
                  query: GET_ADMIN_PRODUCTS_QUERY,
                         variables: { limit: DEFAULT_PAGE_LIMIT, offset: 0, filter: {} },
                        data: {
                             adminGetAllProducts: {
                                 ...existingData.adminGetAllProducts,
                                 count: existingData.adminGetAllProducts.count + 1,
                                 products: [newProduct, ...existingData.adminGetAllProducts.products],
                             },
                         },
                     });
                 }
            } catch (e) {
                 logger.error("Error updating Apollo cache after product creation:", e);
             }
         },
        onError: (error) => {
            logger.error("Error in createProductMutation (onError):", error);
            setSubmitError(error.graphQLErrors?.[0]?.message || error.message || "Failed to create product.");
            setIsSubmitting(false);
        }
    });

    const handleSubmit = async (formDataFromForm, selectedImageFile) => {
        setIsSubmitting(true);
        setSubmitError(null);
        let finalImageUrl = null;

        // Bước 1: Upload ảnh (nếu có)
        if (selectedImageFile) {
            logger.info(`Attempting to upload image: ${selectedImageFile.name}`);
            const imageUploadFormData = new FormData();
            imageUploadFormData.append('productImage', selectedImageFile);

            try {
                const token = localStorage.getItem('admin_token'); // Lấy token admin
                const uploadRes = await fetch(
                    // Đảm bảo endpoint upload đúng và backend đã có biến môi trường
                    `${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5000'}/api/uploads/image`,
                    {
                        method: 'POST',
                        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
                        body: imageUploadFormData,
                    }
                );

                const uploadData = await uploadRes.json();
                logger.info("Image upload response data:", uploadData);

                if (!uploadRes.ok || !uploadData.success) {
                    throw new Error(uploadData.message || `Image upload failed with status ${uploadRes.status}`);
                }
                finalImageUrl = uploadData.imageUrl; // URL tương đối từ backend, ví dụ: /uploads/products/filename.jpg
                logger.info('Image uploaded successfully, server URL:', finalImageUrl);
            } catch (uploadError) {
                logger.error("Image upload process error:", uploadError);
                setSubmitError(`Image upload failed: ${uploadError.message}. Please ensure the image is valid and try again.`);
                setIsSubmitting(false);
                return;
            }
        }

        // Bước 2: Chuẩn bị input cho GraphQL mutation
        const productInput = {
            ...formDataFromForm, // Dữ liệu từ ProductForm
            imageUrl: finalImageUrl, // Có thể là null nếu không có ảnh mới
            // categoryId đã có trong formDataFromForm
            // collectionIds đã có trong formDataFromForm
            // inventoryItems đã có trong formDataFromForm
        };
        // Xóa các trường không cần thiết hoặc frontend-only nếu có
        delete productInput.selectedFile; // Ví dụ

        logger.info("Calling createProduct mutation with input:", productInput);

        // Bước 3: Gọi GraphQL Mutation
        try {
            const { data: mutationData } = await createProductMutation({ variables: { input: productInput } });
            logger.info('Product created successfully via GraphQL:', mutationData);
            navigate('/products', { state: { successMessage: `Product "${mutationData.adminCreateProduct.product_name}" created successfully!` } });
        } catch (gqlError) {
            // Lỗi từ createProductMutation đã được xử lý bởi onError callback của useMutation
            // Đoạn này có thể không cần thiết nếu onError đã đủ
            logger.error("Error calling createProductMutation (catch block):", gqlError);
            if (!submitError) { // Chỉ set nếu onError của mutation chưa set
                 setSubmitError(gqlError.message || "An unexpected error occurred while creating the product.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
         <Container fluid className="p-3">
            <Row className="align-items-center mb-3">
                <Col>
                    <h1 className="h3 mb-0">Add New Product</h1>
                </Col>
            </Row>
            {/* Bạn có thể muốn hiển thị submitError ở đây bằng AlertMessage nếu ProductForm không xử lý */}
            {submitError && <AlertMessage variant="danger" className="mb-3">{submitError}</AlertMessage>}
            <Card className="shadow-sm">
                <Card.Body>
                    <ProductForm
                        onSubmit={handleSubmit}
                        loading={isSubmitting}
                        // Nếu ProductForm của bạn có prop để hiển thị lỗi, hãy truyền submitError vào đây
                        // error={submitError ? { message: submitError } : null} 
                        isEditMode={false}
                    />
                </Card.Body>
            </Card>
        </Container>
    );
}

export default ProductCreatePage;