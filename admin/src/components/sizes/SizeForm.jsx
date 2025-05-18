// admin-frontend/src/components/sizes/SizeForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Card, FloatingLabel, Spinner } from 'react-bootstrap';
import AlertMessage from '../common/AlertMessage';

function SizeForm({ initialData, onSubmit, loading, error, isEditMode = false, onCancel }) {
    const [sizeName, setSizeName] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (isEditMode && initialData) {
            setSizeName(initialData.size_name || '');
        } else if (!isEditMode) {
            setSizeName('');
        }
    }, [isEditMode, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!sizeName.trim()) {
            setFormError('Tên kích thước là bắt buộc.');
            return;
        }
        onSubmit({ size_name: sizeName.trim() }); // Gửi object chứa size_name
    };

    return (
        <Card className="shadow-sm">
            <Card.Header as="h5">{isEditMode ? 'Chỉnh sửa Kích thước' : 'Tạo Kích thước mới'}</Card.Header>
            <Card.Body>
                {formError && <AlertMessage variant="danger" onClose={() => setFormError('')} dismissible>{formError}</AlertMessage>}
                {error && <AlertMessage variant="danger">Lỗi từ server: {error.message}</AlertMessage>}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="sizeName">
                        <FloatingLabel label={<>Tên Kích thước <span className="text-danger">*</span></>}>
                            <Form.Control
                                type="text"
                                value={sizeName}
                                onChange={(e) => {
                                    setSizeName(e.target.value);
                                    setFormError('');
                                }}
                                placeholder="Ví dụ: S, M, L, XL, 38, 39"
                                required
                                disabled={loading}
                                autoFocus
                            />
                        </FloatingLabel>
                    </Form.Group>

                    <div className="mt-3 d-flex justify-content-end">
                        <Button variant="outline-secondary" type="button" onClick={onCancel} className="me-2" disabled={loading}>
                            Hủy
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading || !sizeName.trim()}>
                            {loading && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />}
                            {isEditMode ? 'Lưu thay đổi' : 'Tạo Kích thước'}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default SizeForm;
