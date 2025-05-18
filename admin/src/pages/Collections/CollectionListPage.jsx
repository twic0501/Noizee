// admin-frontend/src/pages/Collections/CollectionListPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Container, Row, Col, Button, Modal, Spinner, Breadcrumb } from 'react-bootstrap';
import CollectionTable from '../../components/collections/CollectionTable';
import CollectionForm from '../../components/collections/CollectionForm'; // Component form mới
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import ModalConfirm from '../../components/common/ModalConfirm';
import { ADMIN_GET_ALL_COLLECTIONS_QUERY } from '../../api/queries/collectionQueries';
import { ADMIN_CREATE_COLLECTION_MUTATION, ADMIN_UPDATE_COLLECTION_MUTATION, ADMIN_DELETE_COLLECTION_MUTATION } from '../../api/mutations/collectionMutations';
import logger from '../../utils/logger';
import { ADMIN_LANGUAGE_KEY } from '../../utils/constants';

function CollectionListPage() {
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCollection, setCurrentCollection] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });
    const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';

    const { loading: queryLoading, error: queryError, data, refetch } = useQuery(ADMIN_GET_ALL_COLLECTIONS_QUERY, {
        variables: { lang: currentAdminLang },
        fetchPolicy: 'cache-and-network',
        onError: (err) => {
            logger.error("Error fetching collections (full error object):", err); // Ghi lại toàn bộ đối tượng lỗi
    if (err.graphQLErrors) {
        err.graphQLErrors.forEach(graphQLError => {
            logger.error("GraphQL Error:", graphQLError.message, "Path:", graphQLError.path, "Extensions:", graphQLError.extensions);
        });
    }
    if (err.networkError) {
        logger.error("Network Error:", err.networkError.message, "Result:", err.networkError.result);
    }
    const displayMessage = err.graphQLErrors?.[0]?.message || err.networkError?.message || err.message || "Không thể tải bộ sưu tập.";
    setActionFeedback({ type: 'danger', message: displayMessage });
        }
    });

    const handleMutationError = useCallback((err, actionName, specificMessage = null) => {
        logger.error(`Error ${actionName} collection:`, err);
        const message = specificMessage || err.graphQLErrors?.[0]?.message || err.message || `Thao tác ${actionName} thất bại.`;
        setActionFeedback({ type: 'danger', message });
    }, []);

    useEffect(() => {
        if (actionFeedback.message) {
            const timer = setTimeout(() => setActionFeedback({ type: '', message: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [actionFeedback]);

    const [createCollection, { loading: creating }] = useMutation(ADMIN_CREATE_COLLECTION_MUTATION, {
        onCompleted: (mutationData) => {
            const newName = (currentAdminLang === 'en' && mutationData.adminCreateCollection.name_en) ? mutationData.adminCreateCollection.name_en : mutationData.adminCreateCollection.collection_name_vi;
            setActionFeedback({ type: 'success', message: `Bộ sưu tập "${newName}" đã được tạo!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'tạo bộ sưu tập'),
        refetchQueries: [{ query: ADMIN_GET_ALL_COLLECTIONS_QUERY, variables: { lang: currentAdminLang } }],
    });

    const [updateCollection, { loading: updating }] = useMutation(ADMIN_UPDATE_COLLECTION_MUTATION, {
        onCompleted: (mutationData) => {
            const updatedName = (currentAdminLang === 'en' && mutationData.adminUpdateCollection.name_en) ? mutationData.adminUpdateCollection.name_en : mutationData.adminUpdateCollection.collection_name_vi;
            setActionFeedback({ type: 'success', message: `Bộ sưu tập "${updatedName}" đã được cập nhật!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'cập nhật bộ sưu tập')
    });

    const [deleteCollection, { loading: deleting }] = useMutation(ADMIN_DELETE_COLLECTION_MUTATION, {
        onCompleted: () => {
            const deletedName = (currentAdminLang === 'en' && itemToDelete?.name_en) ? itemToDelete.name_en : itemToDelete?.collection_name_vi;
            setActionFeedback({ type: 'success', message: `Bộ sưu tập "${deletedName}" đã được xóa!` });
            setItemToDelete(null);
            refetch();
        },
        onError: (err) => {
            handleMutationError(err, 'xóa bộ sưu tập', `Không thể xóa bộ sưu tập.`);
            setItemToDelete(null);
        }
    });

    const handleModalClose = (shouldRefetch = false) => {
        setShowFormModal(false);
        setCurrentCollection(null);
        setIsEditMode(false);
        if (shouldRefetch) refetch();
    };

    const handleShowCreateModal = () => {
        setIsEditMode(false);
        setCurrentCollection(null);
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    };

    const handleShowEditModal = (collection) => {
        setIsEditMode(true);
        setCurrentCollection(collection);
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    };

    const handleFormSubmit = async (formDataFromComponent) => {
        setActionFeedback({ type: '', message: '' });
        // Input đã được chuẩn bị bởi CollectionForm
        const input = {
            collection_name_vi: formDataFromComponent.collection_name_vi,
            collection_name_en: formDataFromComponent.collection_name_en || null,
            collection_description_vi: formDataFromComponent.collection_description_vi || null,
            collection_description_en: formDataFromComponent.collection_description_en || null,
            slug: formDataFromComponent.slug,
        };

        if (isEditMode && currentCollection) {
            await updateCollection({ variables: { id: currentCollection.collection_id, input } });
        } else {
            await createCollection({ variables: { input } });
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
        <Container fluid className="p-md-4 p-3">
            <Breadcrumb className="mb-3">
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item href="/products">Sản phẩm</Breadcrumb.Item>
                <Breadcrumb.Item active>Bộ sưu tập</Breadcrumb.Item>
            </Breadcrumb>
            <Row className="align-items-center mb-3">
                <Col><h1 className="h3 mb-0 text-dark-blue">Quản lý Bộ sưu tập</h1></Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={handleShowCreateModal} className="shadow-sm">
                        <i className="bi bi-plus-lg me-1"></i> Thêm Bộ sưu tập
                    </Button>
                </Col>
            </Row>

            {actionFeedback.message && <AlertMessage variant={actionFeedback.type} dismissible onClose={() => setActionFeedback({type:'', message:''})}>{actionFeedback.message}</AlertMessage>}

            {queryLoading && <LoadingSpinner message="Đang tải bộ sưu tập..." />}
            {queryError && !data && <AlertMessage variant="danger">Lỗi tải dữ liệu: {queryError.message}</AlertMessage>}
            
            {!queryLoading && !queryError && collections.length === 0 && (
                 <AlertMessage variant="info" className="mt-3 text-center">Không có bộ sưu tập nào. Nhấn "Thêm Bộ sưu tập" để tạo mới.</AlertMessage>
            )}

            {!queryLoading && collections.length > 0 && (
                <CollectionTable
                    collections={collections}
                    onEdit={handleShowEditModal}
                    onDelete={handleDeleteRequest}
                />
            )}

            {showFormModal && (
                <Modal show={showFormModal} onHide={() => handleModalClose(false)} centered size="lg" backdrop="static">
                     <CollectionForm
                        initialData={currentCollection}
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
                title="Xác nhận Xóa Bộ sưu tập"
                body={`Bạn có chắc chắn muốn xóa bộ sưu tập "${
                     (currentAdminLang === 'en' && itemToDelete?.name_en ? itemToDelete.name_en : itemToDelete?.collection_name_vi) || ''
                }"?`}
                confirmButtonText={deleting ? <><Spinner size="sm" className="me-1" /> Đang xóa...</> : 'Xóa'}
                confirmButtonVariant="danger"
                confirmDisabled={deleting}
            />
        </Container>
    );
}

export default CollectionListPage;
