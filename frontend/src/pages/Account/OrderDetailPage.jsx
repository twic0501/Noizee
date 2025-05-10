import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { Container, Row, Col, Card, Table, ListGroup, Badge, Image } from 'react-bootstrap';
import { AlertMessage, LoadingSpinner, OrderStatusBadge } from '@noizee/ui-components';
import { formatCurrency, formatDate, formatDateTime, getFullImageUrl } from '@noizee/shared-utils'; // Import getFullImageUrl
import { GET_MY_SALE_DETAIL_QUERY } from '../../api/graphql/queries/userQueries';

const PLACEHOLDER_IMAGE = '/images/placeholder.png';

function OrderDetailPage() {
    const { orderId } = useParams();

    const { data, loading, error } = useQuery(GET_MY_SALE_DETAIL_QUERY, {
        variables: { id: orderId },
        fetchPolicy: 'cache-and-network',
        onError: (err) => {
             console.error(`Error fetching order detail for ID ${orderId}:`, err);
        }
    });

    if (loading) return <LoadingSpinner message="Đang tải chi tiết đơn hàng..." />;
    if (error) return <AlertMessage variant="danger">Lỗi tải chi tiết đơn hàng: {error.message}</AlertMessage>;
    if (!data?.mySaleDetail) return <AlertMessage variant="warning">Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này.</AlertMessage>;

    const order = data.mySaleDetail;

    const subtotal = order.items.reduce((sum, item) => sum + (item.price_at_sale * item.product_qty), 0);

     const handleImageError = (e) => {
         e.target.onerror = null;
         e.target.src = PLACEHOLDER_IMAGE;
     };

    return (
        <Container className="my-4">
            <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Chi tiết đơn hàng #{order.sale_id}</h4>
                    <Link to="/account/orders" className="btn btn-sm btn-outline-secondary">Quay lại Lịch sử</Link>
                </Card.Header>
                <Card.Body>
                    <Row className="mb-4">
                        <Col md={6} className="mb-3 mb-md-0">
                            <h5 className="mb-3">Thông tin đơn hàng</h5>
                            <ListGroup variant="flush">
                                <ListGroup.Item><strong>Mã đơn hàng:</strong> #{order.sale_id}</ListGroup.Item>
                                <ListGroup.Item><strong>Ngày đặt:</strong> {formatDate(order.sale_date)}</ListGroup.Item>
                                <ListGroup.Item><strong>Trạng thái:</strong> <OrderStatusBadge status={order.sale_status} /></ListGroup.Item>
                                <ListGroup.Item><strong>Tổng tiền:</strong> <span className="fw-bold">{formatCurrency(order.totals?.total_amount)}</span></ListGroup.Item>
                            </ListGroup>
                        </Col>
                        <Col md={6}>
                             <h5 className="mb-3">Thông tin khách hàng</h5>
                             <ListGroup variant="flush">
                                 <ListGroup.Item><strong>Tên:</strong> {order.customer?.customer_name}</ListGroup.Item>
                                 <ListGroup.Item><strong>Email:</strong> {order.customer?.customer_email}</ListGroup.Item>
                                 <ListGroup.Item><strong>SĐT:</strong> {order.customer?.customer_tel}</ListGroup.Item>
                                 <ListGroup.Item><strong>Địa chỉ giao hàng:</strong> {order.customer?.customer_address || 'Chưa cung cấp'}</ListGroup.Item>
                             </ListGroup>
                        </Col>
                    </Row>

                    <h5 className="mb-3">Các sản phẩm</h5>
                    <Table responsive striped borderless size="sm">
                        <thead className='table-light'>
                            <tr>
                                <th colSpan="2">Sản phẩm</th>
                                <th className="text-center">Số lượng</th>
                                <th className="text-end">Đơn giá</th>
                                <th className="text-end">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item, index) => (
                                <tr key={item.sale_item_id || `item-${index}`}>
                                    <td style={{ width: '80px' }}>
                                         <Link to={`/products/${item.product?.product_id}`}>
                                             <Image
                                                 src={getFullImageUrl(item.product?.imageUrl)} // <<< SỬ DỤNG HÀM HELPER
                                                 alt={item.product?.product_name}
                                                 style={{ width: '60px', height: 'auto', maxHeight: '60px', objectFit: 'contain', borderRadius: '4px' }}
                                                 onError={handleImageError}
                                             />
                                         </Link>
                                     </td>
                                     <td className='align-middle'>
                                         <Link to={`/products/${item.product?.product_id}`} className="text-dark text-decoration-none fw-medium">
                                             {item.product?.product_name || 'Sản phẩm không tồn tại'}
                                         </Link>
                                     </td>
                                     <td className="text-center align-middle">{item.product_qty}</td>
                                     <td className="text-end align-middle">{formatCurrency(item.price_at_sale)}</td>
                                     <td className="text-end align-middle">{formatCurrency(item.price_at_sale * item.product_qty)}</td>
                                 </tr>
                             ))}
                         </tbody>
                         <tfoot>
                             <tr>
                                 <td colSpan="4" className="text-end border-0 pt-3">Tạm tính:</td>
                                 <td className="text-end border-0 pt-3">{formatCurrency(subtotal)}</td>
                             </tr>
                             <tr>
                                 <td colSpan="4" className="text-end">Phí vận chuyển:</td>
                                 <td className="text-end">Miễn phí</td>
                             </tr>
                             <tr className='border-top border-2'>
                                 <td colSpan="4" className="text-end fw-bold h5 pt-2">Tổng cộng:</td>
                                 <td className="text-end fw-bold h5 pt-2">{formatCurrency(order.totals?.total_amount)}</td>
                             </tr>
                         </tfoot>
                    </Table>

                     {order.history && order.history.length > 0 && (
                         <>
                             <h5 className="mt-4 mb-3">Lịch sử trạng thái</h5>
                             <ListGroup variant="flush">
                             {[...order.history].sort((a, b) => new Date(b.history_date) - new Date(a.history_date)).map(hist => (
                                 <ListGroup.Item key={hist.history_id} className="d-flex justify-content-between align-items-center">
                                     <div>
                                         <OrderStatusBadge status={hist.history_status} />
                                         {hist.history_notes && <div className="text-muted mt-1"><small>Ghi chú: {hist.history_notes}</small></div>}
                                     </div>
                                     <small className="text-muted">{formatDateTime(hist.history_date)}</small>
                                 </ListGroup.Item>
                             ))}
                             </ListGroup>
                         </>
                     )}
                </Card.Body>
            </Card>
        </Container>
    );
}

export default OrderDetailPage;