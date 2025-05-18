// admin-frontend/src/pages/Products/ProductEditPage.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Breadcrumb } from 'react-bootstrap';
import ProductForm from '../../components/products/ProductForm';
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
        fetchPolicy: 'cache-and-network',
        onError: (err) => {
            logger.error(`Error fetching product details for ID ${productId} (GraphQL):`, err);
        }
    });

    const [updateProductMutation, { loading: mutationLoading }] = useMutation(UPDATE_PRODUCT_MUTATION, {
        refetchQueries: [
            // Ensure $lang is passed if the query expects it, which GET_ADMIN_PRODUCT_DETAILS_QUERY does
            { query: GET_ADMIN_PRODUCT_DETAILS_QUERY, variables: { id: productId, lang: currentAdminLang } },
            { query: GET_ADMIN_PRODUCTS_QUERY, variables: { limit: DEFAULT_PAGE_LIMIT, offset: 0, filter: {}, lang: currentAdminLang } }
        ],
        onError: (error) => {
            logger.error("Error in updateProductMutation (GraphQL):", error);
            const messages = error.graphQLErrors?.map(e => e.message).join("\n") || error.message || "Cập nhật sản phẩm thất bại.";
            setSubmitError(messages);
        },
        onCompleted: (data) => {
            const updatedProductName = (currentAdminLang === 'en' && data.adminUpdateProduct.name_en) // Assuming 'name_en' or use 'name(lang:"en")'
                                     ? data.adminUpdateProduct.name_en
                                     : (data.adminUpdateProduct.name_vi || data.adminUpdateProduct.name); // Fallback
            logger.info('Product updated successfully via GraphQL:', data);
            navigate('/products', { state: { successMessage: `Sản phẩm "${updatedProductName}" đã được cập nhật thành công!` } });
        }
    });

    const handleFormSubmit = async (preparedDataFromForm) => {
        setSubmitError(null);
        logger.info("ProductEditPage: Calling updateProduct mutation with input:", preparedDataFromForm);
        try {
            // FIXED: Pass lang variable to the mutation
            await updateProductMutation({ 
                variables: { 
                    input: preparedDataFromForm, // preparedDataFromForm already includes 'id'
                    lang: currentAdminLang // Pass the current language
                } 
            });
        } catch (gqlError) {
            if (!submitError && gqlError) {
                logger.error("Error caught in ProductEditPage handleSubmit:", gqlError);
                const messages = gqlError.graphQLErrors?.map(e => e.message).join("\n") || gqlError.message || "Đã xảy ra lỗi không mong muốn.";
                setSubmitError(messages);
            }
        }
    };

    if (queryLoading) return <LoadingSpinner message="Đang tải chi tiết sản phẩm..." />;
    
    if (queryError) {
        return (
            <Container fluid className="p-md-4 p-3">
                 <Breadcrumb className="mb-3">
                    <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item href="/products">Sản phẩm</Breadcrumb.Item>
                    <Breadcrumb.Item active>Lỗi</Breadcrumb.Item>
                </Breadcrumb>
                <AlertMessage variant="danger" className="mb-3">
                    Lỗi tải sản phẩm: {queryError.message}
                    <Button variant="outline-primary" size="sm" className="ms-2" onClick={() => refetchProductDetails()}>Thử lại</Button>
                </AlertMessage>
            </Container>
        );
    }

    const initialProductData = productQueryResult?.adminGetProductDetails;

    if (!initialProductData && !queryLoading) {
        return (
            <Container fluid className="p-md-4 p-3">
                 <Breadcrumb className="mb-3">
                    <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item href="/products">Sản phẩm</Breadcrumb.Item>
                    <Breadcrumb.Item active>Không tìm thấy</Breadcrumb.Item>
                </Breadcrumb>
                <AlertMessage variant="warning">Không tìm thấy sản phẩm với ID: {productId}.</AlertMessage>
                <Link to="/products" className="btn btn-outline-secondary btn-sm">
                    <i className="bi bi-arrow-left me-1"></i> Quay lại Danh sách Sản phẩm
                </Link>
            </Container>
        );
    }
    
    const displayProductName = (currentAdminLang === 'en' && initialProductData?.name_en) 
                                ? initialProductData.name_en 
                                : (initialProductData?.name_vi || initialProductData?.name);

    return (
        <Container fluid className="p-md-4 p-3">
            <Breadcrumb className="mb-3">
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item href="/products">Sản phẩm</Breadcrumb.Item>
                <Breadcrumb.Item active>Chỉnh sửa Sản phẩm</Breadcrumb.Item>
            </Breadcrumb>

            <Row className="align-items-center mb-3">
                <Col>
                    <h1 className="h3 mb-0 text-dark-blue">Chỉnh sửa Sản phẩm: <span className="text-primary">{displayProductName || `ID: ${productId}`}</span></h1>
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
                    {initialProductData && (
                        <ProductForm
                            initialData={initialProductData}
                            onSubmit={handleFormSubmit}
                            loading={mutationLoading}
                            isEditMode={true}
                            onCancel={() => navigate(`/products`)} // Navigate back to list on cancel
                        />
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}

export default ProductEditPage;
