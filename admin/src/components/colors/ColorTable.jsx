import React, { useState } from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import ModalConfirm from '../common/ModalConfirm'; // Import ModalConfirm

// Component hiển thị bảng danh sách màu sắc
function ColorTable({ colors = [], onEdit, onDelete }) { // Nhận hàm xử lý Edit, Delete
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const openDeleteConfirm = (item) => {
        setItemToDelete(item); // Lưu cả object vào state nội bộ của ColorTable
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setItemToDelete(null);
        setShowDeleteModal(false);
    };

    const confirmDelete = () => {
        if (itemToDelete && onDelete) {
            // Truyền toàn bộ object lên component cha (ColorListPage)
            onDelete(itemToDelete);
        }
        closeDeleteModal();
    };

    if (!colors || colors.length === 0) {
        return <p>No colors found.</p>;
    }

    return (
        <>
            <Table striped bordered hover responsive size="sm">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Preview</th>
                        <th>Name</th>
                        <th>Hex Code</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {colors.map((color) => (
                        <tr key={color.color_id}>
                            <td>{color.color_id}</td>
                            <td>
                                <Badge pill bg="light" text="dark" className="border">
                                    <span style={{
                                        display: 'inline-block', width: '15px', height: '15px',
                                        borderRadius: '50%', backgroundColor: color.color_hex || '#ccc',
                                        verticalAlign: 'middle', border: '1px solid #eee'
                                    }}></span>
                                </Badge>
                            </td>
                            <td>{color.color_name}</td>
                            <td>{color.color_hex || 'N/A'}</td>
                            <td>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-1"
                                    onClick={() => onEdit(color)} // Truyền cả object color
                                    title="Edit"
                                >
                                    <i className="bi bi-pencil-fill"></i>
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => openDeleteConfirm(color)} // Mở modal và lưu cả object color
                                    title="Delete"
                                >
                                    <i className="bi bi-trash-fill"></i>
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Modal Xác nhận Xóa */}
            <ModalConfirm
                show={showDeleteModal}
                handleClose={closeDeleteModal}
                handleConfirm={confirmDelete} // Hàm này giờ sẽ gọi onDelete với cả object
                title="Confirm Deletion"
                body={`Are you sure you want to delete color "${itemToDelete?.color_name}"?`}
                confirmButtonText="Delete"
                confirmButtonVariant="danger"
            />
        </>
    );
}

export default ColorTable;