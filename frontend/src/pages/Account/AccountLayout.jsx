// src/pages/Account/AccountLayout.jsx
import React from 'react';
import { Container, Row, Col, Nav, Card } from 'react-bootstrap'; // Thêm Card
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './AccountLayout.css'; // Import CSS riêng

function AccountLayout() {
  const { logout, userInfo } = useAuth(); // Lấy thêm userInfo để hiển thị tên
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // Chuyển về trang chủ sau khi logout
  };

  return (
    <Container className="my-4 my-md-5 account-layout">
      <Row>
        {/* Cột Menu Account */}
        <Col md={4} lg={3} className="mb-4 mb-md-0">
          {/* Sử dụng Card để bọc Nav cho đẹp hơn và nhất quán với các card khác */}
          <Card className="account-nav-card shadow-sm">
            <Card.Header className="account-nav-header">
              {/* Hiển thị tên người dùng nếu có */}
              <h5 className="mb-0 account-nav-greeting">Xin chào, {userInfo?.customer_name || 'Bạn'}!</h5>
            </Card.Header>
            <Nav className="flex-column p-3">
              <Nav.Link as={NavLink} to="/account" end className="account-nav-link">
                <i className="bi bi-person-circle me-2"></i> Thông tin tài khoản
              </Nav.Link>
              <Nav.Link as={NavLink} to="/account/orders" className="account-nav-link">
                <i className="bi bi-receipt-cutoff me-2"></i> Lịch sử đơn hàng
              </Nav.Link>
              {/* <Nav.Link as={NavLink} to="/account/addresses" className="account-nav-link">
                <i className="bi bi-geo-alt me-2"></i> Địa chỉ của tôi
              </Nav.Link>
              <Nav.Link as={NavLink} to="/account/change-password" className="account-nav-link">
                <i className="bi bi-shield-lock me-2"></i> Đổi mật khẩu
              </Nav.Link> */}
              <Nav.Link onClick={handleLogout} className="account-nav-link text-danger mt-3">
                <i className="bi bi-box-arrow-right me-2"></i> Đăng xuất
              </Nav.Link>
            </Nav>
          </Card>
        </Col>

        {/* Cột Nội dung Trang con */}
        <Col md={8} lg={9}>
          {/* Nội dung trang con sẽ được render vào <Outlet /> */}
          <Outlet />
        </Col>
      </Row>
    </Container>
  );
}

export default AccountLayout;