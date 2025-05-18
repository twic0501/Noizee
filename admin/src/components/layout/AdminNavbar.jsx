// admin-frontend/src/components/layout/Navbar.jsx
import React from 'react';
import { Navbar, Nav, NavDropdown, Container, Button, ButtonGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Giả sử bạn có hook này
// import { useLanguage } from '../../contexts/LanguageContext'; // Nếu bạn tạo LanguageContext

// Key để lưu ngôn ngữ admin chọn trong localStorage
const ADMIN_LANGUAGE_KEY = 'admin_preferred_lang';

function AdminNavbar() {
    const { authState, logout } = useAuth ? useAuth() : { authState: {}, logout: () => {} }; // Xử lý nếu useAuth không tồn tại
    const navigate = useNavigate();
    // const { language, setLanguage } = useLanguage ? useLanguage() : { language: 'vi', setLanguage: () => {} }; // Nếu dùng LanguageContext

    // Lấy ngôn ngữ hiện tại từ localStorage hoặc mặc định là 'vi'
    const currentLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';

    const handleLogout = () => {
        if (logout) logout();
        navigate('/login');
    };

    const handleLanguageChange = (lang) => {
        localStorage.setItem(ADMIN_LANGUAGE_KEY, lang);
        // if (setLanguage) setLanguage(lang); // Nếu dùng LanguageContext
        window.location.reload(); // Tải lại trang để áp dụng ngôn ngữ mới (cách đơn giản)
                                  // Hoặc bạn có thể dùng một cơ chế phức tạp hơn để cập nhật UI mà không reload
    };

    const adminName = localStorage.getItem('admin_name') || authState?.adminName || 'Admin';

    return (
        <Navbar bg="light" expand="lg" className="shadow-sm">
            <Container fluid>
                <Navbar.Brand as={Link} to="/dashboard">Admin Dashboard</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {/* Các mục menu khác có thể thêm ở đây nếu cần */}
                    </Nav>
                    <Nav>
                        {/* Language Switcher */}
                        <ButtonGroup size="sm" className="me-3">
                            <Button
                                variant={currentLang === 'vi' ? 'primary' : 'outline-secondary'}
                                onClick={() => handleLanguageChange('vi')}
                            >
                                VI
                            </Button>
                            <Button
                                variant={currentLang === 'en' ? 'primary' : 'outline-secondary'}
                                onClick={() => handleLanguageChange('en')}
                            >
                                EN
                            </Button>
                        </ButtonGroup>

                        <NavDropdown title={adminName} id="admin-nav-dropdown" align="end">
                            {/* <NavDropdown.Item as={Link} to="/profile">My Profile</NavDropdown.Item> */}
                            {/* <NavDropdown.Item as={Link} to="/settings">Settings</NavDropdown.Item> */}
                            {/* <NavDropdown.Divider /> */}
                            <NavDropdown.Item onClick={handleLogout}>
                                Logout
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default AdminNavbar;
