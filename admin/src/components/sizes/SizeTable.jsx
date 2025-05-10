import React from 'react';
import { Table, Button } from 'react-bootstrap';

function SizeTable({ sizes = [], onEdit, onDelete }) {
    if (!sizes || sizes.length === 0) {
        return <p>No sizes found.</p>;
    }
    return (
        <Table striped bordered hover responsive size="sm">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sizes.map((size) => (
                    <tr key={size.size_id}>
                        <td>{size.size_id}</td>
                        <td>{size.size_name}</td>
                        <td>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-1"
                                onClick={() => onEdit(size)}
                                title="Edit"
                            >
                                <i className="bi bi-pencil-fill"></i>
                            </Button>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => onDelete(size)}
                                title="Delete"
                            >
                                <i className="bi bi-trash-fill"></i>
                            </Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
}

export default SizeTable;