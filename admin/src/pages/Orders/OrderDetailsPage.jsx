// src/pages/Orders/OrderDetailsPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { Container, Row, Col, Card, Button, Form, Spinner, Table, ListGroup, Image } from 'react-bootstrap';
import { GET_ADMIN_SALE_DETAILS_QUERY } from '../../api/queries/orderQueries';
import { UPDATE_SALE_STATUS_MUTATION } from '../../api/mutations/orderMutations';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import OrderHistoryList from '../../components/orders/OrderHistoryList';
import { formatCurrency, formatDate, formatDateTime, getFullImageUrl } from '../../utils/formatters';
import { ORDER_STATUS_LIST } from '../../utils/constants'; // Danh sách các trạng thái hợp lệ
import logger from '../../utils/logger';

const PLACEHOLDER_IMAGE = '/images/placeholder.png'; // Từ admin.docx, public/images/placeholder.png

function OrderDetailsPage() {
    const { id: saleId } = useParams();
    const navigate = useNavigate();

    const [selectedStatus, setSelectedStatus] = useState('');
    const [statusNotes, setStatusNotes] = useState('');
    const [updateFeedback, setUpdateFeedback] = useState({ type: '', message: '' }); // Gộp error và success

    const { loading: queryLoading, error: queryError, data: saleData, refetch } = useQuery(GET_ADMIN_SALE_DETAILS_QUERY, {
        variables: { id: saleId },
        fetchPolicy: 'cache-and-network',
        onError: (err) => {
            logger.error(`Error fetching sale details for ID ${saleId}:`, err);
            // Không setUpdateFeedback ở đây vì đây là lỗi query, không phải lỗi update
        }
    });

    useEffect(() => { // Tự động điền selectedStatus khi saleData load lần đầu
        if (saleData?.adminGetSaleDetails?.sale_status && !selectedStatus) {
            setSelectedStatus(saleData.adminGetSaleDetails.sale_status);
        }
    }, [saleData, selectedStatus]);


    const [updateStatusMutation, { loading: mutationLoading }] = useMutation(UPDATE_SALE_STATUS_MUTATION, {
        onCompleted: (data) => {
            setUpdateFeedback({ type: 'success', message: `Order status successfully updated to ${data.adminUpdateSaleStatus.sale_status}.` });
            // setSelectedStatus(''); // Không reset selectedStatus, để nó hiển thị status mới
            setStatusNotes('');
            refetch(); // Lấy lại toàn bộ chi tiết đơn hàng để đảm bảo history được cập nhật
        },
        onError: (err) => {
            logger.error("Error updating sale status:", err);
            setUpdateFeedback({ type: 'danger', message: err.graphQLErrors?.[0]?.message || err.message || 'Failed to update order status.' });
        }
    });

    const handleStatusUpdate = useCallback(async (e) => {
        e.preventDefault();
        setUpdateFeedback({ type: '', message: '' }); // Clear old feedback

        if (!selectedStatus) {
            setUpdateFeedback({ type: 'danger', message: 'Please select a new status.' });
            return;
        }
        if (selectedStatus === saleData?.adminGetSaleDetails?.sale_status && !statusNotes.trim()) {
            setUpdateFeedback({ type: 'info', message: 'Status is already the same and no notes provided.' });
            return;
        }

        try {
            await updateStatusMutation({
                variables: {
                    saleId: saleId,
                    status: selectedStatus,
                    notes: statusNotes.trim() || null // Gửi null nếu notes rỗng
                }
            });
        } catch (err) {
            // Lỗi đã được xử lý trong onError của useMutation
            // Không cần setUpdateFeedback ở đây nữa trừ khi có lỗi đặc biệt trước khi mutation được gọi
        }
    }, [selectedStatus, statusNotes, updateStatusMutation, saleId, saleData]);

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = PLACEHOLDER_IMAGE;
    };

    useEffect(() => { // Tự xóa feedback sau 5s
        if (updateFeedback.message) {
            const timer = setTimeout(() => setUpdateFeedback({ type: '', message: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [updateFeedback]);


    if (queryLoading) return <LoadingSpinner message="Loading order details..." />;
    if (queryError) return <Container><AlertMessage variant="danger">Error loading order: {queryError.message}</AlertMessage></Container>;

    const sale = saleData?.adminGetSaleDetails;
    if (!sale) return <Container><AlertMessage variant="warning">Order not found or you do not have permission to view it.</AlertMessage></Container>;

    const calculateSubtotal = () => sale.items.reduce((sum, item) => sum + (item.price_at_sale * item.product_qty), 0);
    const calculateTotalDiscount = () => sale.items.reduce((sum, item) => sum + (item.discount_amount || 0), 0); // Đảm bảo discount_amount tồn tại

    return (
        <Container fluid className="p-3">
            <Row className="align-items-center mb-3">
                <Col><h1 className="h3 mb-0">Order Details #{sale.sale_id}</h1></Col>
                <Col xs="auto">
                    <Link to="/orders">
                        <Button variant="outline-secondary" size="sm">
                            <i className="bi bi-arrow-left me-1"></i> Back to Order List
                        </Button>
                    </Link>
                </Col>
            </Row>

            {updateFeedback.message && <AlertMessage variant={updateFeedback.type} dismissible onClose={() => setUpdateFeedback({type: '', message: ''})}>{updateFeedback.message}</AlertMessage>}

            <Row>
                <Col lg={5} xl={4} className="mb-3">
                    <Card className="shadow-sm mb-3">
                        <Card.Header><h5 className="card-title mb-0">Order Summary</h5></Card.Header>
                        <Card.Body>
                            <ListGroup variant="flush">
                                <ListGroup.Item><strong>Order ID:</strong> #{sale.sale_id}</ListGroup.Item>
                                <ListGroup.Item><strong>Date:</strong> {formatDate(sale.sale_date)}</ListGroup.Item>
                                <ListGroup.Item><strong>Status:</strong> <OrderStatusBadge status={sale.sale_status} /></ListGroup.Item>
                                <ListGroup.Item><strong>Subtotal:</strong> {formatCurrency(calculateSubtotal())}</ListGroup.Item>
                                <ListGroup.Item><strong>Discount:</strong> -{formatCurrency(calculateTotalDiscount())}</ListGroup.Item>
                                <ListGroup.Item className="h5 fw-bold"><strong>Grand Total:</strong> {formatCurrency(sale.totals?.total_amount)}</ListGroup.Item>
                            </ListGroup>
                        </Card.Body>
                    </Card>
                    <Card className="shadow-sm">
                        <Card.Header><h5 className="card-title mb-0">Customer Information</h5></Card.Header>
                        <Card.Body>
                             <ListGroup variant="flush">
                                <ListGroup.Item><strong>Name:</strong> {sale.customer?.customer_name || 'N/A'}</ListGroup.Item>
                                <ListGroup.Item><strong>Email:</strong> {sale.customer?.customer_email || 'N/A'}</ListGroup.Item>
                                <ListGroup.Item><strong>Phone:</strong> {sale.customer?.customer_tel || 'N/A'}</ListGroup.Item>
                                <ListGroup.Item><strong>Address:</strong> {sale.customer?.customer_address || 'N/A'}</ListGroup.Item>
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={7} xl={8} className="mb-3">
                    <Card className="shadow-sm mb-3">
                        <Card.Header><h5 className="card-title mb-0">Update Order Status</h5></Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleStatusUpdate}>
                                <Row className="g-2">
                                    <Col md={5}>
                                        <Form.Select
                                            aria-label="Select new status"
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            disabled={mutationLoading}
                                        >
                                            {/* <option value="">-- Select New Status --</option> */}
                                            {ORDER_STATUS_LIST.map(statusOption => (
                                                <option key={statusOption} value={statusOption}>
                                                    {statusOption} {statusOption === sale.sale_status ? '(Current)' : ''}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col md={5}>
                                        <Form.Control
                                            as="textarea"
                                            rows={1}
                                            placeholder="Notes for status change (optional)"
                                            value={statusNotes}
                                            onChange={(e) => setStatusNotes(e.target.value)}
                                            disabled={mutationLoading}
                                        />
                                    </Col>
                                    <Col md={2} className="d-grid">
                                        <Button
                                            variant="primary" // Đổi thành primary cho action chính
                                            type="submit"
                                            disabled={mutationLoading || (selectedStatus === sale.sale_status && !statusNotes.trim())}
                                        >
                                            {mutationLoading ? <Spinner size="sm" /> : 'Update'}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm mb-3">
                        <Card.Header><h5 className="card-title mb-0">Order Items ({sale.items?.length || 0})</h5></Card.Header>
                        <Table responsive hover className="mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th style={{width: '80px'}}>Image</th>
                                    <th>Product</th>
                                    <th className="text-center">Qty</th>
                                    <th className="text-end">Unit Price</th>
                                    <th className="text-end">Discount</th>
                                    <th className="text-end">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items.map(item => (
                                    <tr key={item.sale_item_id}>
                                        <td>
                                            <Image
                                                src={getFullImageUrl(item.product?.imageUrl)}
                                                alt={item.product?.product_name}
                                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                                                onError={handleImageError}
                                            />
                                        </td>
                                        <td>
                                            <Link to={`/products/edit/${item.product?.product_id}`} className="fw-medium text-dark text-decoration-none">
                                                {item.product?.product_name || 'Product Deleted'}
                                            </Link>
                                            <div className="text-muted small">
                                                {item.size ? `Size: ${item.size.size_name}` : ''}
                                                {item.color ? `${item.size ? ', ' : ''}Color: ${item.color.color_name}` : ''}
                                            </div>
                                        </td>
                                        <td className="text-center">{item.product_qty}</td>
                                        <td className="text-end">{formatCurrency(item.price_at_sale)}</td>
                                        <td className="text-end text-danger">-{formatCurrency(item.discount_amount || 0)}</td>
                                        <td className="text-end fw-medium">{formatCurrency((item.price_at_sale * item.product_qty) - (item.discount_amount || 0))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card>

                    {sale.history && sale.history.length > 0 && (
                        <Card className="shadow-sm">
                            <Card.Header><h5 className="card-title mb-0">Order History</h5></Card.Header>
                            <Card.Body className="p-0">
                                <OrderHistoryList history={sale.history || []} />
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default OrderDetailsPage;