// src/pages/Account/OrderHistoryPage.jsx
import React from 'react';
import { Card, Table, Button } from 'react-bootstrap';
import { useQuery } from '@apollo/client';
import { Link, useNavigate, useParams } from 'react-router-dom'; // Thêm useParams
import { GET_MY_SALES_QUERY } from '../../api/graphql/queries/userQueries';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import Pagination from '../../components/common/Pagination';
import useDataTable from '../../hooks/useDataTable';
import { formatCurrency, formatDate } from '../../utils/formatters';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import { ACCOUNT_ORDERS_LIMIT } from '../../utils/constants';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation

function OrderHistoryPage() {
    const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
    const navigate = useNavigate();
    const params = useParams();
    const currentLang = params.lang || i18n.language || 'vi';

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

    const langLink = (path) => `/${currentLang}${path}`.replace(/\/+/g, '/');

    const handleViewOrder = (saleId) => {
        navigate(langLink(`/account/orders/${saleId}`));
    };

    const errorMessage = error ? t('orderHistoryPage.loadError') : null;

    return (
        <Card className="shadow-sm card-page-content">
            <Card.Header><h5 className="mb-0 text-uppercase">{t('orderHistoryPage.title')}</h5></Card.Header>
            <Card.Body>
                {loading && <LoadingSpinner message={t('loadingSpinner.loading')} />}
                {errorMessage && <AlertMessage variant="danger">{errorMessage}</AlertMessage>}
                {!loading && !error && sales.length === 0 && (
                    <AlertMessage variant="info">
                        {t('orderHistoryPage.noOrders')} 
                        <Link to={langLink("/collections")}> {t('orderHistoryPage.startShoppingLink')}</Link>
                    </AlertMessage>
                )}
                {!loading && !error && sales.length > 0 && (
                    <>
                        <Table responsive hover className="order-history-table align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>{t('orderHistoryPage.orderIdHeader')}</th>
                                    <th>{t('orderHistoryPage.dateHeader')}</th>
                                    <th>{t('orderHistoryPage.statusHeader')}</th>
                                    <th className="text-end">{t('orderHistoryPage.totalAmountHeader')}</th>
                                    <th className="text-center">{t('orderHistoryPage.actionsHeader')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(sale => (
                                    <tr key={sale.sale_id}>
                                        <td>
                                            <Link to={langLink(`/account/orders/${sale.sale_id}`)} className="fw-medium text-decoration-none">
                                                #{sale.sale_id}
                                            </Link>
                                        </td>
                                        <td>{formatDate(sale.sale_date, i18n.language)}</td>
                                        <td>
                                            <OrderStatusBadge status={sale.sale_status} />
                                        </td>
                                        <td className="text-end">{formatCurrency(sale.totals?.total_amount, i18n.language)}</td>
                                        <td className="text-center">
                                            <Button
                                                variant="outline-dark"
                                                size="sm"
                                                onClick={() => handleViewOrder(sale.sale_id)}
                                                title={t('orderHistoryPage.viewDetailButtonTitle')}
                                            >
                                               <i className="bi bi-eye"></i> {t('orderHistoryPage.viewButton')}
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
                            {t('orderHistoryPage.paginationInfo', { count: sales.length, total: totalSalesCount })}
                        </div>
                    </>
                )}
            </Card.Body>
        </Card>
    );
}

export default OrderHistoryPage;
