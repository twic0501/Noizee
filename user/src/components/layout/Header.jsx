// src/components/layout/Header.jsx
import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import useScrollPosition from '../../hooks/useScrollPosition';
import useToggle from '../../hooks/useToggle';
import { classNames } from '../../utils/helpers';
import { SUPPORTED_LANGUAGES, APP_NAME } from '../../utils/constants';
// import gsap from 'gsap'; // GSAP không được sử dụng trong file này, có thể xóa

const Header = () => {
  const { t, i18n } = useTranslation();
  const { authState, logout } = useAuth();
  const { cart } = useCart();
  const scrollPosition = useScrollPosition();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen] = useToggle(false);
  const [isSearchOpen, toggleSearch, setSearchOpen] = useToggle(false);
  const [isGuestUserDropdownOpen, toggleGuestUserDropdown, setGuestUserDropdownOpen] = useToggle(false);

  const headerRef = useRef(null);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const isHomePage = location.pathname === '/';

  // Logic xác định header trong suốt
  // Header chỉ trong suốt trên trang chủ, khi scroll ở đầu trang, và không có menu mobile hay search bar đang mở
  const isHeaderTransparent = isHomePage && scrollPosition < 50 && !isMobileMenuOpen && !isSearchOpen;

  // Logic ẩn/hiện header khi cuộn (cho các trang không phải homepage)
  useEffect(() => {
    if (isHomePage) {
      if(headerRef.current) { // Đảm bảo headerRef.current tồn tại
        headerRef.current.classList.remove('navbar-hidden');
        headerRef.current.classList.add('navbar-visible');
      }
      setIsHidden(false);
      lastScrollY.current = window.scrollY; // Sử dụng window.scrollY thay vì scrollPosition cho logic này
      return;
    }

    const handleScroll = () => {
      if (!headerRef.current) return;
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > headerRef.current.offsetHeight) {
        setIsHidden(true);
      } else if (currentScrollY < lastScrollY.current) {
        setIsHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage, location.pathname]); // Bỏ scrollPosition khỏi dependencies vì lastScrollY.current được dùng


  const handleLogout = useCallback(() => {
    logout();
    setMobileMenuOpen(false);
    setGuestUserDropdownOpen(false);
  }, [logout, setMobileMenuOpen, setGuestUserDropdownOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setGuestUserDropdownOpen(false);
  }, [location.pathname, setMobileMenuOpen, setGuestUserDropdownOpen]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setMobileMenuOpen(false);
  };

  const headerBaseClasses = "navbar navbar-expand-lg fixed-top";
  let headerDynamicStyles;

  if (isHomePage) {
    headerDynamicStyles = isHeaderTransparent
      ? "navbar-transparent py-3"
      : "navbar-light bg-white shadow-lg py-2 navbar-visible";
  } else {
    headerDynamicStyles = classNames(
      "navbar-light bg-white shadow-lg py-2",
      isHidden ? "navbar-hidden" : "navbar-visible"
    );
  }

  const textColorClass = (isHeaderTransparent && isHomePage) ? "text-white hover-text-white-80" : "text-dark hover-text-primary";
  const activeTextColorClass = (isHeaderTransparent && isHomePage) ? "active-transparent fw-semibold" : "active-opaque fw-semibold text-primary";

  const logoTextClasses = classNames(
    "navbar-brand logo-text fs-4 fw-bold",
    (isHeaderTransparent && isHomePage) ? "text-white" : "text-primary"
  );

  const navLinkBaseClasses = "nav-link main-menu-link";
  const navLinkDynamicClasses = (isActiveRoute) => classNames(
    textColorClass,
    isActiveRoute && activeTextColorClass
  );
  
  const iconNavLinkClasses = classNames("nav-link d-flex align-items-center justify-content-center px-2", textColorClass);
  const iconButtonClasses = classNames("btn btn-link p-0 d-flex align-items-center justify-content-center px-2", textColorClass);


  const langButtonClasses = classNames(
    "nav-link dropdown-toggle d-flex align-items-center p-0",
    textColorClass
  );

  const menuItems = [
    { to: "/", labelKey: "header.home", exact: true },
    { to: "/products", labelKey: "header.products" },
    { to: "/blog", labelKey: "header.blog" },
    { to: "/about", labelKey: "header.about" }
  ];
  const bsIconBaseClass = "bi";
  const togglerIconColor = (isHeaderTransparent && isHomePage && !isMobileMenuOpen) ? 'text-white' : 'text-dark';

  // Style cho menu chính trên desktop để đảm bảo nó hiển thị
  const desktopMenuNavStyle = (isHomePage && isHeaderTransparent)
    ? { opacity: 0, visibility: 'hidden', transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out' }
    : { opacity: 1, visibility: 'visible', transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out' };


  return (
    <nav ref={headerRef} className={`${headerBaseClasses} ${headerDynamicStyles}`}>
      <div className="container d-flex align-items-center"> {/* Container chính cho nội dung navbar */}
        
        {/* === LEFT GROUP (Logo + Language for Desktop) === */}
        <div className="d-flex align-items-center"> {/* Bỏ 'me-auto' */}
          <Link to="/" className={logoTextClasses}>
            {t('appName', APP_NAME)}
          </Link>
          <div className="dropdown d-none d-lg-block ms-3">
            <button
              className={langButtonClasses}
              type="button"
              id="languageDropdownMenuButtonDesktop"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {(i18n.language === 'vi' ? 'VI' : 'EN')}
            </button>
            <ul className="dropdown-menu shadow" aria-labelledby="languageDropdownMenuButtonDesktop">
              {SUPPORTED_LANGUAGES.map(lang => (
                <li key={lang.code}>
                  <button
                    onClick={() => changeLanguage(lang.code)}
                    className={classNames("dropdown-item", { 'active': i18n.language === lang.code })}
                  >
                    {lang.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* === MOBILE TOGGLER (Sẽ được đẩy sang phải bởi menu hoặc nhóm icon nếu không có điều chỉnh đặc biệt) === */}
        {/* Để đảm bảo toggler ở đúng vị trí, nó thường nằm ngay sau brand hoặc trước collapse */}
        <button
          className="navbar-toggler d-lg-none ms-auto" // Thêm ms-auto để đẩy về phải trên mobile nếu cần
          type="button"
          onClick={toggleMobileMenu}
          aria-controls="mainNavbarNav"
          aria-expanded={isMobileMenuOpen}
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen
            ? <i className={`${bsIconBaseClass} bi-x-lg fs-4 ${togglerIconColor}`}></i>
            : <i className={`${bsIconBaseClass} bi-list fs-4 ${togglerIconColor}`}></i>
          }
        </button>

        {/* === COLLAPSIBLE CONTENT (Centered Menu for Desktop + All Mobile Menu items) === */}
        {/* class "flex-grow-1" giúp navbar-collapse chiếm không gian ở giữa cho menu desktop */}
        <div className={classNames("collapse navbar-collapse flex-grow-1", { 'show': isMobileMenuOpen })} id="mainNavbarNav">
          {/* Desktop Centered Navigation Links */}
          <ul
            className="navbar-nav mx-auto mb-2 mb-lg-0 d-none d-lg-flex"
            style={desktopMenuNavStyle} // Áp dụng style ẩn/hiện
          >
            {menuItems.map(item => (
              <li key={item.to} className="nav-item">
                <Link
                  to={item.to}
                  className={`${navLinkBaseClasses} ${navLinkDynamicClasses(location.pathname === item.to || (item.exact && location.pathname === '/'))}`}
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>

          {/* --- MOBILE ONLY ITEMS (Stacked inside collapsible area) --- */}
          <div className="d-lg-none mt-3 border-top pt-3">
            {/* ... (giữ nguyên code mobile menu) ... */}
            <ul className="navbar-nav flex-column">
              {menuItems.map(item => (
                <li key={`mobile-${item.to}`} className="nav-item">
                  <Link
                    to={item.to}
                    className={`nav-link mobile-menu-link py-2 text-dark ${ (location.pathname === item.to || (item.exact && location.pathname === '/')) ? 'active text-primary fw-semibold' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
              <li className="nav-item mt-2">
                <button onClick={() => { toggleSearch(); setMobileMenuOpen(false); }} className="nav-link mobile-menu-link py-2 text-dark d-flex align-items-center w-100 text-start">
                  <i className={`${bsIconBaseClass} bi-search me-2`}></i> {t('header.search')}
                </button>
              </li>
            </ul>
            <hr />
            <div className="mt-3">
              <p className="small text-muted mb-2">{t('header.language')}</p>
              {SUPPORTED_LANGUAGES.map(lang => (
                <button
                  key={`mobile-lang-${lang.code}`}
                  onClick={() => changeLanguage(lang.code)}
                  className={classNames(
                    "btn btn-sm w-100 text-start mb-1",
                    i18n.language === lang.code ? "btn-primary" : "btn-outline-secondary"
                  )}
                >
                  {lang.name}
                </button>
              ))}
            </div>
            <hr />
            <div className="mt-3">
              {authState.isAuthenticated ? (
                <>
                  <Link to="/account/profile" className="nav-link mobile-menu-link py-2 text-dark d-flex align-items-center" onClick={() => setMobileMenuOpen(false)}>
                    <i className={`${bsIconBaseClass} bi-person me-2`}></i>{authState.user?.firstName || authState.user?.customer_name || t('header.myProfile')}
                  </Link>
                  <button onClick={handleLogout} className="nav-link mobile-menu-link py-2 text-danger d-flex align-items-center w-100 text-start">
                    <i className={`${bsIconBaseClass} bi-box-arrow-right me-2`}></i> {t('header.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link mobile-menu-link py-2 text-dark d-flex align-items-center" onClick={() => setMobileMenuOpen(false)}>
                    <i className={`${bsIconBaseClass} bi-box-arrow-in-right me-2`}></i>{t('header.login')}
                  </Link>
                  <Link to="/register" className="nav-link mobile-menu-link py-2 text-dark d-flex align-items-center" onClick={() => setMobileMenuOpen(false)}>
                    <i className={`${bsIconBaseClass} bi-person-plus me-2`}></i>{t('header.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div> {/* End navbar-collapse */}

        {/* === RIGHT ACTIONS (Desktop Only - Search, User, Cart) === */}
        {/* Phải có 'ms-auto' để đẩy về bên phải */}
        <div className="d-none d-lg-flex align-items-center ms-auto">
          <button onClick={toggleSearch} aria-label={t('header.search')} className={iconButtonClasses}>
            <i className={`${bsIconBaseClass} bi-search fs-5`}></i>
          </button>

          {authState.isAuthenticated ? (
            <Link
              to="/account/profile"
              aria-label={t('header.myProfile')}
              className={`${iconNavLinkClasses} text-decoration-none`}
            >
              <i className={`${bsIconBaseClass} bi-person fs-5`}></i>
              <span className={classNames("d-none d-xl-inline ms-1", { 'd-none': (isHeaderTransparent && isHomePage) && !isMobileMenuOpen })}>
                {authState.user?.firstName || authState.user?.customer_name || authState.user?.email?.split('@')[0]}
              </span>
            </Link>
          ) : (
            <div className="dropdown">
              <button
                className={`${iconButtonClasses} dropdown-toggle`}
                type="button"
                id="guestUserDropdownMenuButtonDesktop"
                onClick={toggleGuestUserDropdown}
                aria-expanded={isGuestUserDropdownOpen}
              >
                <i className={`${bsIconBaseClass} bi-person fs-5`}></i>
              </button>
              <ul className={classNames("dropdown-menu dropdown-menu-end shadow", { 'show': isGuestUserDropdownOpen })} aria-labelledby="guestUserDropdownMenuButtonDesktop">
                <li><Link className="dropdown-item d-flex align-items-center" to="/login" onClick={() => setGuestUserDropdownOpen(false)}><i className={`${bsIconBaseClass} bi-box-arrow-in-right me-2`}></i>{t('header.login')}</Link></li>
                <li><Link className="dropdown-item d-flex align-items-center" to="/register" onClick={() => setGuestUserDropdownOpen(false)}><i className={`${bsIconBaseClass} bi-person-plus me-2`}></i>{t('header.register')}</Link></li>
              </ul>
            </div>
          )}

          <Link to="/cart" aria-label={t('header.cart')} className={`${iconNavLinkClasses} position-relative`}>
            <i className={`${bsIconBaseClass} bi-bag fs-5`}></i>
            {itemCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {itemCount}
                <span className="visually-hidden">items in cart</span>
              </span>
            )}
          </Link>
        </div>
      </div> 

      
      {isSearchOpen && (
        <div className="position-absolute top-100 start-0 end-0 bg-white shadow-lg p-3 z-index-below-navbar">
          <input
            type="text"
            placeholder={t('header.searchPlaceholder')}
            className="form-control"
            autoFocus
            onBlur={() => setSearchOpen(false)}
          />
        </div>
      )}
    </nav>
  );
};

export default Header;