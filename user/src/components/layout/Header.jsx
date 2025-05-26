import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiUser, FiShoppingCart, FiSearch, FiMenu, FiX, FiLogOut, FiLogIn, FiHeart, FiShoppingBag, FiSettings } from 'react-icons/fi'; // Thêm các icon cần thiết

import { useAuth } from '../../contexts/AuthContext'; // Đường dẫn đúng
import { useCart } from '../../contexts/CartContext';   // Đường dẫn đúng
import useScrollPosition from '../../hooks/useScrollPosition'; // Hook đã tạo
import useToggle from '../../hooks/useToggle'; // Hook đã tạo
import { classNames } from '../../utils/helpers'; // Tiện ích classNames
import { SUPPORTED_LANGUAGES } from '../../utils/constants'; // Hằng số ngôn ngữ
// import SearchBar from '../common/SearchBar'; // Tạo component này sau
// import Lanyard from '../common/Lanyard'; // Tạo component này sau (hoặc có thể đặt Lanyard ở MainLayout)

// CSS cho Header (nếu không dùng 100% Tailwind)
// import './Header.css';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { authState, logout } = useAuth();
  const { cart } = useCart();
  const scrollPosition = useScrollPosition();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen] = useToggle(false); // Dùng useToggle
  const [isSearchOpen, toggleSearch, setSearchOpen] = useToggle(false); // Dùng useToggle
  // const [isUserDropdownOpen, toggleUserDropdown, setUserDropdownOpen] = useToggle(false);

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleLogout = useCallback(() => {
    logout();
    // navigate('/login'); // AuthContext hoặc ProtectedRoute sẽ xử lý chuyển hướng khi state thay đổi
  }, [logout]);

  // Đóng mobile menu và search khi route thay đổi
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    // setUserDropdownOpen(false);
  }, [location.pathname, setMobileMenuOpen, setSearchOpen]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    // Có thể lưu lựa chọn ngôn ngữ vào localStorage nếu muốn duy trì
  };

  const headerBaseClasses = "sticky top-0 z-50 w-full transition-all duration-300 ease-in-out bg-white";
  const headerScrolledClasses = "shadow-lg py-3"; // Khi cuộn
  const headerDefaultClasses = "py-4"; // Khi ở trên cùng

  const navLinkClasses = "text-gray-600 hover:text-indigo-600 transition-colors duration-200";
  const activeNavLinkClasses = "text-indigo-600 font-semibold"; // Ví dụ

  const getNavLinkClass = (path) => {
    return location.pathname === path ? classNames(navLinkClasses, activeNavLinkClasses) : navLinkClasses;
  };
  
  // TODO: Implement SearchBar component later
  const SearchBarComponent = () => {
    if (!isSearchOpen) return null;
    return (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg p-4 z-40">
            <input type="text" placeholder={t('header.searchPlaceholder')} className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
            {/* Add search button or logic */}
        </div>
    );
  };


  return (
    <header className={classNames(headerBaseClasses, scrollPosition > 50 ? headerScrolledClasses : headerDefaultClasses)}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-indigo-600">
          {t('appName', 'Noizee')}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className={getNavLinkClass('/')}>{t('header.home')}</Link>
          <Link to="/products" className={getNavLinkClass('/products')}>{t('header.products')}</Link>
          {/* <Link to="/collections" className={getNavLinkClass('/collections')}>{t('header.collections')}</Link> */}
          {/* <Link to="/about" className={getNavLinkClass('/about')}>{t('header.about')}</Link> */}
          {/* <Link to="/contact" className={getNavLinkClass('/contact')}>{t('header.contact')}</Link> */}
        </nav>

        {/* Actions: Search, Lang, User, Cart */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Search Icon (Desktop) */}
          <button onClick={toggleSearch} aria-label={t('header.search')} className="hidden md:block text-gray-600 hover:text-indigo-600">
            <FiSearch size={22} />
          </button>
          
          {/* Language Selector (Desktop) - Example Dropdown */}
          <div className="hidden md:block relative group">
            <button className="text-gray-600 hover:text-indigo-600 flex items-center">
              <span>{SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language)?.name || i18n.language.toUpperCase()}</span>
              {/* <FiChevronDown size={16} className="ml-1" /> */}
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out z-50">
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


          {/* User Actions */}
          {authState.isAuthenticated ? (
            <div className="relative group">
               <Link to="/account/profile" aria-label={t('header.account')} className="text-gray-600 hover:text-indigo-600 flex items-center">
                <FiUser size={22} />
                <span className="hidden lg:inline ml-1">{authState.user?.firstName || authState.user?.email?.split('@')[0]}</span>
              </Link>
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out z-50 py-1">
                <Link to="/account/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600">
                  <FiSettings size={16} className="mr-2"/> {t('header.myProfile')}
                </Link>
                <Link to="/account/orders" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600">
                  <FiShoppingBag size={16} className="mr-2"/> {t('header.myOrders')}
                </Link>
                {/* <Link to="/account/wishlist" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600">
                  <FiHeart size={16} className="mr-2"/> {t('header.myWishlist')}
                </Link> */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <FiLogOut size={16} className="mr-2"/> {t('header.logout')}
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" aria-label={t('header.login')} className="text-gray-600 hover:text-indigo-600 flex items-center">
              <FiLogIn size={22} />
              <span className="hidden lg:inline ml-1">{t('header.login')}</span>
            </Link>
          )}

          {/* Cart Icon */}
          <Link to="/cart" aria-label={t('header.cart')} className="relative text-gray-600 hover:text-indigo-600">
            <FiShoppingCart size={24} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button onClick={toggleMobileMenu} aria-label={t('header.menu')}>
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Search Bar (Desktop) - rendered below header based on isSearchOpen */}
      <div className="relative"> {/* Container for search bar to be positioned correctly */}
          <SearchBarComponent />
      </div>


      {/* Mobile Menu */}
      <div
        className={classNames(
          "md:hidden fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out bg-white",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-5">
          <div className="flex justify-between items-center mb-6">
            <Link to="/" className="text-xl font-bold text-indigo-600" onClick={toggleMobileMenu}>
                {t('appName', 'Noizee')}
            </Link>
            <button onClick={toggleMobileMenu} aria-label={t('header.closeMenu')}>
              <FiX size={24} />
            </button>
          </div>
          <nav className="flex flex-col space-y-4">
            <Link to="/" className={getNavLinkClass('/')} onClick={toggleMobileMenu}>{t('header.home')}</Link>
            <Link to="/products" className={getNavLinkClass('/products')} onClick={toggleMobileMenu}>{t('header.products')}</Link>
            {/* <Link to="/collections" className={getNavLinkClass('/collections')} onClick={toggleMobileMenu}>{t('header.collections')}</Link> */}
            {/* <Link to="/about" className={getNavLinkClass('/about')} onClick={toggleMobileMenu}>{t('header.about')}</Link> */}
            {/* <Link to="/contact" className={getNavLinkClass('/contact')} onClick={toggleMobileMenu}>{t('header.contact')}</Link> */}
             {/* Search Icon (Mobile) */}
            <button onClick={() => { toggleSearch(); toggleMobileMenu(); }} aria-label={t('header.search')} className="flex items-center py-2 text-gray-600 hover:text-indigo-600">
                <FiSearch size={20} className="mr-2" /> {t('header.search')}
            </button>

            {/* Language Selector (Mobile) */}
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