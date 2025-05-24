// src/pages/Account/OrderDetailPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { Container, Row, Col, Card, Table, ListGroup, Image } from 'react-bootstrap';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { formatCurrency, formatDate, formatDateTime, getFullImageUrl } from '../../utils/formatters';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge'; // OrderStatusBadge đã được dịch
import { GET_MY_SALE_DETAIL_QUERY } from '../../api/graphql/queries/userQueries';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../../utils/constants';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
import './OrderDetailPage.css';

function OrderDetailPage() {
    const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
    const { orderId } = useParams();
    const currentLang = useParams().lang || i18n.language || 'vi';


    const { data, loading, error } = useQuery(GET_MY_SALE_DETAIL_QUERY, {
        variables: { id: orderId },
        fetchPolicy: 'cache-and-network',
        onError: (err) => {
             console.error(`Lỗi khi fetch chi tiết đơn hàng ID ${orderId}:`, err.message);
        }
    });

    if (loading) {
        return (
            <Container className="my-4 text-center">
                <LoadingSpinner message={t('orderDetailPage.loadingMessage')} />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="my-4">
                <AlertMessage variant="danger">
                    {t('orderDetailPage.loadError')}
                </AlertMessage>
            </Container>
        );
    }

    const order = data?.mySaleDetail;
    const langLink = (path) => `/${currentLang}${path}`.replace(/\/+/g, '/');


    if (!order) {
        return (
            <Container className="my-4">
                <AlertMessage variant="warning">
                    {t('orderDetailPage.notFoundError')}
                </AlertMessage>
                <Link to={langLink("/account/orders")} className="btn btn-outline-secondary mt-2">
                    <i className="bi bi-arrow-left me-1"></i> {t('orderDetailPage.backToHistoryButton')}
                </Link>
            </Container>
        );
    }

    const subtotal = order.items.reduce((sum, item) => sum + (item.price_at_sale * item.product_qty), 0);
    const totalDiscount = order.items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
    const shippingFee = order.totals?.shipping_fee || 0;

    const handleImageError = (e) => {
         e.target.onerror = null;
         e.target.src = PLACEHOLDER_PRODUCT_IMAGE;
    };

    return (
        <Card className="shadow-sm order-detail-card card-page-content">
            <Card.Header className="d-flex justify-content-between align-items-center order-detail-header">
                <h5 className="mb-0 text-uppercase">{t('orderDetailPage.title', { orderId: order.sale_id })}</h5>
                <Link to={langLink("/account/orders")} className="btn btn-sm btn-outline-secondary back-to-history-btn">
                    <i className="bi bi-arrow-left me-1"></i> {t('orderDetailPage.backButton')}
                </Link>
            </Card.Header>
            <Card.Body className="order-detail-body">
                <Row className="mb-4 section-row">
                    <Col md={6} className="mb-3 mb-md-0">
                       <h6 className="section-title">{t('orderDetailPage.orderInfoSectionTitle')}</h6>
                        <ListGroup variant="flush" className="info-list">
                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>{t('orderDetailPage.orderIdLabel')}</span> <strong>#{order.sale_id}</strong></ListGroup.Item>
                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>{t('orderDetailPage.dateLabel')}</span> <strong>{formatDate(order.sale_date, i18n.language)}</strong></ListGroup.Item>
                            <ListGroup.Item className="px-0 d-flex justify-content-between align-items-center"><span>{t('orderDetailPage.statusLabel')}</span> <OrderStatusBadge status={order.sale_status} /></ListGroup.Item>
                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>{t('orderDetailPage.paymentMethodLabel')}</span> <strong>{order.payment_method || 'COD'}</strong></ListGroup.Item>
                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>{t('orderDetailPage.totalAmountLabel')}</span> <strong className="h5 text-primary">{formatCurrency(order.totals?.total_amount, i18n.language)}</strong></ListGroup.Item>
                        </ListGroup>
                    </Col>
                    <Col md={6}>
                         <h6 className="section-title">{t('orderDetailPage.shippingInfoSectionTitle')}</h6>
                        <ListGroup variant="flush" className="info-list">
                             <ListGroup.Item className="px-0"><strong>{t('orderDetailPage.recipientNameLabel')}</strong> {order.shipping_name || order.customer?.customer_name || t('common.notProvided')}</ListGroup.Item>
                             <ListGroup.Item className="px-0"><strong>{t('orderDetailPage.phoneLabel')}</strong> {order.shipping_phone || order.customer?.customer_tel || t('common.notProvided')}</ListGroup.Item>
                             <ListGroup.Item className="px-0"><strong>{t('orderDetailPage.addressLabel')}</strong> {order.shipping_address || order.customer?.customer_address || t('common.notProvided')}</ListGroup.Item>
                             {order.shipping_notes && <ListGroup.Item className="px-0"><strong>{t('orderDetailPage.notesLabel')}</strong> {order.shipping_notes}</ListGroup.Item>}
                         </ListGroup>
                    </Col>
                </Row>

                <h6 className="section-title mt-4 mb-2">{t('orderDetailPage.itemsSectionTitle')}</h6>
                <div className="table-responsive">
                    <Table borderless className="order-items-table align-middle">
                        <thead className='table-light-custom'>
                            <tr>
                               <th colSpan={2} className="pb-2">{t('orderDetailPage.productHeader')}</th>
                                <th className="text-center pb-2">{t('orderDetailPage.quantityHeader')}</th>
                                <th className="text-end pb-2">{t('orderDetailPage.unitPriceHeader')}</th>
                                {totalDiscount > 0 && <th className="text-end pb-2">{t('orderDetailPage.discountHeader')}</th>}
                                <th className="text-end pb-2">{t('orderDetailPage.subtotalHeader')}</th>
                            </tr>
                        </thead>
                        <tbody>
                             {order.items.map((item, index) => {
                                // Giả sử item.product.name đã được dịch hoặc lấy từ item.product_name_at_sale
                                const productName = item.product_name_at_sale || item.product?.name || t('common.productUnavailable');
                                // Tương tự cho size và color name
                                const sizeName = item.size?.size_name;
                                const colorName = item.color?.color_name;

                                return (
                                <tr key={item.sale_item_id || `item-${index}`} className="order-item-row">
                                    <td style={{ width: '70px' }} className="py-2">
                                        <Link to={item.product ? langLink(`/products/${item.product.product_id}`) : "#"} title={productName}>
                                             <Image
                                                 src={getFullImageUrl(item.product?.imageUrl)}
                                                 alt={productName}
                                                 className="order-item-image"
                                                 onError={handleImageError}
                                             />
                                         </Link>
                                    </td>
                                     <td className='py-2'>
                                         <Link to={item.product ? langLink(`/products/${item.product.product_id}`) : "#"} className="text-dark text-decoration-none fw-medium order-item-name" title={productName}>
                                             {productName}
                                         </Link>
                                         <div className="text-muted small order-item-variant">
                                            {sizeName && `${t('cartItem.sizeLabel')} ${sizeName}`}
                                            {sizeName && colorName && ' / '}
                                            {colorName && `${t('cartItem.colorLabel')} ${colorName}`}
                                            {item.product_sku_at_sale && <span className="d-block">{t('orderDetailPage.skuLabel')} {item.product_sku_at_sale}</span>}
                                         </div>
                                     </td>
                                     <td className="text-center py-2">{item.product_qty}</td>
                                     <td className="text-end py-2">{formatCurrency(item.price_at_sale, i18n.language)}</td>
                                     {totalDiscount > 0 && <td className="text-end py-2 text-success">-{formatCurrency(item.discount_amount || 0, i18n.language)}</td>}
                                     <td className="text-end py-2 fw-medium">{formatCurrency((item.price_at_sale * item.product_qty) - (item.discount_amount || 0), i18n.language )}</td>
                                 </tr>
                                );
                             })}
                         </tbody>
                    </Table>
                </div>
                <Row className="mt-3 justify-content-end">
                    <Col md={6} lg={5}>
                        <ListGroup variant="flush" className="order-totals-summary-footer">
                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>{t('orderDetailPage.summarySubtotal')}</span> <span>{formatCurrency(subtotal, i18n.language)}</span></ListGroup.Item>
                            {totalDiscount > 0 && <ListGroup.Item className="px-0 d-flex justify-content-between"><span>{t('orderDetailPage.summaryDiscount')}</span> <span className="text-success">-{formatCurrency(totalDiscount, i18n.language)}</span></ListGroup.Item>}
                            <ListGroup.Item className="px-0 d-flex justify-content-between"><span>{t('orderDetailPage.summaryShipping')}</span> <span>{formatCurrency(shippingFee, i18n.language)}</span></ListGroup.Item>
                            <ListGroup.Item className="px-0 d-flex justify-content-between fw-bold h5 text-primary"><span>{t('orderDetailPage.summaryTotal')}</span> <span>{formatCurrency(order.totals?.total_amount, i18n.language)}</span></ListGroup.Item>
                        </ListGroup>
                    </Col>
                </Row>

                 {order.history && order.history.length > 0 && (
                     <>
                         <h6 className="section-title mt-4 mb-3">{t('orderDetailPage.historySectionTitle')}</h6>
                         <ListGroup variant="flush" className="order-history-list">
                             {[...order.history]
                                .sort((a, b) => new Date(b.history_date) - new Date(a.history_date))
                                .map(hist => (
                             <ListGroup.Item key={hist.history_id} className="px-0 d-flex justify-content-between align-items-start py-2 history-item">
                                 <div>
                                     <OrderStatusBadge status={hist.history_status} />
                                     {hist.history_notes && <div className="text-muted mt-1 fst-italic history-notes"><small>{t('orderDetailPage.notesPrefix')} {hist.history_notes}</small></div>}
                                 </div>
                                 <small className="text-muted text-nowrap ms-3 history-date">{formatDateTime(hist.history_date, i18n.language)}</small>
                             </ListGroup.Item>
                         ))}
                         </ListGroup>
                     </>
                 )}
            </Card.Body>
        </Card>
    );
}

export default OrderDetailPage;