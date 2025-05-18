// admin-frontend/src/components/categories/CategoryTable.jsx
import React from 'react';
import { Table, Button } from 'react-bootstrap';
import { ADMIN_LANGUAGE_KEY } from '../../utils/constants'; // Key để lấy ngôn ngữ admin

function CategoryTable({ categories = [], onEdit, onDelete }) {
    const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';

    if (!categories || categories.length === 0) {
        return <p className="text-center text-muted my-3">Không tìm thấy danh mục nào.</p>;
    }

    return (
        <Table striped bordered hover responsive size="sm" className="shadow-sm">
            <thead className="table-light">
                <tr>
                    <th>ID</th>
                    <th>Tên Danh mục ({currentAdminLang.toUpperCase()})</th>
                    {/* Thêm cột cho ngôn ngữ còn lại nếu muốn hiển thị song song */}
                    {/* <th>Tên ({currentAdminLang === 'vi' ? 'EN' : 'VI'})</th> */}
                    <th style={{ width: '120px' }} className="text-center">Hành động</th>
                </tr>
            </thead>
            <tbody>
                {categories.map((category) => {
                    // Ưu tiên hiển thị tên theo ngôn ngữ admin chọn, fallback về tiếng Việt
                    const displayName = (currentAdminLang === 'en' && category.name_en) 
                                        ? category.name_en 
                                        : category.category_name_vi; // Sửa: dùng category_name_vi từ GraphQL
                                                                    // Hoặc nếu dùng trường ảo: category.name (đã có lang)

                    // const otherLangName = (currentAdminLang === 'vi' && category.category_name_en)
                    //                         ? category.category_name_en
                    //                         : (currentAdminLang === 'en' && category.category_name_vi)
                    //                           ? category.category_name_vi
                    //                           : '';
                    return (
                        <tr key={category.category_id}>
                            <td>{category.category_id}</td>
                            <td>{displayName || 'N/A'}</td>
                            {/* <td>{otherLangName || 'N/A'}</td> */}
                            <td className="text-center">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => onEdit(category)}
                                    title="Sửa"
                                >
                                    <i className="bi bi-pencil-fill"></i>
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => onDelete(category)}
                                    title="Xóa"
                                >
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

export default CategoryTable;
