// admin-frontend/src/pages/Products/ProductListPage.jsx
    import React, { useState, useEffect } from 'react';
    import { useQuery, useMutation } from '@apollo/client';
    import { Link, useLocation, useNavigate } from 'react-router-dom';
    import { Container, Button, Row, Col, Breadcrumb, Spinner } from 'react-bootstrap';
    import ProductTable from '../../components/products/ProductTable';
    import ProductFilters from '../../components/products/ProductFilters';
    import Pagination from '../../components/common/Pagination';
    import LoadingSpinner from '../../components/common/LoadingSpinner';
    import AlertMessage from '../../components/common/AlertMessage';
    import ModalConfirm from '../../components/common/ModalConfirm';
    import { GET_ADMIN_PRODUCTS_QUERY } from '../../api/queries/productQueries';
    import { DELETE_PRODUCT_MUTATION, UPDATE_PRODUCT_MUTATION } from '../../api/mutations/productMutations';
    import useDataTable from '../../hooks/useDataTable';
    import logger from '../../utils/logger'; 
    import { DEFAULT_PAGE_LIMIT, ADMIN_LANGUAGE_KEY } from '../../utils/constants';
    
    function ProductListPage() {
        const location = useLocation();
        const navigate = useNavigate();
        const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || null);
        const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';
    
        const {
            currentPage, limit, offset, filters, totalItems, totalPages,
            handlePageChange, applyFilters, resetFilters, setTotalItems,
        } = useDataTable({ initialLimit: DEFAULT_PAGE_LIMIT, initialFilters: {} });
    
        const [showDeleteModal, setShowDeleteModal] = useState(false);
        const [productToDelete, setProductToDelete] = useState(null); // Mong đợi nhận toàn bộ đối tượng product
        const [actionError, setActionError] = useState(null);
    
        const { loading, error, data, refetch } = useQuery(GET_ADMIN_PRODUCTS_QUERY, {
            variables: { limit: limit, offset: offset, filter: filters, lang: currentAdminLang },
            fetchPolicy: 'cache-and-network',
            notifyOnNetworkStatusChange: true,
            onCompleted: (queryData) => {
                setTotalItems(queryData?.adminGetAllProducts?.count || 0);
            },
            onError: (err) => {
                logger.error("ProductListPage: Error fetching products:", err);
                setActionError(err.message || "Failed to load products.");
            }
        });
    
        const [deleteProductMutation, { loading: deleting }] = useMutation(DELETE_PRODUCT_MUTATION, {
            onCompleted: (mutationData) => {
                logger.info("ProductListPage: deleteProductMutation onCompleted, data:", mutationData);
                if (mutationData.adminDeleteProduct) {
                    const productNameForDisplay = (currentAdminLang === 'en' && productToDelete?.product_name_en)
                        ? productToDelete.product_name_en
                        : productToDelete?.product_name_vi;
                    setSuccessMessage(`Sản phẩm "${productNameForDisplay || 'ID: ' + productToDelete?.product_id}" đã được xóa!`);
                    setActionError(null);
                    refetch(); 
                    if (currentPage > 1 && data?.adminGetAllProducts?.products?.length === 1 && totalItems > 1) {
                        handlePageChange(currentPage - 1);
                    }
                } else {
                    logger.warn("ProductListPage: deleteProductMutation onCompleted - adminDeleteProduct returned false or unexpected data.", mutationData);
                    setActionError('Xóa sản phẩm thất bại. Server không xác nhận việc xóa.');
                    setSuccessMessage(null);
                }
                setProductToDelete(null);
            },
            onError: (err) => {
                logger.error("ProductListPage: Error in deleteProductMutation (GraphQL):", err);
                const messages = err.graphQLErrors?.map(e => e.message).join("\n") || err.message || 'Xóa sản phẩm thất bại.';
                setActionError(messages);
                setSuccessMessage(null);
                setProductToDelete(null);
            },
        });
    
        const [updateProductStatus, { loading: updatingStatus }] = useMutation(UPDATE_PRODUCT_MUTATION, {
            onCompleted: (mutationData) => {
                const updatedProduct = mutationData?.adminUpdateProduct;
                const productNameForDisplay = (currentAdminLang === 'en' && updatedProduct?.product_name_en)
                    ? updatedProduct.product_name_en
                    : updatedProduct?.product_name_vi;
                setSuccessMessage(`Trạng thái sản phẩm "${productNameForDisplay || `ID: ${updatedProduct?.product_id}`}" đã được cập nhật!`);
                setActionError(null);
                refetch(); 
            },
            onError: (err) => {
                logger.error("ProductListPage: Error updating product status:", err);
                setActionError(err.graphQLErrors?.[0]?.message || err.message || 'Cập nhật trạng thái sản phẩm thất bại.');
                setSuccessMessage(null);
            },
            refetchQueries: [{ query: GET_ADMIN_PRODUCTS_QUERY, variables: { limit, offset, filter: filters, lang: currentAdminLang } }],
        });
    
        useEffect(() => {
            if (successMessage) {
                const timer = setTimeout(() => {
                    setSuccessMessage(null);
                    if (location.state?.successMessage) {
                        navigate(location.pathname, { replace: true, state: {} });
                    }
                }, 5000);
                return () => clearTimeout(timer);
            }
        }, [successMessage, location.pathname, location.state, navigate]);
    
        const handleDeleteRequest = (product) => { 
            logger.info('ProductListPage: handleDeleteRequest received product:', product); 
            if (product && typeof product === 'object' && product.product_id) {
                setProductToDelete(product);
                setShowDeleteModal(true);
                setActionError(null);
                setSuccessMessage(null);
            } else {
                logger.warn('ProductListPage: handleDeleteRequest called with invalid product data.', product);
                setActionError('Không thể khởi tạo xóa: Dữ liệu sản phẩm không hợp lệ.');
            }
        };
    
        const confirmDeleteHandler = () => { 
            logger.info('ProductListPage: confirmDeleteHandler. Product from state:', productToDelete); 
            if (productToDelete && productToDelete.product_id) { 
                logger.info(`ProductListPage: Calling deleteProductMutation for ID: ${productToDelete.product_id}`); 
                deleteProductMutation({ variables: { id: productToDelete.product_id } });
            } else {
                logger.warn('ProductListPage: confirmDeleteHandler - productToDelete state is invalid.', productToDelete); 
                setActionError('Không thể xóa sản phẩm: Thông tin sản phẩm không hợp lệ hoặc đã bị xóa.');
            }
            setShowDeleteModal(false); 
        };
    
        const handleToggleActive = (productId, currentIsActiveStatus) => {
            const input = {
                id: productId, 
                is_active: !currentIsActiveStatus
            };
            updateProductStatus({ variables: { input: input, lang: currentAdminLang } });
        };
    
        return (
            <Container fluid className="p-md-4 p-3">
                <Breadcrumb className="mb-3">
                    <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item active>Sản phẩm</Breadcrumb.Item>
                </Breadcrumb>
                <Row className="align-items-center mb-3">
                    <Col><h1 className="h3 mb-0 text-dark-blue">Quản lý Sản phẩm</h1></Col>
                    <Col xs="auto">
                        <Link to="/products/new">
                            <Button variant="primary" className="shadow-sm">
                                <i className="bi bi-plus-lg me-1"></i> Thêm Sản phẩm mới
                            </Button>
                        </Link>
                    </Col>
                </Row>
    
                <ProductFilters 
                    initialFilters={filters} 
                    onFilterChange={applyFilters} 
                    onResetFilters={resetFilters} 
                />
    
                {successMessage && <AlertMessage variant="success" dismissible onClose={() => setSuccessMessage(null)}>{successMessage}</AlertMessage>}
                {actionError && <AlertMessage variant="danger" dismissible onClose={() => setActionError(null)}>{actionError.split("\n").map((line, idx) => (<span key={idx}>{line}<br/></span>))}</AlertMessage>}
    
                {(loading && (!data?.adminGetAllProducts?.products || data.adminGetAllProducts.products.length === 0)) && <LoadingSpinner message="Đang tải sản phẩm..." />}
                {error && !loading && <AlertMessage variant="danger">Lỗi tải sản phẩm: {error.message}</AlertMessage>}
    
                {data?.adminGetAllProducts?.products && (
                     <>
                        <ProductTable
                            products={data.adminGetAllProducts.products}
                            onDelete={handleDeleteRequest}
                            isLoading={loading || deleting || updatingStatus} 
                            onToggleActive={handleToggleActive}
                        />
                        {totalItems > 0 && data.adminGetAllProducts.products.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                         {totalItems > 0 && data.adminGetAllProducts.products.length > 0 && (
                            <div className="text-center text-muted small mt-2">
                                Hiển thị {data.adminGetAllProducts.products.length} trên tổng số {totalItems} sản phẩm.
                            </div>
                        )}
                    </>
                )}
                {!loading && !error && totalItems === 0 && (
                    <AlertMessage variant="info" className="mt-3 text-center">
                        Không tìm thấy sản phẩm nào. Thử điều chỉnh bộ lọc hoặc <Link to="/products/new">thêm sản phẩm mới</Link>.
                    </AlertMessage>
                )}
    
                <ModalConfirm
                    show={showDeleteModal}
                    handleClose={() => { 
                        logger.info('ProductListPage: ModalConfirm handleClose.'); 
                        setShowDeleteModal(false); 
                        setProductToDelete(null); 
                    }}
                    handleConfirm={confirmDeleteHandler} 
                    title="Xác nhận Xóa Sản phẩm"
                    body={`Bạn có chắc chắn muốn xóa sản phẩm "${
                        (currentAdminLang === 'en' && productToDelete?.product_name_en ? productToDelete.product_name_en : productToDelete?.product_name_vi) || (productToDelete?.product_id || 'sản phẩm này')
                    }"? Hành động này không thể hoàn tác.`}
                    confirmButtonText={deleting ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> Đang xóa...</> : 'Xóa'}
                    confirmButtonVariant="danger"
                    confirmDisabled={deleting}
                />
            </Container>
        );
    }
    
    export default ProductListPage;