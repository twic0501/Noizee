// admin-frontend/src/components/blog/BlogTagTable.jsx
import React, { useState } from 'react';
import { Table, Button } from 'react-bootstrap';
import ModalConfirm from '../common/ModalConfirm'; // Giả sử bạn có component này
import LoadingSpinner from '../common/LoadingSpinner'; // Giả sử bạn có component này
import { ADMIN_LANGUAGE_KEY } from '../../utils/constants';

function BlogTagTable({ tags = [], onEdit, onDelete, isLoading }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const currentAdminLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';

    const openDeleteConfirm = (tag) => {
        setItemToDelete(tag);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setItemToDelete(null);
        setShowDeleteModal(false);
    };

    const confirmDelete = () => {
        if (itemToDelete && onDelete) {
            const displayName = (currentAdminLang === 'en' && itemToDelete.name_en) ? itemToDelete.name_en : itemToDelete.name_vi;
            onDelete(itemToDelete.tag_id, displayName); // Truyền ID và tên để hiển thị trong thông báo
        }
        closeDeleteModal();
    };

    if (isLoading && (!tags || tags.length === 0)) {
        return <LoadingSpinner message="Đang tải danh sách thẻ..." />;
    }

    if (!tags || tags.length === 0) {
        return <p className="text-center text-muted my-3">Không tìm thấy thẻ blog nào.</p>;
    }

    return (
        <>
            <Table striped bordered hover responsive size="sm" className="shadow-sm">
                <thead className="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Tên Thẻ ({currentAdminLang.toUpperCase()})</th>
                        {/* Cân nhắc hiển thị cả tên tiếng Anh nếu đang xem tiếng Việt và ngược lại */}
                        {/* <th>Tên Thẻ ({currentAdminLang === 'vi' ? 'EN' : 'VI'})</th> */}
                        <th>Slug</th>
                        <th style={{ width: '120px' }} className="text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {tags.map((tag) => {
                        const displayName = (currentAdminLang === 'en' && tag.name_en) 
                                            ? tag.name_en 
                                            : tag.name_vi;
                        // const otherLangName = (currentAdminLang === 'vi' && tag.name_en)
                        //                     ? tag.name_en
                        //                     : (currentAdminLang === 'en' && tag.name_vi)
                        //                       ? tag.name_vi
                        //                       : '';
                        return (
                            <tr key={tag.tag_id}>
                                <td>{tag.tag_id}</td>
                                <td>{displayName || 'N/A'}</td>
                                {/* <td>{otherLangName || 'N/A'}</td> */}
                                <td>{tag.slug}</td>
                                <td className="text-center">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="me-2"
                                        onClick={() => onEdit(tag)}
                                        title="Sửa thẻ"
                                    >
                                        <i className="bi bi-pencil-fill"></i>
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => openDeleteConfirm(tag)}
                                        title="Xóa thẻ"
                                    >
                                        <i className="bi bi-trash-fill"></i>
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>

            <ModalConfirm
                show={showDeleteModal}
                handleClose={closeDeleteModal}
                handleConfirm={confirmDelete}
                title="Xác nhận Xóa Thẻ Blog"
                body={`Bạn có chắc chắn muốn xóa thẻ "${
                    (currentAdminLang === 'en' && itemToDelete?.name_en ? itemToDelete.name_en : itemToDelete?.name_vi) || 'này'
                }"?`}
                confirmButtonText="Xóa"
                confirmButtonVariant="danger"
            />
        </>
    );
}

export default BlogTagTable;
