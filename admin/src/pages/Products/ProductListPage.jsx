// src/pages/Products/ProductListPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container, Button, Row, Col } from 'react-bootstrap';
import ProductTable from '../../components/products/ProductTable';
import ProductFilters from '../../components/products/ProductFilters';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import ModalConfirm from '../../components/common/ModalConfirm';
import { GET_ADMIN_PRODUCTS_QUERY } from '../../api/queries/productQueries';
import { DELETE_PRODUCT_MUTATION, UPDATE_PRODUCT_MUTATION } from '../../api/mutations/productMutations'; // Giả sử có mutation update trạng thái active
import useDataTable from '../../hooks/useDataTable';
import logger from '../../utils/logger';

const DEFAULT_LIMIT = 10;

function ProductListPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || null);

    const {
        currentPage, limit, offset, filters, totalItems, totalPages,
        handlePageChange, applyFilters, resetFilters, setTotalItems,
    } = useDataTable({ initialLimit: DEFAULT_LIMIT, initialFilters:{} });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null); // Lưu cả object để hiển thị tên
    const [actionError, setActionError] = useState(null);
    // successMessage đã được quản lý ở trên

    const { loading, error, data, refetch } = useQuery(GET_ADMIN_PRODUCTS_QUERY, {
        variables: { limit:limit , offset:offset, filter: filters },
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        onCompleted: (queryData) => {
            setTotalItems(queryData?.adminGetAllProducts?.count || 0);
        },
        onError: (err) => {
            logger.error("Error fetching products:", err);
            setActionError(err.message || "Failed to load products.");
        }
    });

    const [deleteProduct, { loading: deleting }] = useMutation(DELETE_PRODUCT_MUTATION, {
        onCompleted: (mutationData) => {
            if (mutationData.adminDeleteProduct) {
                setSuccessMessage(`Product "${productToDelete?.name || 'ID: '+productToDelete?.id}" deleted successfully!`);
                setActionError(null);
                // Refetch để cập nhật danh sách, hoặc cập nhật cache của Apollo
                refetch();
                if (currentPage > 1 && data?.adminGetAllProducts?.products?.length === 1 && totalItems > 1) {
                    // Nếu xóa item cuối cùng của trang hiện tại (không phải trang 1)
                    handlePageChange(currentPage - 1);
                }
            } else {
                setActionError('Failed to delete product. The product might not have been deleted from the server.');
                setSuccessMessage(null);
            }
            setProductToDelete(null);
        },
        onError: (err) => {
            logger.error("Error deleting product:", err);
            setActionError(err.graphQLErrors?.[0]?.message || err.message || 'Failed to delete product. It might be in use.');
            setSuccessMessage(null);
            setProductToDelete(null);
        },
        // Cân nhắc dùng update function của Apollo Cache để tối ưu hơn refetch toàn bộ
        // update: (cache, { data: { adminDeleteProduct: success, deletedProductId }}) => { ... }
    });

    // Mutation để cập nhật is_active (ví dụ)
    const [updateProductStatus, { loading: updatingStatus }] = useMutation(UPDATE_PRODUCT_MUTATION, {
        onCompleted: (data) => {
            setSuccessMessage(`Product "${data.adminUpdateProduct.product_name}" status updated!`);
            setActionError(null);
            refetch(); // Hoặc chỉ cập nhật item đó trong cache
        },
        onError: (err) => {
            logger.error("Error updating product status:", err);
            setActionError(err.graphQLErrors?.[0]?.message || err.message || 'Failed to update product status.');
            setSuccessMessage(null);
        }
    });

    useEffect(() => {
        // Xóa success message sau một thời gian hoặc khi component unmount
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                // Xóa state khỏi location để không hiển thị lại khi refresh
                navigate(location.pathname, { replace: true, state: {} });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, location.pathname, navigate]);


    const handleDeleteRequest = (productId, productName) => {
        setProductToDelete({ id: productId, name: productName });
        setShowDeleteModal(true);
        setActionError(null); // Clear previous errors
        setSuccessMessage(null);
    };

    const confirmDeleteHandler = () => {
        if (productToDelete?.id) {
            deleteProduct({ variables: { id: productToDelete.id } });
        }
        setShowDeleteModal(false);
    };

    const handleToggleActive = (productId, currentIsActive) => {
        // Lấy thông tin sản phẩm đầy đủ từ data.adminGetAllProducts.products để gửi đi
        // Hoặc mutation chỉ cần is_active
        const productToUpdate = data?.adminGetAllProducts?.products.find(p => p.product_id === productId);
        if (!productToUpdate) {
            setActionError("Could not find product to update status.");
            return;
        }
        // Chỉ gửi các trường cần thiết cho việc cập nhật trạng thái
        // Backend resolver sẽ chỉ cập nhật trường is_active
        const input = {
            is_active: !currentIsActive
            // Không gửi các trường khác để tránh ghi đè không mong muốn
            // nếu backend không xử lý tốt partial updates
        };
        updateProductStatus({ variables: { id: productId, input }});
    };


    return (
        <Container fluid className="p-3">
            <Row className="align-items-center mb-3">
                <Col><h1 className="h3 mb-0">Manage Products</h1></Col>
                <Col xs="auto">
                    <Link to="/products/new">
                        <Button variant="primary">
                            <i className="bi bi-plus-lg me-1"></i> Add New Product
                        </Button>
                    </Link>
                </Col>
            </Row>

            <ProductFilters initialFilters={filters} onFilterChange={applyFilters} onResetFilters={resetFilters} />

            {successMessage && <AlertMessage variant="success" dismissible onClose={() => setSuccessMessage(null)}>{successMessage}</AlertMessage>}
            {actionError && <AlertMessage variant="danger" dismissible onClose={() => setActionError(null)}>{actionError}</AlertMessage>}

            {loading && !data && <LoadingSpinner message="Loading products..." />} {/* Chỉ hiện khi chưa có data */}
            {error && !data && <AlertMessage variant="danger">Error loading products: {error.message}</AlertMessage>}

            {data?.adminGetAllProducts?.products && (
                 <>
                    <ProductTable
                        products={data.adminGetAllProducts.products}
                        onDelete={handleDeleteRequest}
                        isLoading={loading && !!data} // True nếu đang refetch hoặc fetch lần đầu nhưng data đã có
                        onToggleActive={handleToggleActive}
                    />
                    {totalItems > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                    <div className="text-center text-muted small mt-1">
                        Showing {data.adminGetAllProducts.products.length} of {totalItems} products.
                    </div>
                </>
            )}
            {!loading && !error && totalItems === 0 && (
                <AlertMessage variant="info" className="mt-3">
                    No products found. Try adjusting your filters or <Link to="/products/new">add a new product</Link>.
                </AlertMessage>
            )}

            <ModalConfirm
                show={showDeleteModal}
                handleClose={() => { setShowDeleteModal(false); setProductToDelete(null);}}
                handleConfirm={confirmDeleteHandler}
                title="Confirm Product Deletion"
                body={`Are you sure you want to delete the product "${productToDelete?.name || 'this product'}"? This action cannot be undone.`}
                confirmButtonText={deleting ? 'Deleting...' : 'Delete'}
                confirmButtonVariant="danger"
                confirmDisabled={deleting}
            />
        </Container>
    );
}

export default ProductListPage;