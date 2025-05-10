import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { ORDER_STATUS_LIST } from '../../utils/constants'; // Import danh sách trạng thái

// Component chứa các bộ lọc cho trang danh sách đơn hàng
function OrderFilters({ initialFilters = {}, onFilterChange, onResetFilters }) {
    const [filters, setFilters] = useState(initialFilters);

    // Cập nhật state nội bộ khi initialFilters từ bên ngoài thay đổi
    useEffect(() => {
        setFilters(initialFilters);
    }, [initialFilters]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        // Có thể gọi onFilterChange ngay hoặc đợi nhấn nút Filter
    };

    const handleApplyFilters = () => {
        const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});
        onFilterChange(activeFilters);
    };

    const handleReset = () => {
        setFilters({});
        onResetFilters();
    }

    return (
        <div className="p-3 mb-3 border rounded bg-light">
            <Row className="g-3 align-items-end">
                {/* Search Term (Order ID, Customer Name/Email) */}
                <Col xs={12} md={6} lg={4}>
                    <Form.Group controlId="filterSearchTermOrder">
                        <Form.Label>Search</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Order ID, Customer..."
                            name="searchTerm" // Cần backend hỗ trợ search term này
                            value={filters.searchTerm || ''}
                            onChange={handleChange}
                        />
                    </Form.Group>
                </Col>

                {/* Status */}
                <Col xs={12} md={6} lg={3}>
                    <Form.Group controlId="filterStatus">
                        <Form.Label>Status</Form.Label>
                        <Form.Select name="status" value={filters.status || ''} onChange={handleChange}>
                            <option value="">All Statuses</option>
                            {ORDER_STATUS_LIST.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>

                {/* Date Range (Sử dụng thư viện date picker hoặc 2 input date) */}
                <Col xs={12} md={6} lg={3}>
                   <Form.Group controlId="filterDateFrom">
                       <Form.Label>Date From</Form.Label>
                       <Form.Control
                           type="date"
                           name="dateFrom"
                           value={filters.dateFrom || ''}
                           onChange={handleChange}
                       />
                   </Form.Group>
                   {/* Tương tự cho Date To */}
                </Col>

                {/* Action Buttons */}
                <Col xs={12} lg={2} className="d-flex align-items-end">
                    <div className="d-grid gap-2 d-md-block w-100">
                        <Button variant="primary" onClick={handleApplyFilters} className="me-md-2 mb-2 mb-md-0 w-100">Filter</Button>
                        <Button variant="outline-secondary" onClick={handleReset} className="w-100">Reset</Button>
                    </div>
                </Col>
            </Row>
        </div>
    );
}

export default OrderFilters;