// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApolloClient, gql } from '@apollo/client';

// Định nghĩa các GraphQL Queries và Mutations cần thiết
// Bạn nên tạo các file .gql riêng trong src/services/graphql/authQueries.gql (ví dụ)
// rồi import chúng, nhưng để đơn giản, tôi sẽ định nghĩa trực tiếp ở đây trước.

const LOGIN_MUTATION = gql`
  mutation Login($identifier: String!, $customer_password: String!) {
    login(identifier: $identifier, customer_password: $customer_password) {
      token
      customer_id
      customer_name
      username
      customer_email
      isAdmin
      virtual_balance
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      customer_id
      customer_name
      username
      customer_email
      isAdmin
      virtual_balance
    }
  }
`;

const MY_PROFILE_QUERY = gql`
  query MyProfile {
    myProfile {
      customer_id
      customer_name
      username
      customer_email
      isAdmin
      virtual_balance
      # Thêm các trường khác nếu cần từ Customer type
    }
  }
`;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const client = useApolloClient();
  const [authState, setAuthState] = useState({
    token: localStorage.getItem('authToken') || null,
    user: null,
    isAuthenticated: false,
    isLoading: true, // Ban đầu là true để kiểm tra token
  });

  const fetchUserProfile = useCallback(async (tokenToUse) => {
    if (!tokenToUse) {
      setAuthState({ token: null, user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      // Đảm bảo token được gửi kèm request (Apollo Client đã cấu hình authLink)
      const { data, errors } = await client.query({
        query: MY_PROFILE_QUERY,
        // context: { headers: { Authorization: `Bearer ${tokenToUse}` } } // Cách khác nếu authLink chưa set
      });

      if (errors) {
        throw new Error(errors.map(e => e.message).join(', '));
      }

      if (data && data.myProfile) {
        setAuthState({
          token: tokenToUse,
          user: data.myProfile,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Trường hợp token hợp lệ nhưng không lấy được profile (hiếm khi xảy ra nếu backend tốt)
        throw new Error("Profile not found with current token, or token is invalid.");
      }
    } catch (error) {
      console.error("Auth token validation or profile fetch failed:", error);
      localStorage.removeItem('authToken');
      setAuthState({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  }, [client]);


  useEffect(() => {
    const tokenFromStorage = localStorage.getItem('authToken');
    if (tokenFromStorage) {
      fetchUserProfile(tokenFromStorage);
    } else {
      setAuthState(prevState => ({ ...prevState, isLoading: false }));
    }
  }, [fetchUserProfile]); // fetchUserProfile là dependency

  const loginUser = async (identifier, password) => {
    try {
      const { data } = await client.mutate({
        mutation: LOGIN_MUTATION,
        variables: { identifier, customer_password: password },
      });
      if (data && data.login) {
        localStorage.setItem('authToken', data.login.token);
        // user data từ AuthPayload sẽ được chuẩn hóa một chút trước khi set vào state
        const userData = {
            customer_id: data.login.customer_id,
            customer_name: data.login.customer_name,
            username: data.login.username,
            customer_email: data.login.customer_email,
            isAdmin: data.login.isAdmin,
            virtual_balance: data.login.virtual_balance,
        };
        setAuthState({
          token: data.login.token,
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true, user: userData };
      }
      throw new Error("Login failed: No data returned from server.");
    } catch (error) {
      console.error("Login error:", error);
      localStorage.removeItem('authToken'); // Đảm bảo token cũ bị xóa nếu login thất bại
      setAuthState(prevState => ({ ...prevState, token: null, user: null, isAuthenticated: false, isLoading: false }));
      // Ném lỗi ra ngoài để component UI có thể bắt và hiển thị
      throw error;
    }
  };

  const registerUser = async (registerInput) => {
    try {
      const { data } = await client.mutate({
        mutation: REGISTER_MUTATION,
        variables: { input: registerInput },
      });
      if (data && data.register) {
        localStorage.setItem('authToken', data.register.token);
         const userData = { // Chuẩn hóa user data
            customer_id: data.register.customer_id,
            customer_name: data.register.customer_name,
            username: data.register.username,
            customer_email: data.register.customer_email,
            isAdmin: data.register.isAdmin,
            virtual_balance: data.register.virtual_balance,
        };
        setAuthState({
          token: data.register.token,
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true, user: userData };
      }
      throw new Error("Registration failed: No data returned from server.");
    } catch (error) {
      console.error("Registration error:", error);
      // Ném lỗi ra ngoài để component UI có thể bắt và hiển thị
      throw error;
    }
  };

  const logoutUser = async () => {
    localStorage.removeItem('authToken');
    setAuthState({ token: null, user: null, isAuthenticated: false, isLoading: false });
    try {
        await client.resetStore(); // Xóa cache của Apollo Client để đảm bảo dữ liệu cũ không còn
    } catch (error) {
        console.error("Error resetting Apollo store on logout:", error);
    }
    // Bạn có thể muốn điều hướng người dùng về trang chủ hoặc trang đăng nhập ở đây
    // navigate('/'); // Nếu dùng useNavigate từ react-router-dom
  };

  const value = {
    ...authState,
    loginUser,
    logoutUser,
    registerUser,
    fetchUserProfile // Có thể cần gọi lại nếu token thay đổi từ nguồn khác
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) { // Kiểm tra null vì giá trị khởi tạo của context là null
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};