import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Badge } from 'react-bootstrap';
import OrderStatusBadge from '../orders/OrderStatusBadge'; // Tái sử dụng badge status
import { formatCurrency, formatDate } from '../../utils/formatters';

function MiniOrderTable({ orders = [], title = "Recent Orders", maxRows = 5 }) {
    if (!orders || orders.length === 0) {
        return <p>No recent orders to display.</p>;
    }

    const displayedOrders = orders.slice(0, maxRows); // Chỉ hiển thị số lượng giới hạn

    return (
        <div className="card shadow-sm">
            <div className="card-header">
                <h5 className="card-title mb-0">{title}</h5>
            </div>
            <div className="card-body p-0"> {/* Bỏ padding để table sát viền card */}
                <Table hover responsive className="mb-0"> {/* Bỏ border, striped */}
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Total</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedOrders.map((order) => (
                            <tr key={order.sale_id}>
                                <td>#{order.sale_id}</td>
                                <td>{order.customer?.customer_name || 'N/A'}</td>
                                <td>{formatDate(order.sale_date)}</td>
                                <td>
                                    <OrderStatusBadge status={order.sale_status} />
                                </td>
                                <td>{formatCurrency(order.totals?.total_amount)}</td>
                                <td>
                                    <Link
                                        to={`/orders/${order.sale_id}`}
                                        className="btn btn-sm btn-outline-info"
                                        title="View Details"
                                    >
                                        <i className="bi bi-eye"></i>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
            {orders.length > maxRows && (
                <div className="card-footer text-center">
                    <Link to="/orders">View All Orders</Link>
                </div>
            )}
        </div>
    );
}

export default MiniOrderTable;