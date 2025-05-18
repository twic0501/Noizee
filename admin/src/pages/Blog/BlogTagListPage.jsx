// admin-frontend/src/pages/Blog/BlogTagListPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Container, Row, Col, Button, Modal, Spinner, Breadcrumb } from 'react-bootstrap';
import BlogTagTable from '../../components/blog/BlogTagTable';
import BlogTagForm from '../../components/blog/BlogTagForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import ModalConfirm from '../../components/common/ModalConfirm';
import { ADMIN_GET_ALL_BLOG_TAGS_QUERY } from '../../api/queries/blogTagQueries';
import { ADMIN_CREATE_BLOG_TAG_MUTATION, ADMIN_UPDATE_BLOG_TAG_MUTATION, ADMIN_DELETE_BLOG_TAG_MUTATION } from '../../api/mutations/blogTagMutations';
import logger from '../../utils/logger';
import { ADMIN_LANGUAGE_KEY } from '../../utils/constants';

function BlogTagListPage() {
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentTag, setCurrentTag] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });
    const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';

    const { loading: queryLoading, error: queryError, data, refetch } = useQuery(ADMIN_GET_ALL_BLOG_TAGS_QUERY, {
        variables: { lang: currentAdminLang },
        fetchPolicy: 'cache-and-network',
        onError: (err) => {
            logger.error("Error fetching blog tags:", err);
            setActionFeedback({ type: 'danger', message: err.message || "Không thể tải danh sách thẻ." });
        }
    });

    const handleMutationError = useCallback((err, actionName, specificMessage = null) => {
        logger.error(`Error ${actionName} blog tag:`, err);
        const message = specificMessage || err.graphQLErrors?.[0]?.message || err.message || `Thao tác ${actionName} thất bại.`;
        setActionFeedback({ type: 'danger', message });
    }, []);

    useEffect(() => {
        if (actionFeedback.message) {
            const timer = setTimeout(() => setActionFeedback({ type: '', message: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [actionFeedback]);

    const [createBlogTag, { loading: creating }] = useMutation(ADMIN_CREATE_BLOG_TAG_MUTATION, {
        onCompleted: (mutationData) => {
            const newName = (currentAdminLang === 'en' && mutationData.adminCreateBlogTag.name_en) ? mutationData.adminCreateBlogTag.name_en : mutationData.adminCreateBlogTag.name_vi;
            setActionFeedback({ type: 'success', message: `Thẻ "${newName}" đã được tạo!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'tạo thẻ'),
        refetchQueries: [{ query: ADMIN_GET_ALL_BLOG_TAGS_QUERY, variables: { lang: currentAdminLang } }],
    });

    const [updateBlogTag, { loading: updating }] = useMutation(ADMIN_UPDATE_BLOG_TAG_MUTATION, {
        onCompleted: (mutationData) => {
            const updatedName = (currentAdminLang === 'en' && mutationData.adminUpdateBlogTag.name_en) ? mutationData.adminUpdateBlogTag.name_en : mutationData.adminUpdateBlogTag.name_vi;
            setActionFeedback({ type: 'success', message: `Thẻ "${updatedName}" đã được cập nhật!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'cập nhật thẻ')
    });

    const [deleteBlogTag, { loading: deleting }] = useMutation(ADMIN_DELETE_BLOG_TAG_MUTATION, {
        onCompleted: () => {
            const deletedName = (currentAdminLang === 'en' && itemToDelete?.name_en) ? itemToDelete.name_en : itemToDelete?.name_vi;
            setActionFeedback({ type: 'success', message: `Thẻ "${deletedName}" đã được xóa!` });
            setItemToDelete(null);
            refetch();
        },
        onError: (err) => {
            handleMutationError(err, 'xóa thẻ', `Không thể xóa thẻ.`);
            setItemToDelete(null);
        }
    });

    const handleModalClose = (shouldRefetch = false) => {
        setShowFormModal(false);
        setCurrentTag(null);
        setIsEditMode(false);
        if (shouldRefetch) refetch();
    };

    const handleShowCreateModal = () => {
        setIsEditMode(false);
        setCurrentTag(null);
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    };

    const handleShowEditModal = (tag) => {
        setIsEditMode(true);
        setCurrentTag(tag);
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    };

    const handleFormSubmit = async (formDataFromComponent) => {
        setActionFeedback({ type: '', message: '' });
        const input = { // Chuẩn bị input cho GraphQL mutation
            name_vi: formDataFromComponent.name_vi,
            name_en: formDataFromComponent.name_en || null,
            slug: formDataFromComponent.slug,
        };

        if (isEditMode && currentTag) {
            await updateBlogTag({ variables: { id: currentTag.tag_id, input } });
        } else {
            await createBlogTag({ variables: { input } });
        }
    };

    const handleDeleteRequest = (tag) => {
        setItemToDelete(tag);
        setActionFeedback({ type: '', message: '' });
        setShowDeleteModal(true);
    };

    const confirmDeleteHandler = () => {
        if (itemToDelete) {
            deleteBlogTag({ variables: { id: itemToDelete.tag_id } });
        }
        setShowDeleteModal(false);
    };

    const tags = data?.adminGetAllBlogTags || [];

    return (
        <Container fluid className="p-md-4 p-3">
            <Breadcrumb className="mb-3">
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item href="/blog/posts">Blog</Breadcrumb.Item>
                <Breadcrumb.Item active>Thẻ</Breadcrumb.Item>
            </Breadcrumb>
            <Row className="align-items-center mb-3">
                <Col><h1 className="h3 mb-0 text-dark-blue">Quản lý Thẻ Blog</h1></Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={handleShowCreateModal} className="shadow-sm">
                        <i className="bi bi-plus-lg me-1"></i> Thêm Thẻ mới
                    </Button>
                </Col>
            </Row>

            {actionFeedback.message && <AlertMessage variant={actionFeedback.type} dismissible onClose={() => setActionFeedback({type:'', message:''})}>{actionFeedback.message}</AlertMessage>}

            {queryLoading && <LoadingSpinner message="Đang tải danh sách thẻ..." />}
            {queryError && !data && <AlertMessage variant="danger">Lỗi tải dữ liệu: {queryError.message}</AlertMessage>}
            
            {!queryLoading && !queryError && tags.length === 0 && (
                 <AlertMessage variant="info" className="mt-3 text-center">Không có thẻ nào. Nhấn "Thêm Thẻ mới" để tạo.</AlertMessage>
            )}

            {!queryLoading && tags.length > 0 && (
                <BlogTagTable
                    tags={tags}
                    onEdit={handleShowEditModal}
                    onDelete={handleDeleteRequest}
                    isLoading={queryLoading}
                />
            )}

            {showFormModal && (
                <Modal show={showFormModal} onHide={() => handleModalClose(false)} centered backdrop="static">
                     <BlogTagForm
                        initialData={currentTag}
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
                title="Xác nhận Xóa Thẻ Blog"
                body={`Bạn có chắc chắn muốn xóa thẻ "${
                     (currentAdminLang === 'en' && itemToDelete?.name_en ? itemToDelete.name_en : itemToDelete?.name_vi) || ''
                }"?`}
                confirmButtonText={deleting ? <><Spinner size="sm" className="me-1" /> Đang xóa...</> : 'Xóa'}
                confirmButtonVariant="danger"
                confirmDisabled={deleting}
            />
        </Container>
    );
}

export default BlogTagListPage;
