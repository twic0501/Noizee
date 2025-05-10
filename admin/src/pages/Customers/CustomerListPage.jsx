// src/pages/Customers/CustomerListPage.jsx
import React, { useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { Container, Row, Col, Form, InputGroup, Button } from 'react-bootstrap'; // Thêm Form, InputGroup, Button nếu cần filter
import CustomerTable from '../../components/customers/CustomerTable';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { GET_ADMIN_USERS_QUERY } from '../../api/queries/userQueries';
import useDataTable from '../../hooks/useDataTable';
import logger from '../../utils/logger';

const DEFAULT_LIMIT = 15;

function CustomerListPage() {
    const {
        currentPage, limit, offset, filters, totalItems, totalPages,
        handlePageChange, applyFilters, resetFilters, setTotalItems,
    } = useDataTable({
        initialLimit: DEFAULT_LIMIT,
        initialFilters: { searchTerm: '', isAdmin: '' } // Ví dụ filter ban đầu
    });

    const { loading, error, data, refetch } = useQuery(GET_ADMIN_USERS_QUERY, {
        variables: {
            limit: limit,
            offset: offset,
            // GraphQL backend cần hỗ trợ filter object này
            // filter: {
            //     searchTerm: filters.searchTerm || undefined, // Gửi undefined nếu rỗng để backend bỏ qua
            //     isAdmin: filters.isAdmin !== '' ? filters.isAdmin === 'true' : undefined
            // }
        },
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        onCompleted: (queryData) => {
            setTotalItems(queryData?.adminGetAllUsers?.count || 0);
        },
        onError: (err) => logger.error("Error fetching customers:", err)
    });

    // Callback cho component filter (nếu bạn tạo component filter riêng)
    const handleFilterChange = useCallback((newFilters) => {
        applyFilters(newFilters);
    }, [applyFilters]);

    const handleLocalFilterChange = (e) => {
        const { name, value } = e.target;
        applyFilters({ ...filters, [name]: value });
    };

    const handleResetFilters = useCallback(() => {
        resetFilters(); // Gọi hàm từ hook
        // Sau đó refetch hoặc để useQuery tự refetch khi filters thay đổi
    }, [resetFilters]);


    // TODO: Thêm các chức năng quản lý user (tạo, sửa, xóa, thay đổi quyền) nếu cần
    // sẽ yêu cầu thêm Mutations và Modals.

    return (
        <Container fluid className="p-3">
            <Row className="align-items-center mb-3">
                <Col><h1 className="h3 mb-0">Manage Customers & Admins</h1></Col>
                 <Col xs="auto">
                    <Button variant="primary" onClick={() => { /* TODO: Show create user modal */ }}>
                        <i className="bi bi-plus-lg me-1"></i> Add New User
                    </Button>
                </Col> 
            </Row>

            {/* Example Filter UI (Inline) - Có thể tách ra component CustomerFilters.jsx */}
            <Card className="p-3 mb-3 bg-light shadow-sm">
                <Form>
                    <Row className="g-2">
                        <Col md={5}>
                            <Form.Group controlId="customerSearchTerm">
                                <Form.Label visuallyHidden>Search Customers</Form.Label>
                                <InputGroup>
                                     <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        name="searchTerm"
                                        placeholder="Search by Name, Email, Phone..."
                                        value={filters.searchTerm || ''}
                                        onChange={handleLocalFilterChange}
                                    />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                             <Form.Group controlId="customerFilterIsAdmin">
                                <Form.Label visuallyHidden>Filter by Role</Form.Label>
                                <Form.Select
                                    name="isAdmin"
                                    value={filters.isAdmin === undefined ? '' : String(filters.isAdmin)}
                                    onChange={handleLocalFilterChange}
                                >
                                    <option value="">All Roles</option>
                                    <option value="false">Customer</option>
                                    <option value="true">Admin</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md="auto">
                            <Button variant="outline-secondary" onClick={handleResetFilters} className="w-100">
                                Reset Filters
                            </Button>
                        </Col>
                         {/* Nút "Apply" có thể không cần nếu filter áp dụng ngay khi thay đổi */}
                    </Row>
                </Form>
            </Card>


            {loading && !data && <LoadingSpinner message="Loading users..." />}
            {error && <AlertMessage variant="danger">Error loading users: {error.message}</AlertMessage>}

            {data?.adminGetAllUsers?.users && (
                <>
                    <CustomerTable customers={data.adminGetAllUsers.users || []} />
                    {totalItems > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                     <div className="text-center text-muted small mt-1">
                        Showing {data.adminGetAllUsers.users.length} of {totalItems} users.
                    </div>
                </>
            )}
             {!loading && !error && totalItems === 0 && (
                <AlertMessage variant="info" className="mt-3">
                    No users found matching your criteria.
                </AlertMessage>
            )}
        </Container>
    );
}

export default CustomerListPage;