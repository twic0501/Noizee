// admin-frontend/src/pages/Products/ProductEditPage.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Breadcrumb } from 'react-bootstrap';
import ProductForm from '../../components/products/ProductForm'; // Đã được cập nhật
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { GET_ADMIN_PRODUCT_DETAILS_QUERY, GET_ADMIN_PRODUCTS_QUERY } from '../../api/queries/productQueries';
import { UPDATE_PRODUCT_MUTATION } from '../../api/mutations/productMutations';
import logger from '../../utils/logger';
import { DEFAULT_PAGE_LIMIT, ADMIN_LANGUAGE_KEY } from '../../utils/constants';

function ProductEditPage() {
    const { id: productId } = useParams();
    const navigate = useNavigate();
    const [submitError, setSubmitError] = useState(null);
    const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';

    const { loading: queryLoading, error: queryError, data: productQueryResult, refetch: refetchProductDetails } = useQuery(GET_ADMIN_PRODUCT_DETAILS_QUERY, {
        variables: { id: productId, lang: currentAdminLang },
        fetchPolicy: 'cache-and-network', // Lấy từ cache trước, rồi network sau
        onError: (err) => {
            logger.error(`Error fetching product details for ID ${productId} (GraphQL):`, err);
            // Không setSubmitError ở đây, vì đây là lỗi query
        }
    });

    const [updateProductMutation, { loading: mutationLoading }] = useMutation(UPDATE_PRODUCT_MUTATION, {
        // Không cần refetchQueries ở đây nếu Apollo cache tự động cập nhật sau khi mutation trả về đối tượng đã sửa
        // Tuy nhiên, để chắc chắn list được cập nhật, có thể giữ lại refetch cho list query
        refetchQueries: [
             { query: GET_ADMIN_PRODUCT_DETAILS_QUERY, variables: { id: productId, lang: currentAdminLang } }, // Refetch chi tiết SP này
             { query: GET_ADMIN_PRODUCTS_QUERY, variables: { limit: DEFAULT_PAGE_LIMIT, offset: 0, filter: {}, lang: currentAdminLang } } // Refetch list
        ],
        onError: (error) => {
            logger.error("Error in updateProductMutation (GraphQL):", error);
            const messages = error.graphQLErrors?.map(e => e.message).join("\n") || error.message || "Cập nhật sản phẩm thất bại. Vui lòng kiểm tra lại thông tin.";
            setSubmitError(messages);
        },
        onCompleted: (data) => {
            const updatedProduct = data?.adminUpdateProduct;
            const updatedProductName = updatedProduct
                ? (currentAdminLang === 'en' && updatedProduct.name_en ? updatedProduct.name_en : updatedProduct.name_vi) || updatedProduct.name
                : "Sản phẩm";
            logger.info('Product updated successfully via GraphQL:', data);
            navigate('/products', { state: { successMessage: `Sản phẩm "${updatedProductName}" đã được cập nhật thành công!` } });
        }
    });

    const handleFormSubmit = async (preparedDataFromForm) => {
        setSubmitError(null);
        // preparedDataFromForm đã bao gồm 'id' từ ProductForm nếu isEditMode=true
        logger.info("ProductEditPage: Calling updateProduct mutation with input:", preparedDataFromForm);
        try {
            // Biến $lang trong UPDATE_PRODUCT_MUTATION là để PRODUCT_ADMIN_CORE_FIELDS (trong phần trả về) có thể resolve đúng ngôn ngữ.
            await updateProductMutation({
                variables: {
                    input: preparedDataFromForm, // input này đã chứa id
                    lang: currentAdminLang // Cần thiết cho fragment trả về
                }
            });
        } catch (gqlError) {
            if (!submitError && gqlError) {
                logger.error("Error caught in ProductEditPage handleSubmit:", gqlError);
                const messages = gqlError.graphQLErrors?.map(e => e.message).join("\n") || gqlError.message || "Đã xảy ra lỗi không mong muốn khi chuẩn bị cập nhật sản phẩm.";
                setSubmitError(messages);
            }
        }
    };

    if (queryLoading && !productQueryResult) return <Container className="mt-5"><LoadingSpinner message="Đang tải chi tiết sản phẩm..." /></Container>;

    if (queryError) {
        return (
            <Container fluid className="p-md-4 p-3">
                 <Breadcrumb className="mb-3">
                    <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item href="/products">Sản phẩm</Breadcrumb.Item>
                    <Breadcrumb.Item active>Lỗi tải sản phẩm</Breadcrumb.Item>
                </Breadcrumb>
                <AlertMessage variant="danger" className="mb-3">
                    Lỗi tải dữ liệu sản phẩm: {queryError.message}
                    <Button variant="outline-primary" size="sm" className="ms-2" onClick={() => refetchProductDetails()}>Thử lại</Button>
                </AlertMessage>
            </Container>
        );
    }

    const initialProductData = productQueryResult?.adminGetProductDetails;

    if (!initialProductData && !queryLoading) { // Đã load xong nhưng không có data
        return (
            <Container fluid className="p-md-4 p-3">
                 <Breadcrumb className="mb-3">
                    <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item href="/products">Sản phẩm</Breadcrumb.Item>
                    <Breadcrumb.Item active>Không tìm thấy</Breadcrumb.Item>
                </Breadcrumb>
                <AlertMessage variant="warning">Không tìm thấy sản phẩm với ID: {productId}. Có thể sản phẩm đã bị xóa hoặc bạn không có quyền truy cập.</AlertMessage>
                <Link to="/products" className="btn btn-outline-secondary btn-sm">
                    <i className="bi bi-arrow-left me-1"></i> Quay lại Danh sách Sản phẩm
                </Link>
            </Container>
        );
    }

    const displayProductName = initialProductData
        ? (currentAdminLang === 'en' && initialProductData.name_en ? initialProductData.name_en : initialProductData.name_vi) || initialProductData.name
        : `ID: ${productId}`;

    return (
        <Container fluid className="p-md-4 p-3">
            <Breadcrumb className="mb-3">
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item href="/products">Sản phẩm</Breadcrumb.Item>
                <Breadcrumb.Item active>Chỉnh sửa: {truncateString(displayProductName, 30)}</Breadcrumb.Item>
            </Breadcrumb>

            <Row className="align-items-center mb-3">
                <Col>
                    <h1 className="h3 mb-0 text-dark-blue">Chỉnh sửa Sản phẩm: <span className="text-primary">{displayProductName}</span></h1>
                </Col>
                <Col xs="auto">
                    <Link to="/products">
                        <Button variant="outline-secondary" size="sm">
                            <i className="bi bi-arrow-left me-1"></i> Quay lại Danh sách
                        </Button>
                    </Link>
                </Col>
            </Row>

            {submitError && (
                 <AlertMessage variant="danger" className="mb-3" onClose={() => setSubmitError(null)} dismissible>
                    {submitError.split("\n").map((line, idx) => (<span key={idx}>{line}<br/></span>))}
                </AlertMessage>
            )}

            <Card className="shadow-sm border-light">
                <Card.Body className="p-lg-4 p-3">
                    {initialProductData && ( // Chỉ render form khi có initialData
                        <ProductForm
                            initialData={initialProductData}
                            onSubmit={handleFormSubmit}
                            loading={mutationLoading} // Loading của mutation update
                            error={submitError ? { message: submitError } : null}
                            isEditMode={true}
                            onCancel={() => navigate(`/products`)}
                        />
                    )}
                    {/* Trường hợp initialProductData chưa có nhưng queryLoading đã false (ví dụ lỗi NOT_FOUND từ query) đã được xử lý ở trên */}
                </Card.Body>
            </Card>
        </Container>
    );
}
// Helper function (nếu chưa có trong utils)
const truncateString = (str, num) => {
  if (!str) return '';
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + '...';
};
export default ProductEditPage;
