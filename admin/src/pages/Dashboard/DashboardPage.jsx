// src/pages/Dashboard/DashboardPage.jsx
import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { Container, Row, Col, Button } from 'react-bootstrap';
import StatCard from '../../components/dashboard/StatCard';
import MiniOrderTable from '../../components/dashboard/MiniOrderTable';
import SalesChart from '../../components/dashboard/SalesChart';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { formatCurrency } from '../../utils/formatters';
import logger from '../../utils/logger';

// Di chuyển query này ra file riêng (ví dụ: src/api/graphql/queries/dashboardQueries.js) là tốt nhất
const GET_DASHBOARD_DATA = gql`
  query GetAdminDashboardData {
    adminDashboardStats {
      totalUsers
      totalSalesAmount
      totalOrders
      # pendingOrdersCount # Thêm field này vào typeDefs và resolver backend nếu cần
    }
    adminGetAllSales(limit: 5, offset: 0, filter: {}) { # Bỏ filter nếu không cần thiết cho Recent Orders
      sales {
        sale_id
        sale_date
        sale_status
        customer {
          customer_name
        }
        totals {
          total_amount
        }
      }
      # count
    }
    # salesRevenueOverTime(period: "LAST_7_DAYS") {
    #   date
    #   revenue
    # }
  }
`;

function DashboardPage() {
    const { loading, error, data, refetch } = useQuery(GET_DASHBOARD_DATA, {
        fetchPolicy: 'cache-and-network',
        onError: (err) => {
            // Dòng log này đã có trong log bạn gửi:
            logger.error("Error fetching dashboard data:", err);
        }
    });

    if (loading && !data) return <LoadingSpinner message="Loading dashboard data..." />;
    // Hiển thị lỗi chỉ khi không có data nào được cache và query bị lỗi
    if (error && !data) {
        return (
            <Container fluid className="p-3">
                <AlertMessage variant="danger">
                    Could not load dashboard data: {error.message}
                    <Button onClick={() => refetch()} variant="link" size="sm" className="ms-2">Try again</Button>
                </AlertMessage>
            </Container>
        );
    }

    const stats = data?.adminDashboardStats;
    const recentOrders = data?.adminGetAllSales?.sales || [];

    const chartDataExample = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: [120, 190, 300, 500, 230, 320, 450]
    };

    return (
        <Container fluid className="p-3">
            <Row className="align-items-center mb-3">
                <Col>
                    <h1 className="h3 mb-0">Dashboard Overview</h1>
                </Col>
                <Col xs="auto">
                    <Button variant="outline-primary" size="sm" onClick={() => refetch()} disabled={loading}>
                        <i className="bi bi-arrow-clockwise me-1"></i> Refresh Data
                    </Button>
                </Col>
            </Row>

            {/* Hiển thị lỗi nếu có lỗi nhưng vẫn có một phần data (từ cache) */}
            {error && data && (
                 <AlertMessage variant="warning" dismissible className="mb-3">
                    Error updating dashboard data: {error.message} Some data might be outdated.
                </AlertMessage>
            )}

            <Row>
                <Col md={6} xl={3} className="mb-3">
                    <StatCard
                        title="Total Revenue"
                        value={stats ? formatCurrency(stats.totalSalesAmount) : (loading ? '...' : 'N/A')}
                        iconClass="bi-cash-coin"
                        colorVariant="success"
                        isLoading={loading && !stats}
                    />
                </Col>
                <Col md={6} xl={3} className="mb-3">
                    <StatCard
                        title="Total Orders"
                        value={stats ? (stats.totalOrders?.toString() ?? 'N/A') : (loading ? '...' : 'N/A')}
                        iconClass="bi-cart-check-fill"
                        colorVariant="primary"
                        isLoading={loading && !stats}
                    />
                </Col>
                <Col md={6} xl={3} className="mb-3">
                    <StatCard
                        title="Total Customers"
                        value={stats ? (stats.totalUsers?.toString() ?? 'N/A') : (loading ? '...' : 'N/A')}
                        iconClass="bi-people-fill"
                        colorVariant="info"
                        isLoading={loading && !stats}
                    />
                </Col>
                <Col md={6} xl={3} className="mb-3">
                    <StatCard
                        title="Pending Orders"
                        value={stats ? (stats.pendingOrdersCount?.toString() ?? "N/A") : (loading ? '...' : 'N/A')}
                        iconClass="bi-hourglass-split"
                        colorVariant="warning"
                        isLoading={loading && !stats}
                    />
                </Col>
            </Row>

            <Row>
                <Col lg={7} className="mb-3">
                    <SalesChart
                        data={chartDataExample}
                        title="Sales Overview (Sample Data)"
                        type="bar"
                    />
                </Col>
                <Col lg={5} className="mb-3">
                    <MiniOrderTable
                        orders={recentOrders}
                        title="Recent Orders"
                        maxRows={5}
                    />
                     {loading && recentOrders.length === 0 && (
                         <LoadingSpinner message="Loading recent orders..." />
                     )}
                     {error && recentOrders.length === 0 && (
                        <AlertMessage variant="warning" className="mt-2">Could not load recent orders.</AlertMessage>
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default DashboardPage;