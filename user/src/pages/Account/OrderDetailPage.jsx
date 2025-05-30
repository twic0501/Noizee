// src/pages/Account/OrderDetailPage.jsx
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
// Sử dụng icon từ react-bootstrap-icons hoặc lucide-react tùy theo thiết kế của bạn
import { ArrowLeft, BoxSeam, CalendarEvent, Person, GeoAlt, CreditCard, ClipboardList, Hash } from 'react-bootstrap-icons';
// import { FiArrowLeft, FiClipboard, FiUser, FiMapPin, FiTruck, FiCreditCard, FiHash, FiCalendar } from 'lucide-react'; // Nếu dùng Lucide

import { GET_ORDER_DETAILS_QUERY } from '../../api/graphql/orderQueries';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import { formatPrice, formatDate } from '../../utils/formatters';
import OptimizedImage from '../../components/common/OptimizedImage';
import { API_BASE_URL, PRODUCT_IMAGE_PLACEHOLDER } from '../../utils/constants';

// Component con cho từng section chi tiết (sử dụng Bootstrap classes)
const DetailSection = ({ title, icon, children, className = "" }) => (
  <div className={`mb-4 ${className}`}>
    <h3 className="h6 fw-semibold text-dark mb-2 d-flex align-items-center">
      {React.cloneElement(icon, { size: 18, className: "me-2 text-primary" })} {/* Điều chỉnh size và class icon */}
      {title}
    </h3>
    <div className="small text-muted bg-light p-3 rounded border"> {/* Thêm border và bg-light */}
        {children}
    </div>
  </div>
);

const OrderDetailPage = () => {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { data, loading, error } = useQuery(GET_ORDER_DETAILS_QUERY, {
    variables: { orderId }, // Backend query có thể dùng 'id' hoặc 'orderId'
    fetchPolicy: 'cache-and-network',
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (error) {
    return <AlertMessage type="error" title={t('orderDetail.errorLoading')} message={error.message} />;
  }

  const order = data?.myOrder; // Hoặc data?.order tùy theo schema của bạn

  if (!order) {
    return <AlertMessage type="info" message={t('orderDetail.notFound')} />;
  }

  // Giả định cấu trúc dữ liệu trả về từ backend
  const customerName = `${order.customer?.firstName || order.customer?.customer_name || t('common.unknownUser', 'Khách hàng không xác định')}`;
  const shipping = order.shipping_address || order.shippingAddress; // Kiểm tra cả hai kiểu đặt tên
  const paymentMethodDisplay = order.payment_method || order.paymentMethod || t('common.notAvailable', 'Không có');
  const shippingMethodDisplay = order.shipping_method || order.shippingMethod || t('common.notAvailable', 'Không có');

  const getFullImageUrl = (relativePath) => {
    if (!relativePath) return PRODUCT_IMAGE_PLACEHOLDER;
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('data:')) {
        return relativePath;
    }
    return `${API_BASE_URL}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
  };


  return (
    <div>
      <div className="mb-4 d-flex flex-column flex-sm-row justify-content-sm-between align-items-sm-center">
        <div>
            <Link to="/account/orders" className="btn btn-link text-dark text-decoration-none ps-0 mb-2 d-inline-flex align-items-center small">
                <ArrowLeft size={16} className="me-1" />
                {t('orderDetail.backToOrders')}
            </Link>
            <h2 className="h5 fw-bold text-dark mb-0">
              {t('orderDetail.title')} #{order.order_number || order.id}
            </h2>
        </div>
        <div className="mt-2 mt-sm-0">
            <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Order Info, Customer, Shipping */}
        <div className="col-lg-7">
            <div className="card shadow-sm border-0">
                <div className="card-body p-3 p-md-4">
                    <DetailSection title={t('orderDetail.orderInfo')} icon={<ClipboardList />}>
                        <p className="mb-1"><strong>{t('orders.orderId')}:</strong> {order.order_number || order.id}</p>
                        <p className="mb-1"><strong>{t('orders.date')}:</strong> {formatDate(order.sale_date || order.createdAt)}</p>
                        <p className="mb-1"><strong>{t('orders.status')}:</strong> <span className="fw-medium">{t(`orderStatus.${order.status?.toLowerCase()}`, order.status)}</span></p>
                        <p className="mb-1"><strong>{t('orderDetail.paymentMethod')}:</strong> {paymentMethodDisplay}</p>
                        <p className="mb-0"><strong>{t('orderDetail.shippingMethod')}:</strong> {shippingMethodDisplay}</p>
                    </DetailSection>

                    {order.customer && (
                        <DetailSection title={t('orderDetail.customerInfo')} icon={<Person />}>
                            <p className="mb-1">{customerName}</p>
                            <p className="mb-0">{order.customer.email || order.customer.customer_email}</p>
                            {(shipping?.phoneNumber || order.customer?.customer_tel) && <p className="mb-0">{shipping?.phoneNumber || order.customer?.customer_tel}</p>}
                        </DetailSection>
                    )}

                    {shipping && (
                        <DetailSection title={t('orderDetail.shippingAddress')} icon={<GeoAlt />} className="mb-0">
                            <p className="mb-1">{shipping.street}</p>
                            <p className="mb-1">
                                {shipping.ward && `${shipping.ward}, `}
                                {shipping.district && `${shipping.district}, `}
                                {shipping.city}
                            </p>
                            {shipping.postalCode && <p className="mb-1">{shipping.postalCode}</p>}
                            <p className="mb-0">{shipping.country || "Việt Nam"}</p>
                        </DetailSection>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: Order Summary (Items & Totals) */}
        <div className="col-lg-5">
            <div className="card shadow-sm border-0">
                <div className="card-header bg-light border-bottom-0 p-3">
                    <h3 className="h6 fw-semibold text-dark mb-0 d-flex align-items-center">
                        <BoxSeam size={18} className="me-2 text-primary"/>
                        {t('orderDetail.itemsInOrder')} ({order.items?.length || 0})
                    </h3>
                </div>
                <div className="card-body p-3 p-md-4">
                    <div className="list-group list-group-flush mb-3" style={{maxHeight: '300px', overflowY: 'auto'}}>
                        {order.items?.map(item => (
                        <div key={item.id || item.product_id} className="list-group-item px-0 py-2 d-flex align-items-start">
                            <OptimizedImage
                                src={getFullImageUrl(item.product_image_url || item.product?.images?.[0]?.image_url)}
                                alt={item.product_name || item.product?.name}
                                containerClassName="flex-shrink-0 me-3 border rounded overflow-hidden"
                                style={{ width: '60px', height: '75px' }} // Kích thước ảnh
                                objectFitClass="object-fit-cover"
                            />
                            <div className="flex-grow-1">
                                <p className="small fw-medium text-dark mb-0 lh-sm">{item.product_name || item.product?.name}</p>
                                <p className="small text-muted mb-1" style={{fontSize: '0.75rem'}}>
                                    {t('orderDetail.quantity')}: {item.quantity} x {formatPrice(item.price_per_unit || item.price)}
                                </p>
                            </div>
                            <p className="small fw-semibold text-dark ms-2 mb-0">{formatPrice(item.total_price || (item.price * item.quantity))}</p>
                        </div>
                        ))}
                    </div>

                    <div className="border-top pt-3 small">
                        <div className="d-flex justify-content-between text-muted mb-1">
                            <span>{t('orderDetail.subtotal')}:</span>
                            <span>{formatPrice(order.subtotal_amount || order.subtotal || 0)}</span>
                        </div>
                        { (order.discount_amount > 0 || order.discount > 0) && (
                            <div className="d-flex justify-content-between text-success mb-1">
                                <span>{t('orderDetail.discount')}:</span>
                                <span>-{formatPrice(order.discount_amount || order.discount || 0)}</span>
                            </div>
                        )}
                         <div className="d-flex justify-content-between text-muted mb-1">
                            <span>{t('orderDetail.shippingFee')}:</span>
                            <span>{formatPrice(order.shipping_fee || order.shippingCost || 0)}</span>
                        </div>
                        {(order.tax_amount > 0 || order.tax > 0) && (
                            <div className="d-flex justify-content-between text-muted mb-1">
                                <span>{t('orderDetail.tax')}:</span>
                                <span>{formatPrice(order.tax_amount || order.tax || 0)}</span>
                            </div>
                        )}
                        <hr className="my-2"/>
                        <div className="d-flex justify-content-between h6 fw-bold text-dark pt-1 mb-0">
                            <span>{t('orderDetail.total')}:</span>
                            <span>{formatPrice(order.total_amount || order.total)}</span>
                        </div>
                    </div>
                    {/* TODO: Track order button, re-order button, print invoice */}
                    {/* <div className="mt-4 d-grid gap-2">
                        <button className="btn btn-primary btn-sm">Theo dõi đơn hàng</button>
                        <button className="btn btn-outline-secondary btn-sm">Đặt lại</button>
                    </div> */}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
