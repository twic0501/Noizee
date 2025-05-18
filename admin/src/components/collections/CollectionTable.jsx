// admin-frontend/src/components/collections/CollectionTable.jsx
import React from 'react';
import { Table, Button } from 'react-bootstrap';
import { truncateString } from '../../utils/formatters';
import { ADMIN_LANGUAGE_KEY } from '../../utils/constants';

function CollectionTable({ collections = [], onEdit, onDelete }) {
    const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';

    if (!collections || collections.length === 0) {
        return <p className="text-center text-muted my-3">Không tìm thấy bộ sưu tập nào.</p>;
    }
    return (
        <Table striped bordered hover responsive size="sm" className="shadow-sm">
            <thead className="table-light">
                <tr>
                    <th>ID</th>
                    <th>Tên Bộ sưu tập ({currentAdminLang.toUpperCase()})</th>
                    <th>Mô tả ({currentAdminLang.toUpperCase()})</th>
                    <th>Slug</th>
                    <th style={{ width: '120px' }} className="text-center">Hành động</th>
                </tr>
            </thead>
            <tbody>
                {collections.map((collection) => {
                    const displayName = (currentAdminLang === 'en' && collection.name_en)
                                        ? collection.name_en
                                        : collection.collection_name_vi; // Sửa: dùng collection_name_vi từ GraphQL
                                                                        // Hoặc collection.name nếu dùng trường ảo
                    
                    const displayDescription = (currentAdminLang === 'en' && collection.collection_description_en)
                                        ? collection.collection_description_en
                                        : collection.collection_description_vi;

                    return (
                        <tr key={collection.collection_id}>
                            <td>{collection.collection_id}</td>
                            <td>{displayName || 'N/A'}</td>
                            <td>{truncateString(displayDescription, 100) || 'N/A'}</td>
                            <td>{collection.slug || 'N/A'}</td>
                            <td className="text-center">
                                <Button variant="outline-primary" size="sm" className="me-2" onClick={() => onEdit(collection)} title="Sửa">
                                    <i className="bi bi-pencil-fill"></i>
                                </Button>
                                <Button variant="outline-danger" size="sm" onClick={() => onDelete(collection)} title="Xóa">
                                    <i className="bi bi-trash-fill"></i>
                                </Button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    );
}

export default CollectionTable;
