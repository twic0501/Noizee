import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiUser, FiShoppingCart, FiSearch, FiMenu, FiX, FiLogOut, FiLogIn, FiSettings, FiShoppingBag } from 'react-icons/fi';

import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import useScrollPosition from '../../hooks/useScrollPosition';
import useToggle from '../../hooks/useToggle';
import { classNames } from '../../utils/helpers';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { authState, logout } = useAuth();
  const { cart } = useCart();
  const scrollPosition = useScrollPosition();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen] = useToggle(false);
  const [isSearchOpen, toggleSearch, setSearchOpen] = useToggle(false);

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // BIẾN XÁC ĐỊNH HEADER CÓ TRONG SUỐT HAY KHÔNG
  // Điều kiện: Ở đầu trang (scrollPosition < 50) VÀ đang ở trang chủ (location.pathname === '/')
  // Bạn có thể mở rộng điều kiện này cho các trang khác nếu muốn header trong suốt
  const isTransparent = scrollPosition < 50 && location.pathname === '/';

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, setMobileMenuOpen, setSearchOpen]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // --- Định nghĩa các lớp CSS động dựa trên trạng thái trong suốt/cuộn ---
  const headerClasses = classNames(
    "sticky top-0 z-50 w-full transition-all duration-300 ease-in-out",
    isTransparent ? "bg-transparent py-4" : "bg-white shadow-lg py-3"
  );

  const logoColorClass = isTransparent ? "text-white" : "text-indigo-600";
  const langButtonBaseClasses = "flex items-center transition-colors duration-300";
  const langButtonTextColorClass = isTransparent ? "text-white hover:text-gray-200" : "text-gray-600 hover:text-indigo-600";
  
  const navLinkBaseClasses = "transition-opacity duration-500 ease-in-out";
  // Hiển thị menu items từ từ khi header không còn trong suốt
  const navLinkVisibilityClass = !isTransparent ? "opacity-100" : "opacity-0 invisible";
  const navLinkColorClass = isTransparent ? "text-white hover:text-gray-300" : "text-gray-600 hover:text-indigo-600";
  const activeNavLinkColorClass = isTransparent ? "text-gray-100 font-semibold" : "text-indigo-600 font-semibold";

  const iconColorClass = isTransparent ? "text-white hover:text-gray-200" : "text-gray-600 hover:text-indigo-600";

  const getNavLinkClass = (path) => {
    const isActive = location.pathname === path;
    return classNames(
      navLinkBaseClasses,
      navLinkColorClass, // Màu cơ bản khi trong suốt/không trong suốt
      isActive && activeNavLinkColorClass, // Màu khi active
      navLinkVisibilityClass // Ẩn/hiện menu items
    );
  };
  
  const SearchBarComponent = () => {
    if (!isSearchOpen) return null;
    // Search bar sẽ luôn có nền trắng để dễ đọc
    return (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg p-4 z-40">
            <input type="text" placeholder={t('header.searchPlaceholder')} className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
    );
  };

  // Danh sách menu items mới
  const menuItems = [
    { to: "/", labelKey: "header.newArrivals" }, // Cần thêm route /new-arrivals hoặc chỉnh thành /products?filter=new
    { to: "/products", labelKey: "header.collections" },
    { to: "/blog", labelKey: "header.blog" },
    { to: "/about", labelKey: "header.theNoizee" } // Đảm bảo có route /about và component AboutPage
  ];

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 flex items-center justify-between h-16"> {/* Đặt chiều cao cố định cho header */}
        {/* Left Section: Logo and Language Selector */}
        <div className="flex items-center space-x-4">
          <Link to="/" className={`text-2xl font-bold transition-colors duration-300 ${logoColorClass}`}>
            {t('appName', 'Noizee')}
          </Link>
          
          {/* Language Selector (Desktop) */}
          <div className="hidden md:block relative group">
            <button className={classNames(langButtonBaseClasses, langButtonTextColorClass)}>
              <span>{SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language)?.name || i18n.language.toUpperCase()}</span>
            </button>
            <div className="absolute left-0 mt-1 w-32 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out z-50">
              {SUPPORTED_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Section: Desktop Navigation (xuất hiện khi không trong suốt) */}
        <nav className={`hidden md:flex items-center space-x-6 ${isTransparent ? 'opacity-0 invisible' : 'opacity-100 visible'} transition-opacity duration-500`}>
          {menuItems.map(item => (
            <Link key={item.to} to={item.to} className={getNavLinkClass(item.to)}>
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Right Section: Actions (Search, User, Cart, Mobile Toggle) */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <button onClick={toggleSearch} aria-label={t('header.search')} className={`hidden md:block ${iconColorClass}`}>
            <FiSearch size={22} />
          </button>
          
          {authState.isAuthenticated ? (
            <div className="relative group">
               <Link to="/account/profile" aria-label={t('header.account')} className={`flex items-center ${iconColorClass}`}>
                <FiUser size={22} />
                {/* Tên user ẩn khi header trong suốt hoặc trên mobile để tiết kiệm không gian */}
                <span className={`hidden lg:inline ml-1 ${isTransparent ? 'hidden' : ''}`}>{authState.user?.firstName || authState.user?.email?.split('@')[0]}</span>
              </Link>
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out z-50 py-1">
                {/* Dropdown items luôn có màu text bình thường */}
                <Link to="/account/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600">
                  <FiSettings size={16} className="mr-2"/> {t('header.myProfile')}
                </Link>
                <Link to="/account/orders" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600">
                  <FiShoppingBag size={16} className="mr-2"/> {t('header.myOrders')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <FiLogOut size={16} className="mr-2"/> {t('header.logout')}
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" aria-label={t('header.login')} className={`flex items-center ${iconColorClass}`}>
              <FiLogIn size={22} />
               {/* Chữ login ẩn khi header trong suốt hoặc trên mobile */}
              <span className={`hidden lg:inline ml-1 ${isTransparent ? 'hidden' : ''}`}>{t('header.login')}</span>
            </Link>
          )}

          <Link to="/cart" aria-label={t('header.cart')} className={`relative ${iconColorClass}`}>
            <FiShoppingCart size={24} />
            {itemCount > 0 && (
              // Badge giỏ hàng nên có màu nổi bật riêng, không phụ thuộc header trong suốt
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          <div className="md:hidden">
            <button onClick={toggleMobileMenu} aria-label={t('header.menu')} className={iconColorClass}>
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      <div className="relative">
          <SearchBarComponent />
      </div>

      {/* Mobile Menu - Giữ nguyên cấu trúc, chỉ cần đảm bảo màu sắc các item bên trong phù hợp */}
      <div
        className={classNames(
          "md:hidden fixed inset-0 z-30 transform transition-transform duration-300 ease-in-out bg-white", // z-index thấp hơn header chính
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-5">
          <div className="flex justify-between items-center mb-6">
            <Link to="/" className="text-xl font-bold text-indigo-600" onClick={toggleMobileMenu}>
                {t('appName', 'Noizee')}
            </Link>
            <button onClick={toggleMobileMenu} aria-label={t('header.closeMenu')} className="text-gray-600"> {/* Nút close luôn màu tối */}
              <FiX size={24} />
            </button>
          </div>
          {/* Mobile Navigation Links */}
          <nav className="flex flex-col space-y-4">
            {menuItems.map(item => (
              <Link 
                key={`mobile-${item.to}`} 
                to={item.to} 
                // Class cho mobile links, không phụ thuộc isTransparent của header chính
                className={({ isActive }) => 
                    classNames(
                        "py-2 text-gray-600 hover:text-indigo-600",
                        isActive ? "text-indigo-600 font-semibold" : ""
                    )
                }
                onClick={toggleMobileMenu}
              >
                {t(item.labelKey)}
              </Link>
            ))}
            
            <button onClick={() => { toggleSearch(); toggleMobileMenu(); }} aria-label={t('header.search')} className="flex items-center py-2 text-gray-600 hover:text-indigo-600">
                <FiSearch size={20} className="mr-2" /> {t('header.search')}
            </button>

            <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">{t('header.language')}</p>
                {SUPPORTED_LANGUAGES.map(lang => (
                    <button
                    key={lang.code}
                    onClick={() => { changeLanguage(lang.code); toggleMobileMenu(); }}
                    className={classNames(
                        "block w-full text-left py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600",
                        i18n.language === lang.code && "text-indigo-600 font-semibold"
                    )}
                    >
                    {lang.name}
                    </button>
                ))}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;