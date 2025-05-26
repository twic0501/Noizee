import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useApolloClient, useMutation, useLazyQuery } from '@apollo/client'; // Thêm useMutation, useLazyQuery
import { LOGIN_USER_MUTATION, REGISTER_USER_MUTATION } from '../api/graphql/authMutations';
import { GET_ME_QUERY } from '../api/graphql/userQueries';
import LoadingSpinner from '../components/common/LoadingSpinner'; // Giả sử bạn có component này

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const client = useApolloClient(); // Để reset cache

  const [authState, setAuthState] = useState({
    token: localStorage.getItem('userToken') || null,
    user: null, // Sẽ lấy từ localStorage hoặc fetch
    isAuthenticated: false, // Sẽ xác định sau khi kiểm tra token
    loading: true, // Loading ban đầu để fetch user
    authError: null, // Để lưu lỗi xác thực
  });

  // --- GraphQL Hooks ---
  // Login
  const [loginUserMutation, { loading: loginLoading, error: loginError }] = useMutation(LOGIN_USER_MUTATION, {
    onError: (error) => setAuthState(prev => ({ ...prev, authError: error.message, loading: false })),
    onCompleted: (data) => {
      if (data.loginUser) {
        const { token, user } = data.loginUser;
        localStorage.setItem('userToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        setAuthState({
          token,
          user,
          isAuthenticated: true,
          loading: false,
          authError: null,
        });
        // client.resetStore(); // Reset store để các query khác có thể fetch dữ liệu mới với user mới
      }
    },
  });

  // Register
  const [registerUserMutation, { loading: registerLoading, error: registerError }] = useMutation(REGISTER_USER_MUTATION, {
    onError: (error) => setAuthState(prev => ({ ...prev, authError: error.message, loading: false })),
    onCompleted: (data) => {
      if (data.registerUser) {
        const { token, user } = data.registerUser;
        localStorage.setItem('userToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        setAuthState({
          token,
          user,
          isAuthenticated: true,
          loading: false,
          authError: null,
        });
        // client.resetStore();
      }
    },
  });

  // Fetch current user (me)
  const [fetchMe, { loading: meLoading, error: meError }] = useLazyQuery(GET_ME_QUERY, {
    fetchPolicy: 'network-only', // Luôn lấy dữ liệu mới nhất từ server
    onCompleted: (data) => {
      if (data.me) {
        localStorage.setItem('userData', JSON.stringify(data.me));
        setAuthState(prev => ({
          ...prev,
          user: data.me,
          isAuthenticated: true, // Đã xác thực thành công với backend
          loading: false,
          authError: null,
        }));
      } else { // Token có thể hợp lệ nhưng không tìm thấy user (ít xảy ra nếu backend tốt)
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        setAuthState({ token: null, user: null, isAuthenticated: false, loading: false, authError: "Không thể xác thực người dùng." });
      }
    },
    onError: (error) => { // Lỗi từ query 'me' (ví dụ token hết hạn, không hợp lệ)
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      client.clearStore(); // Xóa cache nếu token không hợp lệ
      setAuthState({ token: null, user: null, isAuthenticated: false, loading: false, authError: error.message });
    },
  });

  // --- Effects ---
  // Kiểm tra token và fetch user khi component mount
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      // Có token, thử fetch thông tin user để xác thực token với backend
      fetchMe();
    } else {
      // Không có token, không cần làm gì thêm, state đã là unauthenticated
      setAuthState({ token: null, user: null, isAuthenticated: false, loading: false, authError: null });
    }
  }, [fetchMe]); // fetchMe là stable function từ useLazyQuery


  // --- Context Actions ---
  const login = useCallback(async (email, password) => {
    setAuthState(prev => ({ ...prev, loading: true, authError: null }));
    try {
      await loginUserMutation({ variables: { email, password } });
      // onCompleted sẽ xử lý setAuthState
    } catch (e) {
      // Lỗi network hoặc lỗi không bắt được bởi onError của useMutation (ít xảy ra)
      console.error("Login context function error:", e);
      setAuthState(prev => ({ ...prev, authError: "Lỗi đăng nhập không xác định.", loading: false }));
    }
  }, [loginUserMutation]);

  const register = useCallback(async (input) => {
    setAuthState(prev => ({ ...prev, loading: true, authError: null }));
    try {
      await registerUserMutation({ variables: { input } });
      // onCompleted sẽ xử lý setAuthState
    } catch (e) {
      console.error("Register context function error:", e);
      setAuthState(prev => ({ ...prev, authError: "Lỗi đăng ký không xác định.", loading: false }));
    }
  }, [registerUserMutation]);

  const logout = useCallback(async () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    try {
      await client.clearStore(); // Hoặc client.resetStore();
    } catch (error) {
      console.error("Error clearing/resetting Apollo Client store on logout:", error);
    }
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      loading: false,
      authError: null,
    });
    // Chuyển hướng về trang login có thể được xử lý ở component gọi logout hoặc ProtectedRoute
  }, [client]);
  
  const clearAuthError = useCallback(() => {
    setAuthState(prev => ({ ...prev, authError: null }));
  }, []);


  // Value của context
  const contextValue = {
    authState,
    login,
    logout,
    register,
    isLoading: authState.loading || loginLoading || registerLoading || meLoading, // Trạng thái loading tổng hợp
    authError: authState.authError || loginError?.message || registerError?.message || meError?.message,
    clearAuthError,
  };

  // Hiển thị loading spinner toàn trang khi AuthContext đang xác thực ban đầu
  if (authState.loading && !authState.user && !authState.authError) {
     return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <LoadingSpinner />
        </div>
     );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để sử dụng AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};