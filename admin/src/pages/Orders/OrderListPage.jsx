// src/pages/Orders/OrderListPage.jsx
import React, { useCallback } from 'react'; // Removed useState as filters are now fully managed by useDataTable
import { useQuery } from '@apollo/client';
import { Container, Row, Col } from 'react-bootstrap';
import OrderTable from '../../components/orders/OrderTable';
import OrderFilters from '../../components/orders/OrderFilters';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { GET_ADMIN_SALES_QUERY } from '../../api/queries/orderQueries';
import useDataTable from '../../hooks/useDataTable';
import logger from '../../utils/logger';

const DEFAULT_LIMIT = 15;

function OrderListPage() {
    const {
        currentPage,
        limit,
        offset,
        filters, // 'filters' from useDataTable will be the source of truth for OrderFilters
        applyFilters, // Renamed from setFilters for clarity
        resetFilters,
        setTotalItems,
        totalPages,
        totalItems,
        handlePageChange
    } = useDataTable({ initialLimit: DEFAULT_LIMIT, initialFilters: {} }); // Start with empty initial filters

    const { loading, error, data, refetch } = useQuery(GET_ADMIN_SALES_QUERY, {
        variables: { limit, offset, filter: filters }, // Use 'filters' directly from useDataTable
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        onCompleted: (queryData) => {
            setTotalItems(queryData?.adminGetAllSales?.count || 0);
        },
        onError: (err) => {
            logger.error("Error fetching orders:", err);
            // Consider setting an error state to display in AlertMessage
        }
    });

    // This function is now passed directly to OrderFilters
    // It will call applyFilters from useDataTable, which updates 'filters' state and resets page.
    const handleFilterChange = useCallback((newFiltersFromComponent) => {
        applyFilters(newFiltersFromComponent);
    }, [applyFilters]);

    const handleResetFilters = useCallback(() => {
        resetFilters(); // This will also reset page via useDataTable
    }, [resetFilters]);


    return (
        <Container fluid className="p-3">
            <Row className="align-items-center mb-3">
                <Col><h1 className="h3 mb-0">Manage Orders</h1></Col>
                {/* Optional: Add a button or link if admins can create orders, though less common */}
            </Row>

            <OrderFilters
                initialFilters={filters} // Pass current filters from useDataTable
                onFilterChange={handleFilterChange} // Let OrderFilters call this to update
                onResetFilters={handleResetFilters}
            />

            {loading && !data && <LoadingSpinner message="Loading orders..." />}
            {error && <AlertMessage variant="danger">Error loading orders: {error.message}</AlertMessage>}

            {data?.adminGetAllSales?.sales && (
                <>
                    <OrderTable sales={data.adminGetAllSales.sales || []} />
                    {totalItems > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                    <div className="text-center text-muted small mt-1">
                        Showing {data.adminGetAllSales.sales.length} of {totalItems} orders.
                    </div>
                </>
            )}

            {!loading && !error && totalItems === 0 && (
                <AlertMessage variant="info" className="mt-3">
                    No orders found matching your criteria.
                </AlertMessage>
            )}
        </Container>
    );
}

export default OrderListPage;