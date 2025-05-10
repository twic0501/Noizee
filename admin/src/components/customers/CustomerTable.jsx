import React from 'react';
// import { Link } from 'react-router-dom';
import { Table, Button, Badge } from 'react-bootstrap';
import { formatCurrency } from '../../utils/formatters';

// Component hiển thị bảng danh sách khách hàng
function CustomerTable({ customers = [] }) { // Nhận danh sách customers qua props
    if (!customers || customers.length === 0) {
        return <p>No customers found.</p>;
    }
    return (
        <Table striped bordered hover responsive="lg" size="sm">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Virtual Balance</th>
                    <th>Is Admin</th>
                    {/* <th>Actions</th> */}
                </tr>
            </thead>
            <tbody>
                {customers.map((customer) => (
                    <tr key={customer.customer_id}>
                        <td>{customer.customer_id}</td>
                        <td>{customer.customer_name}</td>
                        <td>{customer.customer_email}</td>
                        <td>{customer.customer_tel}</td>
                        <td>{formatCurrency(customer.virtual_balance)}</td>
                        <td>
                            {customer.isAdmin ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>}
                        </td>
                        {/* <td> */}
                            {/* Thêm Actions nếu có chức năng edit/view orders */}
                            {/* <Link to={`/customers/${customer.customer_id}/orders`} className="btn btn-sm btn-outline-secondary me-1" title="View Orders">
                                <i className="bi bi-list-ul"></i>
                            </Link>
                            <Button variant="outline-warning" size="sm" title="Adjust Balance (Needs API)">
                                <i className="bi bi-currency-dollar"></i>
                            </Button> */}
                        {/* </td> */}
                    </tr>
                ))}
            </tbody>
        </Table>
    );
}

export default CustomerTable;