// src/components/common/ModalConfirm.jsx
import React from 'react';
import { Modal, Button } from 'react-bootstrap';

function ModalConfirm({
    show,
    handleClose,
    handleConfirm,
    title = "Confirm Action",
    body = "Are you sure you want to proceed?",
    confirmButtonText = "Confirm",
    cancelButtonText = "Cancel",
    confirmButtonVariant = "danger"
}) {
    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{body}</Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    {cancelButtonText}
                </Button>
                <Button variant={confirmButtonVariant} onClick={handleConfirm}>
                    {confirmButtonText}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ModalConfirm; // <<<< CHÚ Ý DÒNG NÀY