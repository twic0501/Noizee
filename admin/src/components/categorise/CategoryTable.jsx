import React from 'react';
import { Table, Button } from 'react-bootstrap';

function CategoryTable({ categories = [], onEdit, onDelete }) {
    if (!categories || categories.length === 0) {
        return <p>No categories found.</p>;
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
                {categories.map((category) => (
                    <tr key={category.category_id}>
                        <td>{category.category_id}</td>
                        <td>{category.category_name}</td>
                        <td>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-1"
                                onClick={() => onEdit(category)}
                                title="Edit"
                            >
                                <i className="bi bi-pencil-fill"></i>
                            </Button>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => onDelete(category)} // Truyền cả object để lấy ID và tên cho modal
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

export default CategoryTable;