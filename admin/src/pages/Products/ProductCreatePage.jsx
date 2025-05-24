// admin-frontend/src/pages/Products/ProductCreatePage.jsx
import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Row, Col, Breadcrumb } from 'react-bootstrap';
import ProductForm from '../../components/products/ProductForm'; // Đã được cập nhật
import { CREATE_PRODUCT_MUTATION } from '../../api/mutations/productMutations';
import { GET_ADMIN_PRODUCTS_QUERY } from '../../api/queries/productQueries'; // Để refetch list
import AlertMessage from '../../components/common/AlertMessage';
import logger from '../../utils/logger';
import { DEFAULT_PAGE_LIMIT, ADMIN_LANGUAGE_KEY } from '../../utils/constants';

function ProductCreatePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [submitError, setSubmitError] = useState(null);
    const [successFlashMessage, setSuccessFlashMessage] = useState(location.state?.successMessage || null);
    const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';

    useEffect(() => {
        if (successFlashMessage) {
            const timer = setTimeout(() => {
                setSuccessFlashMessage(null);
                // Xóa state khỏi location để không hiển thị lại khi refresh hoặc quay lại trang
                navigate(location.pathname, { replace: true, state: {} });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successFlashMessage, location.pathname, navigate]);

    const [createProductMutation, { loading: mutationLoading }] = useMutation(CREATE_PRODUCT_MUTATION, {
        refetchQueries: [
            {
                query: GET_ADMIN_PRODUCTS_QUERY,
                variables: { limit: DEFAULT_PAGE_LIMIT, offset: 0, filter: {}, lang: currentAdminLang },
            },
        ],
        onError: (error) => {
            logger.error("Error in createProductMutation (GraphQL):", error);
            const messages = error.graphQLErrors?.map(e => e.message).join("\n") || error.message || "Tạo sản phẩm thất bại. Vui lòng kiểm tra lại thông tin.";
            setSubmitError(messages);
        },
        onCompleted: (data) => {
            const newProduct = data?.adminCreateProduct;
            const newProductName = newProduct
                ? (currentAdminLang === 'en' && newProduct.name_en ? newProduct.name_en : newProduct.name_vi) || newProduct.name // Sử dụng trường ảo name nếu có
                : "Sản phẩm mới";
            logger.info('Product created successfully via GraphQL:', data);
            navigate('/products', { state: { successMessage: `Sản phẩm "${newProductName}" đã được tạo thành công!` } });
        }
    });

    const handleFormSubmit = async (preparedDataFromForm) => {
        setSubmitError(null);
        logger.info("ProductCreatePage: Calling createProduct mutation with input:", preparedDataFromForm);

        try {
            // Biến $lang trong CREATE_PRODUCT_MUTATION là để PRODUCT_ADMIN_CORE_FIELDS (trong phần trả về) có thể resolve đúng ngôn ngữ.
            // Resolver adminCreateProduct ở backend không nhận trực tiếp biến lang.
            await createProductMutation({
                variables: {
                    input: preparedDataFromForm,
                    lang: currentAdminLang // Cần thiết cho fragment trả về
                }
            });
        } catch (gqlError) {
            // Lỗi đã được xử lý bởi onError của useMutation
            // Tuy nhiên, nếu có lỗi trước khi mutation được gọi (ví dụ: lỗi chuẩn bị biến), có thể bắt ở đây
            if (!submitError && gqlError) { // Chỉ set nếu onError chưa set
                logger.error("Error caught directly in ProductCreatePage handleSubmit:", gqlError);
                 const messages = gqlError.graphQLErrors?.map(e => e.message).join("\n") || gqlError.message || "Đã xảy ra lỗi không mong muốn khi chuẩn bị tạo sản phẩm.";
                setSubmitError(messages);
            }
        }
    };

    return (
        <Container fluid className="p-md-4 p-3">
            <Breadcrumb className="mb-3">
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item href="/products">Sản phẩm</Breadcrumb.Item>
                <Breadcrumb.Item active>Thêm Sản phẩm mới</Breadcrumb.Item>
            </Breadcrumb>

            <Row className="align-items-center mb-3">
                <Col>
                    <h1 className="h3 mb-0 text-dark-blue">Thêm Sản phẩm mới</h1>
                </Col>
            </Row>

            {successFlashMessage && <AlertMessage variant="success" dismissible onClose={() => setSuccessFlashMessage(null)}>{successFlashMessage}</AlertMessage>}
            {submitError && (
                <AlertMessage variant="danger" className="mb-3" onClose={() => setSubmitError(null)} dismissible>
                    {submitError.split("\n").map((line, idx) => (<span key={idx}>{line}<br/></span>))}
                </AlertMessage>
            )}

            <Card className="shadow-sm border-light">
                <Card.Body className="p-lg-4 p-3">
                    <ProductForm
                        onSubmit={handleFormSubmit}
                        loading={mutationLoading} // Truyền trạng thái loading của mutation
                        error={submitError ? { message: submitError } : null} // Truyền lỗi nếu có
                        isEditMode={false}
                        onCancel={() => navigate('/products')}
                    />
                </Card.Body>
            </Card>
        </Container>
    );
}

export default ProductCreatePage;
