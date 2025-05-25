// src/components/layout/Header.jsx
import React from 'react';
import { Link, NavLink } from 'react-router-dom'; // Sẽ dùng NavLink để active styling

const Header = () => {
  return (
    <header className="bg-gray-800 text-white shadow-md">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-gray-300">
          Noizee
        </Link>
        <ul className="flex space-x-4 items-center">
          <li><NavLink to="/" className={({ isActive }) => isActive ? "text-yellow-400" : "hover:text-gray-300"}>Trang Chủ</NavLink></li>
          <li><NavLink to="/products" className={({ isActive }) => isActive ? "text-yellow-400" : "hover:text-gray-300"}>Sản Phẩm</NavLink></li>
          <li><NavLink to="/collections" className={({ isActive }) => isActive ? "text-yellow-400" : "hover:text-gray-300"}>Bộ Sưu Tập</NavLink></li>
          <li><NavLink to="/blog" className={({ isActive }) => isActive ? "text-yellow-400" : "hover:text-gray-300"}>Blog</NavLink></li>
          {/* Thêm link giỏ hàng, tài khoản, đăng nhập/đăng xuất ở đây sau */}
          <li><NavLink to="/cart" className={({ isActive }) => isActive ? "text-yellow-400" : "hover:text-gray-300"}>Giỏ Hàng</NavLink></li>
          <li><NavLink to="/login" className={({ isActive }) => isActive ? "text-yellow-400" : "hover:text-gray-300"}>Đăng Nhập</NavLink></li>
          <li><NavLink to="/account" className={({ isActive }) => isActive ? "text-yellow-400" : "hover:text-gray-300"}>Tài Khoản</NavLink></li>
        </ul>
      </nav>
    </header>
  );
};
export default Header;