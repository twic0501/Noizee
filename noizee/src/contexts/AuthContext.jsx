import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useMutation, useLazyQuery, ApolloError } from '@apollo/client';
import { useNavigate } from 'react-router-dom'; // Để điều hướng sau khi login/logout
import { LOGIN_USER, REGISTER_USER } from '../api/graphql/mutations/authMutations'; // Giả sử bạn đã tạo các file này
import { GET_ME } from '../api/graphql/queries/userQueries'; // Giả sử bạn đã tạo file này
import client from '../api/apolloClient'; // Import Apollo client để reset store khi logout

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true); // Loading ban đầu để kiểm tra token
    const [authError, setAuthError] = useState(null);
    const navigate = useNavigate();

    // Mutation để đăng nhập
    const [loginUserMutation, { loading: loginLoading, error: loginError }] = useMutation(LOGIN_USER, {
        onCompleted: (data) => {
            if (data.login && data.login.token && data.login.user) {
                localStorage.setItem('authToken', data.login.token);
                setCurrentUser(data.login.user);
                setIsAuthenticated(true);
                setAuthError(null);
                client.resetStore(); // Reset cache của Apollo để các query sau đó lấy dữ liệu mới
                navigate('/'); // Điều hướng về trang chủ hoặc trang profile
            } else {
                setAuthError("Login failed: Invalid response from server.");
            }
        },
        onError: (error) => {
            console.error("Login Error:", error);
            setAuthError(error.message || "An error occurred during login.");
        }
    });

    // Mutation để đăng ký
    const [registerUserMutation, { loading: registerLoading, error: registerError }] = useMutation(REGISTER_USER, {
        onCompleted: (data) => {
            if (data.register && data.register.token && data.register.user) {
                localStorage.setItem('authToken', data.register.token);
                setCurrentUser(data.register.user);
                setIsAuthenticated(true);
                setAuthError(null);
                client.resetStore();
                navigate('/');
            } else {
                setAuthError("Registration failed: Invalid response from server.");
            }
        },
        onError: (error) => {
            console.error("Register Error:", error);
            setAuthError(error.message || "An error occurred during registration.");
        }
    });

    // Query để lấy thông tin người dùng (dùng lazy query để gọi khi cần)
    const [getMeQuery, { loading: meLoading, error: meError }] = useLazyQuery(GET_ME, {
        onCompleted: (data) => {
            if (data && data.me) {
                setCurrentUser(data.me);
                setIsAuthenticated(true);
            } else {
                // Nếu có token nhưng getMe không trả về user, có thể token hết hạn
                localStorage.removeItem('authToken');
                setIsAuthenticated(false);
                setCurrentUser(null);
            }
            setLoadingAuth(false);
        },
        onError: (error) => {
            console.error("Get Me Error:", error);
            localStorage.removeItem('authToken');
            setIsAuthenticated(false);
            setCurrentUser(null);
            setLoadingAuth(false);
            // Không setAuthError ở đây để tránh hiển thị lỗi khi chỉ kiểm tra token
        },
        fetchPolicy: 'network-only', // Luôn lấy dữ liệu mới nhất từ server
    });

    // Kiểm tra token khi ứng dụng load lần đầu
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            getMeQuery();
        } else {
            setLoadingAuth(false);
        }
    }, [getMeQuery]);


    const login = async (email, password) => {
        setAuthError(null); // Reset lỗi trước khi thử lại
        try {
            await loginUserMutation({ variables: { email, password } });
        } catch (e) {
            // Lỗi đã được xử lý bởi onError của useMutation
            console.error("Catch Login:", e);
             if (!(e instanceof ApolloError)) { // Xử lý các lỗi không phải Apollo
                setAuthError("An unexpected error occurred during login.");
            }
        }
    };

    const register = async (userData) => { // userData: { firstName, lastName, email, password }
        setAuthError(null);
        try {
            await registerUserMutation({ variables: userData });
        } catch (e) {
            console.error("Catch Register:", e);
            if (!(e instanceof ApolloError)) {
                setAuthError("An unexpected error occurred during registration.");
            }
        }
    };

    const logout = useCallback(async () => {
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('authToken');
        setAuthError(null);
        try {
            await client.resetStore(); // Xóa cache của Apollo Client
            // Có thể gọi mutation logout ở backend nếu có
        } catch (error) {
            console.error("Error resetting Apollo store on logout:", error);
        }
        navigate('/login'); // Điều hướng về trang đăng nhập
    }, [navigate]);

    const value = {
        currentUser,
        isAuthenticated,
        loadingAuth: loadingAuth || meLoading, // Kết hợp loading ban đầu và loading khi query `me`
        isLoggingIn: loginLoading,
        isRegistering: registerLoading,
        authError: authError || loginError?.message || registerError?.message || meError?.message,
        setAuthError, // Để có thể clear lỗi từ bên ngoài nếu cần
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined && context === null) { // Sửa điều kiện kiểm tra context
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};