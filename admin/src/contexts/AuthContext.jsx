// src/contexts/AuthContext.jsx
import React, { createContext, useState, useCallback, useMemo } from 'react';
import { useApolloClient } from '@apollo/client';
import logger from '../utils/logger'; // Giả sử logger của bạn ở đây

const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_IS_ADMIN_KEY = 'admin_isAdmin';
const ADMIN_ID_KEY = 'admin_id';
const ADMIN_NAME_KEY = 'admin_name';
const ADMIN_USERNAME_KEY = 'admin_username';
const ADMIN_EMAIL_KEY = 'admin_email';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState(() => {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);
        const isAdminString = localStorage.getItem(ADMIN_IS_ADMIN_KEY);
        const adminId = localStorage.getItem(ADMIN_ID_KEY);
        const adminName = localStorage.getItem(ADMIN_NAME_KEY);
        const username = localStorage.getItem(ADMIN_USERNAME_KEY);
        const email = localStorage.getItem(ADMIN_EMAIL_KEY);

        if (token && isAdminString === 'true') {
            // logger.info('[AuthContext] Restored admin session from localStorage.'); // Ghi chú lại hoặc bỏ logger ở đây nếu không cần thiết khi chạy
            return { token, isAdmin: true, adminId, adminName, username, email };
        }
        // logger.info('[AuthContext] No valid admin session found in localStorage.'); // Tương tự
        return { token: null, isAdmin: false, adminId: null, adminName: null, username: null, email: null };
    });

    const client = useApolloClient();

    const setAuthInfo = useCallback(({
        token,
        isAdmin,
        customer_id,
        customer_name,
        username,
        customer_email
    }) => {
        if (isAdmin !== true) {
            // logger.warn("[AuthContext Admin] Attempted to setAuthInfo for a non-admin user. Clearing state.", { isAdmin, username });
            logout();
            return;
        }

        // logger.info("[AuthContext Admin] Setting auth info for admin:", { username, customer_id });
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
        localStorage.setItem(ADMIN_IS_ADMIN_KEY, String(isAdmin));
        if (customer_id) localStorage.setItem(ADMIN_ID_KEY, String(customer_id)); // Chuyển customer_id thành chuỗi nếu nó là số
        if (customer_name) localStorage.setItem(ADMIN_NAME_KEY, customer_name);
        if (username) localStorage.setItem(ADMIN_USERNAME_KEY, username);
        if (customer_email) localStorage.setItem(ADMIN_EMAIL_KEY, customer_email);

        setAuthState({
            token,
            isAdmin: true,
            adminId: String(customer_id), // Lưu adminId dưới dạng chuỗi
            adminName: customer_name,
            username: username,
            email: customer_email,
        });
    }, []); // Bỏ logout khỏi dependency

    const logout = useCallback(() => {
        // logger.info("[AuthContext Admin] Logging out admin.");
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_IS_ADMIN_KEY);
        localStorage.removeItem(ADMIN_ID_KEY);
        localStorage.removeItem(ADMIN_NAME_KEY);
        localStorage.removeItem(ADMIN_USERNAME_KEY);
        localStorage.removeItem(ADMIN_EMAIL_KEY);

        setAuthState({ token: null, isAdmin: false, adminId: null, adminName: null, username: null, email: null });
        client.resetStore().catch(error => logger.error('Error resetting Apollo cache on admin logout:', error));
    }, [client]);

    const isAdminAuthenticated = useMemo(() => {
        return !!authState.token && authState.isAdmin === true;
    }, [authState.token, authState.isAdmin]);

    const contextValue = useMemo(() => ({
        authState,
        setAuthInfo,
        logout,
        isAdminAuthenticated,
    }), [authState, setAuthInfo, logout, isAdminAuthenticated]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;