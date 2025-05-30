// src/pages/Account/OrderHistoryPage.jsx
import React from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom'; // Để quản lý state phân trang trên URL

import { GET_MY_ORDERS_QUERY } from '../../api/graphql/orderQueries';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import Pagination from '../../components/common/Pagination'; // Component Pagination đã được Bootstrap hóa
import OrderStatusBadge from '../../components/orders/OrderStatusBadge'; // Đã được Tailwind hóa, có thể cần điều chỉnh lại cho Bootstrap
import { formatPrice, formatDate } from '../../utils/formatters';
import { ITEMS_PER_PAGE_DEFAULT } from '../../utils/constants';

// OrderHistoryTable component (nội bộ hoặc tách riêng nếu phức tạp)
const OrderHistoryTable = ({ orders, loading, error, t }) => {
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
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
        <div className="table-responsive rounded-top"> {/* Thêm rounded-top cho table */}
            <table className="table table-hover table-striped small align-middle mb-0"> {/* table-striped, small, align-middle */}
                <thead className="table-light text-uppercase"> {/* table-light cho thead */}
                    <tr>
                        <th scope="col" className="px-3 py-2">{t('orders.orderId')}</th>
                        <th scope="col" className="px-3 py-2">{t('orders.date')}</th>
                        <th scope="col" className="px-3 py-2">{t('orders.status')}</th>
                        <th scope="col" className="px-3 py-2 text-end">{t('orders.total')}</th>
                        <th scope="col" className="px-3 py-2 text-end">{t('common.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td className="px-3 py-2 fw-medium">#{order.order_number || order.id}</td>
                            <td className="px-3 py-2 text-muted">{formatDate(order.sale_date)}</td>
                            <td className="px-3 py-2">
                                <OrderStatusBadge status={order.status} />
                                {/* OrderStatusBadge cần được điều chỉnh để dùng class Bootstrap nếu cần,
                                    hoặc giữ nguyên Tailwind nếu bạn có PostCSS xử lý Tailwind trong project.
                                    Ví dụ Bootstrap badge:
                                    <span className={`badge ${getStatusBadgeClass(order.status)}`}>{t(`orderStatus.${order.status?.toLowerCase()}`, order.status)}</span>
                                */}
                            </td>
                            <td className="px-3 py-2 text-end fw-medium">{formatPrice(order.total_amount)}</td>
                            <td className="px-3 py-2 text-end">
                                <Link
                                    to={`/account/orders/${order.id}`}
                                    className="btn btn-outline-dark btn-sm py-1 px-2" // Nút nhỏ hơn
                                    style={{fontSize: '0.75rem'}} // Cỡ chữ nhỏ hơn cho nút
                                >
                                    {t('orders.viewDetails')}
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
// Helper function for Bootstrap status badge (nếu bạn không dùng OrderStatusBadge hiện tại)
// const getStatusBadgeClass = (status) => {
//     switch (status?.toUpperCase()) {
//         case 'PENDING': return 'bg-warning text-dark';
//         case 'PROCESSING': return 'bg-info text-dark';
//         case 'SHIPPED': return 'bg-primary';
//         case 'DELIVERED': return 'bg-success';
//         case 'CANCELLED': case 'FAILED': return 'bg-danger';
//         case 'RETURNED': case 'REFUNDED': return 'bg-secondary';
//         default: return 'bg-light text-dark';
//     }
// };


const OrderHistoryPage = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const itemsPerPage = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE_DEFAULT), 10);

    const { data, loading, error } = useQuery(GET_MY_ORDERS_QUERY, {
        variables: {
            offset: (currentPage - 1) * itemsPerPage,
            limit: itemsPerPage,
            // sortBy: 'sale_date', // Mặc định sắp xếp theo ngày bán
            // sortOrder: 'DESC',   // Mới nhất lên trước
        },
        fetchPolicy: 'cache-and-network',
    });

    const handlePageChange = (newPage) => {
        setSearchParams({ page: newPage.toString(), limit: itemsPerPage.toString() });
        window.scrollTo(0, 0);
    };

    // Backend của bạn cần trả về cấu trúc có chứa danh sách đơn hàng và tổng số đơn hàng
    // Ví dụ: data = { myOrders: { orders: [...], totalCount: N } }
    // Hoặc data = { myOrders: [...] } và một query khác để lấy totalCount.
    // Giả sử data.myOrders là một mảng các đơn hàng và không có totalCount riêng.
    // Trong trường hợp này, phân trang sẽ chỉ dựa trên dữ liệu hiện tại.
    // Để phân trang đúng, backend NÊN trả về totalCount.

    const orders = data?.myOrders || []; // Nếu backend trả về mảng trực tiếp
    // const orders = data?.myOrders?.orders || []; // Nếu backend trả về object có key 'orders'
    
    // Giả sử backend không trả về totalCount, chúng ta sẽ không biết tổng số trang chính xác.
    // Để Pagination hoạt động tốt nhất, totalItems nên là tổng số đơn hàng thực tế.
    // Nếu backend có phân trang và trả về totalCount:
    // const totalOrders = data?.myOrders?.totalCount || 0;
    // Nếu không, và bạn muốn phân trang chỉ trên client-side của batch hiện tại (ít phổ biến cho lịch sử đơn hàng):
    const totalOrders = data?.myOrdersTotalCount || orders.length; // Cần một query khác hoặc backend trả về totalCount
                                                                // Tạm thời dùng orders.length nếu không có totalCount

    return (
        <div>
            <h2 className="h5 fw-bold text-dark mb-4">
                {t('orderHistory.title', 'Lịch sử đơn hàng')}
            </h2>
            <div className="card shadow-sm border-0"> {/* Card bọc ngoài */}
                <div className="card-body p-0"> {/* Bỏ padding của card-body để table chiếm toàn bộ */}
                    <OrderHistoryTable orders={orders} loading={loading && !data} error={error} t={t} />
                </div>
                {totalOrders > itemsPerPage && !loading && orders.length > 0 && (
                    <div className="card-footer bg-white border-top-0 py-3 px-3"> {/* Footer cho pagination */}
                        <Pagination
                            currentPage={currentPage}
                            totalItems={totalOrders} // Cần tổng số item thực tế
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                            className="justify-content-center justify-content-md-end mb-0" // Căn phải trên desktop
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistoryPage;
