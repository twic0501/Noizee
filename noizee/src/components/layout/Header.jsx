import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import useScrollPosition from '../../hooks/useScrollPosition';
import useClickOutside from '../../hooks/useClickOutside';
import {
    X,
    Menu as MenuIcon,
    Search,
    UserCircle,
    ShoppingCart,
    ChevronDown,
    LogOut,
    Settings // Thay BookUser bằng Settings hoặc icon phù hợp hơn cho "Tài khoản của tôi"
} from 'lucide-react';

// TODO: Xác định font chữ đặc biệt từ dự án user/ cũ và tạo biến cho nó
// const LOGO_FONT_FAMILY = "'YourUserProjectFont', sans-serif";

const Header = () => {
    const { t, i18n } = useTranslation();
    const { isAuthenticated, currentUser, logout } = useAuth();
    const { totalCartItems, toggleCartPanel, setIsCartPanelOpen } = useCart(); // Thêm setIsCartPanelOpen nếu cần đóng từ đây
    const navigate = useNavigate();
    const location = useLocation();
    const { scrollY } = useScrollPosition(); // Chỉ cần scrollY để logic đơn giản hơn

    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isHeaderSticky, setIsHeaderSticky] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0); // Vẫn cần lastScrollY để xác định hướng cuộn

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showLangDropdown, setShowLangDropdown] = useState(false);

    const langDropdownRef = useRef(null);
    const userDropdownRef = useRef(null);

    useClickOutside(langDropdownRef, () => setShowLangDropdown(false));
    useClickOutside(userDropdownRef, () => setShowUserDropdown(false));

    const isHomepage = location.pathname === '/';

    // Logic xử lý scroll cho Header
    useEffect(() => {
        const heroSectionHeight = 300; // Chiều cao ước tính của hero section trên homepage

        if (isHomepage) {
            setIsHeaderSticky(scrollY > heroSectionHeight);
            setIsHeaderVisible(true); // Header luôn hiển thị trên homepage
        } else {
            // Ẩn header khi cuộn xuống và hiện lại khi cuộn lên (trừ khi ở rất gần top)
            if (scrollY > lastScrollY && scrollY > 150) { // 150 là một threshold ví dụ
                setIsHeaderVisible(false);
            } else if (scrollY < lastScrollY || scrollY <= 150) {
                setIsHeaderVisible(true);
            }
            setIsHeaderSticky(scrollY > 50); // Sticky khi cuộn qua 50px trên các trang khác
        }
        setLastScrollY(scrollY <= 0 ? 0 : scrollY);
    }, [scrollY, lastScrollY, isHomepage]);


    // Đóng các menu/dropdown khi chuyển trang
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setShowLangDropdown(false);
        setShowUserDropdown(false);
    }, [location.pathname]);

    const handleChangeLanguage = useCallback((lang) => {
        i18n.changeLanguage(lang);
        setShowLangDropdown(false);
    }, [i18n]);

    const handleLogoutClick = useCallback(async () => {
        setShowUserDropdown(false); // Đóng dropdown trước khi logout
        await logout();
        // Điều hướng đã được xử lý trong AuthContext.logout
    }, [logout]);

    const navigateAndCloseMobileMenu = useCallback((path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
    }, [navigate]);

    // Xác định các class CSS động cho Header
    let headerBaseClasses = "fixed-top py-3"; // transition sẽ thêm qua CSS class
    let dynamicContainerClasses = "transition-all duration-300 ease-in-out"; // Class cho hiệu ứng transition
    let navLinkColor = "text-dark";
    let iconColor = "text-dark";
    let logoColor = "text-dark"; // TODO: Áp dụng font từ user/ project
    let langSwitcherColor = "text-dark";
    let langSeparatorColor = "text-muted";
    let langDropdownBorder = "border-secondary-subtle";

    if (isHomepage && !isHeaderSticky) {
        dynamicContainerClasses += " bg-transparent";
        navLinkColor = "text-white";
        iconColor = "text-white";
        logoColor = "text-white";
        langSwitcherColor = "text-white";
        langSeparatorColor = "text-white opacity-75";
        langDropdownBorder = "border-light border-opacity-50";
    } else {
        dynamicContainerClasses += " bg-white shadow-sm"; // Luôn có background trắng và shadow khi sticky hoặc không phải homepage
    }

    if (!isHeaderVisible && !isHomepage) {
        headerBaseClasses += " -translate-y-full"; // Class để ẩn header (cần định nghĩa trong CSS)
    }

    const navItems = [
        { path: "/", labelKey: "nav.newArrivals", exact: true }, // `exact` có thể không cần với React Router v6
        { path: "/collections", labelKey: "nav.collections" },
        { path: "/blog", labelKey: "nav.blog" },
        { path: "/the-noizee", labelKey: "nav.theNoizee" },
    ];

    return (
        <header className={`${headerBaseClasses} ${dynamicContainerClasses}`} style={{ zIndex: 1030 }}> {/* Bootstrap default z-index for fixed-top */}
            <div className="container d-flex align-items-center justify-content-between">
                {/* Left Section */}
                <div className="d-flex align-items-center">
                    <button
                        className={`btn btn-link p-0 d-md-none me-3 ${iconColor}`}
                        onClick={() => setIsMobileMenuOpen(prev => !prev)}
                        aria-label={t('header.toggleMenu', 'Toggle menu')}
                        aria-expanded={isMobileMenuOpen}
                        aria-controls="mobileMenu"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
                    </button>
                    <div className="d-none d-md-flex align-items-center">
                        <Link to="/" className={`text-decoration-none me-3 ${logoColor} fs-4 fw-bold text-uppercase`} /* style={{ fontFamily: LOGO_FONT_FAMILY }} */>
                            {t('siteName', 'Noizee')}
                        </Link>
                        <div className={`d-flex align-items-center border rounded-pill px-2 py-1 ${langDropdownBorder}`}>
                            <span
                                onClick={() => handleChangeLanguage('vi')}
                                className={`cursor-pointer small ${langSwitcherColor} ${i18n.language.startsWith('vi') ? 'fw-bold opacity-100' : 'opacity-75'}`}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => e.key === 'Enter' && handleChangeLanguage('vi')}
                            >
                                {t('common.vietnamese', 'VI')}
                            </span>
                            <span className={`mx-1 ${langSeparatorColor}`}>/</span>
                            <span
                                onClick={() => handleChangeLanguage('en')}
                                className={`cursor-pointer small ${langSwitcherColor} ${i18n.language.startsWith('en') ? 'fw-bold opacity-100' : 'opacity-75'}`}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => e.key === 'Enter' && handleChangeLanguage('en')}
                            >
                               {t('common.english', 'EN')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Mobile Logo (Center on mobile) */}
                <Link to="/" className={`text-decoration-none d-md-none ${logoColor} fs-4 fw-bold text-uppercase`} /* style={{ fontFamily: LOGO_FONT_FAMILY }} */>
                     {t('siteName', 'Noizee')}
                </Link>

                {/* Desktop Navigation (Center on desktop) */}
                <nav className="d-none d-md-flex align-items-center mx-auto">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link mx-3 fw-medium ${navLinkColor} ${location.pathname === item.path ? 'active fw-bold' : ''}`}
                            aria-current={location.pathname === item.path ? "page" : undefined}
                        >
                            {t(item.labelKey)}
                        </Link>
                    ))}
                </nav>

                {/* Right Section Icons */}
                <div className="d-flex align-items-center">
                    <button className={`btn btn-link p-0 me-3 ${iconColor}`} aria-label={t('header.search', 'Search')}>
                        <Search size={20} />
                    </button>

                    <div className="d-none d-md-block dropdown me-3 position-relative" ref={userDropdownRef}>
                        {isAuthenticated ? (
                            <>
                                <button
                                    className={`btn btn-link p-0 d-flex align-items-center text-decoration-none ${iconColor}`}
                                    type="button"
                                    onClick={() => setShowUserDropdown(prev => !prev)}
                                    aria-expanded={showUserDropdown}
                                    aria-controls="userActionsDropdown"
                                >
                                    <UserCircle size={20} className="me-1" />
                                    <span className="d-none d-lg-inline small">
                                        {currentUser?.firstName || currentUser?.name?.split(' ')[0] || t('nav.myAccount')}
                                    </span>
                                    <ChevronDown size={16} className={`ms-1 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showUserDropdown && (
                                    <ul id="userActionsDropdown" className="dropdown-menu dropdown-menu-end end-0 show position-absolute shadow-lg small mt-2 py-1" style={{ zIndex: 1052, minWidth: '180px' }}>
                                        <li className="px-3 py-2 small text-muted">
                                            {t('header.welcome', 'Welcome')}, {currentUser?.firstName || currentUser?.name}!
                                        </li>
                                        <li><hr className="dropdown-divider my-0" /></li>
                                        <li><Link className="dropdown-item d-flex align-items-center py-2" to="/account/profile" onClick={() => setShowUserDropdown(false)}><Settings size={16} className="me-2 opacity-75" /> {t('nav.myAccount')}</Link></li>
                                        <li><button onClick={handleLogoutClick} className="dropdown-item text-danger d-flex align-items-center py-2"><LogOut size={16} className="me-2 opacity-75" /> {t('nav.logout')}</button></li>
                                    </ul>
                                )}
                            </>
                        ) : (
                            <Link to="/login" className={`btn btn-link p-0 d-flex align-items-center ${iconColor}`} aria-label={t('nav.login')}>
                                <UserCircle size={20} />
                            </Link>
                        )}
                    </div>
                    <button onClick={toggleCartPanel} className={`btn btn-link p-0 position-relative ${iconColor}`} aria-label={t('header.openCart', 'Open cart')}>
                        <ShoppingCart size={20} />
                        {totalCartItems > 0 && (
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark text-white" style={{ fontSize: '0.6rem', padding: '0.2em 0.45em' }}>
                                {totalCartItems}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div
                id="mobileMenu"
                className={`fixed inset-0 bg-dark bg-opacity-95 z-index-modal-backdrop flex-column align-items-center justify-content-center space-y-4 d-md-none ${isMobileMenuOpen ? 'd-flex' : 'd-none'}`}
                style={{ paddingTop: '60px' }} // Đảm bảo không bị che bởi header
            >
                <button className="btn btn-link text-white position-absolute top-0 end-0 mt-3 me-3 p-2" onClick={() => setIsMobileMenuOpen(false)} aria-label={t('header.closeMenu', 'Close menu')}>
                    <X size={30} />
                </button>
                {navItems.map(item => (
                     <Link key={item.path} to={item.path} onClick={() => navigateAndCloseMobileMenu(item.path)} className="text-white fs-5 text-uppercase py-2 d-block text-center">
                        {t(item.labelKey)}
                    </Link>
                ))}
                <hr className="w-50 border-light opacity-30 my-3" />
                {isAuthenticated ? (
                    <>
                        <Link to="/account/profile" onClick={() => navigateAndCloseMobileMenu('/account/profile')} className="text-white fs-5 text-uppercase py-2 d-flex align-items-center justify-content-center">
                           <Settings size={20} className="me-2" /> {t('nav.myAccount')}
                        </Link>
                        <button onClick={() => { handleLogoutClick(); setIsMobileMenuOpen(false); }} className="btn btn-link text-danger fs-5 text-uppercase py-2 d-flex align-items-center justify-content-center">
                           <LogOut size={20} className="me-2" /> {t('nav.logout')}
                        </button>
                    </>
                ) : (
                    <Link to="/login" onClick={() => navigateAndCloseMobileMenu('/login')} className="text-white fs-5 text-uppercase py-2 d-flex align-items-center justify-content-center">
                       <UserCircle size={20} className="me-2" /> {t('nav.login')}
                    </Link>
                )}
                <div className="mt-4 d-flex align-items-center border rounded-pill px-3 py-2 border-light border-opacity-50">
                     <span onClick={() => {handleChangeLanguage('vi'); setIsMobileMenuOpen(false);}} className={`cursor-pointer text-white ${i18n.language.startsWith('vi') ? 'fw-bold' : 'opacity-75'}`}>VI</span>
                     <span className="mx-2 text-white opacity-50">/</span>
                     <span onClick={() => {handleChangeLanguage('en'); setIsMobileMenuOpen(false);}} className={`cursor-pointer text-white ${i18n.language.startsWith('en') ? 'fw-bold' : 'opacity-75'}`}>EN</span>
                </div>
            </div>
        </header>
    );
};

export default React.memo(Header); // Sử dụng React.memo nếu Header không có nhiều props thay đổi thường xuyên từ App.jsx