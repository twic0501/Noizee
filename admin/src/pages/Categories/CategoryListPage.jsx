// src/pages/Categories/CategoryListPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Container, Row, Col, Button, Modal, Form, Spinner } from 'react-bootstrap';
import CategoryTable from '../../components/categorise/CategoryTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import ModalConfirm from '../../components/common/ModalConfirm';
import Pagination from '../../components/common/Pagination'; // Nếu có phân trang cho Categories
import useDataTable from '../../hooks/useDataTable'; // Nếu có phân trang/filter
import { GET_ALL_CATEGORIES_QUERY } from '../../api/queries/categoryQueries';
import { ADMIN_CREATE_CATEGORY_MUTATION, ADMIN_UPDATE_CATEGORY_MUTATION, ADMIN_DELETE_CATEGORY_MUTATION } from '../../api/mutations/categoryMutations';
import logger from '../../utils/logger';

const DEFAULT_CATEGORY_LIMIT = 15; // Ví dụ nếu có phân trang

function CategoryListPage() {
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null); // { category_id, category_name }
    const [categoryNameInput, setCategoryNameInput] = useState(''); // State riêng cho input trong modal

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // { category_id, category_name }

    const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' }); // Gộp error và success

    // Giả sử categories không có phân trang phức tạp, nếu có thì dùng useDataTable
    const { loading, error: queryError, data, refetch } = useQuery(GET_ALL_CATEGORIES_QUERY, {
        fetchPolicy: 'cache-and-network',
        onError: (err) => {
            logger.error("Error fetching categories:", err);
            setActionFeedback({ type: 'danger', message: err.message || "Failed to load categories." });
        }
    });

    const [createCategory, { loading: creating }] = useMutation(ADMIN_CREATE_CATEGORY_MUTATION, {
        onCompleted: (data) => {
            setActionFeedback({ type: 'success', message: `Category "${data.adminCreateCategory.category_name}" created successfully!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'create category')
    });

    const [updateCategory, { loading: updating }] = useMutation(ADMIN_UPDATE_CATEGORY_MUTATION, {
        onCompleted: (data) => {
            setActionFeedback({ type: 'success', message: `Category "${data.adminUpdateCategory.category_name}" updated successfully!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'update category')
    });

    const [deleteCategory, { loading: deleting }] = useMutation(ADMIN_DELETE_CATEGORY_MUTATION, {
        onCompleted: () => {
            setActionFeedback({ type: 'success', message: `Category "${itemToDelete?.category_name}" deleted successfully!` });
            setItemToDelete(null);
            refetch();
        },
        onError: (err) => handleMutationError(err, 'delete category', `Failed to delete category. It might be in use by products.`)
    });

    const handleMutationError = (err, actionName, specificMessage = null) => {
        logger.error(`Error ${actionName}:`, err);
        const message = specificMessage || err.graphQLErrors?.[0]?.message || err.message || `Failed to ${actionName}.`;
        if (showFormModal) { // Nếu lỗi xảy ra trong form modal
            setCategoryNameInput(prev => prev); // Giữ lại input để user sửa
             setActionFeedback({ type: 'danger', message: `Form error: ${message}` }); // Hiển thị lỗi trong modal nếu có chỗ
        } else { // Lỗi cho các action khác (delete)
             setActionFeedback({ type: 'danger', message });
        }

    };
    useEffect(() => { // Tự xóa feedback sau 5s
        if (actionFeedback.message) {
            const timer = setTimeout(() => setActionFeedback({ type: '', message: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [actionFeedback]);


    const handleModalClose = (shouldRefetch = false) => {
        setShowFormModal(false);
        setCurrentCategory(null);
        setIsEditMode(false);
        setCategoryNameInput(''); // Reset input
        if (shouldRefetch) refetch();
    };

    const handleShowCreateModal = () => {
        setIsEditMode(false);
        setCurrentCategory(null);
        setCategoryNameInput('');
        setActionFeedback({ type: '', message: '' }); // Clear old feedback
        setShowFormModal(true);
    };

    const handleShowEditModal = (category) => {
        setIsEditMode(true);
        setCurrentCategory(category);
        setCategoryNameInput(category.category_name);
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    };

    const handleFormSubmit = (event) => {
        event.preventDefault();
        setActionFeedback({ type: '', message: '' }); // Clear old feedback from form
        const name = categoryNameInput.trim();
        if (!name) {
            // Hiển thị lỗi trực tiếp trong form modal nếu có chỗ, hoặc dùng setActionFeedback
            alert("Category name is required."); // Hoặc setFormError state riêng cho modal
            return;
        }
        if (isEditMode && currentCategory) {
            if (name === currentCategory.category_name) { // Không có gì thay đổi
                handleModalClose(); return;
            }
            updateCategory({ variables: { id: currentCategory.category_id, name } });
        } else {
            createCategory({ variables: { name } });
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

    const categories = data?.categories || data?.adminGetAllCategories || [];

    return (
        <Container fluid className="p-3">
            <Row className="align-items-center mb-3">
                <Col><h1 className="h3 mb-0">Manage Categories</h1></Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={handleShowCreateModal}>
                        <i className="bi bi-plus-lg me-1"></i> Add New Category
                    </Button>
                </Col>
            </Row>

            {actionFeedback.message && <AlertMessage variant={actionFeedback.type} dismissible onClose={() => setActionFeedback({ type: '', message: ''})}>{actionFeedback.message}</AlertMessage>}

            {loading && <LoadingSpinner message="Loading categories..." />}
            {queryError && !data && <AlertMessage variant="danger">Initial load failed: {queryError.message}</AlertMessage>}
            {/* Check for !data to ensure this only shows on initial hard error */}

            {!loading && !queryError && categories.length === 0 && (
                 <AlertMessage variant="info">No categories found. Click 'Add New Category' to create one.</AlertMessage>
            )}

            {!loading && categories.length > 0 && (
                <CategoryTable
                    categories={categories}
                    onEdit={handleShowEditModal}
                    onDelete={handleDeleteRequest}
                />
            )}
            {/* TODO: Add Pagination if categories list can be long */}

            <Modal show={showFormModal} onHide={() => handleModalClose(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? 'Edit Category' : 'Add New Category'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleFormSubmit}>
                    <Modal.Body>
                        {/* Hiển thị lỗi của form modal ở đây nếu muốn */}
                        <Form.Group className="mb-3" controlId="formCategoryName">
                            <Form.Label>Category Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="category_name"
                                value={categoryNameInput}
                                onChange={(e) => setCategoryNameInput(e.target.value)}
                                required
                                disabled={creating || updating}
                                autoFocus
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => handleModalClose(false)} disabled={creating || updating}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={creating || updating || !categoryNameInput.trim()}>
                            {(creating || updating) ? <Spinner size="sm" animation="border" className="me-1" /> : ''}
                            {isEditMode ? 'Update Category' : 'Create Category'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <ModalConfirm
                show={showDeleteModal}
                handleClose={() => {setShowDeleteModal(false); setItemToDelete(null);}}
                handleConfirm={confirmDeleteHandler}
                title="Confirm Category Deletion"
                body={`Are you sure you want to delete category "${itemToDelete?.category_name || ''}"? Products using this category might be affected.`}
                confirmButtonText={deleting ? 'Deleting...' : 'Delete'}
                confirmButtonVariant="danger"
                confirmDisabled={deleting}
            />
        </Container>
    );
}

export default CategoryListPage;