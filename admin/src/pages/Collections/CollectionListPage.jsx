// src/pages/Collections/CollectionListPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client'; // Import gql
import { Container, Row, Col, Button, Modal, Form, Spinner } from 'react-bootstrap';
import CollectionTable from '../../components/collections/CollectionTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import ModalConfirm from '../../components/common/ModalConfirm';
import {
    ADMIN_CREATE_COLLECTION_MUTATION,
    ADMIN_UPDATE_COLLECTION_MUTATION,
    ADMIN_DELETE_COLLECTION_MUTATION
} from '../../api/mutations/collectionMutations'; // Import mutations
import { ADMIN_GET_ALL_COLLECTIONS_QUERY } from '../../api/queries/collectionQueries'; // Import query
// Hoặc nếu bạn định nghĩa trực tiếp:
// const ADMIN_GET_ALL_COLLECTIONS_QUERY = gql` query AdminGetAllCollections { adminGetAllCollections { collection_id collection_name collection_description slug } } `;
import logger from '../../utils/logger';


function CollectionListPage() {
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCollection, setCurrentCollection] = useState(null); // To store { name, description, slug }
    const [formData, setFormData] = useState({ collection_name: '', collection_description: '', slug: '' });


    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // To store { collection_id, collection_name }

    const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });


    const { loading: queryLoading, error: queryError, data, refetch } = useQuery(ADMIN_GET_ALL_COLLECTIONS_QUERY, {
        fetchPolicy: 'cache-and-network',
        onError: (err) => {
            logger.error("Error fetching collections:", err);
            setActionFeedback({ type: 'danger', message: err.message || "Failed to load collections." });
        }
    });

    const handleMutationError = (err, actionName) => {
        logger.error(`Error ${actionName} collection:`, err);
        const message = err.graphQLErrors?.[0]?.message || err.message || `Failed to ${actionName} collection.`;
        setActionFeedback({ type: 'danger', message });
    };


    const [createCollection, { loading: creating }] = useMutation(ADMIN_CREATE_COLLECTION_MUTATION, {
        onCompleted: (data) => {
            setActionFeedback({ type: 'success', message: `Collection "${data.adminCreateCollection.collection_name}" created!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'create'),
        // refetchQueries: [{ query: ADMIN_GET_ALL_COLLECTIONS_QUERY }] // Hoặc dùng refetch()
    });

    const [updateCollection, { loading: updating }] = useMutation(ADMIN_UPDATE_COLLECTION_MUTATION, {
        onCompleted: (data) => {
            setActionFeedback({ type: 'success', message: `Collection "${data.adminUpdateCollection.collection_name}" updated!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'update')
    });

    const [deleteCollection, { loading: deleting }] = useMutation(ADMIN_DELETE_COLLECTION_MUTATION, {
        onCompleted: () => {
            setActionFeedback({ type: 'success', message: `Collection "${itemToDelete?.collection_name}" deleted!` });
            setItemToDelete(null);
            refetch();
        },
        onError: (err) => handleMutationError(err, 'delete')
    });


    const handleModalClose = (shouldRefetch = false) => {
        setShowFormModal(false);
        setCurrentCollection(null);
        setIsEditMode(false);
        setFormData({ collection_name: '', collection_description: '', slug: '' });
        if (shouldRefetch) refetch();
    };

    const handleShowCreateModal = () => {
        setIsEditMode(false);
        setCurrentCollection(null);
        setFormData({ collection_name: '', collection_description: '', slug: '' });
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    };

    const handleShowEditModal = (collection) => {
        setIsEditMode(true);
        setCurrentCollection(collection); // Chỉ lưu collection gốc để lấy ID
        setFormData({ // Cập nhật state form từ collection được chọn
            collection_name: collection.collection_name || '',
            collection_description: collection.collection_description || '',
            slug: collection.slug || ''
        });
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    };

    const handleFormInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = (event) => {
        event.preventDefault();
        setActionFeedback({ type: '', message: '' });

        const input = {
            collection_name: formData.collection_name.trim(),
            collection_description: formData.collection_description?.trim() || null,
            slug: formData.slug.trim()
        };

        if (!input.collection_name) {
            setActionFeedback({ type: 'danger', message: "Collection name is required." });
            return;
        }
        if (!input.slug) {
            // Tạo slug tự động từ tên nếu slug rỗng (ví dụ đơn giản)
            // Hoặc yêu cầu người dùng nhập slug
            // input.slug = input.collection_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            // if (!input.slug) { // Kiểm tra lại sau khi tự tạo
                 setActionFeedback({ type: 'danger', message: "Slug is required and cannot be empty."});
                 return;
            // }
        }


        if (isEditMode && currentCollection) {
            // Chỉ gửi những trường có thay đổi, hoặc backend tự xử lý
            // Nếu input type của mutation là AdminUpdateCollectionInput! thì phải gửi đủ
            // Nếu là AdminUpdateCollectionInput (không có !) thì có thể gửi một phần
            updateCollection({ variables: { id: currentCollection.collection_id, input } });
        } else {
            createCollection({ variables: { input } });
        }
    };

    const handleDeleteRequest = (collection) => {
        setItemToDelete(collection);
        setActionFeedback({ type: '', message: '' });
        setShowDeleteModal(true);
    };

    const confirmDeleteHandler = () => {
        if (itemToDelete) {
            deleteCollection({ variables: { id: itemToDelete.collection_id } });
        }
        setShowDeleteModal(false);
    };

    const collections = data?.adminGetAllCollections || [];

    return (
        <Container fluid className="p-3">
            <Row className="align-items-center mb-3">
                <Col><h1 className="h3 mb-0">Manage Collections</h1></Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={handleShowCreateModal}>
                        <i className="bi bi-plus-lg me-1"></i> Add New Collection
                    </Button>
                </Col>
            </Row>

            {actionFeedback.message && <AlertMessage variant={actionFeedback.type} dismissible onClose={() => setActionFeedback({type:'', message:''})}>{actionFeedback.message}</AlertMessage>}

            {queryLoading && <LoadingSpinner message="Loading collections..." />}
            {queryError && !data && <AlertMessage variant="danger">Initial load failed: {queryError.message}</AlertMessage>}

            {!queryLoading && !queryError && collections.length === 0 && (
                <AlertMessage variant="info">No collections found. Click 'Add New Collection' to create one.</AlertMessage>
            )}

            {!queryLoading && collections.length > 0 && (
                <CollectionTable
                    collections={collections}
                    onEdit={handleShowEditModal}
                    onDelete={handleDeleteRequest}
                />
            )}
            {/* TODO: Add Pagination if collection list can be long */}


            <Modal show={showFormModal} onHide={() => handleModalClose(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? 'Edit Collection' : 'Add New Collection'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleFormSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3" controlId="formCollectionName">
                            <Form.Label>Collection Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="text" name="collection_name" value={formData.collection_name} onChange={handleFormInputChange} required disabled={creating || updating} autoFocus />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formCollectionDesc">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" rows={3} name="collection_description" value={formData.collection_description} onChange={handleFormInputChange} disabled={creating || updating} />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formCollectionSlug">
                            <Form.Label>Slug (URL friendly) <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="text" name="slug" placeholder="e.g., summer-collection" value={formData.slug} onChange={handleFormInputChange} required disabled={creating || updating} />
                            <Form.Text muted>If left blank, it might be auto-generated (logic needs implementation).</Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => handleModalClose(false)} disabled={creating || updating}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={creating || updating || !formData.collection_name.trim() || !formData.slug.trim()}>
                            {(creating || updating) ? <Spinner size="sm" animation="border" className="me-1" /> : ''}
                            {isEditMode ? 'Update Collection' : 'Create Collection'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <ModalConfirm
                show={showDeleteModal}
                handleClose={() => {setShowDeleteModal(false); setItemToDelete(null);}}
                handleConfirm={confirmDeleteHandler}
                title="Confirm Collection Deletion"
                body={`Are you sure you want to delete collection "${itemToDelete?.collection_name || ''}"? Products in this collection will not be deleted but will lose this association.`}
                confirmButtonText={deleting ? 'Deleting...' : 'Delete'}
                confirmButtonVariant="danger"
                confirmDisabled={deleting}
            />
        </Container>
    );
}

export default CollectionListPage;