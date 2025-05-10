import React from 'react';
import { Pagination as BootstrapPagination } from 'react-bootstrap';

// Đổi tên để tránh trùng
// Component phân trang tái sử dụng
function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) {
        return null; // Không hiển thị nếu chỉ có 1 trang hoặc không có trang nào
    }

    const handlePageClick = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
            onPageChange(pageNumber);
        }
    };

    // Logic tạo các item phân trang (có thể phức tạp hơn để hiển thị '...' nếu nhiều trang)
    let items = [];
    const pageLimit = 5; // Số lượng trang hiển thị xung quanh trang hiện tại
    let startPage = Math.max(1, currentPage - Math.floor(pageLimit / 2));
    let endPage = Math.min(totalPages, startPage + pageLimit - 1);

    // Điều chỉnh lại startPage nếu endPage đạt giới hạn cuối
    if(endPage === totalPages) {
        startPage = Math.max(1, endPage - pageLimit + 1);
    }

    // Nút First và Previous
    items.push(
        <BootstrapPagination.First key="first" onClick={() => handlePageClick(1)} disabled={currentPage === 1} />
    );
    items.push(
        <BootstrapPagination.Prev key="prev" onClick={() => handlePageClick(currentPage - 1)} disabled={currentPage === 1} />
    );

    // Thêm '...' ở đầu nếu cần
    if (startPage > 1) {
        items.push(<BootstrapPagination.Ellipsis key="start-ellipsis" disabled />);
    }

    // Các trang cụ thể
    for (let number = startPage; number <= endPage; number++) {
        items.push(
            <BootstrapPagination.Item key={number} active={number === currentPage} onClick={() => handlePageClick(number)}>
                {number}
            </BootstrapPagination.Item>
        );
    }

    // Thêm '...' ở cuối nếu cần
    if (endPage < totalPages) {
        items.push(<BootstrapPagination.Ellipsis key="end-ellipsis" disabled />);
    }

    // Nút Next và Last
    items.push(
        <BootstrapPagination.Next key="next" onClick={() => handlePageClick(currentPage + 1)} disabled={currentPage === totalPages} />
    );
    items.push(
        <BootstrapPagination.Last key="last" onClick={() => handlePageClick(totalPages)} disabled={currentPage === totalPages} />
    );

    return (
        <div className="d-flex justify-content-center mt-3">
            <BootstrapPagination>{items}</BootstrapPagination>
        </div>
    );
}

export default Pagination;