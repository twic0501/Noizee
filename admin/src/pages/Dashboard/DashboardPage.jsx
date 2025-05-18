        // admin-frontend/src/pages/Dashboard/DashboardPage.jsx
        import React from 'react';
        import { useQuery, gql } from '@apollo/client';
        import { Container, Row, Col, Button, Card, Breadcrumb } from 'react-bootstrap';
        import StatCard from '../../components/dashboard/StatCard';
        import MiniOrderTable from '../../components/dashboard/MiniOrderTable';
        import SalesChart from '../../components/dashboard/SalesChart';
        import LoadingSpinner from '../../components/common/LoadingSpinner';
        import AlertMessage from '../../components/common/AlertMessage';
        import { formatCurrency, formatDate } from '../../utils/formatters'; // Thêm formatDate
        import logger from '../../utils/logger';
        import { Link } from 'react-router-dom';

        // Query này nên được chuyển ra file riêng: src/api/graphql/queries/dashboardQueries.js
        const GET_DASHBOARD_DATA = gql`
          query GetAdminDashboardData {
            adminDashboardStats {
              totalUsers
              totalSalesAmount
              totalOrders
              # totalProducts # Ví dụ thêm
              # totalBlogPosts # Ví dụ thêm
            }
            adminGetAllSales(limit: 5, offset: 0) { # Lấy 5 đơn hàng mới nhất
              sales {
                sale_id
                sale_date
                sale_status
                customer {
                  customer_id
                  customer_name
                }
                totals {
                  total_amount
                }
              }
            }
            # Ví dụ dữ liệu cho biểu đồ (backend cần cung cấp)
            # salesRevenueOverTime(period: "LAST_30_DAYS") {
            #   date # format YYYY-MM-DD
            #   revenue
            # }
          }
        `;

        function DashboardPage() {
            const { loading, error, data, refetch } = useQuery(GET_DASHBOARD_DATA, {
                fetchPolicy: 'cache-and-network',
                onError: (err) => {
                    logger.error("Error fetching dashboard data:", err);
                }
            });

            if (loading && !data) return (
                <Container fluid className="p-3 p-md-4"><LoadingSpinner message="Đang tải dữ liệu dashboard..." /></Container>
            );
            
            const stats = data?.adminDashboardStats;
            const recentOrders = data?.adminGetAllSales?.sales || [];
            // const salesChartDataRaw = data?.salesRevenueOverTime || [];

            // Xử lý dữ liệu cho biểu đồ (ví dụ)
            // const salesChartProcessedData = {
            //     labels: salesChartDataRaw.map(d => formatDate(d.date, 'dd/MM')),
            //     values: salesChartDataRaw.map(d => d.revenue),
            // };
            const salesChartPlaceholderData = { // Dữ liệu mẫu cho biểu đồ
                labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                values: [1200000, 1900000, 3000000, 5000000, 2300000, 3200000, 4500000]
            };


            return (
                <> {/* Sử dụng Fragment vì AdminLayout đã có Container fluid */}
                    <Breadcrumb className="mb-3">
                        <Breadcrumb.Item active>Dashboard</Breadcrumb.Item>
                    </Breadcrumb>
                    <Row className="align-items-center mb-4">
                        <Col>
                            <h1 className="h3 mb-0 text-dark-blue">Tổng quan Dashboard</h1>
                        </Col>
                        <Col xs="auto">
                            <Button variant="outline-primary" size="sm" onClick={() => refetch()} disabled={loading}>
                                <i className="bi bi-arrow-clockwise me-1"></i> Làm mới
                            </Button>
                        </Col>
                    </Row>

                    {error && (
                         <AlertMessage variant="warning" dismissible className="mb-3">
                            Lỗi cập nhật dữ liệu dashboard: {error.message} Một số dữ liệu có thể đã cũ.
                        </AlertMessage>
                    )}

                    <Row>
                        <Col md={6} xl={3} className="mb-4">
                            <StatCard
                                title="Tổng Doanh thu"
                                value={stats ? formatCurrency(stats.totalSalesAmount) : (loading ? '...' : 'N/A')}
                                iconClass="bi-cash-coin"
                                colorVariant="success"
                                isLoading={loading && !stats}
                                linkTo="/orders"
                            />
                        </Col>
                        <Col md={6} xl={3} className="mb-4">
                            <StatCard
                                title="Tổng Đơn hàng"
                                value={stats ? (stats.totalOrders?.toString() ?? 'N/A') : (loading ? '...' : 'N/A')}
                                iconClass="bi bi-cart-check-fill"
                                colorVariant="primary"
                                isLoading={loading && !stats}
                                linkTo="/orders"
                            />
                        </Col>
                        <Col md={6} xl={3} className="mb-4">
                            <StatCard
                                title="Khách hàng"
                                value={stats ? (stats.totalUsers?.toString() ?? 'N/A') : (loading ? '...' : 'N/A')}
                                iconClass="bi bi-people-fill"
                                colorVariant="info"
                                isLoading={loading && !stats}
                                linkTo="/customers"
                            />
                        </Col>
                         <Col md={6} xl={3} className="mb-4">
                            <StatCard
                                title="Bài viết Blog"
                                value={stats?.totalBlogPosts?.toString() ?? (loading ? '...' : 'N/A')} // Giả sử có totalBlogPosts
                                iconClass="bi bi-pencil-square"
                                colorVariant="purple" // Bạn có thể định nghĩa màu này trong CSS
                                isLoading={loading && !stats}
                                linkTo="/blog/posts"
                            />
                        </Col>
                    </Row>

                    <Row>
                        <Col lg={7} className="mb-4">
                            <SalesChart
                                data={salesChartPlaceholderData} // Thay bằng salesChartProcessedData khi có API
                                title="Doanh số 7 ngày qua (Ví dụ)"
                                type="line" // hoặc 'bar'
                            />
                        </Col>
                        <Col lg={5} className="mb-4">
                            <MiniOrderTable
                                orders={recentOrders}
                                title="Đơn hàng Gần đây"
                                maxRows={5}
                            />
                             {loading && recentOrders.length === 0 && !error && (
                                 <LoadingSpinner message="Đang tải đơn hàng..." />
                             )}
                             {error && recentOrders.length === 0 && (
                                <AlertMessage variant="warning" className="mt-2">Không thể tải đơn hàng gần đây.</AlertMessage>
                            )}
                        </Col>
                    </Row>
                </>
            );
        }

        export default DashboardPage;
        