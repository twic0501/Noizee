// src/pages/Account/OrderDetailPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { Container, Row, Col, Card, Table, ListGroup, Image } from 'react-bootstrap';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { formatCurrency, formatDate, formatDateTime, getFullImageUrl } from '../../utils/formatters';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import { GET_MY_SALE_DETAIL_QUERY } from '../../api/graphql/queries/userQueries';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../../utils/constants';
import './OrderDetailPage.css'; // Tạo file CSS này để style

function OrderDetailPage() {
    const { orderId } = useParams(); // Lấy orderId từ URL params

    const { data, loading, error } = useQuery(GET_MY_SALE_DETAIL_QUERY, {
        variables: { id: orderId },
        fetchPolicy: 'cache-and-network', // Lấy từ cache rồi cập nhật từ network
        onError: (err) => {
             console.error(`Lỗi khi fetch chi tiết đơn hàng ID ${orderId}:`, err.message);
        }
    });

    // Xử lý trạng thái loading
    if (loading) {
        return (
            <Container className="my-4 text-center">
                <LoadingSpinner message="Đang tải chi tiết đơn hàng..." />
            </Container>
        );
    }

    // Xử lý trạng thái lỗi
    if (error) {
        return (
            <Container className="my-4">
                <AlertMessage variant="danger">
                    Lỗi tải chi tiết đơn hàng. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.
                    {/* {error.message} */}
                </AlertMessage>
            </Container>
        );
    }

    const order = data?.mySaleDetail;

    // Xử lý trường hợp không tìm thấy đơn hàng
    if (!order) {
        return (
            <Container className="my-4">
                <AlertMessage variant="warning">
                    Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này.
                </AlertMessage>
                <Link to="/account/orders" className="btn btn-outline-secondary mt-2">
                    <i className="bi bi-arrow-left me-1"></i> Quay lại Lịch sử đơn hàng
                </Link>
            </Container>
        );
    }

    // Tính toán các giá trị phụ
    const subtotal = order.items.reduce((sum, item) => sum + (item.price_at_sale * item.product_qty), 0);
    const totalDiscount = order.items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
    const shippingFee = order.totals?.shipping_fee || 0;
    // const grandTotal = order.totals?.total_amount; // Nên lấy trực tiếp từ totals

    const handleImageError = (e) => {
         e.target.onerror = null; // Ngăn lặp vô hạn nếu placeholder cũng lỗi
         e.target.src = PLACEHOLDER_PRODUCT_IMAGE; // Fallback về ảnh placeholder chung
    };

    return (
        // Container được bọc ngoài cùng bởi AccountLayout
        <Card className="shadow-sm order-detail-card card-page-content">
            <Card.Header className="d-flex justify-content-between align-items-center order-detail-header">
                <h5 className="mb-0 text-uppercase">Chi tiết đơn hàng #{order.sale_id}</h5>
                <Link to="/account/orders" className="btn btn-sm btn-outline-secondary back-to-history-btn">
                    <i className="bi bi-arrow-left me-1"></i> Quay lại
                </Link>
            </Card.Header>
            <Card.Body className="order-detail-body">
                <Row className="mb-4 section-row">
                    <Col md={6} className="mb-3 mb-md-0">
                       <h6 className="section-title">Thông tin đơn hàng</h6>
                        <ListGroup variant="flush" className="info-list">
                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Mã đơn hàng:</span> <strong>#{order.sale_id}</strong></ListGroup.Item>
                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Ngày đặt:</span> <strong>{formatDate(order.sale_date)}</strong></ListGroup.Item>
                            <ListGroup.Item className="px-0 d-flex justify-content-between align-items-center"><span>Trạng thái:</span> <OrderStatusBadge status={order.sale_status} /></ListGroup.Item>
                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Phương thức TT:</span> <strong>{order.payment_method || 'COD'}</strong></ListGroup.Item>
                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Tổng tiền:</span> <strong className="h5 text-primary">{formatCurrency(order.totals?.total_amount)}</strong></ListGroup.Item>
                        </ListGroup>
                    </Col>
                    <Col md={6}>
                         <h6 className="section-title">Thông tin giao hàng</h6>
                        <ListGroup variant="flush" className="info-list">
                             <ListGroup.Item className="px-0"><strong>Người nhận:</strong> {order.shipping_name || order.customer?.customer_name || 'Chưa cung cấp'}</ListGroup.Item>
                             <ListGroup.Item className="px-0"><strong>Điện thoại:</strong> {order.shipping_phone || order.customer?.customer_tel || 'Chưa cung cấp'}</ListGroup.Item>
                             <ListGroup.Item className="px-0"><strong>Địa chỉ:</strong> {order.shipping_address || order.customer?.customer_address || 'Chưa cung cấp'}</ListGroup.Item>
                             {order.shipping_notes && <ListGroup.Item className="px-0"><strong>Ghi chú:</strong> {order.shipping_notes}</ListGroup.Item>}
                         </ListGroup>
                    </Col>
                </Row>

                <h6 className="section-title mt-4 mb-2">Các sản phẩm trong đơn</h6>
                <div className="table-responsive">
                    <Table borderless className="order-items-table align-middle">
                        <thead className='table-light-custom'>
                            <tr>
                               <th colSpan={2} className="pb-2">Sản phẩm</th>
                                <th className="text-center pb-2">Số lượng</th>
                                <th className="text-end pb-2">Đơn giá</th>
                                {totalDiscount > 0 && <th className="text-end pb-2">Giảm giá</th>}
                                <th className="text-end pb-2">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                             {order.items.map((item, index) => (
                                <tr key={item.sale_item_id || `item-${index}`} className="order-item-row">
                                    <td style={{ width: '70px' }} className="py-2">
                                        <Link to={item.product ? `/products/${item.product.product_id}` : "#"} title={item.product_name_at_sale}>
                                             <Image
                                                 src={getFullImageUrl(item.product?.imageUrl)} // Lấy ảnh từ product nếu có
                                                 alt={item.product_name_at_sale}
                                                 className="order-item-image"
                                                 onError={handleImageError}
                                             />
                                         </Link>
                                    </td>
                                     <td className='py-2'>
                                         <Link to={item.product ? `/products/${item.product.product_id}` : "#"} className="text-dark text-decoration-none fw-medium order-item-name" title={item.product_name_at_sale}>
                                             {item.product_name_at_sale || 'Sản phẩm không còn tồn tại'}
                                         </Link>
                                         <div className="text-muted small order-item-variant">
                                            {item.size?.size_name && `Size: ${item.size.size_name}`}
                                            {item.size?.size_name && item.color?.color_name && ' / '}
                                            {item.color?.color_name && `Màu: ${item.color.color_name}`}
                                            {item.product_sku_at_sale && <span className="d-block">SKU: {item.product_sku_at_sale}</span>}
                                         </div>
                                     </td>
                                     <td className="text-center py-2">{item.product_qty}</td>
                                     <td className="text-end py-2">{formatCurrency(item.price_at_sale)}</td>
                                     {totalDiscount > 0 && <td className="text-end py-2 text-success">-{formatCurrency(item.discount_amount || 0)}</td>}
                                     <td className="text-end py-2 fw-medium">{formatCurrency((item.price_at_sale * item.product_qty) - (item.discount_amount || 0) )}</td>
                                 </tr>
                             ))}
                         </tbody>
                    </Table>
                </div>
                <Row className="mt-3 justify-content-end">
                    <Col md={6} lg={5}>
                        <ListGroup variant="flush" className="order-totals-summary-footer">
                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Tạm tính:</span> <span>{formatCurrency(subtotal)}</span></ListGroup.Item>
                            {totalDiscount > 0 && <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Tổng giảm giá:</span> <span className="text-success">-{formatCurrency(totalDiscount)}</span></ListGroup.Item>}
                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>Phí vận chuyển:</span> <span>{formatCurrency(shippingFee)}</span></ListGroup.Item>
                            <ListGroup.Item className="px-0 d-flex justify-content-between fw-bold h5 text-primary"><span>Thành tiền:</span> <span>{formatCurrency(order.totals?.total_amount)}</span></ListGroup.Item>
                        </ListGroup>
                    </Col>
                </Row>

                 {order.history && order.history.length > 0 && (
                     <>
                         <h6 className="section-title mt-4 mb-3">Lịch sử đơn hàng</h6>
                         <ListGroup variant="flush" className="order-history-list">
                             {[...order.history] // Tạo một bản sao để sort không ảnh hưởng mảng gốc
                                .sort((a, b) => new Date(b.history_date) - new Date(a.history_date)) // Sắp xếp mới nhất lên đầu
                                .map(hist => (
                             <ListGroup.Item key={hist.history_id} className="px-0 d-flex justify-content-between align-items-start py-2 history-item">
                                 <div>
                                     <OrderStatusBadge status={hist.history_status} />
                                     {hist.history_notes && <div className="text-muted mt-1 fst-italic history-notes"><small>Ghi chú: {hist.history_notes}</small></div>}
                                 </div>
                                 <small className="text-muted text-nowrap ms-3 history-date">{formatDateTime(hist.history_date)}</small>
                             </ListGroup.Item>
                         ))}
                         </ListGroup>
                     </>
                 )}
            </Card.Body>
        </Card>
    ); // Đóng ngoặc tròn của return
} // Đóng ngoặc nhọn của function OrderDetailPage

export default OrderDetailPage;