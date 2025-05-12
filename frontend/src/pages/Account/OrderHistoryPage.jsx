// src/pages/Account/OrderHistoryPage.jsx
import React from 'react';
import { Card, Table, Button } from 'react-bootstrap';
import { useQuery } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { GET_MY_SALES_QUERY } from '../../api/graphql/queries/userQueries';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import Pagination from '../../components/common/Pagination';
import useDataTable from '../../hooks/useDataTable';
import { formatCurrency, formatDate } from '../../utils/formatters';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge'; // Bỏ comment nếu muốn dùng badge
import { ACCOUNT_ORDERS_LIMIT } from '../../utils/constants';

function OrderHistoryPage() {
    const navigate = useNavigate();
    const {
        currentPage,
        limit,
        offset,
        handlePageChange,
        setTotalItems,
        totalPages,
    } = useDataTable({ initialLimit: ACCOUNT_ORDERS_LIMIT });

    const { loading, error, data } = useQuery(GET_MY_SALES_QUERY, {
        variables: { limit, offset },
        fetchPolicy: 'cache-and-network',
        onCompleted: (queryData) => {
            const count = queryData?.mySales?.count;
            setTotalItems(typeof count === 'number' ? count : 0);
        },
        onError: (err) => {
            console.error("Error fetching order history:", err.message);
        }
    });

    const sales = data?.mySales?.sales || [];
    const totalSalesCount = data?.mySales?.count || 0;

    const handleViewOrder = (saleId) => {
        navigate(`/account/orders/${saleId}`);
    };

    const errorMessage = error ? `Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.` : null;

    return (
        <Card className="shadow-sm card-page-content">
            <Card.Header><h5 className="mb-0 text-uppercase">Lịch sử đơn hàng</h5></Card.Header>
            <Card.Body>
                {loading && <LoadingSpinner message="Đang tải đơn hàng..." />}
                {errorMessage && <AlertMessage variant="danger">{errorMessage}</AlertMessage>}
                {!loading && !error && sales.length === 0 && (
                    <AlertMessage variant="info">Bạn chưa có đơn hàng nào. <Link to="/collections">Bắt đầu mua sắm ngay!</Link></AlertMessage>
                )}
                {!loading && !error && sales.length > 0 && (
                    <>
                        <Table responsive hover className="order-history-table align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Mã ĐH</th>
                                    <th>Ngày đặt</th>
                                    <th>Trạng thái</th>
                                    <th className="text-end">Tổng tiền</th>
                                    <th className="text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(sale => (
                                    <tr key={sale.sale_id}>
                                        <td><Link to={`/account/orders/${sale.sale_id}`} className="fw-medium text-decoration-none">#{sale.sale_id}</Link></td>
                                        <td>{formatDate(sale.sale_date)}</td>
                                        <td>
                                            <OrderStatusBadge status={sale.sale_status} />
                                        </td>
                                        <td className="text-end">{formatCurrency(sale.totals?.total_amount)}</td>
                                        <td className="text-center">
                                            <Button
                                                variant="outline-dark"
                                                size="sm"
                                                onClick={() => handleViewOrder(sale.sale_id)}
                                                title="Xem chi tiết"
                                            >
                                               <i className="bi bi-eye"></i> Xem
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                         <div className="text-center text-muted small mt-2">
                            Hiển thị {sales.length} trên tổng số {totalSalesCount} đơn hàng.
                        </div>
                    </>
                )}
            </Card.Body>
        </Card>
    );
}

export default OrderHistoryPage;

/* Thêm CSS nếu cần cho .order-history-table, ví dụ:
.order-history-table th, .order-history-table td {
    font-size: 0.9rem;
}
.order-history-table th {
    font-weight: 500;
    text-transform: uppercase;
    color: var(--color-text-muted);
}
 */