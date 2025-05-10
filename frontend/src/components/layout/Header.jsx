// src/components/layout/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useScrollPosition } from '../../hooks/useScrollPosition';
import './Header.css'; // File CSS riêng cho Header

// Logo Placeholder (Thay bằng component/ảnh logo thật)
const Logo = () => (
    <Link to="/" className="navbar-brand logo-text"> {/* CSS: Add Archivo Black font */}
        NOIZEE
    </Link>
);

function Header() {
    const location = useLocation();
    const isScrolled = useScrollPosition(50); // Ngưỡng scroll để thay đổi header (vd: 50px)

    // Kiểm tra xem có phải trang New Arrivals không
    const isNewArrivalsPage = location.pathname === '/'; // Hoặc path khác nếu trang chủ là trang khác

    // State cho trạng thái header (trong suốt hoặc trắng)
    const [isHeaderWhite, setIsHeaderWhite] = useState(!isNewArrivalsPage); // Mặc định trắng nếu ko phải trang chủ
    // State cho việc hiển thị menubar (chỉ áp dụng cho trang New Arrivals)
    const [showMenuBar, setShowMenuBar] = useState(!isNewArrivalsPage);

    useEffect(() => {
        if (isNewArrivalsPage) {
            // Ở trang New Arrivals:
            // - Header trắng và hiện menu khi cuộn xuống
            // - Header trong suốt và ẩn menu khi ở trên cùng
            setIsHeaderWhite(isScrolled);
            setShowMenuBar(isScrolled);
        } else {
            // Ở các trang khác, header luôn trắng và hiện menu
            setIsHeaderWhite(true);
            setShowMenuBar(true);
        }
    }, [isScrolled, isNewArrivalsPage]);

    // Menu Items
    const menuItems = [
        { path: "/", name: "New arrivals" },       // Trang chủ
        { path: "/collections", name: "Collections" }, // Ánh xạ tới trang collections
        { path: "/accessories", name: "Accessories" },
        { path: "/the-noizee", name: "The Noizee" },  // Ánh xạ tới trang The Noizee
        // { path: "/about", name: "About us" }, // Xem xét lại mapping này
    ];

    return (
        <Navbar
            expand="lg"
            fixed="top" // Giữ header ở trên cùng
            className={`
                main-header
                ${isHeaderWhite ? 'header-white' : 'header-transparent'}
                ${showMenuBar ? 'menu-visible' : 'menu-hidden'}
            `} /* CSS: Add transition effect */
        >
            <Container fluid className="header-container"> {/* CSS: Có thể cần custom container */}
                {/* Logo bên trái */}
                <Logo />

                {/* Navbar Toggler for mobile */}
                <Navbar.Toggle aria-controls="basic-navbar-nav" />

                {/* Navbar Collapse */}
                <Navbar.Collapse id="basic-navbar-nav">
                    {/* Menu ở giữa (chỉ hiển thị khi showMenuBar là true) */}
                    <Nav className={`mx-auto main-menu ${!showMenuBar && isNewArrivalsPage ? 'd-none' : ''}`}>
                      {/* CSS: Thêm font Oswald, style active */}
                      {menuItems.map(item => (
                          <NavLink key={item.path} to={item.path} className="nav-link">
                              {item.name}
                          </NavLink>
                      ))}
                    </Nav>

                    {/* Icons bên phải */}
                    <Nav className="header-icons"> {/* CSS: Style các icon */}
                        <Nav.Link href="#search" title="Search"> {/* TODO: Implement search */}
                            <i className="bi bi-search"></i>
                        </Nav.Link>
                        <Nav.Link as={Link} to="/account" title="Account"> {/* TODO: Kiểm tra đăng nhập để link đến login/account */}
                            <i className="bi bi-person"></i>
                        </Nav.Link>
                        <Nav.Link as={Link} to="/cart" title="Cart">
                            <i className="bi bi-cart3"></i>
                            {/* TODO: Hiển thị số lượng item trong giỏ hàng */}
                            {/* <span className="cart-count">0</span> */}
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Header;