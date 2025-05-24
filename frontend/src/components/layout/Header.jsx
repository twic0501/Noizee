import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useParams } from 'react-router-dom'; // Thêm useParams
import { Navbar, Nav, Container, Badge, Offcanvas } from 'react-bootstrap';
import { useScrollPosition } from '../../hooks/useScrollPosition';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import LanguageSwitcher from '../common/LoadingSpinner';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
import './Header.css';

// Logo không cần dịch, nhưng link của nó cần được cập nhật dựa trên ngôn ngữ hiện tại
const Logo = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'vi';
  return (
    <Link to={`/${currentLang}`} className="navbar-brand logo-text" aria-label="Noizee Homepage">
        NOIZEE
    </Link>
  );
};

function Header() {
    const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
    const location = useLocation();
    const params = useParams(); // Để lấy :lang từ URL

    const { isAuthenticated, userInfo } = useAuth();
    const { totalItems: cartItemCount } = useCart();

    const isScrolled = useScrollPosition(50);

    // Xác định ngôn ngữ hiện tại từ URL hoặc từ i18n fallback
    const currentLang = params.lang || i18n.language || 'vi';

    // Xác định xem có phải trang chủ không, dựa trên path sau tiền tố ngôn ngữ
    const pathAfterLang = location.pathname.startsWith(`/${currentLang}/`)
                        ? location.pathname.substring(currentLang.length + 1) // Bỏ /<lang>
                        : (location.pathname === `/${currentLang}` ? "/" : location.pathname); // Xử lý trường hợp chỉ có /<lang>

    const isHomePage = pathAfterLang === '/' || pathAfterLang === '';


    const [headerBackground, setHeaderBackground] = useState(isHomePage && !isScrolled ? 'header-transparent' : 'header-white');
    const [showMenuText, setShowMenuText] = useState(isHomePage && !isScrolled ? false : true);
    const [showOffcanvas, setShowOffcanvas] = useState(false);

    const handleCloseOffcanvas = () => setShowOffcanvas(false);
    const handleShowOffcanvas = () => setShowOffcanvas(true);

    useEffect(() => {
        if (isHomePage) {
            setHeaderBackground(isScrolled ? 'header-white' : 'header-transparent');
            setShowMenuText(isScrolled);
        } else {
            setHeaderBackground('header-white');
            setShowMenuText(true);
        }
    }, [isScrolled, isHomePage, location.pathname]);

    const menuItems = [
        { pathKey: "", nameKey: "header.newArrivals", exact: true }, // pathKey rỗng cho trang chủ của ngôn ngữ hiện tại
        { pathKey: "collections", nameKey: "header.collections" },
        { pathKey: "accessories", nameKey: "header.accessories" },
        { pathKey: "the-noizee", nameKey: "header.theNoizee" },
    ];

    // Hàm tạo đường dẫn đầy đủ với tiền tố ngôn ngữ
    const langPath = (pathSegment) => {
        const basePath = `/${currentLang}`;
        if (!pathSegment) return basePath; // Cho trang chủ
        return `${basePath}/${pathSegment}`.replace(/\/+/g, '/'); // Loại bỏ dấu // thừa
    };
    
    const navLinkClass = ({ isActive }) =>
        `nav-link main-menu-link ${isActive ? 'active' : ''} ${!showMenuText && isHomePage ? 'text-transparent-strict' : ''}`;

    return (
        <>
            <Navbar
                expand="lg"
                fixed="top"
                className={`main-header ${headerBackground} ${showMenuText || !isHomePage ? 'menu-text-visible' : 'menu-text-hidden'}`}
                variant={headerBackground === 'header-white' || showOffcanvas ? 'light' : 'dark'}
            >
                <Container fluid className="header-container px-md-3 px-lg-5">
                    <Logo /> {/* Logo đã được cập nhật để link đúng */}
                    <Navbar.Toggle aria-controls="main-navbar-nav" onClick={handleShowOffcanvas} className="ms-auto me-2 d-lg-none custom-toggler"/>
                    <Nav className={`mx-auto main-menu d-none d-lg-flex ${!showMenuText && isHomePage ? 'invisible-on-hero' : ''}`}>
                        {menuItems.map(item => (
                            <NavLink 
                                key={item.pathKey || 'home'} 
                                to={langPath(item.pathKey)} 
                                className={navLinkClass} 
                                end={item.exact}
                            >
                                {t(item.nameKey)}
                            </NavLink>
                        ))}
                    </Nav>
                    <Nav className="header-icons d-none d-lg-flex align-items-center">
                        <Nav.Link href="#search" title={t('header.search')} className="header-icon-link p-0">
                            <i className="bi bi-search"></i>
                        </Nav.Link>
                        <Nav.Link 
                            as={Link} 
                            to={isAuthenticated ? langPath("account") : langPath("login")} 
                            title={isAuthenticated ? (userInfo?.customer_name || t('header.account')) : t('header.loginRegister')} 
                            className="header-icon-link p-0"
                        >
                            <i className="bi bi-person"></i>
                        </Nav.Link>
                        <Nav.Link 
                            as={Link} 
                            to={langPath("cart")} 
                            title={t('header.cart')} 
                            className="header-icon-link p-0 position-relative"
                        >
                            <i className="bi bi-bag"></i>
                            {cartItemCount > 0 && (
                                <Badge pill bg="danger" className="cart-count-badge">
                                    {cartItemCount}
                                </Badge>
                            )}
                        </Nav.Link>
                        <div className="ms-2">
                           <LanguageSwitcher />
                        </div>
                    </Nav>
                </Container>
            </Navbar>

            <Offcanvas show={showOffcanvas} onHide={handleCloseOffcanvas} placement="end" className="mobile-offcanvas">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>
                        {/* Logo trong Offcanvas cũng cần link đúng */}
                        <Link to={`/${currentLang}`} className="navbar-brand logo-text" aria-label="Noizee Homepage" onClick={handleCloseOffcanvas}>
                            NOIZEE
                        </Link>
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="d-flex flex-column">
                    <Nav className="flex-column mobile-main-menu mb-auto">
                        {menuItems.map(item => (
                            <NavLink 
                                key={`mobile-${item.pathKey || 'home'}`} 
                                to={langPath(item.pathKey)} 
                                className="nav-link mobile-menu-link" 
                                onClick={handleCloseOffcanvas} 
                                end={item.exact}
                            >
                                {t(item.nameKey)}
                            </NavLink>
                        ))}
                    </Nav>
                    <Nav className="flex-column mobile-icon-menu mt-3">
                         <Nav.Link as={Link} to={isAuthenticated ? langPath("account") : langPath("login")} className="nav-link mobile-icon-link" onClick={handleCloseOffcanvas}>
                            <i className="bi bi-person me-2"></i>
                            {isAuthenticated ? (userInfo?.customer_name || t('header.account')) : t('header.loginRegister')}
                        </Nav.Link>
                        <Nav.Link as={Link} to={langPath("cart")} className="nav-link mobile-icon-link" onClick={handleCloseOffcanvas}>
                            <i className="bi bi-bag me-2"></i>
                            {t('header.cart')} {cartItemCount > 0 && `(${cartItemCount})`}
                        </Nav.Link>
                        <Nav.Link href="#search" className="nav-link mobile-icon-link" onClick={handleCloseOffcanvas}>
                            <i className="bi bi-search me-2"></i>
                            {t('header.search')}
                        </Nav.Link>
                         <div className="mt-3 mb-2 px-3 border-top pt-3">
                            <LanguageSwitcher variant="dark" size="md"/>
                        </div>
                    </Nav>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
}

export default Header;