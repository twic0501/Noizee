// src/pages/Account/OrderHistoryPage.jsx
import React from 'react';
import { Card, Table, Button } from 'react-bootstrap';
import { useQuery } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { GET_MY_SALES_QUERY } from '../../api/graphql/queries/userQueries';
import { AlertMessage, LoadingSpinner, Pagination} from '@noizee/ui-components';
import useDataTable from '../../hooks/useDataTable';
import { formatCurrency, formatDate } from '@noizee/shared-utils';
// import OrderStatusBadge from '../../components/orders/OrderStatusBadge'; // <<< XÓA HOẶC COMMENT DÒNG NÀY

const PAGE_LIMIT = 10;

function OrderHistoryPage() {
    const navigate = useNavigate();
    const {
        currentPage,
        limit,
        offset,
        handlePageChange,
        setTotalItems,
        totalPages,
    } = useDataTable({ initialLimit: PAGE_LIMIT });

    const { loading, error, data } = useQuery(GET_MY_SALES_QUERY, {
        variables: { limit, offset },
        fetchPolicy: 'cache-and-network',
        onCompleted: (queryData) => {
             const count = queryData?.mySales?.count;
             if (typeof count === 'number') {
                 setTotalItems(count);
             } else {
                 console.warn("Pagination count not received from mySales query.");
                 setTotalItems(0);
             }
        },
        onError: (err) => {
            console.error("Error fetching order history:", err);
        }
    });

    const sales = data?.mySales?.sales || [];

    const handleViewOrder = (saleId) => {
        navigate(`/account/orders/${saleId}`);
    };

    const errorMessage = error ? `Error loading orders. Please try again later. (${error.message})` : null;

    return (
        <Card className="shadow-sm">
            <Card.Header><h5 className="mb-0">Lịch sử đơn hàng</h5></Card.Header>
            <Card.Body>
                {loading && <LoadingSpinner message="Đang tải đơn hàng..." />}
                {errorMessage && <AlertMessage variant="danger">{errorMessage}</AlertMessage>}
                {!loading && !error && sales.length === 0 && (
                    <AlertMessage variant="info">Bạn chưa có đơn hàng nào.</AlertMessage>
                )}
                {!loading && !error && sales.length > 0 && (
                    <>
                        <Table responsive striped hover size="sm" className="order-history-table">
                            <thead>
                                <tr>
                                    <th>Mã ĐH</th>
                                    <th>Ngày đặt</th>
                                    <th>Trạng thái</th>
                                    <th className="text-end">Tổng tiền</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(sale => (
                                    <tr key={sale.sale_id}>
                                        <td>#{sale.sale_id}</td>
                                        <td>{formatDate(sale.sale_date)}</td>
                                        <td>
                                             {/* <OrderStatusBadge status={sale.sale_status} /> */} {/* <<< XÓA HOẶC COMMENT DÒNG NÀY */}
                                             {sale.sale_status} {/* Hiển thị tạm trạng thái bằng text */}
                                        </td>
                                        <td className="text-end">{formatCurrency(sale.totals?.total_amount)}</td>
                                        <td>
                                            <Button
                                                variant="outline-dark"
                                                size="sm"
                                                onClick={() => handleViewOrder(sale.sale_id)}
                                            >
                                                Xem
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </Card.Body>
        </Card>
    );
}

export default OrderHistoryPage;