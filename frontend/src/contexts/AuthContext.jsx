import React, { createContext, useState, useCallback, useMemo } from 'react';
import { useApolloClient } from '@apollo/client';
import { USER_TOKEN_KEY, USER_INFO_KEY } from '@noizee/shared-utils'; // Import keys

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(USER_TOKEN_KEY));
  // Lấy thông tin user từ localStorage khi khởi tạo
  const [userInfo, setUserInfo] = useState(() => {
      const storedUserInfo = localStorage.getItem(USER_INFO_KEY);
      try {
          return storedUserInfo ? JSON.parse(storedUserInfo) : null;
      } catch (e) {
          console.error("Failed to parse user info from localStorage", e);
          localStorage.removeItem(USER_INFO_KEY); // Xóa nếu bị lỗi
          return null;
      }
  });
  const client = useApolloClient(); // Để reset cache khi logout

  const login = useCallback((newToken, userData) => {
    localStorage.setItem(USER_TOKEN_KEY, newToken);
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userData)); // Lưu object user
    setToken(newToken);
    setUserInfo(userData);
    // Không cần client.resetStore() ở đây, trừ khi có lý do đặc biệt
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    setToken(null);
    setUserInfo(null);
    // Reset Apollo cache để xóa dữ liệu cũ cần xác thực
    client.resetStore().catch(error => console.error('Error resetting Apollo cache on logout:', error));
  }, [client]);

   // Cập nhật số dư ảo (ví dụ sau khi checkout)
  const updateVirtualBalance = useCallback((newBalance) => {
      setUserInfo(prevInfo => {
          if (!prevInfo) return null;
          const updatedInfo = { ...prevInfo, virtual_balance: newBalance };
          localStorage.setItem(USER_INFO_KEY, JSON.stringify(updatedInfo)); // Cập nhật localStorage
          return updatedInfo;
      });
  }, []);

  // Tự động logout nếu token hết hạn (Cần giải mã token - dùng thư viện như jwt-decode)
  // useEffect(() => { /* Logic kiểm tra hạn token */ }, [token, logout]);

  // Sử dụng useMemo để tối ưu, chỉ tạo lại value khi state thay đổi
  const contextValue = useMemo(() => ({
    token,
    userInfo,
    isAuthenticated: !!token, // Kiểm tra đăng nhập dễ dàng
    login,
    logout,
    updateVirtualBalance, // <<< Thêm hàm cập nhật số dư
  }), [token, userInfo, login, logout, updateVirtualBalance]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;