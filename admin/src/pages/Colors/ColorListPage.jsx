// admin-frontend/src/pages/Colors/ColorListPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Container, Row, Col, Button, Modal, Spinner, Breadcrumb } from 'react-bootstrap';
import ColorTable from '../../components/colors/ColorTable';
import ColorForm from '../../components/colors/ColorForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import ModalConfirm from '../../components/common/ModalConfirm';
// Query và Mutation sẽ được cập nhật để không dùng lang cho tên màu nếu không cần
import { ADMIN_GET_ALL_COLORS_QUERY } from '../../api/queries/colorQueries'; 
import { ADMIN_CREATE_COLOR_MUTATION, ADMIN_UPDATE_COLOR_MUTATION, ADMIN_DELETE_COLOR_MUTATION } from '../../api/mutations/colorMutations';
import logger from '../../utils/logger';
// ADMIN_LANGUAGE_KEY không còn quá quan trọng cho Color nếu tên không dịch

function ColorListPage() {
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentColor, setCurrentColor] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });
    // const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi'; // Ít quan trọng hơn

    // Query không cần biến lang nếu resolver Color.name không dùng đến
    const { loading: queryLoading, error: queryError, data, refetch } = useQuery(ADMIN_GET_ALL_COLORS_QUERY, {
        // variables: { lang: currentAdminLang }, // Bỏ nếu query không cần lang
        fetchPolicy: 'cache-and-network',
        onError: (err) => {
            logger.error("Error fetching colors:", err);
            setActionFeedback({ type: 'danger', message: err.message || "Không thể tải danh sách màu." });
        }
    });

    const handleMutationError = useCallback((err, actionName, specificMessage = null) => {
        logger.error(`Error ${actionName} color:`, err);
        const message = specificMessage || err.graphQLErrors?.[0]?.message || err.message || `Thao tác ${actionName} thất bại.`;
        setActionFeedback({ type: 'danger', message });
    }, []);

    useEffect(() => {
        if (actionFeedback.message) {
            const timer = setTimeout(() => setActionFeedback({ type: '', message: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [actionFeedback]);

    const [createColor, { loading: creating }] = useMutation(ADMIN_CREATE_COLOR_MUTATION, {
        onCompleted: (mutationData) => {
            // adminCreateColor trả về color_name
            const newName = mutationData.adminCreateColor.color_name; 
            setActionFeedback({ type: 'success', message: `Màu "${newName}" đã được tạo!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'tạo màu'),
        refetchQueries: [{ query: ADMIN_GET_ALL_COLORS_QUERY /*, variables: { lang: currentAdminLang } */ }],
    });

    const [updateColor, { loading: updating }] = useMutation(ADMIN_UPDATE_COLOR_MUTATION, {
        onCompleted: (mutationData) => {
            const updatedName = mutationData.adminUpdateColor.color_name;
            setActionFeedback({ type: 'success', message: `Màu "${updatedName}" đã được cập nhật!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'cập nhật màu'),
        refetchQueries: [{ query: ADMIN_GET_ALL_COLORS_QUERY }],
    });

    const [deleteColor, { loading: deleting }] = useMutation(ADMIN_DELETE_COLOR_MUTATION, {
        onCompleted: () => {
            setActionFeedback({ type: 'success', message: `Màu "${itemToDelete?.color_name}" đã được xóa!` });
            setItemToDelete(null);
            refetch();
        },
        onError: (err) => {
            handleMutationError(err, 'xóa màu', `Không thể xóa màu. Màu có thể đang được sử dụng.`);
            setItemToDelete(null);
        }
    });

    const handleModalClose = (shouldRefetch = false) => {
        setShowFormModal(false);
        setCurrentColor(null);
        setIsEditMode(false);
        if (shouldRefetch) refetch();
    };

    const handleShowCreateModal = () => {
        setIsEditMode(false);
        setCurrentColor(null);
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    };

    const handleShowEditModal = (color) => {
        setIsEditMode(true);
        // color object từ query giờ sẽ có color_name
        setCurrentColor(color); 
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    };

    const handleFormSubmit = async (formDataFromComponent) => {
        setActionFeedback({ type: '', message: '' });
        
        // Input chỉ cần color_name và color_hex
        const input = { 
            color_name: formDataFromComponent.color_name,
            color_hex: formDataFromComponent.color_hex || null,
        };

        if (isEditMode && currentColor) {
            await updateColor({ variables: { id: currentColor.color_id, input } });
        } else {
            await createColor({ variables: { input } });
        }
    };

    const handleDeleteRequest = (color) => {
        setItemToDelete(color); // itemToDelete sẽ có color_name
        setActionFeedback({ type: '', message: '' });
        setShowDeleteModal(true);
    };

    const confirmDeleteHandler = () => {
        if (itemToDelete) {
            deleteColor({ variables: { id: itemToDelete.color_id } });
        }
        setShowDeleteModal(false);
    };

    const colors = data?.adminGetAllColors || [];

    return (
        <Container fluid className="p-md-4 p-3">
            <Breadcrumb className="mb-3">
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item href="/products">Sản phẩm</Breadcrumb.Item>
                <Breadcrumb.Item active>Màu sắc</Breadcrumb.Item>
            </Breadcrumb>
            <Row className="align-items-center mb-3">
                <Col><h1 className="h3 mb-0 text-dark-blue">Quản lý Màu sắc</h1></Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={handleShowCreateModal} className="shadow-sm">
                        <i className="bi bi-plus-lg me-1"></i> Thêm Màu
                    </Button>
                </Col>
            </Row>

            {actionFeedback.message && <AlertMessage variant={actionFeedback.type} dismissible onClose={() => setActionFeedback({type:'', message:''})}>{actionFeedback.message}</AlertMessage>}

            {queryLoading && <LoadingSpinner message="Đang tải danh sách màu..." />}
            {queryError && !data && <AlertMessage variant="danger">Lỗi tải dữ liệu: {queryError.message}</AlertMessage>}
            
            {!queryLoading && !queryError && colors.length === 0 && (
                 <AlertMessage variant="info" className="mt-3 text-center">Không có màu nào. Nhấn "Thêm Màu" để tạo mới.</AlertMessage>
            )}

            {!queryLoading && colors.length > 0 && (
                <ColorTable
                    colors={colors}
                    onEdit={handleShowEditModal}
                    onDelete={handleDeleteRequest}
                />
            )}

            {showFormModal && (
                <Modal show={showFormModal} onHide={() => handleModalClose(false)} centered backdrop="static" size="lg">
                     <ColorForm
                        initialData={currentColor}
                        onSubmit={handleFormSubmit}
                        loading={creating || updating}
                        error={actionFeedback.type === 'danger' ? {message: actionFeedback.message} : null}
                        isEditMode={isEditMode}
                        onCancel={() => handleModalClose(false)}
                    />
                </Modal>
            )}

            <ModalConfirm
                show={showDeleteModal}
                handleClose={() => {setShowDeleteModal(false); setItemToDelete(null);}}
                handleConfirm={confirmDeleteHandler}
                title="Xác nhận Xóa Màu"
                // itemToDelete giờ sẽ có color_name
                body={`Bạn có chắc chắn muốn xóa màu "${itemToDelete?.color_name || ''}"?`}
                confirmButtonText={deleting ? <><Spinner size="sm" className="me-1" /> Đang xóa...</> : 'Xóa'}
                confirmButtonVariant="danger"
                confirmDisabled={deleting}
            />
        </Container>
    );
}

export default ColorListPage;
