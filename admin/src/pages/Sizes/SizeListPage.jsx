// admin-frontend/src/pages/Sizes/SizeListPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Container, Row, Col, Button, Modal, Spinner, Breadcrumb } from 'react-bootstrap';
import SizeTable from '../../components/sizes/SizeTable'; // Component này bạn đã cung cấp (uploaded:SizeTable.jsx)
import SizeForm from '../../components/sizes/SizeForm';   // Component này đã được tạo ở lượt trước (admin_fe_SizeForm_jsx_new)
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import ModalConfirm from '../../components/common/ModalConfirm';
import { ADMIN_GET_ALL_SIZES_QUERY } from '../../api/queries/sizeQueries'; // Import đúng query
import {
    ADMIN_CREATE_SIZE_MUTATION,
    ADMIN_UPDATE_SIZE_MUTATION,
    ADMIN_DELETE_SIZE_MUTATION
} from '../../api/mutations/sizeMutations'; // Đảm bảo các mutation này tồn tại
import logger from '../../utils/logger';

function SizeListPage() {
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentSize, setCurrentSize] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });

    const { loading: queryLoading, error: queryError, data, refetch } = useQuery(ADMIN_GET_ALL_SIZES_QUERY, {
        fetchPolicy: 'cache-and-network',
        onError: (err) => {
            logger.error("Error fetching sizes:", err);
            setActionFeedback({ type: 'danger', message: err.message || "Không thể tải danh sách kích thước." });
        }
    });

    const handleMutationError = useCallback((err, actionName, specificMessage = null) => {
        logger.error(`Error ${actionName} size:`, err);
        const message = specificMessage || err.graphQLErrors?.[0]?.message || err.message || `Thao tác ${actionName} thất bại.`;
        setActionFeedback({ type: 'danger', message });
    }, []);

    useEffect(() => {
        if (actionFeedback.message) {
            const timer = setTimeout(() => setActionFeedback({ type: '', message: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [actionFeedback]);

    const [createSize, { loading: creating }] = useMutation(ADMIN_CREATE_SIZE_MUTATION, {
        onCompleted: (mutationData) => {
            setActionFeedback({ type: 'success', message: `Kích thước "${mutationData.adminCreateSize.size_name}" đã được tạo!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'tạo kích thước'),
        refetchQueries: [{ query: ADMIN_GET_ALL_SIZES_QUERY }],
    });

    const [updateSize, { loading: updating }] = useMutation(ADMIN_UPDATE_SIZE_MUTATION, {
        onCompleted: (mutationData) => {
            setActionFeedback({ type: 'success', message: `Kích thước "${mutationData.adminUpdateSize.size_name}" đã được cập nhật!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'cập nhật kích thước')
    });

    const [deleteSize, { loading: deleting }] = useMutation(ADMIN_DELETE_SIZE_MUTATION, {
        onCompleted: () => {
            setActionFeedback({ type: 'success', message: `Kích thước "${itemToDelete?.size_name}" đã được xóa!` });
            setItemToDelete(null);
            refetch();
        },
        onError: (err) => {
            handleMutationError(err, 'xóa kích thước', `Không thể xóa kích thước. Kích thước có thể đang được sử dụng.`);
            setItemToDelete(null);
        }
    });

    const handleModalClose = (shouldRefetch = false) => {
        setShowFormModal(false);
        setCurrentSize(null);
        setIsEditMode(false);
        if (shouldRefetch) refetch();
    };

    const handleShowCreateModal = () => {
        setIsEditMode(false);
        setCurrentSize(null);
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    };

    const handleShowEditModal = (size) => {
        setIsEditMode(true);
        setCurrentSize(size); // Truyền initialData cho SizeForm
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    };

    const handleFormSubmit = async (formDataFromComponent) => { // formDataFromComponent là { size_name: "..." }
        setActionFeedback({ type: '', message: '' });
        const name = formDataFromComponent.size_name; // Lấy name từ object

        if (isEditMode && currentSize) {
            // Mutation update size thường nhận id và name
            await updateSize({ variables: { id: currentSize.size_id, name } });
        } else {
            // Mutation create size thường nhận name
            await createSize({ variables: { name } });
        }
    };

    const handleDeleteRequest = (size) => {
        setItemToDelete(size);
        setActionFeedback({ type: '', message: '' });
        setShowDeleteModal(true);
    };

    const confirmDeleteHandler = () => {
        if (itemToDelete) {
            deleteSize({ variables: { id: itemToDelete.size_id } });
        }
        setShowDeleteModal(false);
    };

    const sizes = data?.adminGetAllSizes || []; // Đảm bảo tên trường trả về từ query đúng

    return (
        <Container fluid className="p-md-4 p-3">
            <Breadcrumb className="mb-3">
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item href="/products">Sản phẩm</Breadcrumb.Item>
                <Breadcrumb.Item active>Kích thước</Breadcrumb.Item>
            </Breadcrumb>
            <Row className="align-items-center mb-3">
                <Col><h1 className="h3 mb-0 text-dark-blue">Quản lý Kích thước</h1></Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={handleShowCreateModal} className="shadow-sm">
                        <i className="bi bi-plus-lg me-1"></i> Thêm Kích thước
                    </Button>
                </Col>
            </Row>

            {actionFeedback.message && <AlertMessage variant={actionFeedback.type} dismissible onClose={() => setActionFeedback({type:'', message:''})}>{actionFeedback.message}</AlertMessage>}

            {queryLoading && <LoadingSpinner message="Đang tải danh sách kích thước..." />}
            {queryError && !data && <AlertMessage variant="danger">Lỗi tải dữ liệu: {queryError.message}</AlertMessage>}
            
            {!queryLoading && !queryError && sizes.length === 0 && (
                 <AlertMessage variant="info" className="mt-3 text-center">Không có kích thước nào. Nhấn "Thêm Kích thước" để tạo mới.</AlertMessage>
            )}

            {!queryLoading && !queryError && sizes.length > 0 && (
                <SizeTable
                    sizes={sizes}
                    onEdit={handleShowEditModal}
                    onDelete={handleDeleteRequest}
                />
            )}
            {/* TODO: Add Pagination if size list can be long */}

            {showFormModal && (
                <Modal show={showFormModal} onHide={() => handleModalClose(false)} centered backdrop="static">
                     <SizeForm // Sử dụng SizeForm đã tạo
                        initialData={currentSize}
                        onSubmit={handleFormSubmit}
                        loading={creating || updating}
                        error={actionFeedback.type === 'danger' && actionFeedback.message.toLowerCase().includes('form') ? {message: actionFeedback.message} : null}
                        isEditMode={isEditMode}
                        onCancel={() => handleModalClose(false)}
                    />
                </Modal>
            )}

            <ModalConfirm
                show={showDeleteModal}
                handleClose={() => {setShowDeleteModal(false); setItemToDelete(null);}}
                handleConfirm={confirmDeleteHandler}
                title="Xác nhận Xóa Kích thước"
                body={`Bạn có chắc chắn muốn xóa kích thước "${itemToDelete?.size_name || ''}"?`}
                confirmButtonText={deleting ? <><Spinner size="sm" className="me-1" /> Đang xóa...</> : 'Xóa'}
                confirmButtonVariant="danger"
                confirmDisabled={deleting}
            />
        </Container>
    );
}

export default SizeListPage;
