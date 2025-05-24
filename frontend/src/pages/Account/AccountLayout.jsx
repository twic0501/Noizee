// src/pages/Account/AccountLayout.jsx
import React from 'react';
import { Container, Row, Col, Nav, Card } from 'react-bootstrap';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'; // Thêm useParams
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
import './AccountLayout.css';

function AccountLayout() {
  const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
  const { logout, userInfo } = useAuth();
  const navigate = useNavigate();
  const params = useParams(); // Để lấy lang từ URL cho các link
  const currentLang = params.lang || i18n.language || 'vi';

  const handleLogout = () => {
    logout();
    navigate(`/${currentLang}/`); // Chuyển về trang chủ theo ngôn ngữ hiện tại
  };

  // Helper để tạo link với prefix ngôn ngữ
  const langLink = (path) => `/${currentLang}/account${path}`.replace(/\/+/g, '/');

  return (
    <Container className="my-4 my-md-5 account-layout">
      <Row>
        <Col md={4} lg={3} className="mb-4 mb-md-0">
          <Card className="account-nav-card shadow-sm">
            <Card.Header className="account-nav-header">
              <h5 className="mb-0 account-nav-greeting">
                {/* Sử dụng key dịch với biến */}
                {t('accountLayout.greeting', { name: userInfo?.customer_name || t('accountLayout.defaultUser') })}
              </h5>
            </Card.Header>
            <Nav className="flex-column p-3">
              <Nav.Link as={NavLink} to={langLink("")} end className="account-nav-link">
                <i className="bi bi-person-circle me-2"></i> {t('accountLayout.profileLink')}
              </Nav.Link>
              <Nav.Link as={NavLink} to={langLink("/orders")} className="account-nav-link">
                <i className="bi bi-receipt-cutoff me-2"></i> {t('accountLayout.orderHistoryLink')}
              </Nav.Link>
              {/* <Nav.Link as={NavLink} to={langLink("/addresses")} className="account-nav-link">
                <i className="bi bi-geo-alt me-2"></i> {t('accountLayout.addressesLink')}
              </Nav.Link>
              <Nav.Link as={NavLink} to={langLink("/change-password")} className="account-nav-link">
                <i className="bi bi-shield-lock me-2"></i> {t('accountLayout.changePasswordLink')}
              </Nav.Link> 
              */}
              <Nav.Link onClick={handleLogout} className="account-nav-link text-danger mt-3">
                <i className="bi bi-box-arrow-right me-2"></i> {t('accountLayout.logoutButton')}
              </Nav.Link>
            </Nav>
          </Card>
        </Col>
        <Col md={8} lg={9}>
          <Outlet /> {/* Nội dung trang con sẽ được render ở đây */}
        </Col>
      </Row>
    </Container>
  );
}

export default AccountLayout;