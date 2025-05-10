// src/pages/Sizes/SizeListPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Container, Row, Col, Button, Modal, Form, Spinner } from 'react-bootstrap';
import SizeTable from '../../components/sizes/SizeTable'; // Component bảng Size
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import ModalConfirm from '../../components/common/ModalConfirm';
// Giả sử có GET_ALL_SIZES_QUERY trong sizeQueries.js
import { GET_ALL_SIZES_QUERY } from '../../api/queries/sizeQueries';
import {
    ADMIN_CREATE_SIZE_MUTATION,
    ADMIN_UPDATE_SIZE_MUTATION,
    ADMIN_DELETE_SIZE_MUTATION
} from '../../api/mutations/sizeMutations';
import logger from '../../utils/logger';

function SizeListPage() {
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentSize, setCurrentSize] = useState(null); // { size_id, size_name }
    const [sizeNameInput, setSizeNameInput] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // { size_id, size_name }

    const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });

    const { loading: queryLoading, error: queryError, data, refetch } = useQuery(GET_ALL_SIZES_QUERY, {
        fetchPolicy: 'cache-and-network',
        onError: (err) => {
            logger.error("Error fetching sizes:", err);
            setActionFeedback({ type: 'danger', message: err.message || "Failed to load sizes." });
        }
    });

    const handleMutationError = (err, actionName, specificMessage = null) => {
        logger.error(`Error ${actionName} size:`, err);
        const message = specificMessage || err.graphQLErrors?.[0]?.message || err.message || `Failed to ${actionName} size.`;
        setActionFeedback({ type: 'danger', message });
    };
     useEffect(() => {
        if (actionFeedback.message) {
            const timer = setTimeout(() => setActionFeedback({ type: '', message: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [actionFeedback]);


    const [createSize, { loading: creating }] = useMutation(ADMIN_CREATE_SIZE_MUTATION, {
        onCompleted: (data) => {
            setActionFeedback({ type: 'success', message: `Size "${data.adminCreateSize.size_name}" created!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'create')
    });

    const [updateSize, { loading: updating }] = useMutation(ADMIN_UPDATE_SIZE_MUTATION, {
        onCompleted: (data) => {
            setActionFeedback({ type: 'success', message: `Size "${data.adminUpdateSize.size_name}" updated!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'update')
    });

    const [deleteSize, { loading: deleting }] = useMutation(ADMIN_DELETE_SIZE_MUTATION, {
        onCompleted: () => {
            setActionFeedback({ type: 'success', message: `Size "${itemToDelete?.size_name}" deleted!` });
            setItemToDelete(null);
            refetch();
        },
        onError: (err) => handleMutationError(err, 'delete', `Failed to delete size. It might be in use by products or inventory.`)
    });

    const handleModalClose = (shouldRefetch = false) => {
        setShowFormModal(false);
        setCurrentSize(null);
        setIsEditMode(false);
        setSizeNameInput('');
        if (shouldRefetch) refetch();
    };

    const handleShowCreateModal = () => {
        setIsEditMode(false);
        setCurrentSize(null);
        setSizeNameInput('');
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    };

    const handleShowEditModal = (size) => {
        setIsEditMode(true);
        setCurrentSize(size);
        setSizeNameInput(size.size_name);
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    };

    const handleFormSubmit = (event) => {
        event.preventDefault();
        setActionFeedback({ type: '', message: '' });
        const name = sizeNameInput.trim();
        if (!name) {
            alert("Size name is required.");
            return;
        }
        if (isEditMode && currentSize) {
            if (name === currentSize.size_name) { handleModalClose(); return; }
            updateSize({ variables: { id: currentSize.size_id, name } });
        } else {
            createSize({ variables: { name } });
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

    const sizes = data?.sizes || data?.adminGetAllSizes || []; // Điều chỉnh tùy theo tên field trong query

    return (
        <Container fluid className="p-3">
            <Row className="align-items-center mb-3">
                <Col><h1 className="h3 mb-0">Manage Sizes</h1></Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={handleShowCreateModal}>
                        <i className="bi bi-plus-lg me-1"></i> Add New Size
                    </Button>
                </Col>
            </Row>

            {actionFeedback.message && <AlertMessage variant={actionFeedback.type} dismissible onClose={() => setActionFeedback({type:'', message:''})}>{actionFeedback.message}</AlertMessage>}


            {queryLoading && <LoadingSpinner message="Loading sizes..." />}
            {queryError && !data && <AlertMessage variant="danger">Initial load failed: {queryError.message}</AlertMessage>}

             {!queryLoading && !queryError && sizes.length === 0 && (
                 <AlertMessage variant="info">No sizes found. Click 'Add New Size' to create one.</AlertMessage>
            )}

            {!queryLoading && sizes.length > 0 && (
                <SizeTable
                    sizes={sizes}
                    onEdit={handleShowEditModal}
                    onDelete={handleDeleteRequest}
                />
            )}
            {/* TODO: Add Pagination if size list can be long */}

            <Modal show={showFormModal} onHide={() => handleModalClose(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? 'Edit Size' : 'Add New Size'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleFormSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3" controlId="formSizeNameModal">
                            <Form.Label>Size Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="size_name"
                                value={sizeNameInput}
                                onChange={(e) => setSizeNameInput(e.target.value)}
                                required
                                disabled={creating || updating}
                                autoFocus
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => handleModalClose(false)} disabled={creating || updating}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={creating || updating || !sizeNameInput.trim()}>
                            {(creating || updating) ? <Spinner size="sm" animation="border" className="me-1" /> : ''}
                            {isEditMode ? 'Update Size' : 'Create Size'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <ModalConfirm
                show={showDeleteModal}
                handleClose={() => {setShowDeleteModal(false); setItemToDelete(null);}}
                handleConfirm={confirmDeleteHandler}
                title="Confirm Size Deletion"
                body={`Are you sure you want to delete size "${itemToDelete?.size_name || ''}"? This may affect products and inventory variants using this size.`}
                confirmButtonText={deleting ? 'Deleting...' : 'Delete'}
                confirmButtonVariant="danger"
                confirmDisabled={deleting}
            />
        </Container>
    );
}

export default SizeListPage;