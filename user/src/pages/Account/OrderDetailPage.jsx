// user/src/pages/Account/OrderDetailPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiCalendar, FiUser, FiMapPin, FiTruck, FiCreditCard, FiClipboard, FiHash } from 'react-icons/fi';

import { GET_ORDER_DETAILS_QUERY } from '../../api/graphql/orderQueries'; // Đã tạo
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge'; // Đã tạo
import { formatPrice, formatDate } from '../../utils/formatters';
import OptimizedImage from '../../components/common/OptimizedImage';
import { PRODUCT_IMAGE_PLACEHOLDER } from '../../utils/constants';

const DetailSection = ({ title, icon, children }) => (
  <div className="mb-6">
    <h3 className="text-md font-semibold text-gray-700 mb-2 flex items-center">
      {React.cloneElement(icon, { className: "h-5 w-5 mr-2 text-indigo-600" })}
      {title}
    </h3>
    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md space-y-1">
        {children}
    </div>
  </div>
);

const OrderDetailPage = () => {
  const { t } = useTranslation();
  const { orderId } = useParams(); // Lấy orderId từ URL

  const { data, loading, error } = useQuery(GET_ORDER_DETAILS_QUERY, {
    variables: { orderId },
    fetchPolicy: 'cache-and-network',
  });

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (error) return <AlertMessage type="error" message={t('orderDetail.errorLoading')} details={error.message} />;
  
  const order = data?.myOrder; // Hoặc data?.order tùy theo tên query ở backend

  if (!order) return <AlertMessage type="info" message={t('orderDetail.notFound')} />;

  // Giả định customer, shippingAddress, items là các object/array trong order
  // const customerName = `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim();
  // const shipping = order.shippingAddress;

  // Placeholder data nếu query chưa có
  const placeholderOrder = {
    id: '1', order_number: 'NOZ-001', sale_date: new Date().toISOString(), 
    status: 'DELIVERED', total_amount: 250000, 
    customer: { firstName: 'Văn', lastName: 'A', email: 'vana@example.com'},
    shipping_address: { street: '123 Đường ABC', city: 'Quận 1', postalCode: '700000', country: 'Việt Nam', phoneNumber: '0901234567'},
    payment_method: 'Thanh toán khi nhận hàng (COD)',
    shipping_method: 'Giao hàng tiêu chuẩn',
    items: [
      { id: 'item1', product_name: 'Áo Thun Cao Cấp Noizee Màu Đen', quantity: 1, price_per_unit: 250000, total_price: 250000, product_image_url: 'https://via.placeholder.com/80' },
    ],
    subtotal_amount: 250000,
    discount_amount: 0,
    tax_amount: 0,
  };
  const currentOrder = order || placeholderOrder;


  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
            <Link to="/account/orders" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-2">
                <FiArrowLeft className="mr-1 h-4 w-4" />
                {t('orderDetail.backToOrders', 'Quay lại danh sách đơn hàng')}
            </Link>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
            {t('orderDetail.title', 'Chi tiết đơn hàng')} #{currentOrder.order_number || currentOrder.id}
            </h2>
        </div>
        <OrderStatusBadge status={currentOrder.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Order Info, Customer, Shipping */}
        <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <DetailSection title={t('orderDetail.orderInfo', 'Thông tin đơn hàng')} icon={<FiClipboard />}>
                    <p><strong>{t('orders.orderId', 'Mã ĐH')}:</strong> {currentOrder.order_number || currentOrder.id}</p>
                    <p><strong>{t('orders.date', 'Ngày đặt')}:</strong> {formatDate(currentOrder.sale_date)}</p>
                    <p><strong>{t('orders.status', 'Trạng thái')}:</strong> <span className="font-medium">{t(`orderStatus.${currentOrder.status?.toLowerCase()}`, currentOrder.status)}</span></p>
                    <p><strong>{t('orderDetail.paymentMethod', 'Phương thức thanh toán')}:</strong> {currentOrder.payment_method || 'N/A'}</p>
                    <p><strong>{t('orderDetail.shippingMethod', 'Phương thức vận chuyển')}:</strong> {currentOrder.shipping_method || 'N/A'}</p>
                </DetailSection>

                {currentOrder.customer && (
                    <DetailSection title={t('orderDetail.customerInfo', 'Thông tin khách hàng')} icon={<FiUser />}>
                        <p>{currentOrder.customer.firstName} {currentOrder.customer.lastName}</p>
                        <p>{currentOrder.customer.email}</p>
                        {currentOrder.shipping_address?.phoneNumber && <p>{currentOrder.shipping_address.phoneNumber}</p>}
                    </DetailSection>
                )}

                {currentOrder.shipping_address && (
                    <DetailSection title={t('orderDetail.shippingAddress', 'Địa chỉ giao hàng')} icon={<FiMapPin />}>
                        <p>{currentOrder.shipping_address.street}</p>
                        <p>{currentOrder.shipping_address.city}{currentOrder.shipping_address.district ? `, ${currentOrder.shipping_address.district}` : ''}{currentOrder.shipping_address.ward ? `, ${currentOrder.shipping_address.ward}` : ''}</p>
                        <p>{currentOrder.shipping_address.postalCode ? `${currentOrder.shipping_address.postalCode}, ` : ''}{currentOrder.shipping_address.country}</p>
                    </DetailSection>
                )}
            </div>
        </div>

        {/* Right Column: Order Summary (Items & Totals) */}
        <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-md font-semibold text-gray-700 mb-4 pb-2 border-b">
                    {t('orderDetail.itemsInOrder', 'Các sản phẩm trong đơn')} ({currentOrder.items?.length || 0})
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {currentOrder.items?.map(item => (
                    <div key={item.id} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-b-0">
                        <OptimizedImage
                        src={item.product_image_url || PRODUCT_IMAGE_PLACEHOLDER}
                        alt={item.product_name}
                        containerClassName="w-14 h-14 rounded overflow-hidden flex-shrink-0 bg-gray-100"
                        objectFit="object-contain"
                        className="w-full h-full"
                        />
                        <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.product_name}</p>
                        <p className="text-xs text-gray-500">
                            {t('orderDetail.quantity', 'SL')}: {item.quantity} x {formatPrice(item.price_per_unit)}
                        </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                            {formatPrice(item.total_price)}
                        </p>
                    </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                        <span>{t('orderDetail.subtotal', 'Tạm tính')}:</span>
                        <span>{formatPrice(currentOrder.subtotal_amount)}</span>
                    </div>
                    {currentOrder.discount_amount > 0 && (
                        <div className="flex justify-between text-green-600">
                        <span>{t('orderDetail.discount', 'Giảm giá')}:</span>
                        <span>-{formatPrice(currentOrder.discount_amount)}</span>
                        </div>
                    )}
                    {/* Shipping and Tax can be added here if available in 'currentOrder' */}
                     <div className="flex justify-between text-gray-600">
                        <span>{t('orderDetail.shippingFee', 'Phí vận chuyển')}:</span>
                        <span>{formatPrice(currentOrder.shipping_fee || 0)}</span>
                    </div>
                    {currentOrder.tax_amount > 0 && (
                        <div className="flex justify-between text-gray-600">
                        <span>{t('orderDetail.tax', 'Thuế')}:</span>
                        <span>{formatPrice(currentOrder.tax_amount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t mt-2">
                        <span>{t('orderDetail.total', 'Tổng cộng')}:</span>
                        <span>{formatPrice(currentOrder.total_amount)}</span>
                    </div>
                </div>
                 {/* TODO: Track order button, re-order button, print invoice */}
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;