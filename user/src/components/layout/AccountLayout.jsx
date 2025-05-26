import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiUser, FiShoppingBag, FiHeart, FiMapPin, FiLock, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { classNames } from '../../utils/helpers'; // Import classNames

const AccountLayout = () => {
  const { t } = useTranslation();
  const { authState, logout } = useAuth(); // Lấy logout từ AuthContext
  const location = useLocation();

  const sidebarNavItems = [
    { path: '/account/profile', textKey: 'accountLayout.profile', Icon: FiUser },
    { path: '/account/orders', textKey: 'accountLayout.orders', Icon: FiShoppingBag },
    // { path: '/account/addresses', textKey: 'accountLayout.addresses', Icon: FiMapPin },
    // { path: '/account/wishlist', textKey: 'accountLayout.wishlist', Icon: FiHeart },
    // { path: '/account/change-password', textKey: 'accountLayout.changePassword', Icon: FiLock },
  ];

  const getNavLinkClass = (path) => {
    // So sánh path gốc, không bao gồm query params hoặc hash
    const currentBasePath = location.pathname.split('?')[0].split('#')[0];
    return currentBasePath === path
      ? 'bg-indigo-100 text-indigo-700 group flex items-center px-3 py-2 text-sm font-medium rounded-md'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="lg:flex lg:space-x-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-1/4 xl:w-1/5 mb-8 lg:mb-0">
          <div className="sticky top-24"> {/* top-24 (6rem) = header height + some space */}
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
                {/* Avatar Placeholder */}
                <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xl font-semibold">
                  {authState.user?.firstName?.charAt(0).toUpperCase() || 'N'}
                  {authState.user?.lastName?.charAt(0).toUpperCase() || ''}
                </div>
                <div>
                  <h3 className="text-md font-semibold text-gray-800">
                    {authState.user?.firstName} {authState.user?.lastName}
                  </h3>
                  <p className="text-xs text-gray-500">{authState.user?.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                {sidebarNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={getNavLinkClass(item.path)}
                    end // `end` prop để match chính xác path cho NavLink
                  >
                    <item.Icon className={classNames(
                        location.pathname === item.path ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 flex-shrink-0 h-5 w-5'
                      )} aria-hidden="true" />
                    {t(item.textKey)}
                  </NavLink>
                ))}
                <button
                  onClick={logout}
                  className="text-gray-600 hover:bg-red-50 hover:text-red-700 group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full mt-4 border-t pt-4"
                >
                  <FiLogOut className="text-gray-400 group-hover:text-red-500 mr-3 flex-shrink-0 h-5 w-5" aria-hidden="true" />
                  {t('accountLayout.logout')}
                </button>
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:w-3/4 xl:w-4/5">
          <div className="bg-white p-6 rounded-lg shadow min-h-[calc(100vh-12rem)]"> {/* Đảm bảo chiều cao tối thiểu */}
            <Outlet /> {/* Nội dung của các trang con (ProfilePage, OrderHistoryPage) sẽ render ở đây */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountLayout;