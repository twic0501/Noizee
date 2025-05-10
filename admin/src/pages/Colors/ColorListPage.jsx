// src/pages/Colors/ColorListPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client'; // gql đã được import trong các file api
import { Container, Row, Col, Button, Modal, Form, Spinner } from 'react-bootstrap';
import ColorTable from '../../components/colors/ColorTable';
import ModalConfirm from '../../components/common/ModalConfirm';
import  AlertMessage  from '../../components/common/AlertMessage'; // Từ thư viện của bạn
import  LoadingSpinner  from '../../components/common/LoadingSpinner';
import { ADMIN_GET_ALL_COLORS_QUERY } from '../../api/queries/colorQueries';
import {
    ADMIN_CREATE_COLOR_MUTATION,
    ADMIN_UPDATE_COLOR_MUTATION,
    ADMIN_DELETE_COLOR_MUTATION
} from '../../api/mutations/colorMutations';
import logger from '../../utils/logger';

const DEFAULT_FORM_DATA = { color_name: '', color_hex: '#000000' };

function ColorListPage() {
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentColorForEdit, setCurrentColorForEdit] = useState(null);
    const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });

    const { loading: queryLoading, error: queryError, data, refetch } = useQuery(ADMIN_GET_ALL_COLORS_QUERY, {
        fetchPolicy: 'cache-and-network',
        onError: (err) => {
            logger.error("Error fetching colors:", err);
            setActionFeedback({ type: 'danger', message: err.message || "Failed to load colors." });
        }
    });

    const handleMutationError = useCallback((err, actionName, specificMessage = null) => {
        logger.error(`Error ${actionName} color:`, err);
        const message = specificMessage || err.graphQLErrors?.[0]?.message || err.message || `Failed to ${actionName} color.`;
        setActionFeedback({ type: 'danger', message });
    }, []); // Bỏ showFormModal vì logic hiển thị lỗi đã gộp vào actionFeedback

    useEffect(() => {
        if (actionFeedback.message) {
            const timer = setTimeout(() => setActionFeedback({ type: '', message: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [actionFeedback]);

    const [createColor, { loading: creating }] = useMutation(ADMIN_CREATE_COLOR_MUTATION, {
        onCompleted: (mutationData) => {
            setActionFeedback({ type: 'success', message: `Color "${mutationData.adminCreateColor.color_name}" created successfully!` });
            handleModalClose(true);
        },
        onError: (err) => handleMutationError(err, 'create'),
        update: (cache, { data: { adminCreateColor: newColor } }) => { // Tùy chọn: Cập nhật cache thủ công
            try {
                const existingData = cache.readQuery({ query: ADMIN_GET_ALL_COLORS_QUERY });
                if (existingData && newColor) {
                    cache.writeQuery({
                        query: ADMIN_GET_ALL_COLORS_QUERY,
                        data: {
                            adminGetAllColors: [...existingData.adminGetAllColors, newColor],
                        },
                    });
                }
            } catch (e) {
                logger.warn("Failed to update cache after color creation, will rely on refetch.", e);
            }
        }
    });

    const [updateColor, { loading: updating }] = useMutation(ADMIN_UPDATE_COLOR_MUTATION, {
        onCompleted: (mutationData) => {
            setActionFeedback({ type: 'success', message: `Color "${mutationData.adminUpdateColor.color_name}" updated successfully!` });
            handleModalClose(true); // Refetch để đảm bảo, hoặc chỉ cập nhật cache
        },
        onError: (err) => handleMutationError(err, 'update')
        // Apollo Client tự động cập nhật cache cho item đã sửa nếu ID và __typename khớp
    });

    const [deleteColor, { loading: deleting }] = useMutation(ADMIN_DELETE_COLOR_MUTATION, {
        onCompleted: () => {
            setActionFeedback({ type: 'success', message: `Color "${itemToDelete?.color_name}" deleted successfully!` });
            refetch(); // Hoặc update cache
            setItemToDelete(null);
        },
        onError: (err) => {
            handleMutationError(err, 'delete', 'Failed to delete color. It might be in use.');
            setItemToDelete(null);
        },
        update: (cache, { data: { adminDeleteColor: successFlag } }) => { // Tùy chọn: Cập nhật cache thủ công
            if (successFlag && itemToDelete) {
                const colorIdToDelete = itemToDelete.color_id;
                const existingData = cache.readQuery({ query: ADMIN_GET_ALL_COLORS_QUERY });
                if (existingData) {
                    cache.writeQuery({
                        query: ADMIN_GET_ALL_COLORS_QUERY,
                        data: {
                            adminGetAllColors: existingData.adminGetAllColors.filter(color => color.color_id !== colorIdToDelete),
                        },
                    });
                }
            }
        }
    });

    const handleModalClose = useCallback((shouldRefetchIfNoCacheUpdate = false) => {
        setShowFormModal(false);
        setCurrentColorForEdit(null);
        setIsEditMode(false);
        setFormData({ ...DEFAULT_FORM_DATA });
        // Để actionFeedback lại để user thấy success message
        if (shouldRefetchIfNoCacheUpdate) { // Chỉ refetch nếu không dùng cache update, hoặc cache update thất bại
             // Với cache update, refetch() trong onCompleted của mutation có thể không cần thiết
        }
    }, []); // Bỏ refetch khỏi dependency vì nó không đổi

    const handleShowCreateModal = useCallback(() => {
        setIsEditMode(false);
        setCurrentColorForEdit(null);
        setFormData({ ...DEFAULT_FORM_DATA });
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    }, []);

    const handleShowEditModal = useCallback((color) => {
        setIsEditMode(true);
        setCurrentColorForEdit(color);
        setFormData({
            color_name: color.color_name || '',
            color_hex: color.color_hex || '#000000'
        });
        setActionFeedback({ type: '', message: '' });
        setShowFormModal(true);
    }, []);

    const handleFormInputChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'colorPickerInputModalValue') {
        setFormData(prev => ({ ...prev, color_hex: value.toUpperCase() }));
    } else if (name === 'color_hex') { // Text input
        setFormData(prev => ({ ...prev, color_hex: value }));
    } else { // Các input khác như color_name
        setFormData(prev => ({ ...prev, [name]: value }));
    }
}, []);


    const validateAndFormatHex = useCallback((hexString) => {
        // ... (giữ nguyên hàm validateAndFormatHex đã tối ưu ở lượt trước)
        if (!hexString || typeof hexString !== 'string' || hexString.trim() === '') return { value: null };
        let finalHex = hexString.trim().toUpperCase();
        if (!finalHex.startsWith('#')) finalHex = '#' + finalHex;
        if (/^#([0-9A-F]{3})$/i.test(finalHex)) finalHex = `#${finalHex[1]}${finalHex[1]}${finalHex[2]}${finalHex[2]}${finalHex[3]}${finalHex[3]}`;
        if (!/^#([0-9A-F]{6})$/i.test(finalHex)) return { error: "Invalid HEX. Use #RRGGBB or #RGB." };
        return { value: finalHex };
    }, []);

    const handleFormSubmit = useCallback(async (event) => {
        event.preventDefault();
        setActionFeedback({ type: '', message: '' });

        const name = formData.color_name.trim();
        if (!name) {
            setActionFeedback({ type: 'danger', message: "Color name is required." });
            return;
        }

        const hexValidation = validateAndFormatHex(formData.color_hex);
        if (hexValidation.error) {
            setActionFeedback({ type: 'danger', message: hexValidation.error });
            return;
        }
        const finalHexValue = hexValidation.value;

        const input = { color_name: name, color_hex: finalHexValue };

        if (isEditMode && currentColorForEdit) {
            if (name === currentColorForEdit.color_name && finalHexValue === (currentColorForEdit.color_hex || null)) {
                setActionFeedback({ type: 'info', message: "No changes detected." });
                handleModalClose(); // Đóng modal nếu không có thay đổi
                return;
            }
            await updateColor({ variables: { id: currentColorForEdit.color_id, input } });
        } else {
            await createColor({ variables: { input } });
        }
    }, [formData, isEditMode, currentColorForEdit, createColor, updateColor, handleModalClose, validateAndFormatHex]);

    const handleDeleteRequest = useCallback((color) => {
        setItemToDelete(color);
        setActionFeedback({ type: '', message: '' });
        setShowDeleteModal(true);
    }, []);

    const confirmDeleteHandler = useCallback(() => {
        if (itemToDelete?.color_id) {
            deleteColor({ variables: { id: itemToDelete.color_id } });
        } else {
            logger.error("Delete confirmation: itemToDelete or color_id is missing!", itemToDelete);
            setActionFeedback({ type: 'danger', message: "Error preparing delete: Missing ID." });
        }
        setShowDeleteModal(false);
        // setItemToDelete đã được xử lý trong onCompleted/onError của deleteColor
    }, [itemToDelete, deleteColor]);

    const colors = data?.adminGetAllColors || [];

    return (
        <Container fluid className="p-3">
            <Row className="align-items-center mb-3">
                <Col><h1 className="h3 mb-0">Manage Colors</h1></Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={handleShowCreateModal} disabled={queryLoading || creating || updating}>
                        <i className="bi bi-plus-lg me-1"></i> Add New Color
                    </Button>
                </Col>
            </Row>

            {actionFeedback.message && (
                <AlertMessage
                    variant={actionFeedback.type || 'info'}
                    dismissible
                    onClose={() => setActionFeedback({ type: '', message: '' })}
                    className="mb-3"
                >
                    {actionFeedback.message}
                </AlertMessage>
            )}

            {queryLoading && <LoadingSpinner message="Loading colors..." />}
            {queryError && !data && (
                <AlertMessage variant="danger" className="mb-3">
                    Error loading colors data: {queryError.message}
                </AlertMessage>
            )}

            {!queryLoading && !queryError && colors.length === 0 && (
                 <AlertMessage variant="info" className="mt-3">
                    No colors found. Click 'Add New Color' to create one.
                </AlertMessage>
            )}

            {!queryLoading && colors.length > 0 && (
                <ColorTable
                    colors={colors}
                    onEdit={handleShowEditModal}
                    onDelete={handleDeleteRequest}
                />
            )}

            <Modal show={showFormModal} onHide={() => handleModalClose(false)} centered backdrop="static" keyboard={false}>
                <Modal.Header closeButton={!creating && !updating}>
                    <Modal.Title>{isEditMode ? 'Edit Color' : 'Add New Color'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleFormSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3" controlId="formModalColorNameCtrl">
                            <Form.Label>Color Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="color_name"
                                value={formData.color_name}
                                onChange={handleFormInputChange}
                                required
                                disabled={creating || updating}
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formModalColorHexCtrl">
                            <Form.Label>Hex Code (e.g., #FF0000 or leave blank)</Form.Label>
                            <Row className="g-2 align-items-center">
                                <Col xs="auto">
                                    <Form.Control
                                        type="color"
                                        name="colorPickerInputModalValue" // Để phân biệt với text input
                                        value={formData.color_hex || '#000000'} // Color picker cần 1 giá trị hex hợp lệ
                                        onChange={handleFormInputChange}
                                        title="Choose color"
                                        style={{ width: '40px', height: '40px', padding: '0.1rem', border: '1px solid #ced4da', borderRadius: '0.25rem' }}
                                        disabled={creating || updating}
                                    />
                                </Col>
                                <Col>
                                    <Form.Control
                                        type="text"
                                        name="color_hex"
                                        placeholder="#RRGGBB"
                                        value={formData.color_hex || ''}
                                        onChange={handleFormInputChange}
                                        disabled={creating || updating}
                                    />
                                </Col>
                            </Row>
                        </Form.Group>
                         {/* Hiển thị actionFeedback ngay trong modal nếu muốn, hoặc dựa vào actionFeedback chung */}
                         {showFormModal && actionFeedback.type === 'danger' && actionFeedback.message.startsWith('Form error:') && (
                            <AlertMessage variant="danger" className="mt-2">
                                {actionFeedback.message.replace('Form error: ','')}
                            </AlertMessage>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => handleModalClose(false)} disabled={creating || updating}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={creating || updating || !formData.color_name.trim()}>
                            {(creating || updating) && <Spinner size="sm" animation="border" className="me-2" />}
                            {isEditMode ? 'Update Color' : 'Create Color'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <ModalConfirm
                show={showDeleteModal}
                handleClose={() => { setShowDeleteModal(false); setItemToDelete(null); }}
                handleConfirm={confirmDeleteHandler}
                title="Confirm Color Deletion"
                body={itemToDelete ? `Are you sure you want to delete the color "${itemToDelete.color_name}"? This action cannot be undone and may affect products or inventory variants.` : "Are you sure?"}
                confirmButtonText={deleting ? <><Spinner size="sm" className="me-1" /> Deleting...</> : 'Delete'}
                confirmButtonVariant="danger"
                confirmDisabled={deleting}
            />
        </Container>
    );
}

export default ColorListPage;