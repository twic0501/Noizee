// admin-frontend/src/components/colors/ColorTable.jsx
import React from 'react';
import { Table, Button } from 'react-bootstrap';
// ADMIN_LANGUAGE_KEY không cần thiết nếu tên màu không dịch

function ColorTable({ colors = [], onEdit, onDelete }) {
    // const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi'; // Không cần thiết

    if (!colors || colors.length === 0) {
        return <p className="text-center text-muted my-3">Không tìm thấy màu sắc nào.</p>;
    }

    return (
        <Table striped bordered hover responsive size="sm" className="shadow-sm">
            <thead className="table-light">
                <tr>
                    <th>ID</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Xem trước</th>
                    <th>Tên Màu</th> {/* Chỉ hiển thị Tên Màu */}
                    <th>Mã Hex</th>
                    <th style={{ width: '120px' }} className="text-center">Hành động</th>
                </tr>
            </thead>
            <tbody>
                {colors.map((color) => {
                    // Hiển thị color.color_name trực tiếp
                    const displayName = color.color_name; 
                    // Hoặc nếu query trả về trường ảo `name`: const displayName = color.name || color.color_name;


                    return (
                        <tr key={color.color_id}>
                            <td>{color.color_id}</td>
                            <td style={{ textAlign: 'center' }}>
                                <div style={{
                                    display: 'inline-block',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: color.color_hex && /^#([0-9A-F]{3}){1,2}$/i.test(color.color_hex) ? color.color_hex : '#E0E0E0',
                                    border: '1px solid #BDBDBD',
                                    verticalAlign: 'middle'
                                }} title={color.color_hex || 'Màu không hợp lệ'}>
                                </div>
                            </td>
                            <td>{displayName}</td> {/* Hiển thị tên đã xử lý */}
                            <td>{color.color_hex ? color.color_hex.toUpperCase() : 'N/A'}</td>
                            <td className="text-center">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => onEdit(color)} // color object giờ sẽ có color_name
                                    title="Sửa"
                                >
                                    <i className="bi bi-pencil-fill"></i>
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => onDelete(color)}
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

export default ColorTable;
