import React from 'react';
import { Table, Button } from 'react-bootstrap';
import { truncateString } from '../../utils/formatters'; // Import hàm rút gọn chuỗi (nếu cần)

// Component hiển thị bảng danh sách bộ sưu tập
function CollectionTable({ collections = [], onEdit, onDelete }) {
    if (!collections || collections.length === 0) {
        return <p>No collections found.</p>;
    }
    return (
        <Table striped bordered hover responsive size="sm">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Slug</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    {collections.map((collection) => (<tr key={collection.collection_id}><td>{collection.collection_id}</td><td>{collection.collection_name}</td><td>{truncateString(collection.collection_description, 100) || 'N/A'}</td><td>{collection.slug || 'N/A'}</td><td><Button variant="outline-primary" size="sm" className="me-1" onClick={() => onEdit(collection)} title="Edit"><i className="bi bi-pencil-fill"></i></Button><Button variant="outline-danger" size="sm" onClick={() => onDelete(collection)} title="Delete"><i className="bi bi-trash-fill"></i></Button></td></tr>))}
</tbody>
        </Table>
    );
}

export default CollectionTable;