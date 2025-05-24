import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form } from 'react-bootstrap';
import { useOrderRealtime } from '../../hooks/useOrderRealtime';
import { formatDateTime, formatCurrency } from '../../utils/formatters';

export const RealtimeOrdersList = () => {
  const { orders, loading, updateOrder, updatePayment } = useOrderRealtime();
  const [filterStatus, setFilterStatus] = useState('all');

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'PROCESSING': return 'info';
      case 'SHIPPED': return 'primary';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  };

  const filteredOrders = orders.filter(order => 
    filterStatus === 'all' || order.sale_status === filterStatus
  );

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Đơn Hàng Real-time</h5>
        <Form.Select 
          size="sm" 
          style={{ width: 'auto' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xử lý</option>
          <option value="PROCESSING">Đang xử lý</option>
          <option value="SHIPPED">Đã gửi</option>
          <option value="DELIVERED">Đã giao</option>
          <option value="CANCELLED">Đã hủy</option>
        </Form.Select>
      </Card.Header>
      <Card.Body className="p-0">
        <Table responsive hover className="mb-0">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Thanh toán</th>
              <th>Thời gian</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-3">
                  Đang tải...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-3">
                  Không có đơn hàng nào
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.sale_id}>
                  <td>#{order.sale_id}</td>
                  <td>
                    <div>{order.customer_name}</div>
                    <small className="text-muted">{order.customer?.phone_number}</small>
                  </td>
                  <td>{formatCurrency(order.total_amount)}</td>
                  <td>
                    <Badge bg={getStatusBadgeVariant(order.sale_status)}>
                      {order.sale_status}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={order.payment_status === 'PAID' ? 'success' : 'warning'}>
                      {order.payment_status}
                    </Badge>
                  </td>
                  <td>
                    <div>{formatDateTime(order.created_at)}</div>
                    <small className="text-muted">
                      {order.updated_at !== order.created_at && 
                        `Cập nhật: ${formatDateTime(order.updated_at)}`}
                    </small>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => {/* Xem chi tiết */}}
                      >
                        Chi tiết
                      </Button>
                      <Form.Select
                        size="sm"
                        value={order.sale_status}
                        onChange={(e) => updateOrder(order.sale_id, e.target.value)}
                        style={{ width: 'auto' }}
                      >
                        <option value="PENDING">Chờ xử lý</option>
                        <option value="PROCESSING">Đang xử lý</option>
                        <option value="SHIPPED">Đã gửi</option>
                        <option value="DELIVERED">Đã giao</option>
                        <option value="CANCELLED">Đã hủy</option>
                      </Form.Select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};