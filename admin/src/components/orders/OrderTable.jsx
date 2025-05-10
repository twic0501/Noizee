import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Badge } from 'react-bootstrap';
import { formatCurrency, formatDate } from '../../utils/formatters'; // Import formatters
import OrderStatusBadge from './OrderStatusBadge'; // Import component badge

// Component hiển thị bảng danh sách đơn hàng
function OrderTable({ sales = [] }) { // Nhận danh sách sales qua props
    if (!sales || sales.length === 0) {
        return <p>No orders found.</p>;
    }
    return (
        <Table striped bordered hover responsive="lg" size="sm">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total Amount</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sales.map((sale) => (
                    <tr key={sale.sale_id}>
                        <td>#{sale.sale_id}</td>
                        <td>
                            {sale.customer?.customer_name || 'N/A'} <br />
                            <small className="text-muted">{sale.customer?.customer_email}</small>
                        </td>
                        <td>{formatDate(sale.sale_date)}</td>
                        <td>
                            <OrderStatusBadge status={sale.sale_status} />
                        </td>
                        <td>{formatCurrency(sale.totals?.total_amount)}</td>
                        <td>
                            <Link to={`/orders/${sale.sale_id}`} className="btn btn-sm btn-outline-info" title="View Details">
                                <i className="bi bi-eye-fill"></i>
                            </Link>
                            {/* Thêm các actions khác nếu cần (e.g., print invoice) */}
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
}

export default OrderTable;