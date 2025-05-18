// admin-frontend/src/pages/Categories/CategoryListPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Container, Row, Col, Button, Modal, Spinner, Breadcrumb } from 'react-bootstrap'; // Thêm Breadcrumb
import CategoryTable from '../../components/categorise/CategoryTable'; // Sử dụng component table đã cập nhật
import CategoryForm from '../../components/categorise/CategoryForm';   // Sử dụng component form mới
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import ModalConfirm from '../../components/common/ModalConfirm';
import { ADMIN_GET_ALL_CATEGORIES_QUERY } from '../../api/queries/categoryQueries';
import { ADMIN_CREATE_CATEGORY_MUTATION, ADMIN_UPDATE_CATEGORY_MUTATION, ADMIN_DELETE_CATEGORY_MUTATION } from '../../api/mutations/categoryMutations';
import logger from '../../utils/logger';
import { ADMIN_LANGUAGE_KEY } from '../../utils/constants';

function CategoryListPage() {
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });
    const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';

    const { loading: queryLoading, error: queryError, data, refetch } = useQuery(ADMIN_GET_ALL_CATEGORIES_QUERY, {
        variables: { lang: currentAdminLang }, // Truyền lang
        fetchPolicy: 'cache-and-network',
        onError: (err) => {
            logger.error("Error fetching categories:", err);
            setActionFeedback({ type: 'danger', message: err.message || "Không thể tải danh mục." });
        }
    });

    const handleMutationError = useCallback((err, actionName, specificMessage = null) => {
        logger.error(`Error ${actionName} category:`, err);
        const message = specificMessage || err.graphQLErrors?.[0]?.message || err.message || `Thao tác ${actionName} thất bại.`;
        setActionFeedback({ type: 'danger', message });
    }, []);

    useEffect(() => {
        if (actionFeedback.message) {
            const timer = setTimeout(() => setActionFeedback({ type: '', message: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [actionFeedback]);

    const [createCategory, { loading: creating }] = useMutation(ADMIN_CREATE_CATEGORY_MUTATION, {
        onCompleted: (mutationData) => {
            const newName = (currentAdminLang === 'en' && mutationData.adminCreateCategory.name_en) ? mutationData.adminCreateCategory.name_en : mutationData.adminCreateCategory.category_name_vi;
            setActionFeedback({ type: 'success', message: `Danh mục "${newName}" đã được tạo!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'tạo danh mục'),
        refetchQueries: [{ query: ADMIN_GET_ALL_CATEGORIES_QUERY, variables: { lang: currentAdminLang } }],
    });

    const [updateCategory, { loading: updating }] = useMutation(ADMIN_UPDATE_CATEGORY_MUTATION, {
        onCompleted: (mutationData) => {
            const updatedName = (currentAdminLang === 'en' && mutationData.adminUpdateCategory.name_en) ? mutationData.adminUpdateCategory.name_en : mutationData.adminUpdateCategory.category_name_vi;
            setActionFeedback({ type: 'success', message: `Danh mục "${updatedName}" đã được cập nhật!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'cập nhật danh mục')
    });

    const [deleteCategory, { loading: deleting }] = useMutation(ADMIN_DELETE_CATEGORY_MUTATION, {
        onCompleted: () => {
            const deletedName = (currentAdminLang === 'en' && itemToDelete?.name_en) ? itemToDelete.name_en : itemToDelete?.category_name_vi;
            setActionFeedback({ type: 'success', message: `Danh mục "${deletedName}" đã được xóa!` });
            setItemToDelete(null);
            refetch();
        },
        onError: (err) => {
            handleMutationError(err, 'xóa danh mục', `Không thể xóa danh mục. Danh mục có thể đang được sử dụng.`);
            setItemToDelete(null);
        }
    });

    const handleModalClose = (shouldRefetch = false) => {
        setShowFormModal(false);
        setCurrentCategory(null);
        setIsEditMode(false);
        if (shouldRefetch) refetch();
    };

    const handleShowCreateModal = () => {
        setIsEditMode(false);
        setCurrentCategory(null); // Đảm bảo không có initialData cho CategoryForm
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    };

    const handleShowEditModal = (category) => {
        setIsEditMode(true);
        setCurrentCategory(category); // Truyền initialData cho CategoryForm
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    };

    const handleFormSubmit = async (formDataFromComponent) => {
        setActionFeedback({ type: '', message: '' });
        const input = { // Chuẩn bị input cho GraphQL mutation
            category_name_vi: formDataFromComponent.category_name_vi,
            category_name_en: formDataFromComponent.category_name_en || null, // Gửi null nếu rỗng
        };

        if (isEditMode && currentCategory) {
            await updateCategory({ variables: { id: currentCategory.category_id, input } });
        } else {
            await createCategory({ variables: { input } });
        }
    };

    const handleDeleteRequest = (category) => {
        setItemToDelete(category);
        setActionFeedback({ type: '', message: '' });
        setShowDeleteModal(true);
    };

    const confirmDeleteHandler = () => {
        if (itemToDelete) {
            deleteCategory({ variables: { id: itemToDelete.category_id } });
        }
        setShowDeleteModal(false);
    };

    const categories = data?.adminGetAllCategories || [];

    return (
        <Container fluid className="p-md-4 p-3">
            <Breadcrumb className="mb-3">
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item href="/products">Sản phẩm</Breadcrumb.Item>
                <Breadcrumb.Item active>Danh mục</Breadcrumb.Item>
            </Breadcrumb>
            <Row className="align-items-center mb-3">
                <Col><h1 className="h3 mb-0 text-dark-blue">Quản lý Danh mục</h1></Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={handleShowCreateModal} className="shadow-sm">
                        <i className="bi bi-plus-lg me-1"></i> Thêm Danh mục
                    </Button>
                </Col>
            </Row>

            {actionFeedback.message && <AlertMessage variant={actionFeedback.type} dismissible onClose={() => setActionFeedback({type:'', message:''})}>{actionFeedback.message}</AlertMessage>}

            {queryLoading && <LoadingSpinner message="Đang tải danh mục..." />}
            {queryError && !data && <AlertMessage variant="danger">Lỗi tải dữ liệu: {queryError.message}</AlertMessage>}
            
            {!queryLoading && !queryError && categories.length === 0 && (
                 <AlertMessage variant="info" className="mt-3 text-center">Không có danh mục nào. Nhấn "Thêm Danh mục" để tạo mới.</AlertMessage>
            )}

            {!queryLoading && categories.length > 0 && (
                <CategoryTable
                    categories={categories}
                    onEdit={handleShowEditModal}
                    onDelete={handleDeleteRequest}
                />
            )}

            {showFormModal && ( // Render CategoryForm trong Modal
                <Modal show={showFormModal} onHide={() => handleModalClose(false)} centered backdrop="static">
                    <CategoryForm
                        initialData={currentCategory}
                        onSubmit={handleFormSubmit}
                        loading={creating || updating}
                        error={actionFeedback.type === 'danger' ? {message: actionFeedback.message} : null} // Chỉ truyền lỗi nếu là lỗi form
                        isEditMode={isEditMode}
                        onCancel={() => handleModalClose(false)}
                    />
                </Modal>
            )}

            <ModalConfirm
                show={showDeleteModal}
                handleClose={() => {setShowDeleteModal(false); setItemToDelete(null);}}
                handleConfirm={confirmDeleteHandler}
                title="Xác nhận Xóa Danh mục"
                body={`Bạn có chắc chắn muốn xóa danh mục "${
                    (currentAdminLang === 'en' && itemToDelete?.name_en ? itemToDelete.name_en : itemToDelete?.category_name_vi) || ''
                }"? Các sản phẩm thuộc danh mục này sẽ không bị xóa nhưng sẽ không còn thuộc danh mục này nữa.`}
                confirmButtonText={deleting ? <><Spinner size="sm" className="me-1" /> Đang xóa...</> : 'Xóa'}
                confirmButtonVariant="danger"
                confirmDisabled={deleting}
            />
        </Container>
    );
}

export default CategoryListPage;
