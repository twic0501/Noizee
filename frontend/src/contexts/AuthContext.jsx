// src/contexts/AuthContext.jsx
import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useApolloClient } from '@apollo/client';
import { USER_TOKEN_KEY, USER_INFO_KEY } from '../utils/constants'; // Import keys

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(USER_TOKEN_KEY));
  const [userInfo, setUserInfo] = useState(() => {
    const storedUserInfo = localStorage.getItem(USER_INFO_KEY);
    try {
      return storedUserInfo ? JSON.parse(storedUserInfo) : null;
    } catch (e) {
      console.error("Failed to parse user info from localStorage", e);
      localStorage.removeItem(USER_INFO_KEY); // Xóa nếu bị lỗi parse
      return null;
    }
  });

  const client = useApolloClient(); // Để reset cache khi logout

  const login = useCallback((newToken, userData) => {
    localStorage.setItem(USER_TOKEN_KEY, newToken);
    // Chỉ lưu các thông tin cần thiết và an toàn của user
    const safeUserData = {
        customer_id: userData.customer_id,
        customer_name: userData.customer_name,
        username: userData.username,
        customer_email: userData.customer_email,
        isAdmin: userData.isAdmin,
        virtual_balance: userData.virtual_balance,
        // Không lưu token ở đây nữa nếu đã lưu riêng
    };
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(safeUserData));
    setToken(newToken);
    setUserInfo(safeUserData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    setToken(null);
    setUserInfo(null);
    // Reset Apollo cache để xóa dữ liệu cũ cần xác thực
    // và đảm bảo các query sau đó sẽ fetch dữ liệu mới (không bị dính cache của user cũ)
    client.resetStore().catch(error => console.error('Error resetting Apollo cache on logout:', error));
  }, [client]);

  // Hàm cập nhật thông tin người dùng (ví dụ: sau khi sửa profile)
  const updateUserInfo = useCallback((updatedData) => {
    setUserInfo(prevInfo => {
      if (!prevInfo) return null;
      const newInfo = { ...prevInfo, ...updatedData };
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(newInfo));
      return newInfo;
    });
  }, []);

  // Hàm cập nhật số dư ảo (ví dụ sau khi checkout hoặc nạp tiền)
  const updateVirtualBalance = useCallback((newBalance) => {
    if (typeof newBalance !== 'number') return; // Validate đầu vào
    setUserInfo(prevInfo => {
      if (!prevInfo) return null;
      const updatedInfo = { ...prevInfo, virtual_balance: newBalance };
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(updatedInfo));
      return updatedInfo;
    });
  }, []);

  // (Tùy chọn) Tự động logout nếu token hết hạn hoặc không hợp lệ
  // useEffect(() => {
  //   if (token) {
  //     // Dùng thư viện như jwt-decode để kiểm tra hạn của token
  //     // import { jwtDecode } from "jwt-decode";
  //     // try {
  //     //   const decodedToken = jwtDecode(token);
  //     //   if (decodedToken.exp * 1000 < Date.now()) {
  //     //     console.log("Token expired, logging out.");
  //     //     logout();
  //     //   }
  //     // } catch (error) {
  //     //   console.error("Invalid token, logging out.", error);
  //     //   logout();
  //     // }
  //   }
  // }, [token, logout]);

  const contextValue = useMemo(() => ({
    token,
    userInfo,
    isAuthenticated: !!token,
    login,
    logout,
    updateUserInfo,
    updateVirtualBalance,
  }), [token, userInfo, login, logout, updateUserInfo, updateVirtualBalance]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;