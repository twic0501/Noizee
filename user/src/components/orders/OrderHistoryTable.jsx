// user/src/components/orders/OrderHistoryTable.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatPrice, formatDate } from '../../utils/formatters'; // Tiện ích định dạng
import OrderStatusBadge from './OrderStatusBadge'; // Component này sẽ tạo ở dưới
import LoadingSpinner from '../common/LoadingSpinner';
import AlertMessage from '../common/AlertMessage';
import Pagination from '../common/Pagination'; // Component Pagination (cần tạo/đồng bộ)

const OrderHistoryTable = ({ orders, loading, error, totalOrders, currentPage, itemsPerPage, onPageChange }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <AlertMessage type="error" message={t('orders.errorLoading')} details={error.message} />;
  }

  if (!orders || orders.length === 0) {
    return <AlertMessage type="info" message={t('orders.noOrdersFound')} />;
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('orders.orderId')}
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('orders.date')}
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('orders.status')}
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('orders.total')}
              </th>
              <th scope="col" className="relative px-4 py-3">
                <span className="sr-only">{t('common.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{order.order_number || order.id}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.sale_date)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                  {formatPrice(order.total_amount)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    to={`/account/orders/${order.id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    {t('orders.viewDetails')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalOrders > itemsPerPage && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <Pagination
            currentPage={currentPage}
            totalItems={totalOrders}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default OrderHistoryTable;